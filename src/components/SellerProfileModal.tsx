import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, UserCheck, Package, Star, ShieldCheck } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useDomains } from '../contexts/DomainContext';
import { transformProductPricing } from '../lib/pricing';

export default function SellerProfileModal({ isOpen, onClose, sellerId, sellerName, onViewProfile }: { isOpen: boolean, onClose: () => void, sellerId: string, sellerName: string, onViewProfile?: () => void }) {
  const { user } = useAuth();
  const { commissions } = useDomains();
  const [isFollowing, setIsFollowing] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !sellerId) return;
    
    const fetchSellerData = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'products'), where('sellerId', '==', sellerId));
        const snap = await getDocs(q);
        const fetchedProducts = snap.docs.map(doc => transformProductPricing({ id: doc.id, ...doc.data() }, commissions));
        setProducts(fetchedProducts);
      } catch (err) {
        console.error("Failed to fetch seller products", err);
      }
      setLoading(false);
    };

    fetchSellerData();
  }, [isOpen, sellerId, commissions]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 bg-black/80 flex items-end justify-center sm:items-center p-0 sm:p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full sm:max-w-md bg-slate-900 rounded-t-3xl sm:rounded-3xl border-t border-slate-700 sm:border flex flex-col max-h-[85vh] overflow-hidden shadow-2xl relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-slate-800 flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-400 to-rose-500 border-2 border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
               <span className="font-bold text-2xl text-white pb-0.5">{sellerName?.[0] || 'S'}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                 {sellerName}
                 <ShieldCheck className="w-4 h-4 fill-emerald-500 text-white" />
              </h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                 <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> 4.9 (120)</span>
                 <span>•</span>
                 <span>1.2K Followers</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={`mt-3 flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isFollowing ? 'bg-slate-800 text-white border border-slate-700' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                >
                  {isFollowing ? <><UserCheck className="w-4 h-4" /> Following</> : <><UserPlus className="w-4 h-4" /> Follow</>}
                </button>
                <button 
                  onClick={() => {
                    if (onViewProfile) {
                      onViewProfile();
                    }
                  }}
                  className="mt-3 flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-slate-800 text-white border border-slate-700 hover:bg-slate-700"
                >
                  View Profile
                </button>
              </div>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 p-2 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Body: Products */}
          <div className="p-6 overflow-y-auto hide-scrollbar flex-1">
             <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-400" /> Seller's Products ({products.length})
             </h3>
             
             {loading ? (
                <div className="grid grid-cols-2 gap-3">
                   {[1,2,3,4].map(i => (
                      <div key={i} className="aspect-square bg-slate-800 animate-pulse rounded-xl" />
                   ))}
                </div>
             ) : products.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                   {products.map(p => (
                      <div key={p.id} className="relative rounded-xl overflow-hidden aspect-[3/4] bg-slate-800 group border border-slate-700">
                         {(p.url || (p.mediaUrls && p.mediaUrls[0]) || p.videoUrl) && (
                           p.type === 'video' || p.videoUrl ? (
                             <video src={p.url || p.videoUrl || (p.mediaUrls && p.mediaUrls[0])} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" muted crossOrigin="anonymous" />
                           ) : (
                             <img src={p.url || (p.mediaUrls && p.mediaUrls[0])} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={p.title} />
                           )
                         )}
                         <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 pb-3 to-transparent pointer-events-none">
                            <p className="text-[10px] font-bold text-white line-clamp-1">{p.title}</p>
                            <p className="text-xs font-black text-emerald-400 mt-0.5">NPR {p.price}</p>
                         </div>
                      </div>
                   ))}
                </div>
             ) : (
                <div className="text-center py-8">
                   <p className="text-slate-500 text-sm">No products found for this seller.</p>
                </div>
             )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
