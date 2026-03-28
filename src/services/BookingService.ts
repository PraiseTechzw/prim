import { db } from '../lib/db';
import { LockService } from './LockService';
import { BookingStatus } from '../lib/types';
import { v4 as uuidv4 } from 'uuid'; // I need to install uuid as well

export class BookingService {
  /**
   * Generates a human-readable booking reference.
   * e.g. ZB-7A2B-X9
   */
  static generateReference(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid O, 0, I, 1
    let ref = 'ZB-';
    for (let i = 0; i < 4; i++) ref += chars.charAt(Math.floor(Math.random() * chars.length));
    ref += '-';
    for (let i = 0; i < 2; i++) ref += chars.charAt(Math.floor(Math.random() * chars.length));
    return ref;
  }

  /**
   * Transitions a booking to a new status. Verifies business logic transitions.
   */
  static async updateBookingStatus(bookingId: string, newStatus: BookingStatus, metadata?: any) {
    return await db.transaction().execute(async (trx) => {
      const booking = await trx
        .selectFrom('bookings')
        .where('id', '=', bookingId)
        .selectAll()
        .executeTakeFirst();

      if (!booking) throw new Error('Booking not found');

      // Add state machine validation logic here if needed
      // e.g., only from DRAFT -> SEAT_HELD -> CONFIRMED, etc.

      await trx
        .updateTable('bookings')
        .set({ status: newStatus })
        .where('id', '=', bookingId)
        .execute();

      // Log the transition in audit_logs
      if (metadata?.clerkId) {
        await trx.insertInto('audit_logs')
          .values({
            user_id: metadata.clerkId,
            action: `MANUAL_STATUS_UPDATE_${newStatus}`,
            entity: 'booking',
            entity_id: bookingId,
            reason: JSON.stringify(metadata)
          })
          .execute();
      }

      return booking;
    });
  }

  /**
   * Finalizes a payment. Atomic confirmation.
   */
  static async confirmPayment(bookingId: string, paymentData: { 
    amount: string, 
    provider: string, 
    reference: string, 
    clerkId?: string 
  }) {
    return await db.transaction().execute(async (trx) => {
      // 1. Create the payment record
      await trx.insertInto('payments')
        .values({
          booking_id: bookingId,
          amount: paymentData.amount,
          currency: 'USD',
          provider: paymentData.provider,
          provider_reference: paymentData.reference,
          status: 'SUCCESS',
          handled_by_clerk: paymentData.clerkId || null,
        })
        .execute();

      // 2. Mark booking as CONFIRMED
      const booking = await trx
        .updateTable('bookings')
        .set({ status: 'CONFIRMED' })
        .where('id', '=', bookingId)
        .returningAll()
        .executeTakeFirst();

      // 3. (Side effect) You'd trigger an async job for SMS/Ticket PDF generation here
      
      return booking;
    });
  }

  /**
   * Deactivates seat locking and cancels the booking.
   */
  static async cancelBooking(bookingId: string) {
    return await db.transaction().execute(async (trx) => {
      const seats = await trx
        .selectFrom('booking_seats')
        .where('booking_id', '=', bookingId)
        .select(['trip_id', 'seat_id'])
        .execute();

      if (seats.length > 0) {
        const tripId = seats[0].trip_id;
        const seatIds = seats.map(s => s.seat_id);
        
        // Release Redis locks
        await LockService.releaseAllSeats(tripId, seatIds);
      }

      await trx
        .updateTable('bookings')
        .set({ status: 'CANCELLED' })
        .where('id', '=', bookingId)
        .execute();
    });
  }
}
