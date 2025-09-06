import { NextRequest, NextResponse } from 'next/server';
import { CreateOrderRequest, Order } from '@/types';
import { orders } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();
    
    // Validate request body
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: 'invalid_amount', message: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }
    
    if (!body.currency || !body.token) {
      return NextResponse.json(
        { error: 'missing_fields', message: 'Currency and token are required' },
        { status: 400 }
      );
    }

    // Generate order ID
    const orderId = `ord_0x${Math.random().toString(16).substr(2, 10)}`;
    
    // Create order
    const order: Order = {
      order_id: orderId,
      status: 'created',
      amount: body.amount,
      currency: body.currency,
      token: body.token,
      note: body.note,
      created_at: new Date().toISOString(),
    };
    
    // Store order
    orders.set(orderId, order);
    
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'internal_error', message: 'Failed to create order' },
      { status: 500 }
    );
  }
}

