import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
  cart: any[];
  setCart: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function CartPanel({ isOpen, onClose, cart, setCart }: CartPanelProps) {
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const updateQuantity = (cartItemId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeItem = (cartItemId: number) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    alert('Processing payment for NPR ' + totalAmount + '...\nThank you for choosing Kinne Ki Nakinne!');
    setCart([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
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
                 <div key={item.cartItemId} className="bg-slate-800/50 border border-slate-700 p-3 rounded-2xl flex gap-4 relative group">
                    <div className="w-20 h-24 bg-slate-900 rounded-xl overflow-hidden shrink-0">
                      <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h4 className="text-white font-bold text-sm line-clamp-1 pr-6">{item.title}</h4>
                        <p className="text-slate-400 text-xs mt-1">Size: {item.size}</p>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-emerald-400 font-black text-sm">NPR {item.price}</span>
                        <div className="flex items-center gap-3 bg-slate-900 rounded-full border border-slate-700 px-2 py-1">
                          <button onClick={() => updateQuantity(item.cartItemId, -1)} className="p-1 hover:text-white text-slate-400 transition cursor-pointer">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-white w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.cartItemId, 1)} className="p-1 hover:text-white text-slate-400 transition cursor-pointer">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeItem(item.cartItemId)}
                      className="absolute top-3 right-3 p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/20 rounded-lg transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
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
