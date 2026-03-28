import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

/**
 * Validates a ticket (QR or Reference) for a specific trip
 * POST /api/conductor/validate-ticket
 */
export async function POST(request: Request) {
  try {
    const { ticketCode, tripId } = await request.json();

    if (!ticketCode || !tripId) {
      return NextResponse.json({ error: 'Ticket code and trip id are required' }, { status: 400 });
    }

    // 1. Fetch booking by reference
    const passenger = await db
      .selectFrom('booking_seats')
      .innerJoin('bookings', 'booking_seats.booking_id', 'bookings.id')
      .innerJoin('seats', 'booking_seats.seat_id', 'seats.id')
      .innerJoin('trips', 'booking_seats.trip_id', 'trips.id')
      .innerJoin('routes', 'trips.route_id', 'routes.id')
      .where('bookings.reference_code', '=', ticketCode)
      .where('booking_seats.trip_id', '=', tripId)
      .select([
        'bookings.id as booking_id',
        'bookings.reference_code',
        'bookings.status as booking_status',
        'seats.id as seat_id',
        'seats.seat_identifier',
        'booking_seats.passenger_name',
        'booking_seats.boarding_status',
        'routes.origin',
        'routes.destination',
        'trips.departure_time'
      ])
      .executeTakeFirst();

    if (!passenger) {
      // Check if ticket exists at all but for another trip
      const otherTrip = await db
        .selectFrom('bookings')
        .where('reference_code', '=', ticketCode)
        .select('trip_id')
        .executeTakeFirst();
      
      if (otherTrip) {
        return NextResponse.json({ 
            valid: false, 
            error: 'WRONG_TRIP',
            message: 'This ticket is valid but for a different trip.' 
        }, { status: 400 });
      }

      return NextResponse.json({ 
          valid: false, 
          error: 'NOT_FOUND',
          message: 'No booking found with this reference code.' 
      }, { status: 404 });
    }

    // 2. Business Rules Validation
    if (passenger.booking_status !== 'CONFIRMED') {
        return NextResponse.json({ 
            valid: false, 
            error: 'NOT_CONFIRMED',
            message: `Booking is not confirmed. (Status: ${passenger.booking_status})` 
        }, { status: 400 });
    }

    if (passenger.boarding_status === 'BOARDED') {
        return NextResponse.json({ 
            valid: false, 
            error: 'ALREADY_BOARDED',
            message: 'This passenger has already boarded the bus.' 
        }, { status: 400 });
    }

    // 3. Success
    return NextResponse.json({ 
        valid: true, 
        passenger 
    });

  } catch (err: any) {
    console.error('Validation Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
