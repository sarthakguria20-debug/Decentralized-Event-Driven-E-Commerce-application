import { bus, emitEvent } from './bus';
import { Product, Order } from '../types';

// ==========================================
// DECENTRALIZED DATA STORES
// In a real system, each service has its own DB (e.g. Postgres)
// ==========================================

export const inventoryDb: Record<string, Product> = {
  'prod_1': { id: 'prod_1', name: 'Developer Laptop (Pro)', stock: 5, price: 2499 },
  'prod_2': { id: 'prod_2', name: 'Wireless Headphones', stock: 2, price: 299 },
  'prod_3': { id: 'prod_3', name: 'Ergonomic Keyboard', stock: 10, price: 150 },
};

export const orderDb = new Map<string, Order>();


// ==========================================
// 1. ORDER SERVICE
// ==========================================

export const OrderService = {
  createOrder(productId: string, qty: number, simulatePaymentFail: boolean = false) {
    const orderId = `ord_${Math.random().toString(36).substring(2, 9)}`;
    const order: Order = { orderId, productId, qty, status: 'PENDING', simulatePaymentFail };
    
    // 1. Persist local state
    orderDb.set(orderId, order);
    
    // 2. Publish Domain Event to broker
    emitEvent('ORDER_CREATED', order);
    return orderId;
  }
};

// SAGA Choreography: Listeners that update local Order state based on downstream events
bus.on('INVENTORY_FAILED', (payload) => {
  const order = orderDb.get(payload.orderId);
  if (order) {
    order.status = 'CANCELLED_OUT_OF_STOCK';
    orderDb.set(order.orderId, order);
    emitEvent('ORDER_CANCELLED', { orderId: order.orderId, reason: 'Inventory unavailable' });
  }
});

bus.on('PAYMENT_FAILED', (payload) => {
  const order = orderDb.get(payload.orderId);
  if (order) {
    order.status = 'CANCELLED_PAYMENT_FAILED';
    orderDb.set(order.orderId, order);
    emitEvent('ORDER_CANCELLED', { orderId: order.orderId, reason: 'Payment failed' });
  }
});

bus.on('PAYMENT_SUCCESS', (payload) => {
  const order = orderDb.get(payload.orderId);
  if (order) {
    order.status = 'COMPLETED';
    orderDb.set(order.orderId, order);
    emitEvent('ORDER_COMPLETED', { orderId: order.orderId });
  }
});


// ==========================================
// 2. INVENTORY SERVICE
// ==========================================

bus.on('ORDER_CREATED', (payload: Order) => {
  const { orderId, productId, qty } = payload;
  const product = inventoryDb[productId];

  // Simulate remote service processing time
  setTimeout(() => {
    if (product && product.stock >= qty) {
      product.stock -= qty; // Reserve inventory locally
      emitEvent('INVENTORY_RESERVED', { orderId, productId, qty, price: product.price });
    } else {
      emitEvent('INVENTORY_FAILED', { orderId });
    }
  }, 400);
});

// SAGA Compensating Transaction: Undo reservation if upstream fails
bus.on('PAYMENT_FAILED', (payload) => {
  const { productId, qty } = payload;
  const product = inventoryDb[productId];
  if (product) {
    product.stock += qty; // Release reservation back to pool
    emitEvent('INVENTORY_RESTORED', { orderId: payload.orderId, productId, qty, reason: 'Compensating transaction (Payment F)' });
  }
});


// ==========================================
// 3. PAYMENT SERVICE
// ==========================================

bus.on('INVENTORY_RESERVED', (payload) => {
  const { orderId, productId, qty, price } = payload;
  const order = orderDb.get(orderId);
  const shouldFail = order?.simulatePaymentFail;

  // Simulate payment gateway interaction (Stripe / PayPal)
  setTimeout(() => {
    if (shouldFail) {
      emitEvent('PAYMENT_FAILED', { orderId, productId, qty, reason: 'Card declined / Insufficient funds' });
    } else {
      emitEvent('PAYMENT_SUCCESS', { orderId, amount: price * qty });
    }
  }, 1200);
});


// ==========================================
// 4. NOTIFICATION SERVICE
// ==========================================

bus.on('ORDER_COMPLETED', (payload) => {
  setTimeout(() => {
    emitEvent('NOTIFICATION_SENT', { recipient: 'cx@example.com', template: 'RECEIPT', message: `Order ${payload.orderId} Confirmed.` });
  }, 200);
});

bus.on('ORDER_CANCELLED', (payload) => {
  setTimeout(() => {
    emitEvent('NOTIFICATION_SENT', { recipient: 'cx@example.com', template: 'APOLOGY', message: `Order ${payload.orderId} Failed: ${payload.reason}` });
  }, 200);
});
