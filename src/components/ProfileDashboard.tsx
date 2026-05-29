import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Package, TrendingUp, Truck, LogOut, ShoppingBag, Settings, ChevronRight, DollarSign, Activity, BadgeCheck, Shield, User, Bell, Heart, Video } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import CasualProfileTab from './CasualProfileTab';
import OrderHistoryTab from './OrderHistoryTab';
import SellerProfileTab from './SellerProfileTab';
import AdminDashboardTab from './AdminDashboardTab';
import InventoryTab from './InventoryTab';
import NotificationsTab from './NotificationsTab';
import AnalyticsTab from './AnalyticsTab';
import SettingsTab from './SettingsTab';

interface ProfileDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onProductClick?: (product: any) => void;
  viewingSellerId?: string;
  wishlist?: string[];
  videos?: any[];
  onToggleWishlist?: (id: string) => void;
}

export default function ProfileDashboard({ isOpen, onClose, onProductClick, viewingSellerId, wishlist = [], videos = [], onToggleWishlist }: ProfileDashboardProps) {
  const { user, userRole, activeProfile, setActiveProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    async function checkVerification() {
      if (user && isOpen && userRole === 'seller' && !viewingSellerId) {
        try {
          const docRef = doc(db, 'sellers', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().isVerified) {
            setIsVerified(true);
          }
        } catch (error) {
          console.error("Error checking verification status:", error);
        }
      }
    }
    checkVerification();
  }, [user, isOpen, userRole, viewingSellerId]);

  const handleSwitchProfile = (role: 'casual' | 'seller') => {
    setActiveProfile(role);
    setActiveTab('profile');
    setNotification(`Switched to ${role === 'seller' ? 'Seller Dashboard' : 'Casual Profile'}`);
    setTimeout(() => setNotification(null), 3000);
  };

  const renderWishlistTab = () => (
    <div className="flex flex-col gap-4">
      {wishlist.length === 0 ? (
        <div className="text-center text-slate-500 mt-10">
          <Heart className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-bold">Your wishlist is empty</p>
          <p className="text-xs mt-2">Save items you like to view them later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5">
          {wishlist.map(id => {
            const item = videos.find(v => v.id === id);
            if (!item) return null;
            return (
              <div key={id} className="bg-slate-800 aspect-square overflow-hidden flex flex-col cursor-pointer hover:opacity-80 transition group relative" onClick={() => {
                if (onProductClick) onProductClick(item);
              }}>
                {item.type === 'video' ? (
                   <video src={item.url} className="w-full h-full object-cover absolute inset-0" muted crossOrigin="anonymous" />
                ) : (
                   <div className="w-full h-full bg-cover bg-center absolute inset-0" style={{ backgroundImage: `url(${item.url})` }} />
                )}
                <div className="w-full h-full shrink-0 relative">
                    {item.type === 'video' && (
                      <div className="absolute top-1 left-1 bg-black/40 rounded p-1 z-10 pointer-events-none">
                        <Video className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <button 
                       onClick={(e) => { e.stopPropagation(); if (onToggleWishlist) onToggleWishlist(id); }}
                       className="absolute top-1 right-1 bg-black/40 p-1 rounded backdrop-blur-md text-slate-300 hover:text-rose-500 hover:bg-white/10 transition-colors z-10"
                     >
                       <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                     </button>
                     <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-end z-10">
                       <p className="text-[9px] font-bold truncate">NPR {item.price}</p>
                     </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  if (!user && !viewingSellerId) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 pointer-events-auto flex items-end justify-center"
            onClick={onClose}
          />
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 40 }}
            className="absolute inset-0 w-full h-full bg-slate-950 z-50 flex flex-col pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {!viewingSellerId ? (
              <div className="flex flex-col p-4 pt-10 border-b border-slate-800 bg-slate-900/50 gap-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {user && (
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-full flex items-center justify-center font-black text-white text-xl shadow-lg border-2 border-white/10">
                          {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                        </div>
                        {isVerified && userRole === 'seller' && (
                          <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-0.5">
                            <BadgeCheck className="w-5 h-5 fill-blue-500 text-white" />
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-black text-white leading-tight flex items-center gap-2">
                         {activeProfile === 'seller' ? 'Seller Dashboard' : 'Casual User Info'}
                      </h2>
                      {user && <p className="text-xs text-slate-400">{user.email}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {userRole === 'seller' && (
                      <button 
                        onClick={() => handleSwitchProfile(activeProfile === 'seller' ? 'casual' : 'seller')}
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 rounded-full text-xs font-bold transition flex items-center gap-1"
                      >
                        Swap to {activeProfile === 'seller' ? 'Casual' : 'Seller'}
                      </button>
                    )}
                    <button onClick={onClose} className="bg-slate-800 p-2 rounded-full hover:bg-slate-700 text-slate-300 transition border border-slate-700 border-b-2">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Verification Banner */}
                {activeProfile === 'seller' && !isVerified ? (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500/20 p-2 rounded-lg">
                        <Shield className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Verify Your Seller Profile</h4>
                        <p className="text-[10px] text-blue-200/70">Get the blue checkmark and increase sales by 40%.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                         setIsVerifyModalOpen(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Verify Now
                    </button>
                  </div>
                ) : activeProfile === 'seller' && isVerified ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3">
                    <div className="bg-emerald-500/20 p-2 rounded-lg">
                      <BadgeCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Verified Seller Account</h4>
                      <p className="text-[10px] text-emerald-200/70">Your profile and listings now show the verification badge.</p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="absolute top-4 right-4 z-[60]">
                <button onClick={onClose} className="bg-slate-800/80 backdrop-blur-md p-2.5 rounded-full hover:bg-slate-700 text-slate-300 transition border border-slate-700 shadow-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {viewingSellerId ? (
              <div className="flex-1 overflow-y-auto hide-scrollbar pt-10 px-4">
                <SellerProfileTab user={user} sellerId={viewingSellerId} onProductClick={onProductClick} />
              </div>
            ) : activeProfile === 'admin' ? (
               <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex px-4 pt-4 border-b border-slate-800 bg-slate-900/30 overflow-x-auto hide-scrollbar shrink-0">
                     <button 
                       onClick={() => setActiveTab('profile')}
                       className={`px-4 pb-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'profile' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                       <User className="w-4 h-4" /> Profile
                     </button>
                     <button 
                       onClick={() => setActiveTab('inventory')}
                       className={`px-4 pb-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'inventory' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                       <Package className="w-4 h-4" /> My Products
                     </button>
                     <button 
                       onClick={() => setActiveTab('admin')}
                       className={`px-4 pb-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'admin' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                       <Shield className="w-4 h-4" /> Moderation
                     </button>
                     <button 
                       onClick={() => setActiveTab('settings')}
                       className={`px-4 pb-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'settings' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                       <Settings className="w-4 h-4" /> Settings
                     </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
                     {activeTab === 'profile' && <CasualProfileTab user={user!} onViewOrders={() => {}} />}
                     {activeTab === 'inventory' && <InventoryTab />}
                     {activeTab === 'admin' && <AdminDashboardTab />}
                     {activeTab === 'settings' && <SettingsTab />}
                  </div>
               </div>
            ) : activeProfile === 'seller' ? (
               <>
                  {/* Navigation Tabs */}
                  <div className="flex px-4 pt-4 border-b border-slate-800 bg-slate-900/30 overflow-x-auto hide-scrollbar shrink-0">
                     <button 
                       onClick={() => setActiveTab('profile')}
                       className={`px-4 pb-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'profile' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                       <User className="w-4 h-4" /> Profile
                     </button>
                     <button 
                       onClick={() => setActiveTab('inventory')}
                       className={`px-4 pb-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'inventory' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                       <Package className="w-4 h-4" /> Inventory
                     </button>
                     <button 
                       onClick={() => setActiveTab('notifications')}
                       className={`px-4 pb-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'notifications' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                       <Bell className="w-4 h-4" /> Notifications
                     </button>
                     <button 
                       onClick={() => setActiveTab('orders')}
                       className={`px-4 pb-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'orders' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                       <ShoppingBag className="w-4 h-4" /> Orders
                     </button>
                     <button 
                       onClick={() => setActiveTab('analytics')}
                       className={`px-4 pb-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'analytics' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                       <TrendingUp className="w-4 h-4" /> Analytics
                     </button>
                     <button 
                       onClick={() => setActiveTab('shipping')}
                       className={`px-4 pb-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'shipping' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                       <Truck className="w-4 h-4" /> Shipping
                     </button>
                     <button 
                       onClick={() => setActiveTab('saved')}
                       className={`px-4 pb-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'saved' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                       <Heart className="w-4 h-4" /> Saved
                     </button>
                     <button 
                       onClick={() => setActiveTab('settings')}
                       className={`px-4 pb-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'settings' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                       <Settings className="w-4 h-4" /> Settings
                     </button>
                  </div>

                  {/* Main Content Area */}
                  <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
                     {activeTab === 'shipping' && (
                       <div className="space-y-4">
                          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                             <div className="flex justify-between items-center mb-3">
                               <h4 className="text-sm font-bold text-white">Order #882-9A</h4>
                               <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Pending Shipment</span>
                             </div>
                             <p className="text-xs text-slate-400 mb-4">Buyer: alex.rivera@example.com <br/> Item: Smart Watch Series 5</p>
                             <button className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 rounded-lg border border-slate-700 transition">
                               Print Shipping Label
                             </button>
                          </div>

                          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl opacity-60">
                             <div className="flex justify-between items-center mb-3">
                               <h4 className="text-sm font-bold text-white">Order #881-2B (Auction)</h4>
                               <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">In Transit</span>
                             </div>
                             <p className="text-xs text-slate-400 mb-2">Buyer: vintage_vibes@example.com <br/> Item: Rare Air Jordan 1</p>
                             <p className="text-[10px] text-emerald-400 font-mono">Tracking: 1Z9999999999999999</p>
                          </div>
                       </div>
                     )}

                     {activeTab === 'profile' && <SellerProfileTab user={user!} onProductClick={onProductClick} />}
                     {activeTab === 'inventory' && <InventoryTab />}
                     {activeTab === 'notifications' && <NotificationsTab />}
                     {activeTab === 'orders' && <OrderHistoryTab />}
                     {activeTab === 'analytics' && <AnalyticsTab />}
                     {activeTab === 'saved' && renderWishlistTab()}
                     {activeTab === 'settings' && <SettingsTab />}
                  </div>
               </>
            ) : (
               <div className="flex-1 flex flex-col min-h-0">
                  {/* Navigation Tabs for Casual */}
                  <div className="flex px-4 pt-4 border-b border-slate-800 bg-slate-900/30 shrink-0">
                     <button 
                       onClick={() => setActiveTab('profile')}
                       className={`flex-1 pb-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'profile' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                       <User className="w-4 h-4" /> Profile
                     </button>
                     <button 
                       onClick={() => setActiveTab('orders')}
                       className={`flex-1 pb-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'orders' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                       <ShoppingBag className="w-4 h-4" /> Orders
                     </button>
                     <button 
                       onClick={() => setActiveTab('saved')}
                       className={`flex-1 pb-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'saved' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                       <Heart className="w-4 h-4" /> Saved
                     </button>
                     <button 
                       onClick={() => setActiveTab('settings')}
                       className={`flex-1 pb-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'settings' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                       <Settings className="w-4 h-4" /> Settings
                     </button>
                  </div>
                  
                  {activeTab === 'profile' && <CasualProfileTab user={user} onViewOrders={() => setActiveTab('orders')} />}
                  {activeTab === 'orders' && (
                    <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
                      <OrderHistoryTab />
                    </div>
                  )}
                  {activeTab === 'saved' && (
                    <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
                      {renderWishlistTab()}
                    </div>
                  )}
                  {activeTab === 'settings' && <SettingsTab />}
               </div>
            )}

            {/* Logout Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/30 pb-safe shrink-0">
               <button 
                 onClick={() => {
                   signOut();
                   onClose();
                 }}
                 className="w-full flex items-center justify-center gap-2 text-rose-500 font-bold bg-rose-500/10 hover:bg-rose-500/20 py-3 rounded-xl transition"
               >
                 <LogOut className="w-4 h-4" /> {userRole === 'seller' ? 'Sign Out from Account' : 'Sign Out'}
               </button>
            </div>
            
            <AnimatePresence>
              {notification && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 whitespace-nowrap"
                >
                  <BadgeCheck className="w-4 h-4 text-white" />
                  {notification}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </>
      )}
    </AnimatePresence>
  );
}
