import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { LockService } from '../../../../../services/LockService';

/**
 * Fetch seats and their real-time availability for a trip
 * GET /api/trips/[tripId]/seats
 */
export async function GET(
  request: Request,
  { params }: { params: { tripId: string } }
) {
  const { tripId } = params;

  try {
    const trip = await db
      .selectFrom('trips')
      .innerJoin('routes', 'trips.route_id', 'routes.id')
      .innerJoin('buses', 'trips.bus_id', 'buses.id')
      .where('trips.id', '=', tripId)
      .select([
        'trips.id',
        'trips.departure_time',
        'routes.origin',
        'routes.destination',
        'routes.base_fare_usd',
        'trips.override_fare_usd',
        'buses.id as bus_id',
        'buses.capacity'
      ])
      .executeTakeFirstOrThrow();

    const seats = await db
      .selectFrom('seats')
      .where('bus_id', '=', trip.bus_id)
      .selectAll()
      .orderBy('seat_identifier', 'asc')
      .execute();

    // Fetch permanent locks from DB (Confirmed bookings)
    const bookedSeats = await db
      .selectFrom('booking_seats')
      .innerJoin('bookings', 'booking_seats.booking_id', 'bookings.id')
      .where('booking_seats.trip_id', '=', tripId)
      .where('bookings.status', 'in', ['CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'PAYMENT_PENDING'])
      .select('seat_id')
      .execute();
    
    const bookedIds = new Set(bookedSeats.map(s => s.seat_id));

    // Fetch temporary locks from Redis
    const lockMap = await LockService.getLockedSeatsForTrip(tripId);

    const enrichedSeats = seats.map(seat => {
        const isPermanentlyBooked = bookedIds.has(seat.id);
        const isTemporarilyLocked = !!lockMap[seat.id];
        
        return {
            ...seat,
            isLocked: isPermanentlyBooked || isTemporarilyLocked,
            lockType: isPermanentlyBooked ? 'BOOKED' : isTemporarilyLocked ? 'PENDING' : 'AVAILABLE'
        };
    });

    return NextResponse.json({ 
        trip, 
        seats: enrichedSeats 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
