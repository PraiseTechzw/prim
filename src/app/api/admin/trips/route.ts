import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET() {
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
        'buses.bus_class',
        'buses.capacity'
      ])
      .orderBy('trips.departure_time', 'desc')
      .execute();

    // Map trips and attach bookings count for summary
    const enhancedTrips = await Promise.all(trips.map(async (trip) => {
      const bookingsCount = await db
        .selectFrom('booking_seats')
        .innerJoin('bookings', 'booking_seats.booking_id', 'bookings.id')
        .where('booking_seats.trip_id', '=', trip.id)
        .where('bookings.status', 'in', ['CONFIRMED', 'CHECKED_IN'])
        .select(({ fn }) => fn.count('booking_seats.seat_id').as('count'))
        .executeTakeFirst();
      
      return {
        ...trip,
        booked_count: bookingsCount?.count || 0
      };
    }));

    return NextResponse.json({ trips: enhancedTrips });
  } catch (error) {
    console.error('Admin Trips API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
