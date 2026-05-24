import { Router, Request, Response } from 'express';
import { inventoryDb, orderDb, OrderService } from './microservices';
import { eventsLog } from './bus';

export const apiRouter = Router();

// API Gateway Pattern: Exposing internal disparate routes through a single surface

apiRouter.get('/inventory', (req: Request, res: Response) => {
  res.json(Object.values(inventoryDb));
});

apiRouter.get('/orders', (req: Request, res: Response) => {
  res.json(Array.from(orderDb.values()).reverse()); // Newest first
});

apiRouter.get('/events', (req: Request, res: Response) => {
  res.json(eventsLog);
});

apiRouter.post('/orders', (req: Request, res: Response) => {
  const { productId, qty, simulatePaymentFail } = req.body;
  if (!productId || typeof qty !== 'number' || qty <= 0) {
    res.status(400).json({ error: 'Valid productId and qty are required' });
    return;
  }
  
  // Directly command the Order Service behind the gateway
  const orderId = OrderService.createOrder(productId, qty, simulatePaymentFail);
  res.json({ orderId, status: 'Processing requested' });
});
