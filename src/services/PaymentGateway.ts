import { db } from '../lib/db';
import { BookingService } from './BookingService';
import { PaymentStatus } from '../lib/types';

export interface PaymentProviderResponse {
    success: boolean;
    providerReference: string;
    amount: string;
    currency: string;
    status: PaymentStatus;
    error?: string;
}

export class PaymentGateway {
  /**
   * Universal status poller/verifer.
   * Can be used to check status if webhook fails.
   */
  static async verifyPaymentStatus(paymentId: string): Promise<PaymentProviderResponse> {
    // 1. Fetch payment and provider details from DB
    // 2. Call external API (Mocking here)
    // 3. Update DB
    return {
      success: true,
      providerReference: 'EC-MOCK-123',
      amount: '25.00',
      currency: 'USD',
      status: 'SUCCESS'
    };
  }

  /**
   * Handles payment provider webhooks (EcoCash, etc.)
   */
  static async handleWebhook(provider: string, payload: any): Promise<void> {
    console.log(`[Webhook] Received ${provider} update:`, payload);

    // 1. Parse payload based on provider
    let bookingReference = '';
    let status: PaymentStatus = 'INITIATED';
    let amount = '0.00';
    let providerRef = '';

    if (provider === 'ecocash') {
        bookingReference = payload.merchant_reference;
        status = payload.status === 'success' ? 'SUCCESS' : 'FAILED';
        amount = payload.amount;
        providerRef = payload.poll_url;
    }

    // 2. Find booking in DB
    const booking = await db
        .selectFrom('bookings')
        .where('reference_code', '=', bookingReference)
        .select(['id', 'total_amount', 'status'])
        .executeTakeFirst();

    if (!booking) {
        console.error(`[Webhook Error] Booking with ref ${bookingReference} not found.`);
        return;
    }

    // 3. If success, trigger BookingService confirm
    if (status === 'SUCCESS' && booking.status !== 'CONFIRMED') {
        const amountMatch = parseFloat(amount) >= parseFloat(booking.total_amount);
        
        if (!amountMatch) {
            console.error(`[Webhook Alert] Amount mismatch for ${bookingReference}. Paid ${amount}, Expected ${booking.total_amount}`);
            // Transition to MANUAL_REVIEW
            await BookingService.updateBookingStatus(booking.id, 'PAYMENT_VERIFICATION', { 
                reason: 'Amount mismatch in webhook',
                paid: amount,
                expected: booking.total_amount
            });
            return;
        }

        await BookingService.confirmPayment(booking.id, {
            amount,
            provider,
            reference: providerRef
        });

        // 4. Send Notification (Optional await)
        console.log(`[Webhook] Booking ${bookingReference} CONFIRMED.`);
    } else {
        // Handle failure state
        console.log(`[Webhook] Booking ${bookingReference} update: ${status}`);
    }
  }
}
