import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Share2, ShoppingBag, ShoppingCart, Plus, X, ChevronRight, ChevronLeft, LogIn, User as UserIcon, LogOut, Home, Search, Inbox, BadgeCheck, Volume2, VolumeX, Star, Undo2, Play, Pause, Maximize, Minimize, Info } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, setDoc, doc, addDoc, serverTimestamp, where, limit, updateDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import AuthModal from './components/AuthModal';
import ProfileDashboard from './components/ProfileDashboard';

import ProductUploadModal from './components/ProductUploadModal';
import InboxPanel from './components/chat/InboxPanel';
import ChatPanel from './components/chat/ChatPanel';
import CartPanel from './components/CartPanel';
import ReviewsPanel from './components/ReviewsPanel';
import { useCart } from './contexts/CartContext';
import SellerRating from './components/SellerRating';
import SellerProfileModal from './components/SellerProfileModal';
import BuyMeter from './components/BuyMeter';


const DUMMY_VIDEOS: any[] = [];

const VideoPlayer = ({ src, isMuted, setIsMuted }: { src: string, isMuted: boolean, setIsMuted: (muted: boolean) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    // If controls hide, make sure we reflect real playing state
    if (videoRef.current) {
      if (isPlaying && videoRef.current.paused) {
        videoRef.current.play().catch(e => console.error(e));
      } else if (!isPlaying && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setProgress(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = value;
      setProgress(value);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen:`, err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowControls(!showControls);
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-black relative group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={handleContainerClick}
    >
      <video 
        ref={videoRef}
        src={src} 
        className="w-full h-full object-cover transition-all duration-700" 
        autoPlay 
        loop 
        muted={isMuted} 
        playsInline 
        crossOrigin="anonymous"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={(e) => {
          const target = e.target as HTMLVideoElement;
          console.error('Failed to load video URL:', target.src);
          target.parentElement?.classList.add('bg-slate-900', 'flex', 'items-center', 'justify-center');
          target.style.display = 'none';
          if(target.parentElement && !target.parentElement.querySelector('.video-error-msg')) {
             const p = document.createElement('p');
             p.innerText = "Video failed to load";
             p.className = "text-slate-500 font-bold text-sm absolute video-error-msg";
             target.parentElement.appendChild(p);
          }
        }}
      />
      
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 flex flex-col justify-between pointer-events-none z-30"
          >
            {/* Top right fullscreen toggle */}
            <div className="absolute top-24 right-4 pointer-events-auto">
              <button 
                onClick={toggleFullscreen}
                className="bg-black/50 p-2 rounded-full backdrop-blur-md border border-white/10 hover:bg-black/70 transition-colors shadow-lg"
              >
                {isFullscreen ? <Minimize className="w-5 h-5 text-white" /> : <Maximize className="w-5 h-5 text-white" />}
              </button>
            </div>

            {/* Center Play/Pause */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <button 
                onClick={togglePlay}
                className="bg-black/50 p-4 rounded-full backdrop-blur-md border border-white/20 text-white pointer-events-auto hover:bg-black/70 transition-colors shadow-lg transform hover:scale-105 active:scale-95"
              >
                {isPlaying ? <Pause className="w-8 h-8 md:w-10 md:h-10 fill-white" /> : <Play className="w-8 h-8 md:w-10 md:h-10 fill-white ml-1" />}
              </button>
            </div>

            {/* Bottom Controls Bar (Slider + Mute) */}
            <div className="absolute bottom-28 left-0 right-0 px-4 pointer-events-auto pb-4 pt-8 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center gap-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                  className="bg-black/50 p-2 rounded-full backdrop-blur-md border border-white/20 text-white hover:bg-black/70 transition-colors shadow-lg flex-shrink-0"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                
                <div className="flex items-center gap-3 flex-1 text-xs text-white font-mono font-bold drop-shadow-md">
                   <span>{formatTime(progress)}</span>
                   <input 
                     type="range" 
                     min={0} 
                     max={duration || 100} 
                     value={progress} 
                     onChange={handleSeek}
                     onClick={(e) => e.stopPropagation()}
                     className="flex-1 w-full h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                     style={{
                        background: `linear-gradient(to right, white ${(progress / (duration || 1)) * 100}%, rgba(255,255,255,0.3) ${(progress / (duration || 1)) * 100}%)`
                     }}
                   />
                   <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MediaSlideshow = ({ urls }: { urls: string[] }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (urls.length <= 1) return;
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % urls.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [urls.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex(prev => (prev - 1 + urls.length) % urls.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex(prev => (prev + 1) % urls.length);
  };

  return (
    <div className="w-full h-full relative group bg-black">
      <div 
        className="w-full h-full bg-contain bg-no-repeat bg-center brightness-75 transition-all duration-700 hover:brightness-100" 
        style={{ backgroundImage: `url(${urls[index]})` }} 
      />
      
      {urls.length > 1 && (
        <>
          <div className="absolute top-20 left-0 w-full flex justify-center gap-1.5 px-6 z-10 pointer-events-none">
            {urls.map((_, i) => (
               <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i === index ? 'bg-white' : 'bg-white/40'}`} />
            ))}
          </div>

          <button 
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 p-2 rounded-full text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-20"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button 
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 p-2 rounded-full text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-20"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
    </div>
  );
};

