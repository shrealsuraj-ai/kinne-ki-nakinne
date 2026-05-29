import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { ThumbsUp, ThumbsDown, Users, LayoutTemplate, Settings, Cog, CircleDashed } from 'lucide-react';

const GearIcon = ({ className, color = "currentColor", variant = 1 }: { className?: string, color?: string, variant?: 1 | 2 }) => {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      {variant === 1 ? (
        <path fill={color} fillRule="evenodd" d="M50 5C53 5 55 10 56 12L63 14C66 11 71 9 74 12C77 15 75 20 72 24L75 30C80 30 85 29 88 32C91 35 88 40 85 43L86 50C90 51 95 53 95 56C95 59 90 61 86 62L85 69C88 72 91 77 88 80C85 83 80 82 75 82L72 88C75 92 77 97 74 100C71 103 66 101 63 98L56 100C55 102 53 107 50 107C47 107 45 102 44 100L37 98C34 101 29 103 26 100C23 97 25 92 28 88L25 82C20 82 15 83 12 80C9 77 12 72 15 69L14 62C10 61 5 59 5 56C5 53 10 51 14 50L15 43C12 40 9 35 12 32C15 29 20 30 25 30L28 24C25 20 23 15 26 12C29 9 34 11 37 14L44 12C45 10 47 5 50 5ZM50 70C61.0457 70 70 61.0457 70 50C70 38.9543 61.0457 30 50 30C38.9543 30 30 38.9543 30 50C30 61.0457 38.9543 70 50 70Z M50 63C57.1797 63 63 57.1797 63 50C63 42.8203 57.1797 37 50 37C42.8203 37 37 42.8203 37 50C37 57.1797 42.8203 63 50 63Z" />
      ) : (
        <path fill={color} fillRule="evenodd" d="M50 10L56 10L59 20C63 21 66 23 69 25L78 20L84 26L79 35C82 38 84 41 85 45L95 48L95 56L85 59C84 63 82 66 79 69L84 78L78 84L69 79C66 81 63 83 59 84L56 94L50 94L45 84C41 83 38 81 35 79L26 84L20 78L25 69C22 66 20 63 19 59L9 56L9 48L19 45C20 41 22 38 25 35L20 26L26 20L35 25C38 23 41 21 45 20L50 10ZM50 65C58.28 65 65 58.28 65 50C65 41.72 58.28 35 50 35C41.72 35 35 41.72 35 50C35 58.28 41.72 65 50 65ZM45 50C45 52.76 47.24 55 50 55C52.76 55 55 52.76 55 50C55 47.24 52.76 45 50 45C47.24 45 45 47.24 45 50Z" />
      )}
    </svg>
  );
};

