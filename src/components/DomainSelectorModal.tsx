import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, MotionValue, PanInfo } from 'motion/react';
import { X, Search, ShoppingBag, Utensils, Compass, Tv, Briefcase, GraduationCap, Gamepad2, Grid, LayoutTemplate } from 'lucide-react';
import { DOMAINS, Domain } from '../lib/domains';

const ICONS: Record<string, React.ReactNode> = {
  kinne: <ShoppingBag className="w-6 h-6 text-emerald-400" />,
  khane: <Utensils className="w-6 h-6 text-orange-400" />,
  jane: <Compass className="w-6 h-6 text-blue-400" />,
  herne: <Tv className="w-6 h-6 text-indigo-400" />,
  garne: <Briefcase className="w-6 h-6 text-teal-400" />,
  padhne: <GraduationCap className="w-6 h-6 text-cyan-400" />,
  khelne: <Gamepad2 className="w-6 h-6 text-rose-400" />,
};

function CircularItem({
  domain,
  index,
  selectedIndex,
  setSelectedIndex,
  springOffset,
  angleOffset,
  viewMode,
  onPan,
  onPanEnd
}: {
  domain: Domain;
  index: number;
  selectedIndex: number;
  setSelectedIndex: (idx: number) => void;
  springOffset: MotionValue<number>;
  angleOffset: MotionValue<number>;
  viewMode: 'corner-left' | 'bottom' | 'corner-right';
  onPan: (e: any, info: PanInfo) => void;
  onPanEnd: (e: any, info: PanInfo) => void;
}) {
  const isSelected = index === selectedIndex;
  
  const itemAngle = viewMode === 'bottom' ? 35 : 25;
  const baseAngle = viewMode === 'bottom' ? 0 : 20;
  const radius = viewMode === 'bottom' ? 240 : 180;
  
  const currentAngle = useTransform(springOffset, (offset) => baseAngle + index * itemAngle + offset);
  const x = useTransform(currentAngle, (angle) => (viewMode === 'corner-right' ? -1 : 1) * radius * Math.sin((angle * Math.PI) / 180));
  const y = useTransform(currentAngle, (angle) => -radius * Math.cos((angle * Math.PI) / 180));

  const isDragging = useRef(false);

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: isSelected ? 1.2 : 1, 
        opacity: 1,
      }}
      style={{ x, y, xOrigin: "50%", yOrigin: "50%", touchAction: "none" }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: index * 0.05 }}
      onPanStart={() => {
        isDragging.current = true;
      }}
      onPan={onPan}
      onPanEnd={(e, info) => {
        onPanEnd(e, info);
        // Small delay to prevent click fire after pan ends
        setTimeout(() => {
          isDragging.current = false;
        }, 50);
      }}
      onClick={() => {
         if (isDragging.current) return;
         setSelectedIndex(index);
         angleOffset.set(-index * itemAngle);
      }}
      className={`absolute flex items-center justify-center rounded-full shadow-2xl backdrop-blur-md border pointer-events-auto origin-center transition-colors duration-300 ${
        isSelected 
          ? 'w-16 h-16 bg-white/20 border-white/50 z-20 shadow-sky-500/20 text-white' 
          : 'w-14 h-14 bg-white/5 border-white/10 hover:bg-white/10 z-10 text-slate-300'
      }`}
    >
      <div className={`transform -translate-x-1/2 -translate-y-1/2 absolute left-1/2 top-1/2 flex items-center justify-center transition-transform duration-300 ${isSelected ? 'scale-110' : 'scale-90 opacity-70'}`}>
        {ICONS[domain.id] || <Search className="w-6 h-6" />}
      </div>
      
      {/* Title Label rotating with item */}
      <motion.div 
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 whitespace-nowrap text-xs font-black tracking-widest ${isSelected ? 'text-white' : 'text-slate-400 opacity-0 group-hover:opacity-100'} transition-opacity duration-300 pointer-events-none drop-shadow-md`}
      >
        {domain.name.split(' ')[0]}
      </motion.div>
    </motion.button>
  );
}

export default function DomainSelectorModal({ 
  isOpen, 
  onClose, 
  activeDomainId, 
  onSelectDomain 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  activeDomainId: string; 
  onSelectDomain: (domainId: string, firstSegmentId: string) => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'corner-left' | 'bottom' | 'corner-right'>('corner-left');

  const angleOffset = useMotionValue(0);
  // Add a helper dependency to recalculate current angles immediately when changing modes
  const springOffset = useSpring(angleOffset, { stiffness: 300, damping: 30 });

  const hingeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const idx = DOMAINS.findIndex(d => d.id === activeDomainId);
      if (idx !== -1) {
        setSelectedIndex(idx);
        const itemAngle = viewMode === 'bottom' ? 35 : 25;
        angleOffset.set(-idx * itemAngle);
      }
    }
  }, [isOpen, activeDomainId, viewMode, angleOffset]);

  const activeDomain = DOMAINS[selectedIndex] || DOMAINS[0];

  const handlePan = (e: any, info: PanInfo) => {
    if (hingeRef.current) {
      const rect = hingeRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      
      const prevX = info.point.x - info.delta.x - cx;
      const prevY = info.point.y - info.delta.y - cy;
      const currX = info.point.x - cx;
      const currY = info.point.y - cy;
      
      const prevAngle = Math.atan2(prevY, prevX);
      const currAngle = Math.atan2(currY, currX);
      
      let angleDelta = (currAngle - prevAngle) * (180 / Math.PI);
      
      if (angleDelta > 180) angleDelta -= 360;
      if (angleDelta < -180) angleDelta += 360;
      
      if (viewMode === 'corner-right') {
        angleDelta = -angleDelta;
      }
      
      angleOffset.set(angleOffset.get() + angleDelta);
    } else {
      const delta = info.delta.y * 0.5 + info.delta.x * 0.5;
      angleOffset.set(angleOffset.get() + delta);
    }
  };

  const handlePanEnd = (e: any, info: PanInfo) => {
    let angularVelocity = 0;
    if (hingeRef.current) {
       const rect = hingeRef.current.getBoundingClientRect();
       const cx = rect.left + rect.width / 2;
       const cy = rect.top + rect.height / 2;
       const r = Math.hypot(info.point.x - cx, info.point.y - cy) || 1;
       const vX = info.velocity.x;
       const vY = info.velocity.y;
       const cross = (info.point.x - cx) * vY - (info.point.y - cy) * vX;
       angularVelocity = (cross / (r * r)) * (180 / Math.PI) * 0.1;
    } else {
       angularVelocity = (info.velocity.y * 0.05 + info.velocity.x * 0.05);
    }
    
    if (isNaN(angularVelocity)) angularVelocity = 0;

    const targetOffset = angleOffset.get() + angularVelocity * 2;
    const itemAngle = viewMode === 'bottom' ? 35 : 25;
    
    let idx = Math.round(-targetOffset / itemAngle);
    if (viewMode === 'corner-left' || viewMode === 'corner-right') {
      idx = Math.max(0, Math.min(DOMAINS.length - 1, idx));
    } else {
      // Allow wrap around for center circular menu
      if (idx < 0) idx = (idx % DOMAINS.length) + DOMAINS.length;
      idx = idx % DOMAINS.length;
      // Note: wrap around conceptually works, but indices beyond length will just jump.
      // For a better visual wrap, we'll just constrain it same way but allow cycling.
      // Actually keeping bounds is safer so spring interpolations don't jump drastically.
      idx = Math.max(0, Math.min(DOMAINS.length - 1, idx));
    }
    
    setSelectedIndex(idx);
    angleOffset.set(-idx * itemAngle);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY;
    if (Math.abs(delta) > 5) {
      const dir = delta > 0 ? 1 : -1;
      let newIdx = selectedIndex + dir;
      newIdx = Math.max(0, Math.min(DOMAINS.length - 1, newIdx));
      setSelectedIndex(newIdx);
      const itemAngle = viewMode === 'bottom' ? 35 : 25;
      angleOffset.set(-newIdx * itemAngle);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-2xl flex items-center justify-center"
          onClick={onClose}
        >
          {/* Top Header & Toggle */}
          <div className="absolute top-8 left-8 z-[60] flex flex-col md:flex-row md:items-center gap-4 pointer-events-auto">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setViewMode(v => v === 'corner-left' ? 'bottom' : (v === 'bottom' ? 'corner-right' : 'corner-left'));
              }}
              className="bg-slate-800 p-2.5 rounded-xl hover:bg-slate-700 text-slate-300 transition border border-slate-700 shadow-lg flex items-center gap-2"
              title="Toggle Menu Layout"
            >
              {viewMode === 'corner-left' ? <Grid className="w-5 h-5 text-emerald-400" /> : 
               viewMode === 'corner-right' ? <Gamepad2 className="w-5 h-5 text-emerald-400" /> : 
               <LayoutTemplate className="w-5 h-5 text-emerald-400" />}
              <span className="text-xs font-bold hidden sm:inline-block">Layout</span>
            </button>
            <div className="pointer-events-none mt-2 md:mt-0">
              <h2 className="text-2xl font-black text-white/90 drop-shadow-lg tracking-wide">Discover</h2>
              <p className="text-sm font-bold text-slate-400 mt-1">Select your path</p>
            </div>
          </div>

          {/* Close button */}
          <div className="absolute top-8 right-8 z-[60]">
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-rose-500/80 transition-all border border-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="w-full h-full relative" onClick={e => e.stopPropagation()}>

            {/* Invisible wheel capture area (size varies by mode) */}
            <motion.div
              className={`absolute z-10 ${viewMode === 'bottom' ? 'left-1/2 bottom-0 -translate-x-1/2 w-[500px] h-[250px] rounded-t-full rounded-b-none origin-bottom' : (viewMode === 'corner-left' ? 'left-[-50px] bottom-[-50px] w-[350px] h-[350px] rounded-full' : 'right-[-50px] bottom-[-50px] w-[350px] h-[350px] rounded-full')}`}
              style={{ touchAction: "none" }}
              onPan={handlePan}
              onPanEnd={handlePanEnd}
              onWheel={handleWheel}
            />

            {/* Arc Center acts as the hinge */}
            <div 
              ref={hingeRef} 
              className={`absolute pointer-events-none z-20 transition-all duration-700 w-1 h-1 ${
                viewMode === 'bottom' 
                  ? 'left-1/2 bottom-0 -translate-x-1/2' 
                  : (viewMode === 'corner-left' ? 'left-[30px] bottom-[30px]' : 'right-[30px] bottom-[30px]')
              }`}
            >
              {DOMAINS.map((domain, i) => (
                <CircularItem
                  key={domain.id}
                  domain={domain}
                  index={i}
                  selectedIndex={selectedIndex}
                  setSelectedIndex={setSelectedIndex}
                  springOffset={springOffset}
                  angleOffset={angleOffset}
                  viewMode={viewMode}
                  onPan={handlePan}
                  onPanEnd={handlePanEnd}
                />
              ))}
            </div>

            {/* Magnifying Bubble for Active Item */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[65%] pointer-events-none z-30">
              <motion.div 
                key={activeDomain.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
                className="w-56 h-56 sm:w-60 sm:h-60 rounded-full flex flex-col items-center justify-center p-6 backdrop-blur-3xl bg-slate-800/40 border border-t-white/30 border-l-white/20 border-b-black/50 border-r-black/50 shadow-2xl relative overflow-hidden pointer-events-auto cursor-pointer group"
                onClick={() => onSelectDomain(activeDomain.id, activeDomain.segments[0].id)}
                style={{
                  boxShadow: 'inset 0 20px 40px rgba(255,255,255,0.1), 0 20px 40px rgba(0,0,0,0.5)',
                }}
              >
                {/* Bubble highlight effect */}
                <div className="absolute top-4 left-8 w-24 h-16 bg-white/20 rounded-[100%] rotate-[-20deg] blur-md pointer-events-none"></div>
                
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="flex flex-col items-center text-center z-10"
                >
                  <div className="mb-4 scale-150 drop-shadow-2xl">
                    {ICONS[activeDomain.id]}
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight drop-shadow-md mb-2">
                    {activeDomain.name}
                  </h3>
                  <p className="text-xs text-white/70 font-bold uppercase tracking-widest mb-6">
                    {activeDomain.label}
                  </p>

                  <button className="px-6 py-2 rounded-full bg-white text-slate-900 font-extrabold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all outline-none">
                    Explore
                  </button>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
