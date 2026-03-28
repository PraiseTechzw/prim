import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

/**
 * Fetch financial summary for reconciliation.
 * e.g., GET /api/admin/reconciliation?date=2024-11-20&branchId=...
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const branchId = searchParams.get('branchId');

  try {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // 1. Grouped Collections by Provider (CASH, ECOCASH, ZIPIT)
    const collectionsByProvider = await db
      .selectFrom('payments')
      .select([
        'provider',
        ({ fn }) => fn.sum('amount').as('total_amount'),
        ({ fn }) => fn.count('id').as('count')
      ])
      .where('created_at', '>=', startDate)
      .where('created_at', '<=', endDate)
      .where('status', '=', 'SUCCESS')
      .groupBy('provider')
      .execute();

    // 2. Grouped Collections by Clerk (For cash-up auditing)
    const collectionsByClerk = await db
      .selectFrom('payments')
      .innerJoin('users', 'payments.handled_by_clerk', 'users.id')
      .select([
        'users.full_name as clerk_name',
        'payments.provider',
        ({ fn }) => fn.sum('amount').as('total_amount'),
        ({ fn }) => fn.count('payments.id').as('count')
      ])
      .where('payments.created_at', '>=', startDate)
      .where('payments.created_at', '<=', endDate)
      .where('payments.status', '=', 'SUCCESS')
      .groupBy(['users.full_name', 'payments.provider'])
      .execute();

    // 3. Pending payments requiring verification (ZIPIT/Manual transfers)
    const pendingVerifications = await db
        .selectFrom('payments')
        .innerJoin('bookings', 'payments.booking_id', 'bookings.id')
        .select([
            'payments.id',
            'payments.amount',
            'payments.currency',
            'payments.provider',
            'payments.provider_reference',
            'bookings.reference_code',
            'payments.created_at'
        ])
        .where('payments.status', '=', 'REQUIRES_MANUAL_REVIEW')
        .orderBy('payments.created_at', 'desc')
        .execute();

    return NextResponse.json({ 
        date,
        summary: collectionsByProvider,
        clerkBreakdown: collectionsByClerk,
        pending: pendingVerifications
    });
  } catch (error: any) {
    console.error('Reconciliation API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Manual Approval Action
 * e.g., POST /api/admin/reconciliation/verify
 */
export async function POST(request: Request) {
    // This part should be protected by Finance Role 
    const { paymentId, action, notes } = await request.json();
    
    // In actual implementation, we'd use the session user for auditorId
    const auditorId = '00000000-0000-0000-0000-000000000000'; // Placeholder

    try {
        if (action === 'APPROVE') {
            await db.transaction().execute(async (trx) => {
                // 1. Update Payment status
                const payment = await trx
                    .updateTable('payments')
                    .set({ status: 'SUCCESS', verified_by_finance: auditorId })
                    .where('id', '=', paymentId)
                    .returningAll()
                    .executeTakeFirstOrThrow();

                // 2. Confirm Booking
                await trx
                    .updateTable('bookings')
                    .set({ status: 'CONFIRMED' })
                    .where('id', '=', payment.booking_id)
                    .execute();

                // 3. Log Audit
                await trx
                    .insertInto('audit_logs')
                    .values({
                        user_id: auditorId,
                        action: 'MANUAL_PAYMENT_APPROVAL',
                        entity: 'payment',
                        entity_id: paymentId,
                        reason: notes || 'Verified manual transfer'
                    })
                    .execute();
            });
            return NextResponse.json({ success: true });
        }
        
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
