import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Package, Edit2, Trash2, Video, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export default function InventoryTab() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'products'),
      where('sellerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(fetchedProducts);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete product.');
    }
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      await updateDoc(doc(db, 'products', editingProduct.id), {
        title: editingProduct.title,
        price: parseFloat(editingProduct.price),
        description: editingProduct.description,
        longDescription: editingProduct.description
      });
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update product.');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center gap-2 mb-4 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
        <Package className="w-8 h-8 text-emerald-500" />
        <div>
           <h3 className="text-white font-bold">My Inventory</h3>
           <p className="text-slate-400 text-xs">Manage your products and edit prices.</p>
        </div>
      </div>

      <div className="space-y-4">
        {products.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No products found. Start by uploading one!</p>
        ) : (
          products.map(product => (
            <div key={product.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-3 items-start">
              <div className="w-20 h-20 bg-black rounded-xl overflow-hidden shrink-0 relative border border-slate-700">
                {product.type === 'video' ? (
                  <video src={product.url} className="w-full h-full object-cover" muted />
                ) : (
                  <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${product.url})` }} />
                )}
                {product.type === 'video' && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur pb-1 pt-1 flex justify-center">
                    <Video className="w-3 h-3 text-emerald-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-start mb-1">
                   <h4 className="text-white font-bold text-sm line-clamp-1">{product.title}</h4>
                   <div className="flex gap-2">
                     <button onClick={() => setEditingProduct(product)} className="text-slate-500 hover:text-emerald-400 p-1">
                       <Edit2 className="w-4 h-4" />
                     </button>
                     <button onClick={() => handleDelete(product.id)} className="text-slate-500 hover:text-rose-500 p-1">
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                 </div>
                 <p className="text-emerald-400 text-sm font-bold mb-1">NPR {product.price}</p>
                 <div className="flex gap-2 items-center text-xs">
                   <span className={`px-2 py-0.5 rounded-full font-bold ${product.moderationStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : product.moderationStatus === 'flagged' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-300'}`}>
                     {product.moderationStatus === 'approved' ? 'Active' : product.moderationStatus === 'flagged' ? 'Flagged' : 'Pending'}
                   </span>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {editingProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-sm relative"
            >
              <button 
                onClick={() => setEditingProduct(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
              
              <h3 className="text-xl font-bold text-white mb-4">Edit Product</h3>
              
              <form onSubmit={saveEdit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Title</label>
                  <input required type="text" value={editingProduct.title} onChange={e => setEditingProduct({...editingProduct, title: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Price (NPR)</label>
                  <input required type="number" step="1" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Description</label>
                  <textarea value={editingProduct.description || ''} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} rows={3} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 resize-none"></textarea>
                </div>
                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition">
                  Save Changes
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
