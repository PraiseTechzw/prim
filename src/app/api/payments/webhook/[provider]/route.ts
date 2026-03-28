import { NextResponse } from 'next/server';
import { PaymentGateway } from '../../../../../services/PaymentGateway';

/**
 * Handle incoming webhooks from external payment providers
 * e.g., POST /api/payments/webhook/ecocash
 */
export async function POST(
  request: Request,
  { params }: { params: { provider: string } }
) {
  const { provider } = params;
  
  try {
    const payload = await request.json();
    
    // In production, you MUST verify signatures / IP here for security!
    // Example: verifyEcoCashSignature(payload, request.headers.get('X-Signature'))

    await PaymentGateway.handleWebhook(provider, payload);
    
    // Most providers require a success response to stop retries
    return NextResponse.json({ status: 'ok', received: true });
  } catch (error) {
    console.error(`[Webhook Route Error] ${provider}:`, error);
    // Return 400 to signal error so provider can retry if needed
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
  }
}
