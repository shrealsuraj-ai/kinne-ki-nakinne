import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Share2, ShoppingBag, ShoppingCart, Plus, X, ChevronRight, LogIn, User as UserIcon, LogOut, Home, Search, Inbox, BadgeCheck, Volume2, VolumeX, Star } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, setDoc, doc, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from './lib/firebase';
import AuthModal from './components/AuthModal';
import ProfileDashboard from './components/ProfileDashboard';

import ProductUploadModal from './components/ProductUploadModal';
import InboxPanel from './components/chat/InboxPanel';
import ChatPanel from './components/chat/ChatPanel';
import CartPanel from './components/CartPanel';
import ReviewsPanel from './components/ReviewsPanel';

const DUMMY_VIDEOS = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80',
    type: 'image', // In a real app, these would be video URLs
    seller: 'SneakerHead',
    title: 'Limited Edition Red Runners',
    description: 'Fresh out of the box! Cop these before they are gone.',
    price: 199,
    likes: '12.4K',
    comments: 342,
    isFlashSale: true,
    stockLeft: 4,
    isVerified: true
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&q=80',
    type: 'image',
    seller: 'RunnApparel',
    title: 'Ultra-light running jacket',
    description: 'Perfect for morning jogs. Waterproof and breathable. #fitness #gear',
    price: 89,
    likes: '8.2K',
    comments: 120,
    isFlashSale: false,
    stockLeft: 12,
    isVerified: false
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80',
    type: 'image',
    seller: 'TechPro',
    title: 'Smart Watch Series 5',
    description: 'Track your health, receive calls, look stylish.',
    price: 249,
    likes: '45.1K',
    comments: 1102,
    isFlashSale: true,
    stockLeft: 2,
    isVerified: true
  }
];

