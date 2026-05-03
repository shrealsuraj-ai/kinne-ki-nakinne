import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, User } from 'lucide-react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  recipientName: string;
}

export default function ChatModal({ isOpen, onClose, chatId, recipientName }: ChatModalProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !chatId || !user) return;

    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubscribe();
  }, [isOpen, chatId, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chatId) return;

    const msg = newMessage;
    setNewMessage('');
    
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: msg,
        senderId: user.uid,
        senderEmail: user.email,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending message", error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex flex-col pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
        />
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 350, damping: 40 }}
          className="absolute bottom-0 left-0 w-full h-[80vh] flex flex-col bg-slate-950 border-t border-slate-800 rounded-t-[32px] shadow-[0_-20px_40px_rgba(0,0,0,0.8)] pointer-events-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 pt-5 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <h3 className="text-white font-bold">{recipientName}</h3>
                <p className="text-xs text-emerald-400">Online</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="bg-slate-800 p-2 rounded-full hover:bg-slate-700 text-slate-300 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                <User className="w-12 h-12 opacity-50" />
                <p className="text-sm font-bold">Start a conversation with {recipientName}</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.senderId === user?.uid;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isMine ? 'bg-emerald-500 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-200 rounded-tl-sm'
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-[9px] mt-1 text-right ${isMine ? 'text-emerald-200' : 'text-slate-400'}`}>
                        {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/30 pb-safe">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 text-white p-3 rounded-xl transition flex items-center justify-center aspect-square"
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
