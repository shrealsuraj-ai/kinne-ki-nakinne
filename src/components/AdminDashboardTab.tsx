import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ShieldAlert, CheckCircle2, XCircle, Play, Pause, Trash2, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminDashboardTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [casualUsers, setCasualUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'videos' | 'users'>('videos');

  useEffect(() => {
    // Listen to all products
    const pQ = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubProducts = onSnapshot(pQ, (snapshot) => {
      const fetchedProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(fetchedProducts);
      setLoading(false);
    }, (error) => console.error("Error fetching products in AdminDashboardTab: ", error));

    const sQ = query(collection(db, 'sellers'));
    const unsubSellers = onSnapshot(sQ, (snapshot) => {
      setSellers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Error fetching sellers in AdminDashboardTab: ", error));

    const cQ = query(collection(db, 'casual_users'));
    const unsubCasual = onSnapshot(cQ, (snapshot) => {
      setCasualUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Error fetching casual_users in AdminDashboardTab: ", error));

    return () => {
      unsubProducts();
      unsubSellers();
      unsubCasual();
    };
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
      <div className="flex items-center justify-between mb-4 bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-rose-500" />
          <div>
            <h3 className="text-white font-bold">Admin Portal</h3>
            <p className="text-slate-400 text-xs">Manage rules, products, and users.</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button 
          onClick={() => setActiveTab('videos')}
          className={`flex-1 py-2 text-sm font-bold transition-all rounded-lg ${activeTab === 'videos' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Videos Mod ({products.filter(p => p.type === 'video').length})
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 text-sm font-bold transition-all rounded-lg ${activeTab === 'users' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Users ({sellers.length + casualUsers.length})
        </button>
      </div>

      <div className="space-y-4 pt-2">
        {activeTab === 'videos' && (
          products.filter(p => p.type === 'video').length === 0 ? (
            <p className="text-slate-400 text-center py-8">No video products found.</p>
          ) : (
            products.filter(p => p.type === 'video').map(product => (
              <div key={product.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex gap-4">
                  <div className="w-20 h-32 bg-black rounded-lg overflow-hidden shrink-0 relative border border-slate-700">
                    <video src={product.url} className="w-full h-full object-cover" muted crossOrigin="anonymous" />
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
          )
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-emerald-400 font-bold uppercase text-xs tracking-wider mb-3">Sellers ({sellers.length})</h4>
              <div className="space-y-2">
                {sellers.length === 0 ? (
                  <p className="text-slate-400 text-xs">No sellers found</p>
                ) : (
                  sellers.map(s => (
                    <div key={s.id} className="bg-slate-800/80 p-3 rounded-lg flex justify-between items-center border border-slate-700">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs">
                           {(s.displayName || s.email || s.id)[0].toUpperCase()}
                         </div>
                         <div>
                           <p className="text-white text-sm font-bold">{s.displayName || s.email || 'Unknown User'}</p>
                           <p className="text-slate-400 text-[10px] mono">{s.id}</p>
                         </div>
                       </div>
                       <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.isVerified ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-300'}`}>
                         {s.isVerified ? 'Verified' : 'Unverified'}
                       </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h4 className="text-blue-400 font-bold uppercase text-xs tracking-wider mb-3">Casual Users ({casualUsers.length})</h4>
              <div className="space-y-2">
                {casualUsers.length === 0 ? (
                  <p className="text-slate-400 text-xs">No casual users found</p>
                ) : (
                  casualUsers.map(c => (
                    <div key={c.id} className="bg-slate-800/80 p-3 rounded-lg flex justify-between items-center border border-slate-700">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs">
                           {(c.email || c.id)[0].toUpperCase()}
                         </div>
                         <div>
                           <p className="text-white text-sm font-bold">{c.email || 'Unknown User'}</p>
                           <p className="text-slate-400 text-[10px] mono">{c.id}</p>
                         </div>
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
