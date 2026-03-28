import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { LockService } from '../../../services/LockService';
import { BookingService } from '../../../services/BookingService';

export async function POST(request: Request) {
  try {
    const { tripId, seatIds, passengerName, passengerPhone, passengerEmail } = await request.json();

    if (!tripId || !seatIds || seatIds.length === 0) {
      return NextResponse.json({ error: 'Trip and seats are required' }, { status: 400 });
    }

    // 1. Try to lock seats in Redis
    // To handle concurrency properly, we use a dedicated user ID for this hold.
    // In a real app, this would be the logged-in user or a temporary session ID.
    const tempUserId = `anon_${Date.now()}`;
    const locksAcquired = await LockService.lockSeats(tripId, seatIds, tempUserId);

    if (!locksAcquired) {
      return NextResponse.json({ 
        error: 'One or more selected seats are no longer available. Please try again.' 
      }, { status: 409 });
    }

    // 2. Create SEAT_HELD booking in DB within a transaction
    const booking = await db.transaction().execute(async (trx) => {
      // Check if seats are already booked in DB (Race condition fallback)
      const alreadyBooked = await trx
        .selectFrom('booking_seats')
        .innerJoin('bookings', 'booking_seats.booking_id', 'bookings.id')
        .where('booking_seats.trip_id', '=', tripId)
        .where('booking_seats.seat_id', 'in', seatIds)
        .where('bookings.status', 'in', ['CONFIRMED', 'CHECKED_IN', 'PAYMENT_VERIFICATION'])
        .select('booking_seats.seat_id')
        .execute();

      if (alreadyBooked.length > 0) {
        throw new Error('Some seats are already booked.');
      }

      // Fetch Trip fare
      const trip = await trx
        .selectFrom('trips')
        .innerJoin('routes', 'trips.route_id', 'routes.id')
        .where('trips.id', '=', tripId)
        .select(['trips.override_fare_usd', 'routes.base_fare_usd'])
        .executeTakeFirstOrThrow();

      const perSeatFare = Number(trip.override_fare_usd || trip.base_fare_usd);
      const totalAmount = (perSeatFare * seatIds.length).toString();

      // Create dummy user for passenger if not exists (Simplified for MVP)
      // Real app should handle auth better.
      const reference = BookingService.generateReference();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const newBooking = await trx
        .insertInto('bookings')
        .values({
          reference_code: reference,
          trip_id: tripId,
          passenger_id: '00000000-0000-0000-0000-000000000000', // Placeholder for anonymous
          status: 'SEAT_HELD',
          total_amount: totalAmount,
          currency: 'USD',
          expires_at: expiresAt
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Insert selected seats
      const seatValues = seatIds.map((sid: string) => ({
        booking_id: newBooking.id,
        trip_id: tripId,
        seat_id: sid,
        passenger_name: passengerName || 'Guest',
      }));

      await trx.insertInto('booking_seats').values(seatValues).execute();

      return newBooking;
    });

    return NextResponse.json({ 
      success: true, 
      bookingId: booking.id,
      reference: booking.reference_code,
      expiresAt: booking.expires_at 
    });

  } catch (error: any) {
    console.error('Booking Hold Error:', error);
    // Note: In case of error, we should ideally release Redis locks immediately
    // or let them expire after 10m naturally.
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
