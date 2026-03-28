import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { LockService } from '../../../../services/LockService';
import { BookingService } from '../../../../services/BookingService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Atomic seat reservation and booking creation
 * POST /api/bookings/create
 */
export async function POST(request: Request) {
  try {
    const { tripId, seatIds, passengerId } = await request.json();

    if (!tripId || !seatIds?.length) {
      return NextResponse.json({ error: 'Trip ID and Seat IDs are required' }, { status: 400 });
    }

    // 1. Transactional check and creation
    const booking = await db.transaction().execute(async (trx) => {
        // A. Check if any seat is already booked in DB
        const existing = await trx
            .selectFrom('booking_seats')
            .innerJoin('bookings', 'booking_seats.booking_id', 'bookings.id')
            .where('booking_seats.trip_id', '=', tripId)
            .where('booking_seats.seat_id', 'in', seatIds)
            .where('bookings.status', 'not in', ['CANCELLED', 'EXPIRED'])
            .select('seat_id')
            .execute();

        if (existing.length > 0) {
            throw new Error('One or more selected seats were recently booked.');
        }

        // B. Attempt to acquire Redis locks (10 min hold)
        const locked = await LockService.lockSeats(tripId, seatIds, 600); // 10 minutes
        if (!locked) {
            throw new Error('Could not lock seats. They might be held by another user.');
        }

        // C. Fetch trip for total amount calculation
        const trip = await trx
            .selectFrom('trips')
            .innerJoin('routes', 'trips.route_id', 'routes.id')
            .where('trips.id', '=', tripId)
            .select(['routes.base_fare_usd', 'trips.override_fare_usd'])
            .executeTakeFirstOrThrow();
        
        const fare = parseFloat(trip.override_fare_usd || trip.base_fare_usd);
        const totalAmount = fare * seatIds.length;

        // D. Create Booking header
        const bookingRef = BookingService.generateReference();
        const bookingId = uuidv4();

        const createdBooking = await trx
            .insertInto('bookings')
            .values({
                id: bookingId,
                reference_code: bookingRef,
                trip_id: tripId,
                passenger_id: passengerId || '00000000-0000-0000-0000-000000000000', // Guest placeholder
                status: 'SEAT_HELD',
                total_amount: totalAmount.toFixed(2),
                expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 min from now
            })
            .returningAll()
            .executeTakeFirstOrThrow();

        // E. Associate seats
        const seatsToInsert = seatIds.map((sid: string) => ({
            booking_id: bookingId,
            trip_id: tripId,
            seat_id: sid,
            boarding_status: 'NOT_CHECKED_IN'
        }));

        await trx.insertInto('booking_seats').values(seatsToInsert).execute();

        return createdBooking;
    });

    return NextResponse.json({ 
        success: true, 
        bookingId: booking.id,
        reference: booking.reference_code,
        expiresAt: booking.expires_at
    });

  } catch (err: any) {
    console.error('Booking API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
