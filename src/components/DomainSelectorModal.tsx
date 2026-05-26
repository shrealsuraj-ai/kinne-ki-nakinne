import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, Compass } from 'lucide-react';
import { DOMAINS, Domain } from '../lib/domains';

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
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/80 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl shadow-sky-900/20"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 pb-4 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
              <div className="flex items-center gap-3 text-white">
                 <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
                    <Compass className="w-5 h-5 text-white" />
                 </div>
                 <div>
                   <h2 className="text-xl font-black tracking-tight drop-shadow-md">Discover</h2>
                   <p className="text-xs text-slate-400 font-medium">Select a platform segment</p>
                 </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto scrollbar-hide py-6">
              <div className="grid gap-3">
                 {DOMAINS.map(domain => {
                   const isActive = domain.id === activeDomainId;
                   return (
                     <div 
                       key={domain.id}
                       onClick={() => onSelectDomain(domain.id, domain.segments[0].id)}
                       className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-3 group relative overflow-hidden ${
                         isActive 
                           ? 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/10' 
                           : 'border-slate-800 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600'
                       }`}
                     >
                       {isActive && (
                         <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/20 blur-2xl rounded-full -mr-8 -mt-8 pointer-events-none" />
                       )}
                       
                       <div className="flex items-center justify-between relative z-10">
                         <div>
                           <h3 className={`text-base font-black tracking-wide ${isActive ? 'text-sky-400' : 'text-slate-200 group-hover:text-white transition-colors'}`}>
                             {domain.name}
                           </h3>
                           <p className="text-xs text-slate-400 font-medium">{domain.label}</p>
                         </div>
                         <ChevronRight className={`w-5 h-5 transition-transform ${isActive ? 'text-sky-500 translate-x-1' : 'text-slate-600 group-hover:text-slate-400 group-hover:translate-x-1'}`} />
                       </div>
                       
                       <div className="flex gap-2 flex-wrap mt-1 relative z-10">
                         {domain.segments.map(seg => (
                           <span key={seg.id} className="text-[10px] font-bold px-2 py-1 bg-black/40 text-slate-300 rounded-md border border-white/5">
                             {seg.label}
                           </span>
                         ))}
                       </div>
                     </div>
                   );
                 })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
