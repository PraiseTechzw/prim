import { NextResponse } from 'next/server';
import { CheckinService } from '../../../../services/CheckinService';

/**
 * Perform manual override boarding authorization
 * POST /api/conductor/checkins/override
 */
export async function POST(request: Request) {
  try {
    const { tripId, bookingId, seatId, action, reasonCode, note, idempotencyKey } = await request.json();

    if (!tripId || !bookingId || !seatId || !action || !reasonCode || !idempotencyKey) {
      return NextResponse.json({ error: 'Missing mandatory fields' }, { status: 400 });
    }

    // Role verification would happen here in production
    const approvedBy = '00000000-0000-0000-0000-000000000001'; // Supervisor Placeholder

    const result = await CheckinService.supervisorOverride({
        tripId,
        bookingId,
        seatId,
        overrideAction: action,
        reasonCode,
        note,
        approvedBy,
        idempotencyKey
    });

    return NextResponse.json({ 
        success: true, 
        alreadyDone: result.alreadyDone 
    });

  } catch (err: any) {
    console.error('Supervisor Override API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
