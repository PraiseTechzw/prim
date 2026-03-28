import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';

/**
 * Fetch all booked passengers for a trip (The Manifest)
 * e.g., GET /api/admin/manifests/TRIP_UUID
 */
export async function GET(
  request: Request,
  { params }: { params: { tripId: string } }
) {
  const { tripId } = params;

  try {
    // 1. Fetch trip metadata
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
        'buses.registration_number',
        'buses.capacity'
      ])
      .executeTakeFirst();

    if (!trip) throw new Error('Trip not found');

    // 2. Fetch all CONFIRMED or CHECKED_IN bookings for this trip
    const manifest = await db
      .selectFrom('booking_seats')
      .innerJoin('bookings', 'booking_seats.booking_id', 'bookings.id')
      .innerJoin('seats', 'booking_seats.seat_id', 'seats.id')
      .where('booking_seats.trip_id', '=', tripId)
      .where('bookings.status', 'in', ['CONFIRMED', 'CHECKED_IN'])
      .select([
        'seats.seat_identifier',
        'booking_seats.passenger_name',
        'booking_seats.passenger_id_number',
        'bookings.reference_code',
        'bookings.status as booking_status',
        'bookings.total_amount'
      ])
      .orderBy('seats.seat_identifier', 'asc')
      .execute();

    // 3. (Side effect: You could also map UNPAID / HELD seats if the conductor wants to see potential walk-ins)

    return NextResponse.json({ 
        trip,
        passengers: manifest,
        total_booked: manifest.length
    });
  } catch (error: any) {
    console.error('Manifest Fetch Error:', error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
