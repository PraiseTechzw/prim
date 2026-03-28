import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { BookingService } from '../../../../services/BookingService';

/**
 * MOCK finalize booking with payment and names
 * POST /api/payments/mock
 */
export async function POST(request: Request) {
  try {
    const { bookingId, provider, reference, passengerNames } = await request.json();

    if (!bookingId || !provider || !reference) {
      return NextResponse.json({ error: 'Missing mandatory payment fields' }, { status: 400 });
    }

    await db.transaction().execute(async (trx) => {
        // 1. Update passenger names in booking_seats
        if (passengerNames) {
            for (const seatId of Object.keys(passengerNames)) {
                await trx
                    .updateTable('booking_seats')
                    .set({ passenger_name: passengerNames[seatId] })
                    .where('booking_id', '=', bookingId)
                    .where('seat_id', '=', seatId)
                    .execute();
            }
        }

        // 2. Call confirmPayment logic (this creates payment record and sets booking to CONFIRMED)
        // We simulate the call to BookingService.confirmPayment here
        
        // A. Create Payment
        const amount = await trx
            .selectFrom('bookings')
            .where('id', '=', bookingId)
            .select('total_amount')
            .executeTakeFirstOrThrow();

        await trx.insertInto('payments')
            .values({
                booking_id: bookingId,
                amount: amount.total_amount,
                currency: 'USD',
                provider: provider,
                provider_reference: reference,
                status: 'SUCCESS'
            })
            .execute();

        // B. Confirm Booking
        await trx
            .updateTable('bookings')
            .set({ status: 'CONFIRMED' })
            .where('id', '=', bookingId)
            .execute();
    });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Finalization Error:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
