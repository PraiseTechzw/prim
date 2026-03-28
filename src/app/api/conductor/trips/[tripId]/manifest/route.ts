import { NextResponse } from 'next/server';
import { db } from '../../../../../../lib/db';

/**
 * Fetch manifest for a trip specifically for boarding operations
 * GET /api/conductor/trips/:tripId/manifest
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
      .select(['trips.id', 'trips.departure_time', 'routes.origin', 'routes.destination', 'buses.registration_number'])
      .executeTakeFirstOrThrow();

    const passengers = await db
      .selectFrom('booking_seats')
      .innerJoin('bookings', 'booking_seats.booking_id', 'bookings.id')
      .innerJoin('seats', 'booking_seats.seat_id', 'seats.id')
      .where('booking_seats.trip_id', '=', tripId)
      .select([
        'bookings.id as booking_id',
        'bookings.reference_code',
        'bookings.status as booking_status',
        'seats.id as seat_id',
        'seats.seat_identifier',
        'booking_seats.passenger_name',
        'booking_seats.boarding_status'
      ])
      .orderBy('seats.seat_identifier', 'asc')
      .execute();

    return NextResponse.json({ 
        trip,
        passengers 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
