import React, { useState, useEffect } from 'react';
import { Star, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export default function SellerRating({ sellerId, compact = false }: { sellerId: string; compact?: boolean }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newText, setNewText] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (!sellerId) return;
    const fetchReviews = async () => {
      const q = query(collection(db, 'seller_reviews'), where('sellerId', '==', sellerId), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchReviews();
  }, [sellerId]);

  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : 'New';

  const submitReview = async () => {
    if (!user) return alert('Login required');
    await addDoc(collection(db, 'seller_reviews'), {
      sellerId,
      userId: user.uid,
      userName: user.email?.split('@')[0] || 'User',
      rating: newRating,
      text: newText,
      timestamp: serverTimestamp()
    });
    setIsModalOpen(false);
    setNewText('');
    setNewRating(5);
    // Optimistic UI update could go here
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1 cursor-pointer" onClick={() => setIsModalOpen(true)}>
        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
        <span className="text-[10px] font-bold text-white">{avgRating}</span>
        <span className="text-[10px] text-slate-400">({reviews.length})</span>
      </div>
    );
  }

  return (
    <>
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Seller Rating</h4>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="text-lg font-bold text-white">{avgRating}</span>
              <span className="text-xs text-slate-400">({reviews.length} reviews)</span>
            </div>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors">
            <MessageCircle className="w-3.5 h-3.5" /> Leave Review
          </button>
        </div>

        <div className="space-y-3 mt-4 max-h-48 overflow-y-auto pr-2">
          {reviews.length === 0 && <p className="text-xs text-slate-500">No reviews yet for this seller.</p>}
          {reviews.map(r => (
            <div key={r.id} className="border-t border-slate-700/50 pt-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-300">{r.userName}</span>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-amber-400' : 'fill-transparent text-slate-600'}`} />)}
                </div>
              </div>
              <p className="text-[11px] text-slate-400">{r.text}</p>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm">
              <h3 className="text-lg font-bold text-white mb-4">Review Seller</h3>
              
              <div className="flex gap-2 justify-center mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                   <button key={star} onClick={() => setNewRating(star)}>
                     <Star className={`w-8 h-8 transition-colors ${star <= newRating ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-slate-600'}`} />
                   </button>
                ))}
              </div>

              <textarea 
                value={newText}
                onChange={e => setNewText(e.target.value)}
                placeholder="How was your experience?"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 mb-4 h-24 resize-none"
              />

              <div className="flex gap-3">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800">Cancel</button>
                <button onClick={submitReview} disabled={!newText.trim()} className="flex-1 py-2 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50">Submit</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