export default function App() {
  const [videos, setVideos] = useState<any[]>(DUMMY_VIDEOS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = down/next, -1 = up/prev
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSellerProfileOpen, setIsSellerProfileOpen] = useState(false);
  const [viewingSellerId, setViewingSellerId] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const { cart, addToCart } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileDashboardOpen, setIsProfileDashboardOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>('M');

  const cartIconRef = useRef<HTMLButtonElement>(null);
  const addToCartButtonRef = useRef<HTMLButtonElement>(null);
  const [animations, setAnimations] = useState<{ id: number; x: number; y: number; img: string }[]>([]);

  const handleAddToCartClick = async (e?: React.MouseEvent) => {
    if (!currentItem) return;
    if (activeSegment === 'arena') {
      if (!user) {
        alert("Please login to place a bid.");
        setIsAuthOpen(true);
        return;
      }

      if (currentHighestBid === 0) {
        if (bidAmount < 50) {
          alert("Your starting bid must be at least रू 50");
          return;
        }
      } else {
        if (bidAmount <= currentHighestBid) {
          alert(`Your bid must be higher than the current bid of रू ${currentHighestBid}`);
          return;
        }
      }

      try {
        await addDoc(collection(db, 'bids'), {
          streamId: currentItem.id, // using productId as streamId
          amount: bidAmount,
          userId: user.uid,
          timestamp: serverTimestamp()
        });
        alert('Bid placed successfully! Escrow locked.');
        setIsCheckoutOpen(false);
      } catch (error) {
        console.error("Error placing bid:", error);
        alert('Failed to place bid.');
      }
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

    addToCart({...currentItem, selectedSize: selectedOption}, currentItem.id, Date.now());
    setIsCheckoutOpen(false);
  };
  const [activeChat, setActiveChat] = useState<{ id: string, otherUser: { id: string, name: string, avatar?: string } } | null>(null);
  const { user, signOut, activeProfile, userRole } = useAuth();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const [activeSegment, setActiveSegment] = useState<'feed' | 'arena' | 'remarket'>('feed');
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (user && userRole) {
      const collectionName = userRole === 'seller' ? 'sellers' : userRole === 'admin' ? 'admins' : 'casual_users';
      const userRef = doc(db, collectionName, user.uid);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().wishlist) {
          setWishlist(docSnap.data().wishlist);
        } else {
          setWishlist([]);
        }
      });
      return () => unsubscribe();
    } else {
      setWishlist([]);
    }
  }, [user, userRole]);

  useEffect(() => {
    const q = query(collection(db, 'products'), where('moderationStatus', '==', 'approved'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Only set if we have videos, otherwise show dummy ones
      if (fetchedProducts.length > 0) {
        setVideos(fetchedProducts);
      }
    }, (error) => console.error("Error fetching products: ", error));
    return () => unsubscribe();
  }, []);

  const displayedVideos = videos.filter(v => (v.segment || 'feed') === activeSegment) || [];
  
  // Prevent out of bounds
  const currentItem = displayedVideos.length > 0 ? displayedVideos[currentIndex % displayedVideos.length] : null;

  const [currentHighestBid, setCurrentHighestBid] = useState(0);
  const [bidAmount, setBidAmount] = useState(0);
  const [bidHistory, setBidHistory] = useState<number[]>([]);

  useEffect(() => {
    if (!currentItem?.id || activeSegment !== 'arena') return;
    const streamId = currentItem.id; // Using productId as streamId for simplicity
    const q = query(
      collection(db, 'bids'),
      where('streamId', '==', streamId),
      orderBy('amount', 'desc'),
      limit(1)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const highest = snapshot.docs[0].data();
        setCurrentHighestBid(highest.amount);
      } else {
        setCurrentHighestBid(0); // starting bid
      }
    });
    
    return () => unsubscribe();
  }, [currentItem?.id, activeSegment]);

  useEffect(() => {
    if (activeSegment === 'arena') {
      if (currentHighestBid > 0) {
        setBidAmount(currentHighestBid + 50);
      } else if (currentItem?.price) {
        setBidAmount(currentItem.price + 50);
      } else {
        setBidAmount(100);
      }
      setBidHistory([]);
    }
  }, [currentHighestBid, currentItem?.price, activeSegment]);

  useEffect(() => {
    if (!currentItem?.id) return;
    
    // Background view increment
    const incrementView = async () => {
      try {
        const { increment } = await import('firebase/firestore');
        await updateDoc(doc(db, 'products', currentItem.id), {
          views: increment(1)
        });
      } catch (e) {
        // Ignore permission errors if any
      }
    };
    
    // Debounce to ensure they spend a moment on it
    const timer = setTimeout(() => {
      incrementView();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [currentItem?.id]);

  const toggleWishlist = async (id: string) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    const isSaved = wishlist.includes(id);
    const newWishlist = isSaved ? wishlist.filter(itemId => itemId !== id) : [...wishlist, id];
    setWishlist(newWishlist);

    try {
      const collectionName = userRole === 'seller' ? 'sellers' : userRole === 'admin' ? 'admins' : 'casual_users';
      const userRef = doc(db, collectionName, user.uid);
      await updateDoc(userRef, { wishlist: newWishlist });
    } catch (e) {
      console.error('Error updating wishlist', e);
      setWishlist(wishlist);
    }
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

  const handleProductJump = (product: any) => {
    setIsProfileDashboardOpen(false);
    
    // Switch to the correct segment
    const segment = product.segment || 'feed';
    setActiveSegment(segment);
    
    // Find index of this product in the segment
    const segmentVideos = videos.filter(v => (v.segment || 'feed') === segment);
    const index = segmentVideos.findIndex(v => v.id === product.id);
    if (index !== -1) {
      setCurrentIndex(index);
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
          <div className="flex gap-4 items-center font-bold pointer-events-auto bg-black/40 rounded-full backdrop-blur-md border border-white/10 max-w-[50%] overflow-x-auto hide-scrollbar" style={{ marginLeft: '0px', paddingLeft: '2px', paddingRight: '17px', paddingTop: '6px', paddingBottom: '6px', fontSize: '12px' }}>
            <button 
              onClick={() => { setActiveSegment('feed'); setCurrentIndex(0); }}
              className={`transition-colors whitespace-nowrap ${activeSegment === 'feed' ? 'text-emerald-400 drop-shadow-md' : 'text-white/70 hover:text-white'}`}
            >
              Products
            </button>
            <button 
              onClick={() => { setActiveSegment('arena'); setCurrentIndex(0); }}
              className={`transition-colors flex items-center gap-1 whitespace-nowrap ${activeSegment === 'arena' ? 'text-rose-500 drop-shadow-md' : 'text-white/70 hover:text-white'}`}
            >
              {activeSegment === 'arena' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
              Auction
            </button>
            <button 
              onClick={() => { setActiveSegment('remarket'); setCurrentIndex(0); }}
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
              {currentItem.type === 'slideshow' && currentItem.mediaUrls ? (
                <MediaSlideshow urls={currentItem.mediaUrls} />
              ) : currentItem.type === 'video' || (currentItem.url && (currentItem.url.includes('firebasestorage') || currentItem.url.includes('127.0.0.1') || currentItem.url.includes('googleapis') || currentItem.url.includes('.mp4'))) ? (
                <VideoPlayer 
                  src={currentItem.url} 
                  isMuted={isMuted} 
                  setIsMuted={setIsMuted} 
                />
              ) : (
                <div 
                  className="w-full h-full bg-cover bg-center brightness-75 transition-all duration-700 hover:brightness-100" 
                  style={{ backgroundImage: `url(${currentItem.mediaUrls ? currentItem.mediaUrls[0] : currentItem.url})` }} 
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
                  {currentItem.sellerId && (
                    <div className="mb-1 pointer-events-auto">
                      <SellerRating sellerId={currentItem.sellerId} compact={true} />
                    </div>
                  )}
                  <p className="text-slate-300 text-[11px] line-clamp-2">{currentItem.description}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          )}
        </div>

        {/* Right Action Bar */}
        {currentItem && (
        <div className="absolute right-3 bottom-44 z-20 flex flex-col gap-5 items-center pointer-events-auto" style={{ width: '30px', height: '341px' }}>
          
          <div className="relative flex flex-col items-center cursor-pointer" onClick={() => setIsSellerProfileOpen(true)}>
            <div className="rounded-full bg-gradient-to-tr from-orange-400 to-rose-500 border-2 border-slate-800 flex items-center justify-center overflow-hidden" style={{ width: '30px', height: '30px' }}>
              <span className="font-bold text-xs text-white pb-0.5">{currentItem.seller[0]}</span>
            </div>
            <div className="absolute -bottom-2 bg-rose-600 rounded-full p-0.5 border border-slate-800">
              <Plus className="w-2.5 h-2.5 text-white stroke-[3]" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 mt-4">
            <button 
              onClick={() => toggleWishlist(currentItem.id)}
              className="rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              style={{ width: '30px', height: '30px' }}
            >
              <Heart className={`w-4 h-4 transition-colors ${wishlist.includes(currentItem.id) ? "fill-rose-500 text-rose-500" : "fill-transparent text-white"}`} />
            </button>
            <span className="text-[9px] font-bold text-white drop-shadow-md">Save</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button 
              onClick={() => setIsCheckoutOpen(true)}
              className={`rounded-full ${activeSegment === 'arena' ? 'bg-gradient-to-tr from-rose-500 to-red-600 shadow-rose-500/40' : 'bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-emerald-500/40'} flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl block border-2 border-white`}
              style={{ width: '53px', height: '48px' }}
            >
              <ShoppingCart className="w-5 h-5 text-white" />
            </button>
            <span className={`text-[10px] font-black ${activeSegment === 'arena' ? 'text-rose-400' : 'text-emerald-400'} drop-shadow-lg`}>{activeSegment === 'arena' ? 'BID NOW' : 'KINNE!'}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button onClick={startChat} className="rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors" style={{ width: '30px', height: '30px' }}>
              <MessageCircle className="w-4 h-4 fill-white text-white opacity-90" />
            </button>
            <span className="text-[9px] font-bold text-white drop-shadow-md">Chat</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button onClick={() => setIsReviewsOpen(true)} className="rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors" style={{ width: '30px', height: '30px' }}>
              <Star className={`w-4 h-4 text-white opacity-90 ${(currentItem.reviewCount && currentItem.reviewCount > 0) ? 'fill-amber-400 text-amber-400' : 'fill-transparent'}`} />
            </button>
            <span className="text-[9px] font-bold text-white drop-shadow-md">
              {currentItem.reviewCount ? `${(currentItem.ratingSum / currentItem.reviewCount).toFixed(1)} ★` : 'Reviews'}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button className="rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors" style={{ width: '30px', height: '30px' }}>
              <Share2 className="w-4 h-4 fill-transparent text-white opacity-90" />
            </button>
            <span className="text-[9px] font-bold text-white drop-shadow-md">Share</span>
          </div>

        </div>
        )}

        {/* Bottom Floating Buy Bar - E-commerce CTA */}
        {currentItem && (
        <div className="absolute bottom-20 left-3 right-3 z-20">
          <div className="bg-black/60 backdrop-blur-xl border border-white/20 p-3 rounded-2xl flex items-center justify-between shadow-2xl" style={{ width: '308px', height: '45.6px', backgroundColor: '#030303' }}>
            <div className="flex items-center gap-3">
              <div className="bg-white/10 rounded-lg w-10 h-10 flex items-center justify-center overflow-hidden border border-white/20">
                 <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-xs tracking-tight line-clamp-1 max-w-[120px] drop-shadow-md">{currentItem.title}</span>
                <div className="flex items-center gap-2">
                  {activeSegment === 'arena' ? (
                    <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-500 text-sm drop-shadow-sm">Current Bid: NPR {currentHighestBid > 0 ? currentHighestBid : currentItem.price}</span>
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
                style={{ height: "85vh" }}
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

                <div className="flex-1 overflow-y-auto pr-2">
                  <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700 mb-6">
                    {activeSegment === 'arena' ? (
                      <>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-slate-400 font-bold text-sm">💰 Current Bid</span>
                          <span className="font-bold text-xl text-rose-500">रू {currentHighestBid > 0 ? currentHighestBid : currentItem.price}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-700">
                          <span className="text-emerald-400 font-bold text-sm">🫵 Your Bid</span>
                          <span className="font-bold text-xl text-emerald-400">रू {bidAmount}</span>
                        </div>
                        <div className="flex justify-between items-center text-rose-500 text-xs font-bold pt-2">
                          <span>Auction ends in:</span>
                          <span className="font-mono">02:45 LEFT</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-400 text-xs">Price</span>
                        <span className="font-bold text-xl text-white">NPR {currentItem.price}</span>
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
                      
                      <div className="flex justify-between items-center mb-3 mt-4">
                        <h4 className="text-sm font-bold text-slate-300">{activeSegment === 'arena' ? 'Increase Bid By' : 'Options'}</h4>
                        {activeSegment === 'arena' && bidHistory.length > 0 && (
                          <button 
                            onClick={() => {
                              const newHistory = [...bidHistory];
                              const previousBidAmount = newHistory.pop();
                              setBidHistory(newHistory);
                              if (previousBidAmount !== undefined) {
                                setBidAmount(previousBidAmount);
                              }
                            }}
                            className="flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-md hover:bg-rose-500/20 transition-colors"
                          >
                            <Undo2 className="w-3 h-3" />
                            Undo
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2 w-full overflow-x-auto pb-2">
                        {activeSegment === 'arena' ? (
                           [10, 20, 50, 100].map(amount => (
                             <button onClick={() => { setBidHistory(prev => [...prev, bidAmount]); setBidAmount(prev => prev + amount); }} key={amount} className="flex-1 py-3 border border-slate-700 bg-slate-800/50 rounded-xl flex items-center justify-center font-bold text-slate-300 hover:border-rose-500 hover:bg-rose-500/20 hover:text-white transition-all shrink-0 min-w-[70px]">
                               +Rs {amount}
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
                     onClick={handleAddToCartClick}
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
             {activeProfile === 'seller' ? (
               <button 
                 onClick={() => user ? setIsUploadModalOpen(true) : setIsAuthOpen(true)}
                 className="absolute -top-2 w-11 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center text-black font-black text-xl hover:scale-105 transition-transform border border-white shadow-lg"
                 style={{ height: '30px' }}
               >
                 <Plus className="w-5 h-5 text-white stroke-[3px]" />
               </button>
             ) : (
               <button 
                 onClick={() => currentItem && setIsDetailsOpen(true)}
                 className="absolute -top-2 w-11 bg-slate-800 rounded-lg flex items-center justify-center hover:scale-105 transition-transform border border-slate-600 shadow-lg group"
                 style={{ height: '30px' }}
               >
                 <Info className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
               </button>
             )}
          </div>
          <button onClick={() => user ? setIsInboxOpen(true) : setIsAuthOpen(true)} className="flex flex-col items-center gap-1 text-slate-500 hover:text-white transition">
            <Inbox className="w-5 h-5 opacity-90" />
            <span className="text-[9px] font-bold">Inbox</span>
          </button>
          <button 
            onClick={() => {
               if (user) {
                 setViewingSellerId(null);
                 setIsProfileDashboardOpen(true);
               } else {
                 setIsAuthOpen(true);
               }
            }} 
            className={`flex flex-col items-center gap-1 transition ${user ? 'text-emerald-400' : 'text-slate-500 hover:text-white'}`}
          >
            <UserIcon className="w-5 h-5 opacity-90" />
            <span className="text-[9px] font-bold">Profile</span>
          </button>
        </div>

        {/* Product Details Modal for Casual Users */}
        <AnimatePresence>
          {isDetailsOpen && currentItem && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 w-full bg-slate-900 rounded-t-3xl z-50 p-6 pb-12 flex flex-col border-t border-slate-700 shadow-2xl max-h-[70vh] overflow-y-auto hide-scrollbar"
            >
              <button 
                 onClick={() => setIsDetailsOpen(false)} 
                 className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 p-2 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                 <X className="w-5 h-5" />
              </button>
              <h3 className="font-bold text-xl text-white mb-3 pr-10 leading-tight">{currentItem.title}</h3>
              <div className="flex items-center gap-3 mb-6 bg-slate-800/50 p-3 rounded-2xl border border-slate-800">
                 <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-400 to-rose-500 border border-slate-700 flex items-center justify-center">
                    <span className="font-bold text-sm text-white pb-0.5">{currentItem.seller[0]}</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-sm text-white font-bold flex items-center gap-1">
                       @{currentItem.seller}
                       {currentItem.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/20" />}
                    </span>
                    <SellerRating sellerId={currentItem.sellerId} compact={true} />
                 </div>
              </div>
              <div className="space-y-6">
                 <div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Info className="w-3 h-3" /> Description</h4>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{currentItem.description || 'No description provided.'}</p>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    {currentItem.category && (
                       <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/50">
                          <p className="text-[10px] text-slate-400 uppercase font-black mb-1">Category</p>
                          <p className="text-sm text-emerald-400 font-bold capitalize">{currentItem.category}</p>
                       </div>
                    )}
                    {currentItem.condition && (
                       <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/50">
                          <p className="text-[10px] text-slate-400 uppercase font-black mb-1">Condition</p>
                          <p className="text-sm text-amber-400 font-bold capitalize">{currentItem.condition}</p>
                       </div>
                    )}
                 </div>
                 <BuyMeter productId={currentItem.id} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Modal UI */}
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        <ProfileDashboard 
           isOpen={isProfileDashboardOpen && !!user} 
           onClose={() => {
              setIsProfileDashboardOpen(false);
              setViewingSellerId(null);
           }} 
           onProductClick={handleProductJump}
           viewingSellerId={viewingSellerId || undefined}
           wishlist={wishlist}
           videos={videos}
           onToggleWishlist={(id) => toggleWishlist(id)}
        />
        <ProductUploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
        <SellerProfileModal 
           isOpen={isSellerProfileOpen} 
           onClose={() => setIsSellerProfileOpen(false)} 
           sellerId={currentItem?.sellerId || ''} 
           sellerName={currentItem?.seller || 'Seller'} 
           onViewProfile={() => {
              setIsSellerProfileOpen(false);
              setViewingSellerId(currentItem?.sellerId || null);
              setIsProfileDashboardOpen(true);
           }}
        />
        
        <CartPanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
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
