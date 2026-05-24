export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED_OUT_OF_STOCK' | 'CANCELLED_PAYMENT_FAILED';

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface Order {
  orderId: string;
  productId: string;
  qty: number;
  status: OrderStatus;
  simulatePaymentFail: boolean;
}

export interface EventLogEntry {
  id: string;
  type: string;
  payload: any;
  timestamp: string;
}
