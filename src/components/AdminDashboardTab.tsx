import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ShieldAlert, CheckCircle2, XCircle, Play, Pause, Trash2, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminDashboardTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to all products
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(fetchedProducts);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleApprove = async (productId: string) => {
    try {
      await updateDoc(doc(db, 'products', productId), {
        moderationStatus: 'approved'
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleFlag = async (productId: string) => {
    try {
      await updateDoc(doc(db, 'products', productId), {
        moderationStatus: 'flagged'
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to completely remove this product and video?')) return;
    try {
      await deleteDoc(doc(db, 'products', productId));
      // Cloud function should ideally delete the storage file
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center gap-2 mb-4 bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20">
        <ShieldCheck className="w-8 h-8 text-rose-500" />
        <div>
           <h3 className="text-white font-bold">Video Moderation Portal</h3>
           <p className="text-slate-400 text-xs">Review seller product videos and enforce guidelines.</p>
        </div>
      </div>

      <div className="space-y-4">
        {products.filter(p => p.type === 'video').length === 0 ? (
          <p className="text-slate-400 text-center py-8">No video products found.</p>
        ) : (
          products.filter(p => p.type === 'video').map(product => (
            <div key={product.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex gap-4">
                <div className="w-20 h-32 bg-black rounded-lg overflow-hidden shrink-0 relative border border-slate-700">
                  <video src={product.url} className="w-full h-full object-cover" muted />
                  {product.moderationStatus === 'flagged' && (
                    <div className="absolute inset-0 bg-rose-500/20 flex flex-col items-center justify-center backdrop-blur-sm">
                      <ShieldAlert className="text-rose-500 w-6 h-6 drop-shadow" />
                    </div>
                  )}
                  {product.moderationStatus === 'approved' && (
                    <div className="absolute top-1 right-1 bg-emerald-500 rounded-full p-0.5">
                      <CheckCircle2 className="text-white w-3 h-3" />
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-white font-bold text-sm line-clamp-1">{product.title}</p>
                    <button onClick={() => handleDelete(product.id)} className="text-slate-500 hover:text-rose-500 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-slate-400 text-xs mb-2 truncate">Seller: @{product.seller || product.sellerId}</p>
                  
                  <div className="mt-auto flex gap-2">
                    <button 
                      onClick={() => handleApprove(product.id)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${product.moderationStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    >
                      <CheckCircle2 className="w-3 h-3" /> Approve
                    </button>
                    <button 
                      onClick={() => handleFlag(product.id)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${product.moderationStatus === 'flagged' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    >
                      <XCircle className="w-3 h-3" /> Flag Waitlist
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
