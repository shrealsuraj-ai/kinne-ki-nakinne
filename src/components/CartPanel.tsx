import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight, PlayCircle } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useDomains } from '../contexts/DomainContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartPanel({ isOpen, onClose }: CartPanelProps) {
  const { cart, updateQuantity, removeItem, clearCart } = useCart();
  const { commissions } = useDomains();

  const getDynamicPrice = (item: any) => {
    if (item.basePrice === undefined) return item.price; // fallback if no base price
    
    let rate = commissions[item.segment || ''] || 0;
    if (item.category) {
       const catId = item.category.toLowerCase().replace(/[^a-z0-9]/g, '-');
       if (commissions[`cat_${catId}`] !== undefined) rate = commissions[`cat_${catId}`];
       if (item.subcategory && commissions[`subcat_${catId}_${item.subcategory}`] !== undefined) {
          rate = commissions[`subcat_${catId}_${item.subcategory}`];
       }
    }
    return parseFloat((item.basePrice * (1 + (rate / 100))).toFixed(2));
  };

  const calcItemTotal = (item: any) => {
    let discount = 0;
    if (item.bulkDiscountTiers) {
      for (const [tierQty, tierPct] of Object.entries(item.bulkDiscountTiers)) {
         if (item.quantity >= parseInt(tierQty)) {
             discount = Math.max(discount, typeof tierPct === 'number' ? tierPct : 0);
         }
      }
    }
    const dynamicPrice = getDynamicPrice(item);
    return dynamicPrice * item.quantity * ((100 - discount) / 100);
  };
  
  const totalAmount = cart.reduce((sum, item) => sum + calcItemTotal(item), 0).toFixed(2);

  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!user) {
      alert('Please log in first to checkout.');
      return;
    }
    
    setIsProcessing(true);
    try {
       // Group cart by seller
       const itemsBySeller: Record<string, typeof cart> = {};
       cart.forEach(item => {
         const sid = item.sellerId || 'unknown_seller';
         if (!itemsBySeller[sid]) itemsBySeller[sid] = [];
         itemsBySeller[sid].push(item);
       });

       for (const [sellerId, items] of Object.entries(itemsBySeller)) {
          const updatedItems = items.map(item => {
             const rate = (() => {
               let r = commissions[item.segment || ''] || 0;
               if (item.category) {
                  const catId = item.category.toLowerCase().replace(/[^a-z0-9]/g, '-');
                  if (commissions[`cat_${catId}`] !== undefined) r = commissions[`cat_${catId}`];
                  if (item.subcategory && commissions[`subcat_${catId}_${item.subcategory}`] !== undefined) r = commissions[`subcat_${catId}_${item.subcategory}`];
               }
               return r;
             })();
             return {
                ...item,
                price: getDynamicPrice(item),
                commissionRate: rate,
             };
          });

          const orderTotal = updatedItems.reduce((sum, it) => sum + calcItemTotal(it), 0);
          
          // Create the order
          const orderRef = await addDoc(collection(db, 'orders'), {
             buyerId: user.uid,
             sellerId: sellerId,
             items: updatedItems,
             totalAmount: orderTotal,
             status: 'pending',
             timestamp: serverTimestamp(),
             customerName: user.email?.split('@')[0] || 'Customer'
          });

          // Create notification for seller
          await addDoc(collection(db, 'notifications'), {
             userId: sellerId,
             type: 'new_order',
             orderId: orderRef.id,
             title: 'New Order Received',
             message: `You received a new order for NPR ${orderTotal}.`,
             read: false,
             timestamp: serverTimestamp()
          });
       }

       alert('Checkout complete! Orders have been placed.');
       clearCart();
       onClose();
    } catch (err) {
       console.error("Error during checkout:", err);
       alert("Error processing checkout.");
    } finally {
       setIsProcessing(false);
    }
  };

  const handleViewInVideo = (sourceVideoId?: string, timestamp?: number) => {
    if (!sourceVideoId) return;
    onClose();
    // Simulate navigation/scroll to feed and setting video time
    // In a real router: navigate(`/feed?videoId=${sourceVideoId}&timestamp=${timestamp}`)
    alert(`Navigating to /feed?videoId=${sourceVideoId}&timestamp=${timestamp || 0}`);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="absolute inset-0 z-50 flex justify-end pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto"
        />
        <motion.div 
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 350, damping: 40 }}
          className="absolute top-0 right-0 w-full md:w-[450px] h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col pointer-events-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-5 border-b border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg leading-tight">Your Cart</h3>
                <p className="text-slate-400 text-xs">{cart.reduce((sum, item) => sum + item.quantity, 0)} Items</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-500">
                 <ShoppingCart className="w-16 h-16 opacity-20 mb-4" />
                 <p className="text-lg font-bold text-white mb-2">Cart is empty</p>
                 <p className="text-sm">Find something to buy and add it to cart.</p>
                 <button onClick={onClose} className="mt-6 px-6 py-2 bg-emerald-500/20 text-emerald-400 font-bold rounded-full hover:bg-emerald-500 hover:text-white transition">
                   Start Shopping
                 </button>
               </div>
            ) : (
               cart.map((item) => (
                 <div key={item.cartItemId} className="bg-slate-800/50 border border-slate-700 p-2.5 rounded-xl flex gap-3 relative group overflow-hidden">
                    <div className="w-16 h-20 bg-slate-900 rounded-lg overflow-hidden shrink-0 relative">
                      {item.type === 'video' ? (
                         <>
                           <video src={item.url || (item.mediaUrls && item.mediaUrls[0])} className="w-full h-full object-cover" muted crossOrigin="anonymous" />
                           <div className="absolute top-1 left-1 bg-black/40 rounded p-1 z-10 pointer-events-none">
                             <PlayCircle className="w-3 h-3 text-white" />
                           </div>
                         </>
                      ) : (
                         <img src={item.url || (item.mediaUrls && item.mediaUrls[0])} alt={item.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <h4 className="text-white font-bold text-sm truncate pr-6">{item.title}</h4>
                        <p className="text-slate-400 text-[10px] mt-0.5">Size: {item.size}</p>
                      </div>
                      <div className="flex justify-between items-center gap-2 mt-1">
                        <span className="text-emerald-400 font-black text-sm truncate">NPR {calcItemTotal(item).toFixed(2)}</span>
                        <div className="flex items-center gap-1.5 bg-slate-900 rounded-md border border-slate-700 px-1.5 py-0.5 shrink-0">
                          <button onClick={() => updateQuantity(item.cartItemId, -1)} className="p-0.5 hover:text-white text-slate-400 transition cursor-pointer">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-[10px] font-bold text-white w-3 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.cartItemId, 1)} className="p-0.5 hover:text-white text-slate-400 transition cursor-pointer">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      {item.sourceVideoId && (
                        <div className="mt-1.5">
                           <button 
                             onClick={() => handleViewInVideo(item.sourceVideoId, item.timestampAdded)}
                             className="flex items-center gap-1 text-[9px] uppercase font-bold text-slate-400 hover:text-emerald-400 transition"
                           >
                             <PlayCircle className="w-2.5 h-2.5" /> View in video
                           </button>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => removeItem(item.cartItemId)}
                      className="absolute top-2 right-2 p-1 text-slate-500 hover:text-rose-500 hover:bg-rose-500/20 rounded-md transition sm:opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                 </div>
               ))
            )}
          </div>

          {/* Footer / Checkout */}
          {cart.length > 0 && (
            <div className="p-6 bg-slate-900 border-t border-slate-800">
               <div className="flex justify-between text-slate-400 text-sm mb-2">
                 <span>Subtotal</span>
                 <span className="text-white font-bold">NPR {totalAmount}</span>
               </div>
               <div className="flex justify-between text-slate-400 text-sm mb-4">
                 <span>Shipping</span>
                 <span className="text-emerald-400 font-bold">Free</span>
               </div>
               <div className="flex justify-between items-center mb-6 pt-4 border-t border-slate-800">
                 <span className="text-white font-bold text-lg">Total</span>
                 <span className="text-emerald-400 font-black text-2xl">NPR {totalAmount}</span>
               </div>
               <button 
                 onClick={handleCheckout}
                 className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black rounded-xl text-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-emerald-500/20 block"
               >
                 CHECKOUT <ArrowRight className="w-5 h-5" />
               </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
