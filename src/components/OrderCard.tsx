import React, { useState } from 'react';
import { Package, Truck, CheckCircle, RotateCcw, AlertTriangle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function OrderCard({ order }: { order: any }) {
  const [loading, setLoading] = useState(false);

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'pending':
        return { icon: <Package className="w-4 h-4 text-amber-500" />, text: 'Processing', color: 'text-amber-500', bg: 'bg-amber-500/10' };
      case 'shipped':
        return { icon: <Truck className="w-4 h-4 text-blue-500" />, text: 'Shipped', color: 'text-blue-500', bg: 'bg-blue-500/10' };
      case 'delivered':
        return { icon: <CheckCircle className="w-4 h-4 text-emerald-500" />, text: 'Delivered', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
      case 'refund_requested':
        return { icon: <RotateCcw className="w-4 h-4 text-rose-500" />, text: 'Refund Requested', color: 'text-rose-500', bg: 'bg-rose-500/10' };
      default:
        return { icon: <AlertTriangle className="w-4 h-4 text-slate-400" />, text: 'Unknown', color: 'text-slate-400', bg: 'bg-slate-800' };
    }
  };

  const statusInfo = getStatusDisplay(order.status || 'pending');

  const requestRefund = async (orderId: string) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'refund_requested',
        refundRequestedAt: new Date()
      });
      alert('Refund requested. Seller has 48 hours to respond.');
    } catch (err) {
      console.error(err);
      alert('Failed to request refund.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl mb-3 flex flex-col gap-3">
      <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
        <div>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Order #{order.id?.slice(0, 8)}</span>
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${statusInfo.bg}`}>
            {statusInfo.icon}
            <span className={`text-[10px] font-bold uppercase tracking-wider ${statusInfo.color}`}>{statusInfo.text}</span>
          </div>
        </div>
        
        <div className="text-right">
          <span className="text-sm font-bold text-white block">NPR {order.total}</span>
          <span className="text-[10px] text-slate-400">{order.timestamp?.toDate ? order.timestamp.toDate().toLocaleDateString() : 'Recent'}</span>
        </div>
      </div>

      <div className="space-y-3">
        {order.items?.map((item: any, i: number) => (
          <div key={i} className="flex items-center gap-3">
            {item.url ? (
              <img src={item.url} alt={item.name} className="w-10 h-10 rounded-md object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-md bg-slate-700 flex items-center justify-center">
                <Package className="w-5 h-5 text-slate-500" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-bold text-white">{item.name || item.title || 'Product'}</p>
              <p className="text-[10px] text-slate-400">Qty: {item.quantity} {item.size && `• Size: ${item.size}`}</p>
            </div>
            <span className="text-xs font-bold text-slate-300">NPR {item.price * item.quantity}</span>
          </div>
        ))}
      </div>
      
      <div className="flex justify-end pt-2">
        {order.status === 'delivered' && (
           <button 
             onClick={() => requestRefund(order.id)}
             disabled={loading}
             className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-md transition-colors disabled:opacity-50"
           >
             {loading ? 'Requesting...' : 'Request Refund'}
           </button>
        )}
      </div>
    </div>
  );
}
