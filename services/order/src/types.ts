declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
      validated?: unknown;
    }
  }
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled' | 'failed';

export interface OrderItem {
  productId: string;
  quantity: number;
  price?: number;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: string;
  status: OrderStatus;
  created_at: Date;
  updated_at: Date;
}

export interface OrderWithItems extends Order {
  items: Array<{ product_id: string; quantity: number; price: string }>;
}
