import React, { useState, useEffect } from 'react';
import { Package, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import OrderCard from './OrderCard';
import ChatModal from './ChatModal';

export default function OrderHistoryTab() {
  const { user, userRole } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<{ id: string, name: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const statuses = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const filteredOrders = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      const field = userRole === 'seller' ? 'sellerId' : 'buyerId';
      const q = query(
        collection(db, 'orders'), 
        where(field, '==', user.uid)
      );
      try {
        const snap = await getDocs(q);
        // Quick sort because ordering on different fields needs composite index in Firestore
        const fetchedOrders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        fetchedOrders.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());
        setOrders(fetchedOrders);
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    };
    fetchOrders();
  }, [user, userRole]);

  const handleChat = (order: any) => {
    const recipientName = userRole === 'seller' ? order.customerName : order.sellerName;
    setActiveChat({ id: `chat-${order.id}`, name: recipientName || 'User' });
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-400" /> {userRole === 'seller' ? 'Customer Orders' : 'My Orders'}
          </h3>
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
            {statuses.map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-colors ${
                  statusFilter === status 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
        {filteredOrders.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center">
            <Package className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-bold">No orders found.</p>
          </div>
        ) : (
          filteredOrders.map(order => (
             <div key={order.id} className="relative group">
                <OrderCard order={order} />
                <div className="absolute bottom-4 left-4 z-10">
                   <button 
                     onClick={() => handleChat(order)}
                     className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-slate-700"
                   >
                     <MessageCircle className="w-3.5 h-3.5" />
                     Chat
                   </button>
                </div>
             </div>
          ))
        )}
      </div>
      
      {activeChat && (
        <ChatModal 
          isOpen={true} 
          onClose={() => setActiveChat(null)} 
          chatId={activeChat.id} 
          recipientName={activeChat.name}
        />
      )}
    </>
  );
}
