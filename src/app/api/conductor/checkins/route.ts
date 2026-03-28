import { NextResponse } from 'next/server';
import { CheckinService } from '../../../../services/CheckinService';

/**
 * Perform CHECK_IN or BOARD action for a ticket
 * POST /api/conductor/checkins
 */
export async function POST(request: Request) {
  try {
    const { tripId, bookingId, seatId, action, idempotencyKey } = await request.json();

    if (!tripId || !bookingId || !seatId || !action || !idempotencyKey) {
      return NextResponse.json({ error: 'Missing mandatory fields' }, { status: 400 });
    }

    // Performed by: dummy for MVP login session
    const performedBy = '00000000-0000-0000-0000-000000000000';

    const result = await CheckinService.processAction({
        tripId,
        bookingId,
        seatId,
        action,
        performedBy,
        idempotencyKey
    });

    return NextResponse.json({ 
        success: true, 
        alreadyDone: result.alreadyDone,
        checkin: result.checkin 
    });

  } catch (err: any) {
    console.error('Checkin API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
