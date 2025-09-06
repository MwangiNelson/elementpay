export type OrderStatus = 'created' | 'processing' | 'settled' | 'failed';

export interface CreateOrderRequest {
  amount: number;
  currency: string;
  token: string;
  note?: string;
}

export interface Order {
  order_id: string;
  status: OrderStatus;
  amount: number;
  currency: string;
  token: string;
  note?: string;
  created_at: string;
}

export interface WebhookPayload {
  type: string;
  data: {
    order_id: string;
    status: OrderStatus;
  };
}

export interface ApiError {
  error: string;
  message: string;
}

export interface WalletState {
  isConnected: boolean;
  address?: string;
  chainId?: number;
  isConnecting: boolean;
}

