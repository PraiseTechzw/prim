import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id: bookingId } = params;

  try {
    const booking = await db
      .selectFrom('bookings')
      .innerJoin('trips', 'bookings.trip_id', 'trips.id')
      .innerJoin('routes', 'trips.route_id', 'routes.id')
      .select([
        'bookings.id',
        'bookings.reference_code',
        'bookings.status',
        'bookings.total_amount',
        'bookings.currency',
        'bookings.expires_at',
        'trips.departure_time',
        'routes.origin',
        'routes.destination'
      ])
      .where('bookings.id', '=', bookingId)
      .executeTakeFirst();

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Fetch associated seats
    const seats = await db
      .selectFrom('booking_seats')
      .innerJoin('seats', 'booking_seats.seat_id', 'seats.id')
      .where('booking_seats.booking_id', '=', bookingId)
      .select(['seats.id', 'seats.seat_identifier', 'booking_seats.passenger_name'])
      .execute();

    return NextResponse.json({ 
      booking: {
        ...booking,
        seats
      }
    });
  } catch (error) {
    console.error('Fetch Booking Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