export default function BuyMeter({ productId, activeDomainId = 'kinne' }: { productId: string, activeDomainId?: string }) {
  const [totalEvaluations, setTotalEvaluations] = useState(0);
  const [positiveCount, setPositiveCount] = useState(0);
  const [meterStyle, setMeterStyle] = useState<'modern' | 'classic' | 'steampunk'>('modern');

  const METER_CONFIG: Record<string, { title: string, positive: string, negative: string, posEnglish: string, negEnglish: string }> = {
    kinne: { title: 'यो उत्पादन किन्ने कि नकिन्ने?', positive: 'किन्ने', negative: 'नकिन्ने', posEnglish: 'BUY', negEnglish: 'NOT TO BUY' },
    khane: { title: 'यो खाने कि नखाने?', positive: 'खाने', negative: 'नखाने', posEnglish: 'EAT', negEnglish: 'NOT TO EAT' },
    jane: { title: 'यहाँ जाने कि नजाने?', positive: 'जाने', negative: 'नजाने', posEnglish: 'GO', negEnglish: 'NOT TO GO' },
    herne: { title: 'यो हेर्ने कि नहेर्ने?', positive: 'हेर्ने', negative: 'नहेर्ने', posEnglish: 'WATCH', negEnglish: 'NOT TO WATCH' },
    garne: { title: 'यो गर्ने कि नगर्ने?', positive: 'गर्ने', negative: 'नगर्ने', posEnglish: 'DO', negEnglish: 'NOT TO DO' },
    khelne: { title: 'यो खेल्ने कि नखेल्ने?', positive: 'खेल्ने', negative: 'नखेल्ने', posEnglish: 'PLAY', negEnglish: 'NOT TO PLAY' },
    padhne: { title: 'यो पढ्ने कि नपढ्ने?', positive: 'पढ्ने', negative: 'नपढ्ने', posEnglish: 'STUDY', negEnglish: 'NOT TO STUDY' },
    lagaune: { title: 'यो लगाउने कि नलगाउने?', positive: 'लगाउने', negative: 'नलगाउने', posEnglish: 'WEAR', negEnglish: 'NOT TO WEAR' }
  };

  const config = METER_CONFIG[activeDomainId] || METER_CONFIG['kinne'];

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
      <button 
        onClick={() => setMeterStyle(s => s === 'modern' ? 'classic' : s === 'classic' ? 'steampunk' : 'modern')}
        className="absolute top-4 right-4 p-2 bg-slate-700/50 hover:bg-slate-600 rounded-full text-slate-300 transition-colors z-30 flex items-center justify-center"
        title="Toggle Meter Style"
      >
        <LayoutTemplate className="w-4 h-4" />
      </button>

      <h3 className="text-xl font-bold text-white mb-6 tracking-wide drop-shadow-md z-20">{config.title}</h3>

      {/* Meter Display Element */}
      {meterStyle === 'modern' ? (
        <div className="relative w-full max-w-[320px] aspect-[2/1] overflow-hidden flex items-end justify-center mb-6 z-20">
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
             <span className="block text-sm leading-tight">{config.negative}</span>
             <span className="block text-[10px] uppercase">{config.negEnglish}</span>
             <ThumbsDown className="w-5 h-5 mx-auto mt-1 opacity-80" />
          </div>

          <div className="absolute top-[50%] right-6 text-center transform rotate-[20deg] text-emerald-400 font-bold drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
             <span className="block text-sm leading-tight">{config.positive}</span>
             <span className="block text-[10px] uppercase">{config.posEnglish}</span>
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
      ) : meterStyle === 'classic' ? (
        <div className="relative w-full max-w-[340px] aspect-[1.8/1] flex flex-col items-center justify-end mb-4 z-20">
          <div className="absolute inset-0 bg-[#f4ebd0] rounded-t-full border-[12px] border-[#222] shadow-[inset_0_4px_15px_rgba(0,0,0,0.1),0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Segments */}
            <svg viewBox="0 0 200 100" className="absolute w-full h-[200%] top-0 left-0">
               <path d="M 30 100 A 70 70 0 0 1 80 40 L 90 55 A 50 50 0 0 0 50 100 Z" fill="#e74c3c" />
               <path d="M 80 40 A 70 70 0 0 1 120 40 L 110 55 A 50 50 0 0 0 90 55 Z" fill="#f39c12" />
               <path d="M 120 40 A 70 70 0 0 1 170 100 L 150 100 A 50 50 0 0 0 110 55 Z" fill="#2ecc71" />
               
               {/* Tick Marks inside classic meter */}
               <line x1="30" y1="100" x2="40" y2="100" stroke="#c0392b" strokeWidth="2" />
               <line x1="60" y1="58" x2="68" y2="65" stroke="#c0392b" strokeWidth="2" />
               <line x1="100" y1="30" x2="100" y2="40" stroke="#d35400" strokeWidth="2" />
               <line x1="140" y1="58" x2="132" y2="65" stroke="#27ae60" strokeWidth="2" />
               <line x1="170" y1="100" x2="160" y2="100" stroke="#27ae60" strokeWidth="2" />
            </svg>

            {/* Title / Stars inside */}
            <div className="absolute top-[20%] w-full flex flex-col items-center text-[#333]">
              <div className="flex gap-4">
                <span className="text-[#e74c3c] text-sm font-black">★</span>
                <span className="text-[#f39c12] text-sm font-black">★ ★</span>
                <span className="text-[#2ecc71] text-sm font-black">★ ★ ★</span>
              </div>
              <h4 className="text-[10px] font-black tracking-widest mt-3 opacity-80 uppercase">User Ratings</h4>
              <Users className="w-5 h-5 mt-1 opacity-70" />
            </div>

            {/* Side Texts */}
            <div className="absolute bottom-6 left-4 text-[#c0392b] text-center w-24">
              <span className="text-xl font-black block uppercase tracking-tight">{config.negative}</span>
              <span className="text-[9px] font-bold uppercase opacity-80">{config.negEnglish}</span>
            </div>
            <div className="absolute bottom-6 right-4 text-[#27ae60] text-center w-24">
              <span className="text-xl font-black block uppercase tracking-tight">{config.positive}</span>
              <span className="text-[9px] font-bold uppercase opacity-80">{config.posEnglish}</span>
            </div>

            {/* Smileys */}
            <div className="absolute top-[45%] left-4 bg-[#c0392b] text-white rounded-full w-6 h-6 flex items-center justify-center shadow-inner font-bold text-lg">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,6.48 17.52,2 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M7.5,9.5A1.5,1.5 0 0,1 6,8A1.5,1.5 0 0,1 7.5,6.5A1.5,1.5 0 0,1 9,8A1.5,1.5 0 0,1 7.5,9.5M16.5,9.5A1.5,1.5 0 0,1 15,8A1.5,1.5 0 0,1 16.5,6.5A1.5,1.5 0 0,1 18,8A1.5,1.5 0 0,1 16.5,9.5M12,14C9.58,14 7.42,15.5 6.42,17.65L8.08,18.59C8.75,17.09 10.27,16 12,16C13.73,16 15.25,17.09 15.92,18.59L17.58,17.65C16.58,15.5 14.42,14 12,14Z" /></svg>
            </div>
            <div className="absolute top-[45%] right-4 bg-[#27ae60] text-white rounded-full w-6 h-6 flex items-center justify-center shadow-inner font-bold text-lg">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,6.48 17.52,2 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M7,9.5C7,8.67 7.67,8 8.5,8C9.33,8 10,8.67 10,9.5C10,10.33 9.33,11 8.5,11C7.67,11 7,10.33 7,9.5M14,9.5C14,8.67 14.67,8 15.5,8C16.33,8 17,8.67 17,9.5C17,10.33 16.33,11 15.5,11C14.67,11 14,10.33 14,9.5M12,17.5C14.33,17.5 16.31,16.03 17.11,14H6.89C7.69,16.03 9.67,17.5 12,17.5Z" /></svg>
            </div>
          </div>

          <motion.div 
              className="absolute bottom-[0px] left-[50%] origin-bottom z-10"
              initial={{ rotate: -90 }}
              animate={{ rotate: (scorePercentage / 100) * 180 - 90 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ height: '110px', width: '8px', background: 'transparent', marginLeft: '-4px' }}
          >
              <div className="w-full bg-[#111] absolute top-1 rounded-t-full shadow-lg border-[0.5px] border-white/20" style={{ height: '90px' }} />
          </motion.div>

          <div className="absolute bottom-[-10px] left-[50%] -ml-4 w-8 h-8 bg-[#222] rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.8)] z-20 flex items-center justify-center">
             <div className="w-4 h-4 rounded-full bg-[#444] shadow-inner" />
          </div>
        </div>
      ) : (
        <div className="relative w-full max-w-[340px] aspect-[1.8/1] flex flex-col items-center justify-end mb-4 z-20">
          <div className="absolute inset-0 bg-gradient-to-b from-[#e8c37d] via-[#bfa55a] to-[#8a6d2b] rounded-t-full border-[10px] border-[#4a3b1a] shadow-[inset_0_5px_20px_rgba(0,0,0,0.6),0_15px_40px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Steampunk details and gears */}
            <svg viewBox="0 0 200 100" className="absolute w-full h-[200%] top-0 left-0">
               {/* Inner concentric rings */}
               <circle cx="100" cy="100" r="85" fill="none" stroke="#d4af37" strokeWidth="2" strokeDasharray="4 4" opacity="0.6"/>
               <circle cx="100" cy="100" r="75" fill="none" stroke="#4a3b1a" strokeWidth="1" opacity="0.4"/>
               <circle cx="100" cy="100" r="65" fill="none" stroke="#b08d2b" strokeWidth="8" strokeDasharray="2 6"/>
               <circle cx="100" cy="100" r="50" fill="none" stroke="#4a3b1a" strokeWidth="2"/>
               
               {/* Screws / Rivets */}
               <circle cx="20" cy="80" r="4" fill="#6b5b3a" stroke="#2a2210" strokeWidth="1"/>
               <circle cx="180" cy="80" r="4" fill="#6b5b3a" stroke="#2a2210" strokeWidth="1"/>
               <circle cx="50" cy="30" r="3" fill="#6b5b3a" stroke="#2a2210" strokeWidth="1"/>
               <circle cx="150" cy="30" r="3" fill="#6b5b3a" stroke="#2a2210" strokeWidth="1"/>
               
               {/* Arc segments for sentiment */}
               <path d="M 40 100 A 60 60 0 0 1 85 45 L 90 55 A 50 50 0 0 0 50 100 Z" fill="#7a2a22" fillOpacity="0.8" stroke="#4a3b1a" strokeWidth="1"/>
               <path d="M 85 45 A 60 60 0 0 1 115 45 L 110 55 A 50 50 0 0 0 90 55 Z" fill="#9c782b" fillOpacity="0.8" stroke="#4a3b1a" strokeWidth="1"/>
               <path d="M 115 45 A 60 60 0 0 1 160 100 L 150 100 A 50 50 0 0 0 110 55 Z" fill="#325934" fillOpacity="0.8" stroke="#4a3b1a" strokeWidth="1"/>
               
               {/* Tick marks */}
               {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(tick => {
                  const angle = (tick / 100) * 180;
                  const rad = (angle * Math.PI) / 180;
                  return (
                    <line key={tick} x1={100 - 60*Math.cos(rad)} y1={100 - 60*Math.sin(rad)} x2={100 - 64*Math.cos(rad)} y2={100 - 64*Math.sin(rad)} stroke="#fff" strokeWidth={tick % 20 === 0 ? "1.5" : "0.5"} opacity={tick % 20 === 0 ? "0.8" : "0.4"} />
                  )
               })}
            </svg>
            
            {/* Decorational Gears */}
            <div className="absolute inset-0 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
               <div className="absolute top-[20%] left-[10%] w-16 h-16 flex items-center justify-center">
                  <GearIcon className="absolute w-full h-full animate-[spin_8s_linear_infinite]" color="#b08d2b" variant={1} />
                  <div className="w-3 h-3 rounded-full bg-[#2a2210] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] border border-[#6b5b3a] z-10" />
               </div>
               
               <div className="absolute top-[34%] left-[24%] w-12 h-12 flex items-center justify-center">
                  <GearIcon className="absolute w-full h-full animate-[spin_6s_linear_infinite_reverse]" color="#8a6d2b" variant={2} />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#2a2210] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] border border-[#4a3b1a] z-10" />
               </div>

               <div className="absolute top-[15%] right-[12%] w-14 h-14 flex items-center justify-center">
                  <GearIcon className="absolute w-full h-full animate-[spin_10s_linear_infinite_reverse]" color="#6b5b3a" variant={1} />
                  <div className="w-3 h-3 rounded-full bg-[#111] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] z-10" />
               </div>

               <div className="absolute top-[40%] right-[3%] w-10 h-10 flex items-center justify-center">
                  <GearIcon className="absolute w-full h-full animate-[spin_5s_linear_infinite]" color="#4a3b1a" variant={2} />
                  <div className="w-2 h-2 rounded-full bg-[#b08d2b] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] border border-[#2a2210] z-10" />
               </div>

               <div className="absolute top-[55%] left-[5%] w-12 h-12 flex items-center justify-center">
                  <Settings className="absolute w-full h-full text-[#9c782b] opacity-80 animate-[spin_12s_linear_infinite]" strokeWidth={1.5} />
                  <div className="w-2 h-2 rounded-full bg-[#2a2210] z-10" />
               </div>

               <div className="absolute top-[62%] left-[17%] w-8 h-8 flex items-center justify-center">
                  <Cog className="absolute w-full h-full text-[#5a461b] opacity-90 animate-[spin_4s_linear_infinite_reverse]" strokeWidth={2} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#8a6d2b] z-10" />
               </div>

               <div className="absolute top-[55%] right-[18%] w-[50px] h-[50px] flex items-center justify-center">
                  <GearIcon className="absolute w-full h-full animate-[spin_7s_linear_infinite]" color="#8a6d2b" variant={1} />
                  <div className="w-3 h-3 rounded-full bg-[#111] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] border border-[#6b5b3a] z-10" />
               </div>
            </div>

            {/* Scale Numerals inside meter */}
            <div className="absolute w-full h-[50%] bottom-0 pointer-events-none text-[#2a2210] font-mono text-[8px] font-black opacity-60">
                <span className="absolute left-[20%] bottom-[40%]">0%</span>
                <span className="absolute left-[38%] top-[15%]">25%</span>
                <span className="absolute left-[48%] top-[2%]">50%</span>
                <span className="absolute right-[38%] top-[15%]">75%</span>
                <span className="absolute right-[18%] bottom-[40%]">100%</span>
            </div>

            {/* Labels */}
            <div className="absolute bottom-6 left-4 text-[#8b3a2b] text-center w-24 drop-shadow-[0_1px_0px_rgba(255,255,255,0.5)]">
              <span className="text-xl font-black block tracking-tighter leading-none">{config.negative}</span>
              <span className="text-[10px] font-bold uppercase opacity-80 text-[#4a3b1a]">{config.negEnglish}</span>
            </div>
            <div className="absolute bottom-6 right-4 text-[#356038] text-center w-24 drop-shadow-[0_1px_0px_rgba(255,255,255,0.5)]">
              <span className="text-xl font-black block tracking-tighter leading-none">{config.positive}</span>
              <span className="text-[10px] font-bold uppercase opacity-80 text-[#4a3b1a]">{config.posEnglish}</span>
            </div>
          </div>

          <motion.div 
              className="absolute bottom-[0px] left-[50%] origin-bottom z-10"
              initial={{ rotate: -90 }}
              animate={{ rotate: (scorePercentage / 100) * 180 - 90 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ height: '110px', width: '6px', background: 'transparent', marginLeft: '-3px' }}
          >
              <div 
                className="w-full absolute top-[15px] shadow-[0_0_5px_rgba(0,0,0,0.8)] border-[1px] transition-colors duration-1000" 
                style={{ 
                  height: '85px', borderRadius: '4px',
                  background: scorePercentage > 60 ? 'linear-gradient(to right, #1d331e, #356038, #1d331e)' : scorePercentage < 40 ? 'linear-gradient(to right, #4a1d17, #8b3a2b, #4a1d17)' : 'linear-gradient(to right, #222, #444, #111)',
                  borderColor: scorePercentage > 60 ? '#4caf50' : scorePercentage < 40 ? '#f44336' : '#7a5d22'
                }} 
              />
              {/* Ornate needle tip */}
              <div 
                className="absolute top-[0px] left-[50%] -translate-x-1/2 w-0 h-0 border-b-[18px] border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent drop-shadow-md transition-colors duration-1000" 
                style={{ borderBottomColor: scorePercentage > 60 ? '#4caf50' : scorePercentage < 40 ? '#f44336' : '#8a6d2b' }}
              />
              <div 
                className="absolute top-[2px] left-[50%] -translate-x-1/2 w-0 h-0 border-b-[15px] border-l-[2px] border-l-transparent border-r-[2px] border-r-transparent transition-colors duration-1000" 
                style={{ borderBottomColor: scorePercentage > 60 ? '#356038' : scorePercentage < 40 ? '#8b3a2b' : '#444' }}
              />
          </motion.div>

          {/* Steampunk Needle Hub */}
          <div className="absolute bottom-[-15px] left-[50%] -ml-6 w-12 h-12 bg-gradient-to-br from-[#ffd700] to-[#b08d2b] rounded-full border-4 border-[#2a2210] shadow-[0_5px_15px_rgba(0,0,0,0.8)] z-20 flex items-center justify-center">
             <div className="absolute w-8 h-8 rounded-full border-2 border-dashed border-[#5a461b] animate-[spin_4s_linear_infinite]" />
             <div className="w-3 h-3 rounded-full bg-[#111] shadow-inner border border-[#6b5b3a]" />
          </div>
        </div>
      )}

      {/* Odometer and text */}
      <div className="flex flex-col items-center bg-slate-900/60 p-4 pt-3 rounded-2xl border border-slate-700/50 w-full backdrop-blur-md relative z-20 mt-2">
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

