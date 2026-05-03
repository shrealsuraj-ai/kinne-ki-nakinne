import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageCircle, ChevronRight, Image as ImageIcon, Box } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';

interface InboxPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: (conversationId: string, otherUser: { id: string, name: string, avatar?: string }) => void;
}

export default function InboxPanel({ isOpen, onClose, onOpenChat }: InboxPanelProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isOpen) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setConversations(convos);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching conversations:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isOpen]);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000 && now.getDate() === date.getDate()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex flex-col pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto"
        />
        <motion.div 
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 350, damping: 40 }}
          className="absolute top-0 right-0 w-full md:w-[400px] h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col pointer-events-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-5 border-b border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg leading-tight">Inbox</h3>
                <p className="text-slate-400 text-xs">Direct Messages</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-500">
                 <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
                 <p className="text-sm font-bold">Loading messages...</p>
               </div>
            ) : conversations.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center px-6">
                 <MessageCircle className="w-16 h-16 opacity-20 mb-4" />
                 <p className="text-base font-bold text-white mb-1">No conversations yet</p>
                 <p className="text-sm">When you contact a seller or someone messages you, it will show up here.</p>
               </div>
            ) : (
               conversations.map(conv => {
                 const otherUserId = conv.participants.find((id: string) => id !== user?.uid);
                 const otherUser = conv.participantData?.[otherUserId] || { name: 'Unknown User' };
                 const unreadCount = conv.unreadCount?.[user?.uid || ''] || 0;
                 const isUnread = unreadCount > 0;
                 return (
                   <button 
                     key={conv.id}
                     onClick={() => onOpenChat(conv.id, { id: otherUserId, name: otherUser.name, avatar: otherUser.avatar })}
                     className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-800/50 transition border border-transparent hover:border-slate-800 text-left group"
                   >
                     <div className="relative shrink-0">
                       <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden border border-slate-700">
                         {otherUser.avatar ? (
                           <img src={otherUser.avatar} alt={otherUser.name} className="w-full h-full object-cover" />
                         ) : otherUser.name?.charAt(0).toUpperCase()}
                       </div>
                       {otherUser.isOnline && (
                         <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                       )}
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-baseline mb-1">
                         <h4 className={`text-sm tracking-tight truncate pr-2 ${isUnread ? 'font-black text-white' : 'font-bold text-slate-200'}`}>
                           {otherUser.name}
                         </h4>
                         <span className="text-[10px] text-slate-500 shrink-0 font-medium">
                           {formatTime(conv.lastMessageTime)}
                         </span>
                       </div>
                       <p className={`text-xs truncate flex items-center gap-1 ${isUnread ? 'font-bold text-emerald-400' : 'text-slate-400'}`}>
                         {conv.lastMessageSenderId === user?.uid && <span className="opacity-50">You: </span>}
                         {conv.lastMessageType === 'image' && <ImageIcon className="w-3 h-3" />}
                         {conv.lastMessageType === 'product' && <Box className="w-3 h-3" />}
                         <span>{conv.lastMessage || (conv.lastMessageType === 'image' ? 'Image' : conv.lastMessageType === 'product' ? 'Product shared' : 'No messages yet')}</span>
                       </p>
                     </div>
                     {isUnread ? (
                       <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                         {unreadCount > 99 ? '99+' : unreadCount}
                       </div>
                     ) : (
                       <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition shrink-0" />
                     )}
                   </button>
                 );
               })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
