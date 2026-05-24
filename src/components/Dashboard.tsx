import React, { useEffect, useState, useRef } from 'react';
import { Package, ShoppingCart, Activity, AlertCircle, CheckCircle2, RotateCcw, CreditCard } from 'lucide-react';
import { Product, Order, EventLogEntry } from '../types';

export default function Dashboard() {
  const [inventory, setInventory] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [events, setEvents] = useState<EventLogEntry[]>([]);

  // Polling loop
  useEffect(() => {
    let active = true;
    const fetchState = async () => {
      try {
        const [invRes, ordRes, evRes] = await Promise.all([
          fetch('/api/inventory'),
          fetch('/api/orders'),
          fetch('/api/events'),
        ]);
        if (active) {
          setInventory(await invRes.json());
          setOrders(await ordRes.json());
          setEvents(await evRes.json());
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 500); // 500ms polling for live feeling
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const createOrder = async (productId: string, simulatePaymentFail: boolean) => {
    navigateEventStream(); // trigger smooth scroll
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, qty: 1, simulatePaymentFail })
    });
  };

  // Helper for UI
  const eventStreamRef = useRef<HTMLDivElement>(null);
  const navigateEventStream = () => {
    if (eventStreamRef.current) {
      eventStreamRef.current.scrollTop = 0;
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-8 h-screen flex flex-col pt-6 lg:pt-10">
      <header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-sm flex items-center justify-center shrink-0">
            <div className="w-5 h-5 border-2 border-white rotate-45"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white uppercase">Decentralized Service Fabric</h1>
            <p className="text-xs font-mono text-slate-500">SAGA Pattern & Event-Driven Architecture</p>
          </div>
        </div>
        <div className="flex gap-12">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Gateway Status</p>
            <p className="text-lg font-mono text-emerald-400 flex items-center justify-end gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Active
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* -- Inventory & Ordering Column -- */}
        <div className="border border-slate-800 bg-slate-900/30 rounded-lg relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-1 h-full bg-sky-500"></div>
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-sky-500" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-sky-500">Inventory Service</h2>
          </div>
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            {inventory.map((product) => (
              <div key={product.id} className="bg-slate-900/50 p-4 rounded border border-slate-800 transition-all hover:border-slate-700">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-white">{product.name}</h3>
                    <p className="text-xs font-mono text-slate-500">${product.price}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">stock</span>
                    <span className={product.stock > 0 ? "font-mono text-lg text-emerald-400" : "font-mono text-lg text-rose-500"}>
                      {product.stock > 0 ? product.stock : 'Sold Out'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button 
                    onClick={() => createOrder(product.id, false)}
                    disabled={product.stock <= 0}
                    className="flex flex-col items-center justify-center py-2 px-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4 mb-2 opacity-70" />
                    Standard Buy
                  </button>
                  <button 
                    onClick={() => createOrder(product.id, true)}
                    disabled={product.stock <= 0}
                    className="flex flex-col items-center justify-center py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Simulate a failed payment to trigger compensating SAGA transaction"
                  >
                    <CreditCard className="w-4 h-4 mb-2 opacity-70" />
                    Simulate Payment Fail
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* -- Orders Column -- */}
        <div className="border border-slate-800 bg-slate-900/30 rounded-lg relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500"></div>
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-500">Orders State</h2>
          </div>
          <div className="p-5 flex-1 overflow-y-auto space-y-3">
            {orders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 text-sm font-mono">
                No active orders
              </div>
            ) : orders.map((order) => {
              const isCompleted = order.status === 'COMPLETED';
              const isCancelled = order.status.includes('CANCELLED');
              const bColor = isCompleted ? 'border-emerald-500/30' : isCancelled ? 'border-rose-500/30' : 'border-amber-500/30';
              const bgColor = isCompleted ? 'bg-emerald-500/5' : isCancelled ? 'bg-rose-500/5' : 'bg-amber-500/5';
              const textColor = isCompleted ? 'text-emerald-400' : isCancelled ? 'text-rose-400' : 'text-amber-400';

              return (
                <div key={order.orderId} className={`p-4 rounded border ${bColor} ${bgColor} transition-all`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-xs text-slate-500">{order.orderId}</span>
                    <span className={`text-[10px] uppercase tracking-widest font-bold ${textColor}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-300">{inventory.find(p => p.id === order.productId)?.name || order.productId}</span>
                    <span className="font-mono text-slate-400 text-xs">Qty: {order.qty}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* -- Live Event Log (Kafka/EventBridge Mock) -- */}
        <div className="border border-slate-800 bg-slate-900/30 rounded-lg relative overflow-hidden flex flex-col shadow-[0_0_50px_rgba(79,70,229,0.05)]">
          <div className="absolute top-0 right-0 w-1 h-full bg-indigo-500"></div>
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Live Event Stream</h2>
            </div>
            <span className="text-[10px] font-mono text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">BROKER CONNECTED</span>
          </div>
          <div ref={eventStreamRef} className="p-5 flex-1 overflow-y-auto space-y-2 font-mono text-[11px]" style={{ scrollBehavior: 'smooth' }}>
            {events.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-slate-600">
                 Waiting for events...
               </div>
            ) : events.map((ev, i) => {
              const isFail = ev.type.includes('FAIL') || ev.type.includes('CANCEL');
              const isRestore = ev.type.includes('RESTORED');
              const isSuccess = ev.type.includes('SUCCESS') || ev.type.includes('COMPLETED');
              
              const bColor = isFail ? 'border-rose-500/30' : isRestore ? 'border-amber-500/30' : isSuccess ? 'border-emerald-500/30' : 'border-sky-500/30';
              const tColor = isFail ? 'text-rose-400' : isRestore ? 'text-amber-400' : isSuccess ? 'text-emerald-400' : 'text-sky-400';

              return (
              <div 
                key={ev.id} 
                className={`p-3 rounded border-l-2 ${bColor} bg-slate-900/50 overflow-hidden break-words`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-600">[{ev.timestamp.split('T')[1].replace('Z', '')}]</span>
                  <span className={`font-bold tracking-wider uppercase ${tColor}`}>
                    {ev.type}
                  </span>
                </div>
                <div className="text-slate-400 whitespace-pre-wrap mt-1 opacity-80">
                  {JSON.stringify(ev.payload, null, 2)}
                </div>
              </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
