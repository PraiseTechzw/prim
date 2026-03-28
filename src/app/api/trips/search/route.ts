import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const date = searchParams.get('date'); // Expects ISO string or YYYY-MM-DD

  try {
    let query = db
      .selectFrom('trips')
      .innerJoin('routes', 'trips.route_id', 'routes.id')
      .innerJoin('buses', 'trips.bus_id', 'buses.id')
      .innerJoin('operators', 'routes.operator_id', 'operators.id')
      .select([
        'trips.id',
        'trips.departure_time',
        'trips.arrival_time',
        'trips.status as trip_status',
        'trips.override_fare_usd',
        'routes.origin',
        'routes.destination',
        'routes.base_fare_usd',
        'buses.registration_number',
        'buses.bus_class',
        'buses.capacity',
        'operators.name as operator_name',
        'operators.code as operator_code'
      ])
      .where('trips.status', '=', 'SCHEDULED');

    if (from) {
      query = query.where('routes.origin', 'ilike', `%${from}%`);
    }

    if (to) {
      query = query.where('routes.destination', 'ilike', `%${to}%`);
    }

    if (date) {
      // Start of the day and End of the day for date filtering
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      query = query
        .where('trips.departure_time', '>=', startDate)
        .where('trips.departure_time', '<=', endDate);
    }

    const trips = await query.orderBy('trips.departure_time', 'asc').execute();

    return NextResponse.json({ trips });
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
