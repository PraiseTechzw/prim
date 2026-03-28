import { db } from '../lib/db';

export class AgentService {
  /**
   * Links a booking to an agent and calculates commission.
   */
  static async attributeSale(bookingId: string, agentId: string) {
    return await db.transaction().execute(async (trx) => {
      // 1. Fetch agent and booking context
      const agent = await trx
        .selectFrom('agents')
        .where('id', '=', agentId)
        .select(['id', 'commission_rate_percentage'])
        .executeTakeFirst();

      const booking = await trx
        .selectFrom('bookings')
        .where('id', '=', bookingId)
        .select(['id', 'total_amount'])
        .executeTakeFirst();

      if (!agent || !booking) throw new Error('Agent or Booking not found');

      // 2. Calculate Commission
      const amountUSD = parseFloat(booking.total_amount);
      const rate = parseFloat(agent.commission_rate_percentage) / 100;
      const commission = amountUSD * rate;

      // 3. Record the sale
      await trx
        .insertInto('agent_sales')
        .values({
            agent_id: agentId,
            booking_id: bookingId,
            sale_amount_usd: amountUSD.toFixed(2),
            commission_earned_usd: commission.toFixed(2),
            status: 'UNPAID'
        })
        .execute();

      return { success: true, commission: commission.toFixed(2) };
    });
  }

  /**
   * Get earnings summary for an agent
   */
  static async getEarnings(agentId: string) {
    const summary = await db
        .selectFrom('agent_sales')
        .where('agent_id', '=', agentId)
        .select([
            ({ fn }) => fn.sum('commission_earned_usd').as('total_earned'),
            ({ fn }) => fn.count('id').as('total_sales')
        ])
        .executeTakeFirst();

    const unpaid = await db
        .selectFrom('agent_sales')
        .where('agent_id', '=', agentId)
        .where('status', '=', 'UNPAID')
        .select(({ fn }) => fn.sum('commission_earned_usd').as('unpaid_total'))
        .executeTakeFirst();

    return {
        totalEarned: summary?.total_earned || '0.00',
        totalSales: summary?.total_sales || 0,
        unpaidAmount: unpaid?.unpaid_total || '0.00'
    };
  }
}