export default function App() {
  const [videos, setVideos] = useState<any[]>(DUMMY_VIDEOS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = down/next, -1 = up/prev
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileDashboardOpen, setIsProfileDashboardOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>('M');

  const cartIconRef = useRef<HTMLButtonElement>(null);
  const addToCartButtonRef = useRef<HTMLButtonElement>(null);
  const [animations, setAnimations] = useState<{ id: number; x: number; y: number; img: string }[]>([]);

  const addToCart = (e?: React.MouseEvent) => {
    if (!currentItem) return;
    if (activeSegment === 'arena') {
      alert('Bid placed successfully! Escrow locked.');
      setIsCheckoutOpen(false);
      return;
    }

    if (e && cartIconRef.current && addToCartButtonRef.current) {
      const buttonRect = addToCartButtonRef.current.getBoundingClientRect();
      const cartRect = cartIconRef.current.getBoundingClientRect();
      
      const newAnim = {
        id: Date.now(),
        x: cartRect.left - buttonRect.left,
        y: cartRect.top - buttonRect.top,
        img: currentItem.url
      };
      
      setAnimations(prev => [...prev, newAnim]);
      
      setTimeout(() => {
        setAnimations(prev => prev.filter(anim => anim.id !== newAnim.id));
        setIsCartOpen(true);
      }, 800);
    } else {
       setIsCartOpen(true);
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === currentItem.id && item.size === selectedOption);
      if (existing) {
        return prev.map(item => item.id === currentItem.id && item.size === selectedOption ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...currentItem, size: selectedOption, quantity: 1, cartItemId: Date.now() }];
    });
    setIsCheckoutOpen(false);
  };
  const [activeChat, setActiveChat] = useState<{ id: string, otherUser: { id: string, name: string, avatar?: string } } | null>(null);
  const { user, signOut } = useAuth();
  
  const [activeSegment, setActiveSegment] = useState<'feed' | 'arena' | 'remarket'>('feed');
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Only set if we have videos, otherwise show dummy ones
      if (fetchedProducts.length > 0) {
        setVideos(fetchedProducts);
      }
    });
    return () => unsubscribe();
  }, []);

  const displayedVideos = videos.filter(v => (v.segment || 'feed') === activeSegment) || [];
  
  // Prevent out of bounds
  const currentItem = displayedVideos.length > 0 ? displayedVideos[currentIndex % displayedVideos.length] : null;

  useEffect(() => {
    setCurrentIndex(0);
  }, [activeSegment]);

  const toggleWishlist = (id: number) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]);
  };

  const startChat = async () => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    const currentSellerId = currentItem?.sellerId || 'dummy_seller_123';
    if (!currentItem || currentSellerId === user.uid) return;
    
    try {
      // Look for existing conversation
      const q = query(
         collection(db, 'conversations'), 
         where('participants', 'array-contains', user.uid)
      );
      
      const conversationId = [user.uid, currentSellerId].sort().join('_');
      
      await setDoc(doc(db, 'conversations', conversationId), {
         participants: [user.uid, currentSellerId],
         participantData: {
           [user.uid]: { name: user.email?.split('@')[0] || 'User', avatar: '' },
           [currentSellerId]: { name: currentItem.seller || 'Seller', avatar: '' }
         },
         lastMessage: '',
         lastMessageTime: serverTimestamp(),
         lastMessageSenderId: '',
         unreadCount: { [currentSellerId]: 0, [user.uid]: 0 },
         updatedAt: serverTimestamp(),
         createdAt: serverTimestamp()
      }, { merge: true });

      // Add a product message immediately
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
         senderId: user.uid,
         text: "Hi! I'm interested in this item.",
         messageType: 'product',
         productData: {
           id: currentItem.id,
           title: currentItem.title,
           price: currentItem.price,
           url: currentItem.url || ''
         },
         createdAt: serverTimestamp(),
         readBy: [user.uid],
         status: 'sent'
      });

      setActiveChat({ 
         id: conversationId, 
         otherUser: { id: currentSellerId, name: currentItem.seller || 'Seller', avatar: '' } 
      });

    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const handleNext = () => {
    if (displayedVideos.length <= 1) return;
    setDirection(1);
    setCurrentIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    if (displayedVideos.length <= 1) return;
    setDirection(-1);
    setCurrentIndex(prev => (prev - 1 < 0 ? displayedVideos.length - 1 : prev - 1));
  };

  const variants = {
    enter: (direction: number) => {
      return {
        y: direction > 0 ? "100%" : "-100%",
        opacity: 0,
        scale: 0.95
      };
    },
    center: {
      zIndex: 1,
      y: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => {
      return {
        zIndex: 0,
        y: direction < 0 ? "100%" : "-100%",
        opacity: 0,
        scale: 0.95
      };
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 h-screen w-full flex items-center justify-center overflow-hidden font-sans p-6">
      {/* Mobile constraint container for web preview */}
      <div className="relative w-full max-w-[400px] h-full max-h-[850px] bg-black rounded-[40px] border-[8px] border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Navigation */}
        <div className="absolute top-0 w-full z-20 flex justify-between items-center p-4 pt-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="w-6 h-6 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded flex items-center justify-center font-black text-white text-xs shadow-lg shadow-emerald-500/30">?</div>
            <div className="hidden sm:block text-lg font-extrabold tracking-tight text-white drop-shadow-md">Kinne Ki Nakinne?</div>
          </div>
          <div className="flex gap-4 items-center text-xs font-bold pointer-events-auto bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 max-w-[50%] overflow-x-auto hide-scrollbar">
            <button 
              onClick={() => setActiveSegment('feed')}
              className={`transition-colors whitespace-nowrap ${activeSegment === 'feed' ? 'text-emerald-400 drop-shadow-md' : 'text-white/70 hover:text-white'}`}
            >
              Products
            </button>
            <button 
              onClick={() => setActiveSegment('arena')}
              className={`transition-colors flex items-center gap-1 whitespace-nowrap ${activeSegment === 'arena' ? 'text-rose-500 drop-shadow-md' : 'text-white/70 hover:text-white'}`}
            >
              {activeSegment === 'arena' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
              Auction
            </button>
            <button 
              onClick={() => setActiveSegment('remarket')}
              className={`transition-colors whitespace-nowrap ${activeSegment === 'remarket' ? 'text-amber-400 drop-shadow-md' : 'text-white/70 hover:text-white'}`}
            >
              Second Hand or Refurbished
            </button>
          </div>
          
          <div className="flex gap-2 items-center pointer-events-auto">
            <button ref={cartIconRef} onClick={() => setIsCartOpen(true)} className="bg-black/40 p-1.5 rounded-full backdrop-blur-md border border-white/10 hover:bg-white/20 transition relative">
               <ShoppingCart className="w-4 h-4 text-white" />
               {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-md">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>}
            </button>
            <button onClick={() => setIsWishlistOpen(true)} className="bg-black/40 p-1.5 rounded-full backdrop-blur-md border border-white/10 hover:bg-white/20 transition relative">
               <Heart className="w-4 h-4 text-white" />
               {wishlist.length > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-md">{wishlist.length}</span>}
            </button>

            {!user && (
               <button onClick={() => setIsAuthOpen(true)} className="bg-gradient-to-tr from-emerald-500 to-teal-500 p-1.5 rounded-full backdrop-blur-md border border-white/10 hover:opacity-90 transition shadow-lg shadow-emerald-500/20">
                 <LogIn className="w-4 h-4 text-white" />
               </button>
            )}
          </div>
        </div>

        {/* Video Feed Area */}
        <div className="relative flex-1 w-full bg-black mb-16 flex items-center justify-center">
          {!currentItem ? (
             <div className="text-center p-6 mt-16 max-w-xs mx-auto">
                <ShoppingBag className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-300">Nothing here yet</h3>
                <p className="text-slate-500 text-sm mt-2">Be the first to list an item in this category by clicking the + button.</p>
             </div>
          ) : (
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0 w-full h-full cursor-pointer"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              // Adjust drag threshold
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = offset.y;
                if (swipe < -80) handleNext();
                else if (swipe > 80) handlePrev();
              }}
            >
              {/* Product Media */}
              {currentItem.type === 'video' || (currentItem.url && currentItem.url.includes('firebasestorage')) ? (
                <div className="w-full h-full bg-black relative">
                  <video 
                    src={currentItem.url} 
                    className="w-full h-full object-cover brightness-75 transition-all duration-700 hover:brightness-100" 
                    autoPlay 
                    loop 
                    muted={isMuted} 
                    playsInline 
                  />
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                    className="absolute top-24 right-4 z-30 bg-black/40 p-2 rounded-full backdrop-blur-sm border border-white/10"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                  </button>
                </div>
              ) : (
                <div 
                  className="w-full h-full bg-cover bg-center brightness-75 transition-all duration-700 hover:brightness-100" 
                  style={{ backgroundImage: `url(${currentItem.url})` }} 
                />
              )}
              
              {/* Product overlay content */}
              <div className="absolute bottom-0 left-0 w-full p-4 pb-28 bg-gradient-to-t from-black/80 to-transparent flex items-end">
                <div className="flex-1 pr-12">
                  <h3 className="text-white font-extrabold text-sm tracking-wide mb-1 flex items-center gap-2 drop-shadow-md">
                    @{currentItem.seller}
                    {(activeSegment === 'feed' || activeSegment === 'remarket') && currentItem.isVerified && (
                      <span className="flex items-center gap-1 text-blue-400">
                        <BadgeCheck className="w-4 h-4 fill-blue-500 text-white" />
                      </span>
                    )}
                    {activeSegment === 'arena' && <span className="bg-rose-600 px-2 py-0.5 rounded text-[10px] font-black animate-pulse text-white shadow-lg shadow-rose-600/50">LIVE HOST</span>}
                    {activeSegment === 'remarket' && <span className="bg-amber-500/80 backdrop-blur-md border border-amber-400 px-2 py-0.5 rounded text-[10px] font-black text-white shadow-lg">Good Condition</span>}
                  </h3>
                  <p className="text-slate-300 text-[11px] line-clamp-2">{currentItem.description}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          )}
        </div>

        {/* Right Action Bar */}
        {currentItem && (
        <div className="absolute right-3 bottom-44 z-20 flex flex-col gap-5 items-center pointer-events-auto">
          
          <div className="relative flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-400 to-rose-500 border-2 border-slate-800 flex items-center justify-center overflow-hidden">
              <span className="font-bold text-xs text-white pb-0.5">{currentItem.seller[0]}</span>
            </div>
            <div className="absolute -bottom-2 bg-rose-600 rounded-full p-0.5 border border-slate-800">
              <Plus className="w-2.5 h-2.5 text-white stroke-[3]" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 mt-4">
            <button 
              onClick={() => toggleWishlist(currentItem.id)}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <Heart className={`w-4 h-4 transition-colors ${wishlist.includes(currentItem.id) ? "fill-rose-500 text-rose-500" : "fill-transparent text-white"}`} />
            </button>
            <span className="text-[9px] font-bold text-white drop-shadow-md">Save</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button 
              onClick={() => setIsCheckoutOpen(true)}
              className={`w-12 h-12 rounded-full ${activeSegment === 'arena' ? 'bg-gradient-to-tr from-rose-500 to-red-600 shadow-rose-500/40' : 'bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-emerald-500/40'} flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl block border-2 border-white`}
            >
              <ShoppingCart className="w-5 h-5 text-white" />
            </button>
            <span className={`text-[10px] font-black ${activeSegment === 'arena' ? 'text-rose-400' : 'text-emerald-400'} drop-shadow-lg`}>{activeSegment === 'arena' ? 'BID NOW' : 'KINNE!'}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button onClick={startChat} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <MessageCircle className="w-4 h-4 fill-white text-white opacity-90" />
            </button>
            <span className="text-[9px] font-bold text-white drop-shadow-md">Chat</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button onClick={() => setIsReviewsOpen(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <Star className={`w-4 h-4 text-white opacity-90 ${(currentItem.reviewCount && currentItem.reviewCount > 0) ? 'fill-amber-400 text-amber-400' : 'fill-transparent'}`} />
            </button>
            <span className="text-[9px] font-bold text-white drop-shadow-md">
              {currentItem.reviewCount ? `${(currentItem.ratingSum / currentItem.reviewCount).toFixed(1)} ★` : 'Reviews'}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <Share2 className="w-4 h-4 fill-transparent text-white opacity-90" />
            </button>
            <span className="text-[9px] font-bold text-white drop-shadow-md">Share</span>
          </div>

        </div>
        )}

        {/* Bottom Floating Buy Bar - E-commerce CTA */}
        {currentItem && (
        <div className="absolute bottom-20 left-3 right-3 z-20">
          <div className="bg-black/60 backdrop-blur-xl border border-white/20 p-3 rounded-2xl flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 rounded-lg w-10 h-10 flex items-center justify-center overflow-hidden border border-white/20">
                 <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-xs tracking-tight line-clamp-1 max-w-[120px] drop-shadow-md">{currentItem.title}</span>
                <div className="flex items-center gap-2">
                  {activeSegment === 'arena' ? (
                     <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-500 text-sm drop-shadow-sm">Current Bid: NPR {currentItem.price}</span>
                  ) : (
                     <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 text-sm drop-shadow-sm">NPR {currentItem.price}</span>
                  )}
                  {activeSegment === 'arena' && (
                    <span className="bg-rose-600 px-1.5 py-0.5 rounded text-[8px] font-black animate-pulse text-white shadow-lg shadow-rose-600/50">
                       02:45 LEFT
                    </span>
                  )}
                  {activeSegment === 'feed' && currentItem.isFlashSale && (
                    <span className="bg-amber-500 px-1.5 py-0.5 rounded text-[8px] font-black text-white shadow-lg shadow-amber-500/50">
                       FLASH SALE!
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setIsCheckoutOpen(true)}
              className={`${activeSegment === 'arena' ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-rose-500/30' : 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/30'} text-white px-5 py-2 rounded-xl text-xs font-black tracking-wide shadow-lg hover:opacity-90 active:scale-95 transition-all shrink-0`}
            >
              {activeSegment === 'arena' ? 'PLACE BID' : 'KINNE!'}
            </button>
          </div>
        </div>
        )}

        {/* Half-Modal Checkout Sheet (Animated overlay) */}
        <AnimatePresence>
          {isCheckoutOpen && currentItem && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 pointer-events-auto"
                onClick={() => setIsCheckoutOpen(false)}
              />
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 400, damping: 40 }}
                className="absolute bottom-0 left-0 w-full bg-slate-900 rounded-t-[32px] z-40 p-6 pointer-events-auto border-t border-slate-700 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col"
                style={{ height: "65vh" }}
              >
                <div className="w-12 h-1.5 bg-slate-700 flex self-center rounded-full mb-6" />
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">{currentItem.title}</h2>
                    <p className="text-slate-400 text-xs mt-1">Sold by @{currentItem.seller}</p>
                  </div>
                  <button onClick={() => setIsCheckoutOpen(false)} className="bg-slate-800 p-2 rounded-full border border-slate-700 hover:bg-slate-700 text-slate-300">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400 text-xs">{activeSegment === 'arena' ? 'Current Bid' : 'Price'}</span>
                    <span className="font-bold text-xl text-white">NPR {currentItem.price}</span>
                  </div>
                   {activeSegment === 'arena' && (
                     <div className="flex justify-between items-center text-rose-500 text-xs font-bold">
                       <span>Auction ends in:</span>
                       <span className="font-mono">02:45 LEFT</span>
                     </div>
                   )}
                   {activeSegment === 'remarket' && (
                     <div className="flex justify-between items-center text-amber-500 text-xs font-bold mt-2 pt-2 border-t border-slate-700">
                       <span>AI Verification Score:</span>
                       <span>98% Authentic</span>
                     </div>
                   )}
                   {(currentItem.reviewCount > 0) && (
                     <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700">
                       <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                       <span className="text-white font-bold text-sm">{(currentItem.ratingSum / currentItem.reviewCount).toFixed(1)}</span>
                       <span className="text-slate-400 text-xs">({currentItem.reviewCount} reviews)</span>
                     </div>
                   )}
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="mb-4">
                      {currentItem.keyFeatures && currentItem.keyFeatures.length > 0 && (
                         <div className="mb-4 bg-slate-800/30 p-3 rounded-xl border border-slate-700/50">
                           <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Key Features</h4>
                           <ul className="text-sm text-slate-300 space-y-1 pl-4 list-disc">
                             {currentItem.keyFeatures.map((f: string, i: number) => <li key={i}>{f.replace(/^-/, '').trim()}</li>)}
                           </ul>
                         </div>
                      )}
                      {currentItem.specifications && Object.keys(currentItem.specifications).length > 0 && (
                        <div className="mb-4">
                           <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Specifications</h4>
                           <div className="grid grid-cols-2 gap-2">
                             {Object.entries(currentItem.specifications).map(([k, v]) => (
                               <div key={k} className="bg-slate-800/50 border border-slate-700 rounded-lg p-2 flex flex-col">
                                 <span className="text-[10px] text-slate-500 uppercase font-bold">{k}</span>
                                 <span className="text-xs text-white break-words">{v as string}</span>
                               </div>
                             ))}
                           </div>
                        </div>
                      )}
                      
                      <h4 className="text-sm font-bold text-slate-300 mb-3 mt-4">{activeSegment === 'arena' ? 'Your Bid Amount' : 'Options'}</h4>
                      <div className="flex gap-2 w-full overflow-x-auto pb-2">
                        {activeSegment === 'arena' ? (
                           [10, 20, 50, 100].map(amount => (
                             <button key={amount} className="flex-1 py-3 border border-slate-700 bg-slate-800/50 rounded-xl flex items-center justify-center font-bold text-slate-300 hover:border-rose-500 hover:bg-rose-500/20 hover:text-white transition-all">
                               +${amount}
                             </button>
                           ))
                        ) : (
                          ['S', 'M', 'L', 'XL'].map(size => (
                             <button onClick={() => setSelectedOption(size)} key={size} className={`w-12 h-12 shrink-0 border rounded-xl flex items-center justify-center font-semibold transition-all ${selectedOption === size ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-emerald-500/50 hover:bg-slate-800'}`}>
                               {size}
                             </button>
                          ))
                        )}
                      </div>
                    </div>
                </div>

                 <div className="mt-auto pt-4 border-t border-slate-700 relative">
                   {animations.map(anim => (
                     <motion.div
                       key={anim.id}
                       initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                       animate={{ opacity: 0, scale: 0.2, x: anim.x, y: anim.y }}
                       transition={{ duration: 0.8, ease: "easeInOut" }}
                       className="absolute inset-0 m-auto w-12 h-12 rounded-full z-50 overflow-hidden border-2 border-emerald-500 shadow-xl"
                       style={{ pointerEvents: 'none' }}
                     >
                       <img src={anim.img} className="w-full h-full object-cover" alt="" />
                     </motion.div>
                   ))}
                   <motion.button 
                     ref={addToCartButtonRef}
                     whileTap={{ scale: 0.95 }}
                     onClick={addToCart}
                     className={`w-full ${activeSegment === 'arena' ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-rose-500/30' : 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/30'} text-white font-black text-lg py-4 rounded-xl flex items-center justify-center gap-2 shadow-xl hover:opacity-90 active:scale-95 transition-all`}
                   >
                     {activeSegment === 'arena' ? 'CONFIRM BID' : 'ADD TO CART'} <ChevronRight className="w-5 h-5" />
                   </motion.button>
                   <p className="text-center text-[10px] text-slate-500 mt-4 leading-relaxed tracking-wide uppercase font-bold">Secure encrypted {activeSegment === 'arena' ? 'escrow holding' : 'checkout'}</p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Wishlist Modal */}
        <AnimatePresence>
          {isWishlistOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 pointer-events-auto flex justify-end"
                onClick={() => setIsWishlistOpen(false)}
              >
                <motion.div 
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", stiffness: 350, damping: 40 }}
                  className="h-full w-full max-w-xs bg-slate-900 border-l border-slate-700 shadow-[0_0_40px_rgba(0,0,0,0.8)] z-50 flex flex-col pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center p-6 border-b border-slate-800">
                    <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                       <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                       Wishlist
                    </h2>
                    <button onClick={() => setIsWishlistOpen(false)} className="bg-slate-800 p-2 rounded-full hover:bg-slate-700 text-slate-300 transition">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                    {wishlist.length === 0 ? (
                      <div className="text-center text-slate-500 mt-10">
                        <Heart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="font-bold">Your wishlist is empty</p>
                        <p className="text-xs mt-2">Save items you like to view them later.</p>
                      </div>
                    ) : (
                      wishlist.map(id => {
                        const item = videos.find(v => v.id === id);
                        if (!item) return null;
                        return (
                          <div key={id} className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 flex gap-3 cursor-pointer hover:bg-slate-800 transition" onClick={() => {
                            const idx = videos.findIndex(v => v.id === id);
                            if(idx !== -1) setCurrentIndex(idx);
                            setIsWishlistOpen(false);
                          }}>
                            <div className="w-16 h-16 rounded-lg bg-cover bg-center shrink-0 border border-white/10" style={{ backgroundImage: `url(${item.url})` }} />
                            <div className="flex-1 flex flex-col justify-between overflow-hidden">
                              <div>
                                 <p className="text-sm font-bold text-white line-clamp-1">{item.title}</p>
                                 <p className="text-[10px] text-slate-400">@{item.seller}</p>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                 <p className="text-emerald-400 font-bold text-sm">NPR {item.price}</p>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); toggleWishlist(id); }}
                                   className="text-slate-500 hover:text-rose-500 transition-colors p-1"
                                 >
                                   <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                                 </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  {wishlist.length > 0 && (
                     <div className="p-4 border-t border-slate-800">
                        <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 rounded-xl transition-colors">
                           Share Wishlist
                        </button>
                     </div>
                  )}
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Global Bottom Navigation Bar */}
        <div className="absolute bottom-0 left-0 w-full h-16 bg-black/90 backdrop-blur-md border-t border-white/10 z-30 flex justify-around items-center px-2 pointer-events-auto">
          <button className="flex flex-col items-center gap-1 text-white">
            <Home className="w-5 h-5 opacity-90" />
            <span className="text-[9px] font-bold">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-500 hover:text-white transition">
            <Search className="w-5 h-5 opacity-90" />
            <span className="text-[9px] font-bold">Discover</span>
          </button>
          <div className="relative flex justify-center w-12 h-8">
             <button 
               onClick={() => user ? setIsUploadModalOpen(true) : setIsAuthOpen(true)}
               className="absolute -top-2 w-11 h-[30px] bg-gradient-to-r from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center text-black font-black text-xl hover:scale-105 transition-transform border border-white"
             >
               <Plus className="w-5 h-5 text-white stroke-[3px]" />
             </button>
          </div>
          <button onClick={() => user ? setIsInboxOpen(true) : setIsAuthOpen(true)} className="flex flex-col items-center gap-1 text-slate-500 hover:text-white transition">
            <Inbox className="w-5 h-5 opacity-90" />
            <span className="text-[9px] font-bold">Inbox</span>
          </button>
          <button 
            onClick={() => user ? setIsProfileDashboardOpen(true) : setIsAuthOpen(true)} 
            className={`flex flex-col items-center gap-1 transition ${user ? 'text-emerald-400' : 'text-slate-500 hover:text-white'}`}
          >
            <UserIcon className="w-5 h-5 opacity-90" />
            <span className="text-[9px] font-bold">Profile</span>
          </button>
        </div>

        {/* Auth Modal UI */}
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        <ProfileDashboard isOpen={isProfileDashboardOpen && !!user} onClose={() => setIsProfileDashboardOpen(false)} />
        <ProductUploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
        
        <CartPanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cart={cart} setCart={setCart} />
        {currentItem && (
          <ReviewsPanel isOpen={isReviewsOpen} onClose={() => setIsReviewsOpen(false)} productId={currentItem.id} />
        )}

        <InboxPanel 
           isOpen={isInboxOpen} 
           onClose={() => setIsInboxOpen(false)} 
           onOpenChat={(id, otherUser) => {
              setIsInboxOpen(false);
              setActiveChat({ id, otherUser });
           }}
        />
        
        {activeChat && (
          <ChatPanel 
             isOpen={true} 
             onClose={() => setActiveChat(null)} 
             conversationId={activeChat.id} 
             otherUser={activeChat.otherUser} 
          />
        )}
      </div>
    </div>
  );
}
