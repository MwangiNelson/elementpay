import { NextRequest, NextResponse } from 'next/server';
import { Order, OrderStatus } from '@/types';
import { orders } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { order_id: string } }
) {
  const orderId = params.order_id;
  
  // Check if order exists
  let order = orders.get(orderId);
  if (!order) {
    return NextResponse.json(
      { error: 'order_not_found', message: `No order with id ${orderId}` },
      { status: 404 }
    );
  }
  
  // Calculate time-based status
  const createdAt = new Date(order.created_at);
  const now = new Date();
  const secondsElapsed = Math.floor((now.getTime() - createdAt.getTime()) / 1000);
  
  let status: OrderStatus;
  if (secondsElapsed < 8) {
    status = 'created';
  } else if (secondsElapsed < 18) {
    status = 'processing';
  } else {
    // 80% settled, 20% failed
    status = Math.random() < 0.8 ? 'settled' : 'failed';
  }
  
  // Update order status
  const updatedOrder = { ...order, status };
  orders.set(orderId, updatedOrder);
  
  return NextResponse.json(updatedOrder);
}

