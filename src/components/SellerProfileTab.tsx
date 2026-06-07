import React, { useState, useEffect } from 'react';
import { User as AuthUser } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ShieldCheck, Edit3, Save, X, Truck, CreditCard, Building2, Store, Video, Link as LinkIcon, Users, Grid } from 'lucide-react';
import { motion } from 'motion/react';
import SellerRating from './SellerRating';
import { DOMAINS } from '../lib/domains';
import { useDomains } from '../contexts/DomainContext';
import { transformProductPricing } from '../lib/pricing';

interface SellerProfileTabProps {
  user?: AuthUser | null;
  sellerId?: string;
  onProductClick?: (product: any) => void;
}

export default function SellerProfileTab({ user, sellerId, onProductClick }: SellerProfileTabProps) {
  const { commissions } = useDomains();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  
  const [data, setData] = useState({
    storeName: '',
    businessType: '',
    phone: '',
    domain: '',
    segments: [] as string[],
    pickupAddress: '',
    returnAddress: '',
    bankName: '',
    accountNumber: '',
    deliveryOptions: '',
    paymentMethod: '',
    bio: '',
    website: '',
    faqPairs: [] as {id: string, question: string, answer: string}[]
  });

  const [isVerified, setIsVerified] = useState(false);

  // If no sellerId is provided, we default to the current user's profile. If there's no user, it's an error state but we handle it gracefully.
  const targetId = sellerId || (user ? user.uid : '');
  const isOwnProfile = user && targetId === user.uid;

  useEffect(() => {
    if (!targetId) {
      setLoading(false);
      return;
    }
    let active = true;
    async function fetchUserDataAndProducts() {
      try {
        const docRef = doc(db, 'sellers', targetId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && active) {
          const fetched = docSnap.data();
          setData({
            storeName: fetched.storeName || '',
            businessType: fetched.businessType || '',
            phone: fetched.phone || '',
            domain: fetched.domain || '',
            segments: fetched.segments || [],
            pickupAddress: fetched.pickupAddress || '',
            returnAddress: fetched.returnAddress || '',
            bankName: fetched.bankName || '',
            accountNumber: fetched.accountNumber || '',
            deliveryOptions: fetched.deliveryOptions || '',
            paymentMethod: fetched.paymentMethod || '',
            bio: fetched.bio || '',
            website: fetched.website || '',
            faqPairs: fetched.faqPairs || []
          });
          setIsVerified(fetched.isVerified || false);
        }

        const q = query(collection(db, 'products'), where('sellerId', '==', targetId));
        const productsSnap = await getDocs(q);
        if (active) {
          const fetchedProducts = productsSnap.docs.map(doc => transformProductPricing({ id: doc.id, ...doc.data() }, commissions));
          // Sort by creation date if available (simple sort fallback)
          fetchedProducts.sort((a: any, b: any) => {
             const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
             const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
             return timeB - timeA;
          });
          setProducts(fetchedProducts);
        }

      } catch (error) {
        console.error("Error fetching seller data", error);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchUserDataAndProducts();
    return () => { active = false; };
  }, [targetId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnProfile) return;
    setSaving(true);
    try {
      const docRef = doc(db, 'sellers', targetId);
      await setDoc(docRef, data, { merge: true });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile", error);
      alert("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar flex items-center justify-center min-h-[300px]">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 mb-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-bold text-lg">Edit Profile Details</h3>
          <button 
             type="button"
             onClick={() => setIsEditing(false)}
             className="text-slate-400 hover:text-white transition p-1"
          >
             <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Store Name</label>
          <input required type="text" name="storeName" value={data.storeName} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-white text-sm focus:border-emerald-500" />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Bio / Description</label>
          <textarea name="bio" value={data.bio} onChange={handleChange} rows={2} placeholder="A short bio about your store" className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-white text-sm focus:border-emerald-500 resize-none" />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Website Link</label>
          <input type="url" name="website" value={data.website} onChange={handleChange} placeholder="https://" className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-white text-sm focus:border-emerald-500" />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Business Type</label>
          <select required name="businessType" value={data.businessType} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-white text-sm focus:border-emerald-500 appearance-none">
            <option>Individual</option>
            <option>Company</option>
            <option>Wholesale</option>
            <option>Manufacturer</option>
          </select>
        </div>

        <div>
           <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Phone</label>
           <input required type="tel" name="phone" value={data.phone} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-white text-sm focus:border-emerald-500" />
        </div>

        <div className="h-px bg-slate-800 my-4" />

        <div>
           <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Bank Name</label>
           <input required type="text" name="bankName" value={data.bankName} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-white text-sm focus:border-emerald-500" />
        </div>
        <div>
           <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Account Number</label>
           <input required type="text" name="accountNumber" value={data.accountNumber} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-white text-sm focus:border-emerald-500" />
        </div>

        <div className="h-px bg-slate-800 my-4" />

        <div>
           <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Pickup Address</label>
           <textarea required name="pickupAddress" value={data.pickupAddress} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-white text-sm focus:border-emerald-500 resize-none" rows={2} />
        </div>
        <div>
           <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Return Address</label>
           <textarea required name="returnAddress" value={data.returnAddress} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-white text-sm focus:border-emerald-500 resize-none" rows={2} />
        </div>

        <div className="h-px bg-slate-800 my-4" />

        <h4 className="text-sm font-bold text-emerald-400 mb-2">Automated Wholesale FAQs</h4>
        <div className="space-y-3">
           {data.faqPairs.map((pair, index) => (
             <div key={pair.id} className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 relative">
               <button 
                 type="button"
                 onClick={() => {
                    const newPairs = [...data.faqPairs];
                    newPairs.splice(index, 1);
                    setData(d => ({ ...d, faqPairs: newPairs }));
                 }}
                 className="absolute top-2 right-2 text-rose-400 p-1 hover:bg-rose-500/20 rounded z-10"
               >
                 <X className="w-3 h-3" />
               </button>
               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Trigger Question</label>
               <input 
                 required 
                 type="text" 
                 value={pair.question} 
                 onChange={e => {
                    const newPairs = [...data.faqPairs];
                    newPairs[index].question = e.target.value;
                    setData(d => ({ ...d, faqPairs: newPairs }));
                 }}
                 placeholder="e.g., What is your MOQ?" 
                 className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1.5 px-3 mb-2 text-white text-xs focus:border-emerald-500" 
               />
               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Quick Reply Answer</label>
               <textarea 
                 required 
                 value={pair.answer} 
                 onChange={e => {
                    const newPairs = [...data.faqPairs];
                    newPairs[index].answer = e.target.value;
                    setData(d => ({ ...d, faqPairs: newPairs }));
                 }}
                 placeholder="e.g., Our MOQ is 50 units." 
                 className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1.5 px-3 text-white text-xs focus:border-emerald-500 resize-none" 
                 rows={2} 
               />
             </div>
           ))}
           <button 
             type="button" 
             onClick={() => setData(d => ({ ...d, faqPairs: [...d.faqPairs, { id: Date.now().toString(), question: '', answer: '' }] }))}
             className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl text-xs transition border border-slate-700 border-dashed"
           >
             + Add Q&A Pair
           </button>
        </div>

        <button 
           type="submit"
           disabled={saving}
           className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
        >
          {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Profile</>}
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Profile Header (Instagram style) */}
      <div className="flex items-center justify-around px-4 pt-2">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border border-slate-700 overflow-hidden bg-slate-800 flex items-center justify-center">
            {data.storeName ? (
               <span className="text-2xl font-black text-emerald-400">{data.storeName.charAt(0).toUpperCase()}</span>
            ) : (
               <Store className="w-8 h-8 text-emerald-400" />
            )}
          </div>
          {isVerified && (
            <div className="absolute -bottom-1 -right-1 bg-slate-950 rounded-full p-0.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
          )}
        </div>

        <div className="flex gap-6 text-center">
          <div className="flex flex-col items-center">
            <span className="text-lg font-black text-white">{products.length}</span>
            <span className="text-xs text-slate-400 font-medium">Posts</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-black text-white">12.4K</span>
            <span className="text-xs text-slate-400 font-medium">Followers</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-black text-white">24</span>
            <span className="text-xs text-slate-400 font-medium">Following</span>
          </div>
        </div>
      </div>

      {/* Bio and Info */}
      <div className="px-4">
        <h2 className="text-sm font-bold text-white mb-0.5">{data.storeName || 'My Store'}</h2>
        <div className="flex flex-col gap-1 mb-2">
          <p className="text-xs text-slate-400">{data.businessType || 'Seller'}</p>
          {(data.domain || (data.segments && data.segments.length > 0)) && (
            <div className="flex flex-wrap gap-1 mt-1">
              {data.domain && (
                <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-bold">
                  {DOMAINS.find(d => d.id === data.domain)?.name || data.domain}
                </span>
              )}
              {data.segments && data.segments.map(seg => {
                const domainData = DOMAINS.find(d => d.id === data.domain);
                const segmentLabel = domainData?.segments.find(s => s.id === seg)?.label || seg;
                return (
                  <span key={seg} className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold">
                    {segmentLabel}
                  </span>
                )
              })}
            </div>
          )}
        </div>
        {data.bio && <p className="text-sm text-slate-200 mb-2 whitespace-pre-wrap">{data.bio}</p>}
        {data.website && (
          <a href={data.website} target="_blank" rel="noreferrer" className="text-blue-400 text-sm font-medium flex items-center gap-1 mb-2">
            <LinkIcon className="w-3 h-3" /> {data.website.replace(/^https?:\/\//, '')}
          </a>
        )}
        
        <div className="flex gap-2 mt-4">
          {isOwnProfile && (
            <button 
               onClick={() => setIsEditing(true)}
               className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold py-2 rounded-lg transition"
            >
               Edit Profile
            </button>
          )}
          <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold py-2 rounded-lg transition">
             Share Profile
          </button>
        </div>
      </div>

      <div className="px-4 pb-2">
         <SellerRating sellerId={targetId} compact={true} />
      </div>

      {/* Internal Details Toggle */}
      {isOwnProfile && (
        <div className="px-4">
           <details className="group border border-slate-800 rounded-xl bg-slate-900/50 open:bg-slate-900 transition-colors">
              <summary className="flex items-center justify-between p-3 cursor-pointer select-none">
                 <span className="text-xs font-bold text-slate-300 uppercase flex items-center gap-2">
                   <Building2 className="w-4 h-4 text-emerald-400" /> Internal Store Details
                 </span>
                 <span className="text-slate-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="p-3 pt-0 border-t border-slate-800 mt-2 space-y-3">
                 <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                   <div>
                     <p className="text-xs text-slate-500 font-bold uppercase mb-0.5">Phone</p>
                     <p className="text-slate-300">{data.phone || '--'}</p>
                   </div>
                   <div>
                     <p className="text-xs text-slate-500 font-bold uppercase mb-0.5">Bank</p>
                     <p className="text-slate-300">{data.bankName ? `${data.bankName} (...${data.accountNumber.slice(-4)})` : '--'}</p>
                   </div>
                   <div className="col-span-2">
                     <p className="text-xs text-slate-500 font-bold uppercase mb-0.5">Pickup Address</p>
                     <p className="text-slate-300">{data.pickupAddress || '--'}</p>
                   </div>
                 </div>
              </div>
           </details>
        </div>
      )}

      {/* Grid Gallery View Tabs */}
      <div className="border-t border-slate-800 pt-1">
        <div className="flex">
           <div className="flex-1 border-b-[2px] border-white pb-3 flex items-center justify-center">
             <Grid className="w-5 h-5 text-white" />
           </div>
           <div className="flex-1 border-b-[2px] border-transparent pb-3 flex items-center justify-center">
             <Video className="w-5 h-5 text-slate-600" />
           </div>
        </div>
      </div>

      {/* Grid Array */}
      <div className="grid grid-cols-3 gap-0.5">
        {products.length === 0 ? (
           <div className="col-span-3 py-10 text-center text-slate-500 flex flex-col items-center">
              <Grid className="w-10 h-10 mb-2 opacity-20" />
              <p className="font-medium text-sm">No posts yet</p>
           </div>
        ) : (
           products.map(product => (
             <div key={product.id} onClick={() => onProductClick && onProductClick(product)} className="aspect-square bg-slate-800 relative group cursor-pointer overflow-hidden border border-slate-800/50">
                {(product.type === 'video' || product.videoUrl) ? (
                   <video src={product.url || product.videoUrl || (product.mediaUrls && product.mediaUrls[0])} className="w-full h-full object-cover" muted crossOrigin="anonymous" />
                ) : (
                   <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${product.url || (product.mediaUrls && product.mediaUrls[0])})` }} />
                )}
                {(product.type === 'video' || product.videoUrl) && (
                  <div className="absolute top-1 right-1 bg-black/40 rounded p-1">
                    <Video className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                   <span className="text-[10px] font-bold truncate">NPR {product.price}</span>
                </div>
             </div>
           ))
        )}
      </div>
    </div>
  );
}
