import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

export default function BuyMeter({ productId }: { productId: string }) {
  const [totalEvaluations, setTotalEvaluations] = useState(0);
  const [positiveCount, setPositiveCount] = useState(0);

  useEffect(() => {
    if (!productId) return;
    const q = query(collection(db, `products/${productId}/reviews`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;
      let positive = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        total++;
        if (data.rating >= 4) {
          positive++;
        }
      });
      setTotalEvaluations(total);
      setPositiveCount(positive);
    });
    return () => unsubscribe();
  }, [productId]);

  const displayTotal = totalEvaluations;
  const displayPositive = positiveCount;

  const scorePercentage = displayTotal > 0 ? (displayPositive / displayTotal) * 100 : 50;

  // Render flip characters for the odometer display
  const totalString = displayTotal.toString().padStart(5, '0');

  // SVG parameters for circular meter
  const radius = 120;
  const circumference = Math.PI * radius; // Half circle
  const dashoffset = circumference - (scorePercentage / 100) * circumference;

  return (
    <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700/50 flex flex-col items-center justify-center relative overflow-hidden mt-4 shadow-xl">
      <h3 className="text-xl font-bold text-white mb-6 tracking-wide drop-shadow-md">यो उत्पादन किन्ने कि नकिन्ने?</h3>

      {/* Meter Display Element */}
      <div className="relative w-full max-w-[320px] aspect-[2/1] overflow-hidden flex items-end justify-center mb-6">
        {/* Background Arc */}
        <svg viewBox="0 0 260 130" className="absolute w-full h-[200%] top-0 left-0 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            <defs>
               <linearGradient id="meterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" /> {/* Red */}
                  <stop offset="50%" stopColor="#f59e0b" /> {/* Amber */}
                  <stop offset="100%" stopColor="#10b981" /> {/* Green */}
               </linearGradient>
               <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                     <feMergeNode in="coloredBlur"/>
                     <feMergeNode in="SourceGraphic"/>
                  </feMerge>
               </filter>
            </defs>
          <path
            d="M 10 130 A 120 120 0 0 1 250 130"
            fill="none"
            stroke="#1e293b"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* Filled Arc */}
          <motion.path
            d="M 10 130 A 120 120 0 0 1 250 130"
            fill="none"
            stroke="url(#meterGradient)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            filter="url(#glow)"
          />
          
          {/* Tick Marks (0, 20, 40, 60, 80, 100) */}
          {[0, 20, 40, 60, 80, 100].map((tick) => {
             const angle = (tick / 100) * 180;
             const radians = (angle * Math.PI) / 180;
             const x1 = 130 - 110 * Math.cos(radians);
             const y1 = 130 - 110 * Math.sin(radians);
             const x2 = 130 - 125 * Math.cos(radians);
             const y2 = 130 - 125 * Math.sin(radians);
             
             return (
               <g key={tick}>
                 <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#64748b" strokeWidth="2" />
                 <text 
                    x={130 - 95 * Math.cos(radians)} 
                    y={130 - 95 * Math.sin(radians)} 
                    fill="#94a3b8" 
                    fontSize="10" 
                    textAnchor="middle" 
                    dominantBaseline="middle"
                    className="font-mono font-bold"
                 >
                    {tick}
                 </text>
               </g>
             );
          })}
        </svg>

        {/* Labels positioned inside the meter */}
        <div className="absolute top-[50%] left-6 text-center transform -rotate-[20deg] text-rose-500 font-bold">
           <span className="block text-sm">नकिन्ने (Nakinnay)</span>
           <ThumbsDown className="w-5 h-5 mx-auto mt-1 opacity-80" />
        </div>

        <div className="absolute top-[50%] right-6 text-center transform rotate-[20deg] text-emerald-400 font-bold drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
           <span className="block text-sm">किन्ने (Kinnay)</span>
           <ThumbsUp className="w-5 h-5 mx-auto mt-1 opacity-90 fill-emerald-500/20" />
        </div>

        {/* Indicator Needle */}
        <motion.div 
            className="absolute bottom-0 left-[50%] origin-bottom"
            initial={{ rotate: -90 }}
            animate={{ rotate: (scorePercentage / 100) * 180 - 90 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ height: '110px', width: '4px', background: 'transparent', marginLeft: '-2px' }}
        >
            {/* The needle visual itself */}
            <div className="w-full bg-white rounded-full shadow-[0_0_10px_white] absolute top-2" style={{ height: '89px' }} />
        </motion.div>

        {/* Center Base Cover */}
        <div className="absolute bottom-[-5px] left-[50%] -ml-2 w-4 h-4 bg-slate-800 border-2 border-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)] z-10" />
      </div>

      {/* Odometer and text */}
      <div className="flex flex-col items-center bg-slate-900/60 p-4 pt-3 rounded-2xl border border-slate-700/50 w-full backdrop-blur-md relative z-20">
         <p className="text-sm text-slate-300 font-bold mb-3 tracking-wide">जम्मा मूल्याङ्कन: {displayTotal}</p>
         
         <div className="flex gap-1 justify-center bg-black p-2 rounded-xl border-2 border-slate-700 shadow-inner">
            {totalString.split('').map((char, index) => (
               <div key={index} className="w-8 h-10 bg-slate-800 rounded bg-gradient-to-b from-slate-700 via-slate-900 to-slate-800 flex items-center justify-center border border-slate-900 relative overflow-hidden">
                  <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/40 z-10" />
                  <motion.span 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="text-white font-mono font-bold text-2xl drop-shadow-md z-0 relative top-[1px]"
                  >
                    {char}
                  </motion.span>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
