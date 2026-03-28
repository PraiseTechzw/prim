import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { LockService } from '../../../../../services/LockService';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id: tripId } = params;

  try {
    // 1. Fetch trip and bus details
    const trip = await db
      .selectFrom('trips')
      .innerJoin('buses', 'trips.bus_id', 'buses.id')
      .innerJoin('routes', 'trips.route_id', 'routes.id')
      .select([
        'trips.id',
        'trips.departure_time',
        'buses.id as bus_id',
        'buses.layout_type',
        'buses.capacity',
        'routes.origin',
        'routes.destination',
        'routes.base_fare_usd',
        'trips.override_fare_usd'
      ])
      .where('trips.id', '=', tripId)
      .executeTakeFirst();

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // 2. Fetch all seats for this bus
    const seats = await db
      .selectFrom('seats')
      .where('bus_id', '=', trip.bus_id)
      .select(['id', 'seat_identifier', 'is_active'])
      .orderBy('seat_identifier', 'asc')
      .execute();

    // 3. Fetch current bookings for this trip
    // Note: Concurrency check: filter for active states
    const activeBookings = await db
      .selectFrom('booking_seats')
      .innerJoin('bookings', 'booking_seats.booking_id', 'bookings.id')
      .where('booking_seats.trip_id', '=', tripId)
      .where('bookings.status', 'in', ['SEAT_HELD', 'PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFICATION', 'CONFIRMED'])
      .select('booking_seats.seat_id')
      .execute();

    const bookedSeatIds = new Set(activeBookings.map(b => b.seat_id));

    // 4. Fetch current Redis locks (to show real-time "locked" but not yet "booked" in DB)
    const lockedSeatIdentifiers = await LockService.getLockedSeats(tripId);
    
    // Map seats with status
    const seatMap = seats.map(seat => ({
      ...seat,
      status: bookedSeatIds.has(seat.id) 
        ? 'BOOKED' 
        : lockedSeatIdentifiers.includes(seat.id) // Redis stores by seat_id or identifier? LockService uses seat_id
        ? 'LOCKED' 
        : 'AVAILABLE'
    }));

    return NextResponse.json({ 
      trip,
      seats: seatMap
    });
  } catch (error) {
    console.error('Fetch Trip Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
