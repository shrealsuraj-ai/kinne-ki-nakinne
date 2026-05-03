import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, User as UserIcon } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface ReviewsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
}

export default function ReviewsPanel({ isOpen, onClose, productId }: ReviewsPanelProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    if (!isOpen || !productId) return;
    
    const q = query(
      collection(db, `products/${productId}/reviews`),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    return () => unsubscribe();
  }, [isOpen, productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, `products/${productId}/reviews`), {
        userId: user.uid,
        userName: user.email?.split('@')[0] || 'User',
        rating,
        text: text.trim(),
        createdAt: serverTimestamp()
      });
      
      // Update aggregated rating on product document
      // Note: In production you might want a Cloud Function or a secure transaction for this
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        ratingSum: increment(rating),
        reviewCount: increment(1)
      });

      setText('');
      setRating(5);
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
    : '0.0';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-40 pointer-events-auto"
            onClick={onClose}
          />
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="absolute bottom-0 left-0 w-full bg-slate-900 rounded-t-[32px] z-50 p-6 pointer-events-auto border-t border-slate-700 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col"
            style={{ height: "70vh" }}
          >
            <div className="w-12 h-1.5 bg-slate-700 flex self-center rounded-full mb-6" />
            
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Reviews</h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />
                  </div>
                  <span className="text-white font-bold text-sm">{averageRating}</span>
                  <span className="text-slate-400 text-xs">({reviews.length} reviews)</span>
                </div>
              </div>
              <button onClick={onClose} className="bg-slate-800 p-2 rounded-full border border-slate-700 hover:bg-slate-700 text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 mb-4 space-y-4">
              {reviews.length === 0 ? (
                <div className="text-center py-10">
                  <Star className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400 font-bold">No reviews yet.</p>
                  <p className="text-slate-500 text-xs">Be the first to review this product!</p>
                </div>
              ) : (
                reviews.map(review => (
                  <div key={review.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                           <UserIcon className="w-4 h-4 text-slate-400" />
                         </div>
                         <div>
                           <p className="text-sm font-bold text-slate-200">{review.userName}</p>
                           <div className="flex text-amber-400 mt-0.5">
                             {[...Array(5)].map((_, i) => (
                               <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400' : 'fill-transparent text-slate-600'}`} />
                             ))}
                           </div>
                         </div>
                       </div>
                       <span className="text-[10px] text-slate-500">
                         {review.createdAt?.toDate().toLocaleDateString() || 'Just now'}
                       </span>
                    </div>
                    <p className="text-sm text-slate-300 ml-10">{review.text}</p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-auto pt-4 border-t border-slate-700">
              {user ? (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">Your Rating</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button 
                          key={star} 
                          type="button" 
                          onClick={() => setRating(star)}
                          className="focus:outline-none"
                        >
                          <Star className={`w-6 h-6 transition-colors ${star <= rating ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-slate-600'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <textarea 
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Write your review..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none h-12"
                      required
                    />
                    <button 
                      type="submit" 
                      disabled={isSubmitting || !text.trim()}
                      className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 text-white font-bold px-6 rounded-xl transition-colors shrink-0"
                    >
                      Post
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <p className="text-sm text-slate-300">Log in to leave a review.</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
