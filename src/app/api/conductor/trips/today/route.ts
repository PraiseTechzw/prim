import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';

/**
 * Fetch trips for the logged-in conductor scheduled for today
 * GET /api/conductor/trips/today
 */
export async function GET(request: Request) {
  // In a real production app, we would extract the operator_id and user_id from the session
  // For the MVP, we assume a generic conductor role view.
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  try {
    const trips = await db
      .selectFrom('trips')
      .innerJoin('routes', 'trips.route_id', 'routes.id')
      .innerJoin('buses', 'trips.bus_id', 'buses.id')
      .select([
        'trips.id',
        'trips.departure_time',
        'trips.status',
        'routes.origin',
        'routes.destination',
        'buses.registration_number',
        'buses.capacity'
      ])
      .where('trips.departure_time', '>=', todayStart)
      .where('trips.departure_time', '<=', todayEnd)
      .where('trips.status', '!=', 'CANCELLED')
      .orderBy('trips.departure_time', 'asc')
      .execute();

    // Attach counts
    const enrichedTrips = await Promise.all(trips.map(async (trip) => {
        const boardCount = await db
            .selectFrom('booking_seats')
            .where('trip_id', '=', trip.id)
            .where('boarding_status', '=', 'BOARDED')
            .select(({ fn }) => fn.count('seat_id').as('count'))
            .executeTakeFirst();
        
        const confirmedCount = await db
            .selectFrom('booking_seats')
            .innerJoin('bookings', 'booking_seats.booking_id', 'bookings.id')
            .where('booking_seats.trip_id', '=', trip.id)
            .where('bookings.status', '=', 'CONFIRMED')
            .select(({ fn }) => fn.count('booking_seats.seat_id').as('count'))
            .executeTakeFirst();

        return {
            ...trip,
            boarded: boardCount?.count || 0,
            confirmed: confirmedCount?.count || 0
        };
    }));

    return NextResponse.json({ trips: enrichedTrips });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
