import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function RefundButton({ order }: { order: any }) {
  const [loading, setLoading] = useState(false);

  // Check if delivered and within 7 days
  const isDelivered = order.status === 'delivered';
  
  // Calculate difference in days safely
  const isWithin7Days = () => {
    if (!order.deliveredAt) return false;
    // Handle both Firestore Timestamps and epoch numbers
    const deliveredTime = typeof order.deliveredAt.toMillis === 'function' 
      ? order.deliveredAt.toMillis() 
      : (typeof order.deliveredAt === 'number' ? order.deliveredAt : null);
      
    if (!deliveredTime) return false;
    
    const now = Date.now();
    const diffInDays = (now - deliveredTime) / (1000 * 60 * 60 * 24);
    return diffInDays <= 7;
  };

  const showRefund = isDelivered && isWithin7Days();

  const handleRefundRequest = async () => {
    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        status: 'refund_requested'
      });
      alert('Refund requested successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to request refund.');
    } finally {
      setLoading(false);
    }
  };

  if (!showRefund || order.status === 'refund_requested') {
    return null;
  }

  return (
    <button 
      onClick={handleRefundRequest}
      disabled={loading}
      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-md transition-colors disabled:opacity-50"
    >
      {loading ? 'Requesting...' : 'Request Refund'}
    </button>
  );
}
