import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Image as ImageIcon, Box, ArrowLeft, MoreVertical, ExternalLink, MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, writeBatch, limit } from 'firebase/firestore';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  otherUser: { id: string, name: string, avatar?: string };
}

export default function ChatPanel({ isOpen, onClose, conversationId, otherUser }: ChatPanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !isOpen || !conversationId) return;

    // Load messages
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc'),
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      setLoading(false);
      
      // Mark as read
      const unreadMsgs = snapshot.docs.filter(doc => {
        const data = doc.data();
        return data.senderId !== user.uid && (!data.readBy || !data.readBy.includes(user.uid));
      });
      
      if (unreadMsgs.length > 0) {
        const batch = writeBatch(db);
        unreadMsgs.forEach(msgDoc => {
          batch.update(msgDoc.ref, {
            readBy: [...(msgDoc.data().readBy || []), user.uid],
            status: 'read'
          });
        });
        // Reset unread count for this user in conversation doc
        batch.update(doc(db, 'conversations', conversationId), {
           [`unreadCount.${user.uid}`]: 0
        });
        await batch.commit();
      }
    });

    return () => unsubscribe();
  }, [user, isOpen, conversationId]);

  useEffect(() => {
    // Auto scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !user || !conversationId) return;

    const text = inputText.trim();
    setInputText('');
    
    try {
      const batch = writeBatch(db);
      
      const newMsgRef = doc(collection(db, 'conversations', conversationId, 'messages'));
      batch.set(newMsgRef, {
        senderId: user.uid,
        text,
        messageType: 'text',
        createdAt: serverTimestamp(),
        readBy: [user.uid],
        status: 'sent'
      });

      const convRef = doc(db, 'conversations', conversationId);
      // We can't use FieldValue.increment() easily in batch updates for nested fields dynamically if we don't import it,
      // But let's assume we do a normal update for unreadCount for simplicity, or just set it to 1. 
      // A better way is using an explicit transactions/batch increment, but we will simplify.
      batch.update(convRef, {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: user.uid,
        lastMessageType: 'text',
        updatedAt: serverTimestamp()
      });
      // Updating unreadCount accurately requires fetching the current count or using FieldValue.increment
      
      await batch.commit();

    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex flex-col pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto"
        />
        <motion.div 
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 350, damping: 40 }}
          className="absolute top-0 right-0 w-full md:w-[450px] h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col pointer-events-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md z-10">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-slate-800 text-slate-400 transition">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
                    {otherUser.avatar ? (
                      <img src={otherUser.avatar} alt={otherUser.name} className="w-full h-full object-cover" />
                    ) : otherUser.name?.charAt(0).toUpperCase()}
                 </div>
                 <div>
                   <h3 className="text-white font-bold text-sm tracking-tight">{otherUser.name}</h3>
                   <div className="flex items-center gap-1.5">
                     <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                     <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Online</span>
                   </div>
                 </div>
              </div>
            </div>
            <button className="p-2 rounded-full hover:bg-slate-800 text-slate-400 transition">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0B1120]">
            {loading ? (
               <div className="flex justify-center items-center h-full">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
               </div>
            ) : messages.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                     <MessageCircle className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-sm font-bold text-white mb-1">Start a conversation</p>
                  <p className="text-xs">Say hi to {otherUser.name}</p>
               </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.senderId === user?.uid;
                const showAvatar = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);
                
                return (
                  <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
                    {!isMe && (
                      <div className="w-8 shrink-0 flex items-end">
                        {showAvatar && (
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white text-xs font-bold overflow-hidden mb-1">
                            {otherUser.avatar ? <img src={otherUser.avatar} alt="avatar" /> : otherUser.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {msg.messageType === 'product' && msg.productData && (
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden mb-1 w-64 shadow-lg group hover:border-emerald-500/50 transition">
                          <div className="h-32 bg-slate-900 relative overflow-hidden">
                             {msg.productData.url && <img src={msg.productData.url} alt={msg.productData.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />}
                             <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                             <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] font-black text-white uppercase tracking-wider flexItems-center gap-1">
                                <Box className="w-3 h-3 text-emerald-400" /> Shared Product
                             </div>
                          </div>
                          <div className="p-3">
                            <h4 className="font-bold text-white text-sm line-clamp-1 mb-1">{msg.productData.title}</h4>
                            <p className="text-emerald-400 font-black text-xs mb-3">NPR {msg.productData.price}</p>
                            <button className="w-full py-2 bg-slate-700 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1">
                               View Product <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {msg.text && (
                        <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-sm shadow-xl shadow-emerald-500/10' : 'bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700'}`}>
                          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                        </div>
                      )}
                      
                      <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? 'text-slate-500' : 'text-slate-600'}`}>
                        <span className="text-[9px] font-medium">{formatTime(msg.createdAt)}</span>
                        {isMe && (
                          <div className="flex">
                            <span className="text-[10px]">&bull;</span>
                            <span className={`text-[9px] ml-1 font-bold ${msg.status === 'read' ? 'text-emerald-400' : ''}`}>
                              {msg.status === 'read' ? 'Read' : msg.status === 'delivered' ? 'Delivered' : 'Sent'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 pt-3 pb-safe">
            <form onSubmit={handleSend} className="flex items-end gap-2">
              <button type="button" className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 transition shrink-0">
                <ImageIcon className="w-5 h-5" />
              </button>
              <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 focus-within:border-emerald-500 transition overflow-hidden">
                <textarea 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Message..."
                  className="w-full bg-transparent text-white px-4 py-3 focus:outline-none resize-none max-h-[120px] min-h-[46px] text-sm hide-scrollbar block"
                  rows={1}
                />
              </div>
              <button 
                type="submit" 
                disabled={!inputText.trim()}
                className="p-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition shrink-0 shadow-lg shadow-emerald-500/20 disabled:shadow-none"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
