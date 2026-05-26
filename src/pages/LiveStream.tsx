import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, getDoc, doc, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export default function LiveStream({ currentItem, setIsCheckoutOpen }: any) {
  const [bids, setBids] = useState<any[]>([]);
  const [bidAmount, setBidAmount] = useState(0);

  const [currentHighestBid, setCurrentHighestBid] = useState(0);

  useEffect(() => {
    if (currentHighestBid > 0) {
      setBidAmount(currentHighestBid + 50);
    } else if (currentItem?.price) {
      setBidAmount(currentItem.price + 50);
    } else {
      setBidAmount(100);
    }
  }, [currentHighestBid, currentItem?.price]);
  const [timeRemaining, setTimeRemaining] = useState<number>(300); // 5 mins in seconds
  const { user } = useAuth();

  useEffect(() => {
    if (!currentItem?.id) return;
    const q = query(
      collection(db, 'bids'),
      where('productId', '==', currentItem.id),
      orderBy('amount', 'desc'),
      limit(1)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const highest = snapshot.docs[0].data();
        setCurrentHighestBid(highest.amount);
      } else {
        setCurrentHighestBid(0); // starting bid
      }
    });
    
    return () => unsubscribe();
  }, [currentItem?.id]);
  
  // Real logic for fetching actual server time offset to sync every 3 seconds
  // Since we don't have a reliable backend time endpoint, we will mock the server sync for now 
  // but implement the client countdown properly.
  useEffect(() => {
    const interval = setInterval(() => {
      // Every 3 seconds, we could fetch from server.
      // We will just decrement locally for the demo.
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const placeBid = async () => {
    if (!user) {
      alert("Please login to place a bid.");
      return;
    }
    if (timeRemaining < 3) {
      alert("Too late - auction ending");
      return;
    }

    if (currentHighestBid === 0) {
      if (bidAmount < 50) {
        alert("Your starting bid must be at least रू 50");
        return;
      }
    } else {
      if (bidAmount <= currentHighestBid) {
        alert(`Your bid must be higher than the current bid of रू ${currentHighestBid}`);
        return;
      }
    }

    const newBidAmount = bidAmount;
    
    const bidId = Date.now().toString();
    const tempBid = {
      id: bidId,
      amount: newBidAmount,
      status: 'pending',
      timestamp: Date.now()
    };

    setBids(prev => [...prev, tempBid]);
    
    try {
      // Simulate Firestore request taking time
      const docRef = await addDoc(collection(db, 'bids'), {
        productId: currentItem.id,
        amount: newBidAmount,
        userId: user.uid,
        timestamp: serverTimestamp()
      });
      
      // Assume confirmation within 2s
      setBids(prev => prev.map(b => b.id === bidId ? { ...b, status: 'confirmed' } : b));
    } catch (err) {
      setBids(prev => prev.map(b => b.id === bidId ? { ...b, status: 'failed' } : b));
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <>
      <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-400 text-xs">Current Bid</span>
          <span className="font-bold text-xl text-white">रू {currentHighestBid > 0 ? currentHighestBid : (currentItem?.price || 0)}</span>
        </div>
        <div className="flex justify-between items-center text-rose-500 text-xs font-bold">
          <span>Auction ends in:</span>
          <span className="font-mono">{formatTime(timeRemaining)} LEFT</span>
        </div>
      </div>

      {bids.length > 0 && (
         <div className="mb-4">
           {bids.map(b => (
             <div key={b.id} className="text-xs flex gap-2 items-center mb-1">
                <span>You bid रू {b.amount}</span>
                {b.status === 'pending' && <span className="text-slate-400 italic">pending...</span>}
                {b.status === 'confirmed' && <span className="text-emerald-400 font-bold">confirmed</span>}
                {b.status === 'failed' && <span className="text-rose-500 cursor-pointer">failed - tap to retry</span>}
             </div>
           ))}
         </div>
      )}

      <div>
        <p>💰 Current Bid: रू {currentHighestBid}</p>
        <p>🫵 Your Bid: रू {bidAmount}</p>
      </div>
      <h4 className="text-sm font-bold text-slate-300 mb-3 mt-4">Your Bid Amount</h4>
      <div style={{display: 'flex', gap: '8px', alignItems: 'center'}} className="mb-4">
        <button 
          onClick={() => setBidAmount(prev => Math.max(50, prev - 50))}
          className="py-3 px-6 border rounded-xl flex items-center justify-center font-bold transition-all border-slate-700 bg-slate-800/50 text-slate-300 hover:border-rose-500/50"
        >
          -Rs 50
        </button>
        <span className="font-bold text-xl text-white px-4">रू {bidAmount}</span>
        <button 
          onClick={() => setBidAmount(prev => prev + 50)}
          className="py-3 px-6 border rounded-xl flex items-center justify-center font-bold transition-all border-slate-700 bg-slate-800/50 text-slate-300 hover:border-rose-500/50"
        >
          +Rs 50
        </button>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-700 relative">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={placeBid}
          className="w-full bg-gradient-to-r from-rose-500 to-red-600 shadow-rose-500/30 text-white font-black text-lg py-4 rounded-xl flex items-center justify-center gap-2 shadow-xl hover:opacity-90 active:scale-95 transition-all"
        >
          CONFIRM BID <ChevronRight className="w-5 h-5" />
        </motion.button>
        <p className="text-center text-[10px] text-slate-500 mt-4 leading-relaxed tracking-wide uppercase font-bold">Secure encrypted escrow holding</p>
      </div>
    </>
  );
}
