import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

/**
 * Fetch full details for a booking
 * GET /api/bookings/[bookingId]
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params;

  try {
    const booking = await db
      .selectFrom('bookings')
      .innerJoin('trips', 'bookings.trip_id', 'trips.id')
      .innerJoin('routes', 'trips.route_id', 'routes.id')
      .innerJoin('operators', 'routes.operator_id', 'operators.id')
      .where('bookings.id', '=', bookingId)
      .select([
        'bookings.id',
        'bookings.reference_code',
        'bookings.status',
        'bookings.total_amount',
        'bookings.expires_at',
        'trips.departure_time',
        'routes.origin',
        'routes.destination',
        'operators.name as operator_name'
      ])
      .executeTakeFirstOrThrow();

    const seats = await db
      .selectFrom('booking_seats')
      .innerJoin('seats', 'booking_seats.seat_id', 'seats.id')
      .where('booking_seats.booking_id', '=', bookingId)
      .select([
        'booking_seats.seat_id',
        'seats.seat_identifier',
        'booking_seats.passenger_name',
        'booking_seats.boarding_status'
      ])
      .execute();

    return NextResponse.json({ 
        ...booking, 
        seats 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
