declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
      validated?: unknown;
    }
  }
}

export type PaymentStatus = 'initiated' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  order_id: string;
  amount: string;
  status: PaymentStatus;
  idempotency_key: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrderCreatedEventData {
  orderId: string;
  userId: string;
  totalAmount: number;
  items?: Array<{ productId: string; quantity: number; price?: number }>;
}
