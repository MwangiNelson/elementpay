import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { WebhookPayload } from '@/types';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Parse signature header: t=<timestamp>,v1=<signature>
    const parts = signature.split(',');
    const timestampPart = parts.find(p => p.startsWith('t='));
    const signaturePart = parts.find(p => p.startsWith('v1='));
    
    if (!timestampPart || !signaturePart) {
      return false;
    }
    
    const timestamp = parseInt(timestampPart.split('=')[1]);
    const providedSignature = signaturePart.split('=')[1];
    
    // Check freshness (within 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > 300) {
      return false;
    }
    
    // Compute expected signature
    const payload = `${timestamp}.${rawBody}`;
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('base64');
    
    // Constant-time comparison
    const providedBuffer = Buffer.from(providedSignature, 'base64');
    const expectedBuffer = Buffer.from(expectedSignature, 'base64');
    
    if (providedBuffer.length !== expectedBuffer.length) {
      return false;
    }
    
    return timingSafeEqual(providedBuffer, expectedBuffer);
  } catch (error) {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('X-Webhook-Signature');
    
    if (!signature) {
      return NextResponse.json(
        { error: 'missing_signature', message: 'X-Webhook-Signature header required' },
        { status: 401 }
      );
    }
    
    // Verify signature
    if (!verifyWebhookSignature(rawBody, signature, WEBHOOK_SECRET)) {
      return NextResponse.json(
        { error: 'invalid_signature', message: 'Webhook signature verification failed' },
        { status: 403 }
      );
    }
    
    // Parse webhook payload
    const payload: WebhookPayload = JSON.parse(rawBody);
    
    // Process webhook (in a real app, you'd update your database here)
    console.log('Webhook received:', payload);
    
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'internal_error', message: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

