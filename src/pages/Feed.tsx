import React, { useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';

export default function Feed({ currentItem, setIsCheckoutOpen }: any) {
  const { addToCart } = useCart();
  const videoRef = useRef<HTMLVideoElement>(null); // Suppose this points to the active video
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const videoId = searchParams.get('videoId');
    if (videoId) {
      const element = document.getElementById(`video-${videoId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [searchParams]);

  const handleAddToCart = () => {
    // We need to capture the video's currentTime. If this component doesn't inherently render the video, 
    // we assume we have a way to access it, or we pass the currentTime from a parent video player.
    const currentTimeMs = videoRef.current ? (videoRef.current.currentTime * 1000) : 0;
    
    addToCart(currentItem, currentItem.id, currentTimeMs); 
    // In actual implementation, video.id is sourceVideoId, and timestampAdded is currentTimeMs

    setIsCheckoutOpen(false);
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="mb-4">
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-xs">Price</span>
              <span className="font-bold text-xl text-white">NPR {currentItem.price}</span>
            </div>
          </div>
          
          {/* Options selection goes here */}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-700 relative">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={handleAddToCart}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/30 text-white font-black text-lg py-4 rounded-xl flex items-center justify-center gap-2 shadow-xl hover:opacity-90 active:scale-95 transition-all"
        >
          ADD TO CART <ChevronRight className="w-5 h-5" />
        </motion.button>
        <p className="text-center text-[10px] text-slate-500 mt-4 leading-relaxed tracking-wide uppercase font-bold">Secure encrypted checkout</p>
      </div>
    </>
  );
}
