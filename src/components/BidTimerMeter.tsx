import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock } from 'lucide-react';

export default function BidTimerMeter() {
  const [timeLeft, setTimeLeft] = useState(165); // 02:45 remaining in seconds
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalTime = 300; // Let's say 5 minutes total
  const remainingPercentage = Math.max(0, (timeLeft / totalTime) * 100);

  const radius = 120;
  const circumference = Math.PI * radius; // Half circle
  // We want the dashoffset to go from 0 (full) to circumference (empty)
  // Or rather, the strokeDashoffset:
  // filled completely = 0
  // empty completely = circumference
  const dashoffset = circumference - (remainingPercentage / 100) * circumference;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const odometerStr = formatTime(timeLeft).replace(':', '0'); // using 4 chars for digit spaces or just showing digits

  return (
    <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700/50 flex flex-col items-center justify-center relative overflow-hidden mt-4 shadow-xl">
      <h3 className="text-xl font-bold text-white mb-6 tracking-wide drop-shadow-md">Auction Time Remaining</h3>

      {/* Meter Display Element */}
      <div className="relative w-full max-w-[320px] aspect-[2/1] overflow-hidden flex items-end justify-center mb-6">
        {/* Background Arc */}
        <svg viewBox="0 0 260 130" className="absolute w-full h-[200%] top-0 left-0 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            <defs>
               <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
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
            stroke="url(#timerGradient)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashoffset }}
            transition={{ duration: 1, ease: "linear" }}
            filter="url(#glow)"
          />
          
          {/* Tick Marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
             const angle = (tick / 100) * 180;
             const radians = (angle * Math.PI) / 180;
             const x1 = 130 - 110 * Math.cos(radians);
             const y1 = 130 - 110 * Math.sin(radians);
             const x2 = 130 - 125 * Math.cos(radians);
             const y2 = 130 - 125 * Math.sin(radians);
             
             return (
               <g key={tick}>
                 <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#64748b" strokeWidth="2" />
               </g>
             );
          })}
        </svg>

        {/* Labels positioned inside the meter */}
        <div className="absolute top-[50%] left-6 text-center transform -rotate-[20deg] text-rose-500 font-bold">
           <span className="block text-sm">Ending Soon</span>
           <Clock className="w-5 h-5 mx-auto mt-1 opacity-80" />
        </div>

        <div className="absolute top-[50%] right-6 text-center transform rotate-[20deg] text-emerald-400 font-bold drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
           <span className="block text-sm">Plenty Time</span>
           <Clock className="w-5 h-5 mx-auto mt-1 opacity-90 fill-emerald-500/20" />
        </div>

        {/* Indicator Needle */}
        <motion.div 
            className="absolute bottom-0 left-[50%] origin-bottom"
            initial={{ rotate: -90 }}
            animate={{ rotate: (remainingPercentage / 100) * 180 - 90 }}
            transition={{ duration: 1, ease: "linear" }}
            style={{ height: '110px', width: '4px', background: 'transparent', marginLeft: '-2px' }}
        >
            <div className="w-full bg-white rounded-full shadow-[0_0_10px_white] absolute top-2" style={{ height: '89px' }} />
        </motion.div>

        {/* Center Base Cover */}
        <div className="absolute bottom-[-5px] left-[50%] -ml-2 w-4 h-4 bg-slate-800 border-2 border-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)] z-10" />
      </div>

      {/* Odometer and text */}
      <div className="flex flex-col items-center bg-slate-900/60 p-4 pt-3 rounded-2xl border border-slate-700/50 w-full backdrop-blur-md relative z-20">
         <p className="text-sm text-slate-300 font-bold mb-3 tracking-wide flex items-center gap-2">
            <Clock className="w-4 h-4" /> Time Left
         </p>
         
         <div className="flex gap-1 justify-center bg-black p-2 rounded-xl border-2 border-slate-700 shadow-inner">
            {formatTime(timeLeft).split('').map((char, index) => (
               char === ':' ? (
                  <div key={index} className="text-white font-mono font-bold text-2xl flex items-center justify-center px-1 animate-pulse pb-1">
                     :
                  </div>
               ) : (
                  <div key={index} className="w-8 h-10 bg-slate-800 rounded bg-gradient-to-b from-slate-700 via-slate-900 to-slate-800 flex items-center justify-center border border-slate-900 relative overflow-hidden">
                     <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/40 z-10" />
                     <motion.span 
                       key={char}
                       initial={{ y: -20, opacity: 0 }}
                       animate={{ y: 0, opacity: 1 }}
                       className="text-white font-mono font-bold text-2xl drop-shadow-md z-0 relative top-[1px]"
                     >
                       {char}
                     </motion.span>
                  </div>
               )
            ))}
         </div>
      </div>
    </div>
  );
}
