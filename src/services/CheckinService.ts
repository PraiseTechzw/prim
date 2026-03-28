import { db } from '../lib/db';
import { BoardingStatus } from '../lib/types';
import { v4 as uuidv4 } from 'uuid';

export class CheckinService {
  /**
   * Performs a check-in or board action for a passenger.
   * Ensures idempotency and valid state transitions.
   */
  static async processAction(data: {
    tripId: string;
    bookingId: string;
    seatId: string;
    action: 'CHECK_IN' | 'BOARD';
    performedBy: string;
    idempotencyKey: string;
  }) {
    return await db.transaction().execute(async (trx) => {
      // 1. Check for existing action with this idempotency key
      const existing = await trx
        .selectFrom('checkins')
        .where('idempotency_key', '=', data.idempotencyKey)
        .selectAll()
        .executeTakeFirst();

      if (existing) return { success: true, alreadyDone: true, checkin: existing };

      // 2. Fetch current state and validate
      const passenger = await trx
        .selectFrom('booking_seats')
        .innerJoin('bookings', 'booking_seats.booking_id', 'bookings.id')
        .where('booking_seats.booking_id', '=', data.bookingId)
        .where('booking_seats.seat_id', '=', data.seatId)
        .select([
          'booking_seats.boarding_status',
          'booking_seats.trip_id',
          'bookings.status as booking_status',
          'bookings.reference_code'
        ])
        .executeTakeFirst();

      if (!passenger) throw new Error('Passenger not found on manifest');
      if (passenger.trip_id !== data.tripId) throw new Error('Ticket is for a different trip');
      if (passenger.booking_status !== 'CONFIRMED') throw new Error(`Booking is not confirmed (Status: ${passenger.booking_status})`);

      const currentState = passenger.boarding_status;
      let nextState: BoardingStatus;

      // 3. Define State Machine
      if (data.action === 'CHECK_IN') {
        if (currentState === 'BOARDED') throw new Error('Passenger already boarded');
        if (currentState === 'CHECKED_IN') return { success: true, alreadyDone: true };
        nextState = 'CHECKED_IN';
      } else { // BOARD
        if (currentState === 'BOARDED') return { success: true, alreadyDone: true };
        nextState = 'BOARDED';
      }

      // 4. Atomic Update
      await trx
        .updateTable('booking_seats')
        .set({ boarding_status: nextState })
        .where('booking_id', '=', data.bookingId)
        .where('seat_id', '=', data.seatId)
        .execute();

      const checkin = await trx
        .insertInto('checkins')
        .values({
          trip_id: data.tripId,
          booking_id: data.bookingId,
          seat_id: data.seatId,
          action_type: data.action,
          boarding_state_before: currentState,
          boarding_state_after: nextState,
          performed_by_user_id: data.performedBy,
          idempotency_key: data.idempotencyKey
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return { success: true, checkin };
    });
  }

  /**
   * Supervisor Override for exceptional cases
   */
  static async supervisorOverride(data: {
    tripId: string;
    bookingId: string;
    seatId: string;
    overrideAction: string;
    reasonCode: string;
    note: string;
    approvedBy: string;
    idempotencyKey: string;
  }) {
    return await db.transaction().execute(async (trx) => {
       // Check idempotency
       const existing = await trx
        .selectFrom('override_events')
        .where('id', '=', data.idempotencyKey) // Using idempotencyKey as ID or separate check
        .executeTakeFirst();
       if (existing) return { success: true, alreadyDone: true };

       // Perform override update
       await trx
        .updateTable('booking_seats')
        .set({ boarding_status: 'OVERRIDDEN_BOARDING' })
        .where('booking_id', '=', data.bookingId)
        .where('seat_id', '=', data.seatId)
        .execute();

       await trx
        .insertInto('override_events')
        .values({
            trip_id: data.tripId,
            booking_id: data.bookingId,
            seat_id: data.seatId,
            override_action: data.overrideAction,
            reason_code: data.reasonCode,
            note: data.note,
            approved_by_user_id: data.approvedBy
        })
        .execute();

       return { success: true };
    });
  }
}
