import React, { useState } from 'react';
import { Package, RotateCw, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ChatModal from './ChatModal';

export default function OrderHistoryTab() {
  const { user, userRole } = useAuth();
  const [activeChat, setActiveChat] = useState<{ id: string, name: string } | null>(null);

  const orders = [
    { id: 'ORD-1029', date: '2026-04-25', status: 'Delivered', total: '$145.00', items: ['Vintage Denim Jacket', 'Silver Ring'], sellerName: 'Vintage Vibes', customerName: 'Alex Rivera' },
    { id: 'ORD-1028', date: '2026-04-20', status: 'Processing', total: '$89.99', items: ['Wireless Earbuds'], sellerName: 'Tech Haven', customerName: 'Alex Rivera' },
    { id: 'ORD-1027', date: '2026-04-10', status: 'Delivered', total: '$210.50', items: ['Mechanical Keyboard'], sellerName: 'Keebz', customerName: 'Alex Rivera' },
  ];

  const handleBuyAgain = (orderId: string) => {
    alert(`Items from order ${orderId} have been added to your cart!`);
  };

  const handleChat = (order: any) => {
    // If user is Seller, they chat with Customer. If user is Casual, they chat with Seller.
    const recipientName = userRole === 'seller' ? order.customerName : order.sellerName;
    setActiveChat({ id: `chat-${order.id}`, name: recipientName });
  };

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-emerald-400" /> {userRole === 'seller' ? 'Customer Orders' : 'My Orders'}
        </h3>
        {orders.map(order => (
          <div key={order.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-bold text-white">{order.id}</h4>
              <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                order.status === 'Delivered' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {order.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-2">Ordered on: {order.date}</p>
            <div className="text-xs text-slate-300 font-medium mb-3 flex-1 flex flex-col gap-1">
              {userRole === 'seller' ? (
                 <span><span className="text-slate-500">Customer:</span> {order.customerName}</span>
              ) : (
                 <span><span className="text-slate-500">Seller:</span> {order.sellerName}</span>
              )}
              <span><span className="text-slate-500">Items:</span> {order.items.join(', ')}</span>
            </div>
            <div className="flex flex-col gap-3 pt-3 border-t border-slate-800">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Total</span>
                  <span className="text-sm text-white font-black">{order.total}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleChat(order)}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-slate-700"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Chat
                  </button>
                  {userRole !== 'seller' && (
                    <button 
                      onClick={() => handleBuyAgain(order.id)}
                      className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-emerald-500/20"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      Buy Again
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
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


