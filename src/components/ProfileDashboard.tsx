import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Package, TrendingUp, Truck, LogOut, ShoppingBag, Settings, ChevronRight, DollarSign, Activity, BadgeCheck, Shield, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import CasualProfileTab from './CasualProfileTab';
import OrderHistoryTab from './OrderHistoryTab';
import SellerProfileTab from './SellerProfileTab';
import AdminDashboardTab from './AdminDashboardTab';
import InventoryTab from './InventoryTab';

interface ProfileDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileDashboard({ isOpen, onClose }: ProfileDashboardProps) {
  const { user, userRole, activeProfile, setActiveProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    async function checkVerification() {
      if (user && isOpen && userRole === 'seller') {
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
  }, [user, isOpen, userRole]);

  const handleSwitchProfile = (role: 'casual' | 'seller') => {
    setActiveProfile(role);
    setActiveTab('profile');
    setNotification(`Switched to ${role === 'seller' ? 'Seller Dashboard' : 'Casual Profile'}`);
    setTimeout(() => setNotification(null), 3000);
  };

  if (!user) return null;

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
            className={`absolute bottom-0 left-0 w-full ${activeProfile === 'seller' ? 'h-[90vh]' : 'h-auto max-h-[80vh] min-h-[60vh]'} bg-slate-950 border-t border-slate-800 rounded-t-[32px] shadow-[0_-20px_40px_rgba(0,0,0,0.8)] z-50 flex flex-col pointer-events-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex flex-col p-6 border-b border-slate-800 bg-slate-900/50 rounded-t-[32px] gap-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
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
                  <div>
                    <h2 className="text-lg font-black text-white leading-tight flex items-center gap-2">
                       {activeProfile === 'seller' ? 'Seller Dashboard' : 'Casual User Info'}
                    </h2>
                    <p className="text-xs text-slate-400">{user.email}</p>
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

            {activeProfile === 'admin' ? (
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
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
                     {activeTab === 'profile' && <CasualProfileTab user={user!} onViewOrders={() => {}} />}
                     {activeTab === 'inventory' && <InventoryTab />}
                     {activeTab === 'admin' && <AdminDashboardTab />}
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
                  </div>

                  {/* Main Content Area */}
                  <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
                     {activeTab === 'analytics' && (
                       <div className="space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                           <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                             <DollarSign className="w-6 h-6 text-emerald-400 mb-2" />
                             <span className="text-2xl font-black text-white">NPR 4,280</span>
                             <span className="text-xs text-slate-500 font-bold uppercase mt-1">Total Sales</span>
                           </div>
                           <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                             <Activity className="w-6 h-6 text-rose-400 mb-2" />
                             <span className="text-2xl font-black text-white">18.4K</span>
                             <span className="text-xs text-slate-500 font-bold uppercase mt-1">Video Views</span>
                           </div>
                         </div>
                         
                         <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                           <h3 className="text-sm font-bold text-white mb-4">Earnings by Segment</h3>
                           <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-emerald-400 font-bold">Products (Fixed)</span>
                                <span className="text-sm text-white font-bold">NPR 2,100</span>
                              </div>
                              <div className="w-full bg-slate-800 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full w-[49%]"></div></div>
                              
                              <div className="flex items-center justify-between pt-2">
                                <span className="text-xs text-rose-500 font-bold">Auction</span>
                                <span className="text-sm text-white font-bold">NPR 1,540</span>
                              </div>
                              <div className="w-full bg-slate-800 rounded-full h-1.5"><div className="bg-rose-500 h-1.5 rounded-full w-[36%]"></div></div>

                              <div className="flex items-center justify-between pt-2">
                                <span className="text-xs text-amber-500 font-bold">Second Hand</span>
                                <span className="text-sm text-white font-bold">NPR 640</span>
                              </div>
                              <div className="w-full bg-slate-800 rounded-full h-1.5"><div className="bg-amber-500 h-1.5 rounded-full w-[15%]"></div></div>
                           </div>
                         </div>
                       </div>
                     )}

                     {activeTab === 'inventory' && (
                       <div className="space-y-6">
                         <div>
                           <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider mb-3">Products (Fixed-Price)</h3>
                           <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex gap-3 items-center">
                              <div className="w-12 h-12 bg-slate-800 rounded-lg bg-cover bg-center shrink-0 border border-white/10" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80)` }} />
                              <div className="flex-1">
                                <h4 className="text-sm font-bold text-white line-clamp-1">Smart Watch Series 5</h4>
                                <p className="text-[10px] text-slate-500 font-bold mt-0.5">Stock: 24 • Price: NPR 249</p>
                              </div>
                              <button className="bg-slate-800 p-2 rounded-lg text-slate-300 hover:text-white"><ChevronRight className="w-4 h-4" /></button>
                           </div>
                         </div>

                         <div>
                           <h3 className="text-xs font-black text-rose-500 uppercase tracking-wider mb-3 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span> Auction (Live Setup)</h3>
                           <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex gap-3 items-center opacity-70">
                              <div className="w-12 h-12 bg-slate-800 rounded-lg bg-cover bg-center shrink-0 border border-white/10" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80)` }} />
                              <div className="flex-1">
                                <h4 className="text-sm font-bold text-white line-clamp-1">Rare Air Jordan 1</h4>
                                <p className="text-[10px] text-slate-500 font-bold mt-0.5">Scheduled: Tonight 8 PM • Starting: NPR 150</p>
                              </div>
                              <button className="bg-rose-500/20 text-rose-400 text-[10px] font-bold px-2 py-1 rounded">Go Live</button>
                           </div>
                         </div>

                         <div>
                           <h3 className="text-xs font-black text-amber-500 uppercase tracking-wider mb-3">Second Hand / Refurbished</h3>
                           <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex gap-3 items-center">
                              <div className="w-12 h-12 bg-slate-800 rounded-lg bg-cover bg-center shrink-0 border border-white/10" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&q=80)` }} />
                              <div className="flex-1">
                                <h4 className="text-sm font-bold text-white line-clamp-1">Light Jacket (Used)</h4>
                                <p className="text-[10px] text-amber-500 font-bold mt-0.5">AI Verified • Condition: Good</p>
                              </div>
                              <button className="bg-slate-800 p-2 rounded-lg text-slate-300 hover:text-white"><ChevronRight className="w-4 h-4" /></button>
                           </div>
                         </div>
                         
                         <button className="w-full py-4 border-2 border-dashed border-slate-700 text-slate-400 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 hover:text-white transition">
                            + Add New Listing
                         </button>
                       </div>
                     )}

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

                     {activeTab === 'profile' && <SellerProfileTab user={user!} />}
                     {activeTab === 'inventory' && <InventoryTab />}
                     {activeTab === 'orders' && <OrderHistoryTab />}
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
                  </div>
                  
                  {activeTab === 'profile' && <CasualProfileTab user={user} onViewOrders={() => setActiveTab('orders')} />}
                  {activeTab === 'orders' && (
                    <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
                      <OrderHistoryTab />
                    </div>
                  )}
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
