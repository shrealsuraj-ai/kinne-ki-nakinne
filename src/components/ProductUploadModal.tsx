import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UploadCloud, Video, AlertCircle, ChevronRight, ChevronLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';

interface ProductUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductUploadModal({ isOpen, onClose }: ProductUploadModalProps) {
  const { user, activeProfile } = useAuth();
  
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Form State
  const [segment, setSegment] = useState<'feed' | 'arena' | 'remarket'>('feed');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  
  // Basic Info
  const [title, setTitle] = useState('');
  const [shortHeadline, setShortHeadline] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');

  // Description & Specs
  const [description, setDescription] = useState('');
  const [keyFeatures, setKeyFeatures] = useState('');
  const [specifications, setSpecifications] = useState<Record<string, string>>({});
  
  // Sales & Shipping
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [stock, setStock] = useState('1');
  const [processingTime, setProcessingTime] = useState('');
  const [deliveryCoverage, setDeliveryCoverage] = useState('');
  const [returnPolicy, setReturnPolicy] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const listingQualityScore = useMemo(() => {
    let score = 0;
    if (title.length > 5) score += 10;
    if (shortHeadline.length > 5) score += 10;
    if (brand) score += 5;
    if (category) score += 10;
    if (tags.length > 5) score += 5;
    if (description.length > 20) score += 15;
    if (keyFeatures.length > 10) score += 10;
    if (Object.keys(specifications).length > 0) score += 10;
    if (price && parseFloat(price) > 0) score += 10;
    if (stock && parseInt(stock) > 0) score += 5;
    if (returnPolicy) score += 10;
    return Math.min(100, score);
  }, [title, shortHeadline, brand, category, tags, description, keyFeatures, specifications, price, stock, returnPolicy]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        if (file.size > 50 * 1024 * 1024) {
          setError('Video file is too large (Limit: 50MB)');
          return;
        }
        setVideoFile(file);
        setError(null);
      } else {
        setError('Please upload a valid video file.');
      }
    }
  };

  const handleSpecChange = (key: string, value: string) => {
    setSpecifications(prev => ({ ...prev, [key]: value }));
  };

  const handleAIAssist = () => {
    if (!title && !category) {
      setError('Please enter a title and category first for AI assist.');
      return;
    }
    setError(null);
    setShortHeadline(`Premium ${title || 'Product'} - Unmatched Quality`);
    setDescription(`Discover the exceptional ${title || 'item'}, crafted for those who value quality and performance. Our product integrates modern design with durable materials, ensuring it stands the test of time.`);
    setKeyFeatures(`- High durability\n- Premium materials\n- Sleek modern design\n- 100% Authentic warranty`);
    setTags(`${category.toLowerCase() || 'general'}, premium, trending`);
  };

  const nextStep = () => {
    if (step === 1 && !videoFile) {
        setError("Please upload a video to continue.");
        return;
    }
    setError(null);
    setStep(prev => Math.min(prev + 1, totalSteps));
  };
  
  const prevStep = () => {
    setError(null);
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== totalSteps) {
        nextStep();
        return;
    }

    if (!user || (activeProfile !== 'seller' && activeProfile !== 'admin')) {
      setError('Only sellers or admins can upload products. Please switch to your seller profile.');
      return;
    }
    
    if (!videoFile || !title || !price) {
      setError('Please fill all required fields and select a video.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create product doc stub
      const productRef = await addDoc(collection(db, 'products'), {
        sellerId: user.uid,
        seller: user.email?.split('@')[0] || 'Seller',
        title,
        shortHeadline,
        brand,
        category,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        description,
        longDescription: description,
        keyFeatures: keyFeatures.split('\n').filter(Boolean),
        specifications,
        seoTags: tags.split(',').map(t => t.trim()).filter(Boolean),
        benefits: [], // Can be populated later or from keyFeatures
        shippingInfo: {
          processingTime,
          deliveryCoverage
        },
        returnPolicy,
        searchMetadata: {
          keywords: tags.split(',').map(t => t.trim()).filter(Boolean),
          brand,
          category
        },
        price: parseFloat(price),
        discount: parseFloat(discount) || 0,
        stock: parseInt(stock) || 1,
        listingQualityScore,
        segment,
        uploadStatus: 'uploading',
        createdAt: serverTimestamp(),
        likes: 0,
        comments: 0,
        type: 'video',
        isVerified: true,
        moderationStatus: 'approved' // Automatically auto-approve for now
      });

      // 2. Upload video (Simulated for Demo)
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 10;
        setProgress(Math.min(currentProgress, 100));
      }, 200);

      setTimeout(async () => {
        clearInterval(interval);
        setProgress(100);
        // Fallback demo video since storage is not enabled
        const downloadURL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4';
        
        try {
          await updateDoc(doc(db, 'products', productRef.id), {
            url: downloadURL,
            uploadStatus: 'completed'
          });

          setLoading(false);
          // Reset form
          setStep(1);
          setTitle(''); setShortHeadline(''); setBrand(''); setCategory(''); setTags('');
          setDescription(''); setKeyFeatures(''); setSpecifications({});
          setPrice(''); setDiscount(''); setStock('1'); setProcessingTime(''); setDeliveryCoverage(''); setReturnPolicy('');
          setSegment('feed'); setVideoFile(null); setProgress(0);
          onClose();
        } catch (err) {
          console.error(err);
          setError('Failed to update product URL.');
          setLoading(false);
        }
      }, 2000);

    } catch (err) {
      console.error(err);
      setError('An error occurred during submission.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (activeProfile !== 'seller' && activeProfile !== 'admin') {
    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center max-w-sm w-full relative">
            <button onClick={onClose} className="absolute right-4 top-4 p-2 bg-slate-800 rounded-full text-slate-400">
              <X className="w-4 h-4" />
            </button>
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Seller Profile Required</h3>
            <p className="text-slate-400 text-sm mb-6">You need to be viewing your seller profile to upload and sell products using videos. Switch profiles in the Dashboard to proceed.</p>
            <button onClick={onClose} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition">
              Close
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">1. Product Video *</label>
              <input type="file" accept="video/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
              {!videoFile ? (
                 <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-700 bg-slate-800/30 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 hover:bg-slate-800/50 transition relative group">
                   <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition">
                     <UploadCloud className="w-6 h-6 text-emerald-400" />
                   </div>
                   <p className="text-sm font-bold text-white mb-1">Tap to select video</p>
                   <p className="text-xs text-slate-500">MP4, WebM up to 50MB</p>
                 </div>
              ) : (
                 <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 bg-black aspect-[9/16] w-full max-w-[200px] mx-auto shadow-2xl shadow-emerald-500/10">
                   <video src={URL.createObjectURL(videoFile)} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                   <button type="button" onClick={() => setVideoFile(null)} className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full backdrop-blur text-white hover:bg-rose-500 transition">
                     <X className="w-4 h-4" />
                   </button>
                   <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1">
                     <Video className="w-3 h-3 text-emerald-400" /> Selected
                   </div>
                 </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">2. Listing Type *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'feed', label: 'Products', info: 'Standard Sales', color: 'emerald' },
                  { id: 'arena', label: 'Auction', info: 'Live Bidding', color: 'rose' },
                  { id: 'remarket', label: 'Second Hand', info: 'Used/Refurbished', color: 'amber' }
                ].map(type => (
                  <div key={type.id} onClick={() => setSegment(type.id as any)} className={`p-3 rounded-xl border cursor-pointer transition flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-2 ${segment === type.id ? `bg-${type.color}-500/20 border-${type.color}-500` : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
                    <span className={`text-sm font-bold ${segment === type.id ? `text-${type.color}-400` : 'text-slate-300'}`}>{type.label}</span>
                    <span className="text-[10px] text-slate-400">{type.info}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h4 className="font-bold text-white mb-2">Basic Info</h4>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Title *</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Vintage Leather Jacket" className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Short Headline</label>
              <input type="text" value={shortHeadline} onChange={e => setShortHeadline(e.target.value)} placeholder="Catchy one-liner..." className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Category *</label>
                <select value={category} onChange={e => setCategory(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 appearance-none">
                  <option value="">Select...</option>
                  <option value="Fashion">Fashion & Apparel</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Home">Home & Living</option>
                  <option value="Beauty">Beauty & Health</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Brand</label>
                <input type="text" value={brand} onChange={e => setBrand(e.target.value)} placeholder="Brand Name" className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Search Tags (comma separated)</label>
              <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="vintage, jacket, leather" className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500" />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
               <h4 className="font-bold text-white">Details & Specs</h4>
               <button type="button" onClick={handleAIAssist} className="flex items-center gap-1 text-[10px] font-bold bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-lg border border-indigo-500/50 hover:bg-indigo-500/40 transition">
                  <Sparkles className="w-3 h-3" /> AI Assist
               </button>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Long Description *</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Detailed product description..." className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 resize-none" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Key Features / Benefits (1 per line)</label>
              <textarea value={keyFeatures} onChange={e => setKeyFeatures(e.target.value)} rows={3} placeholder="- Water resistant&#10;- Genuine Leather&#10;- 2 Year Warranty" className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 resize-none" />
            </div>
            
            {category && (
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 mt-4">
                <h5 className="text-xs font-bold text-slate-300 mb-3">{category} Specifications</h5>
                <div className="grid grid-cols-2 gap-3">
                  {category === 'Fashion' && (
                    <>
                      <input type="text" placeholder="Material" value={specifications['material'] || ''} onChange={(e) => handleSpecChange('material', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white text-xs" />
                      <input type="text" placeholder="Size/Fit" value={specifications['size'] || ''} onChange={(e) => handleSpecChange('size', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white text-xs" />
                      <input type="text" placeholder="Care Instructions" value={specifications['care'] || ''} onChange={(e) => handleSpecChange('care', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white text-xs col-span-2" />
                    </>
                  )}
                  {category === 'Electronics' && (
                    <>
                      <input type="text" placeholder="Model" value={specifications['model'] || ''} onChange={(e) => handleSpecChange('model', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white text-xs" />
                      <input type="text" placeholder="Warranty" value={specifications['warranty'] || ''} onChange={(e) => handleSpecChange('warranty', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white text-xs" />
                      <input type="text" placeholder="Compatibility" value={specifications['compatibility'] || ''} onChange={(e) => handleSpecChange('compatibility', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white text-xs col-span-2" />
                    </>
                  )}
                  {(!['Fashion', 'Electronics'].includes(category)) && (
                    <>
                      <input type="text" placeholder="Feature 1" value={specifications['feature1'] || ''} onChange={(e) => handleSpecChange('feature1', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white text-xs" />
                      <input type="text" placeholder="Feature 2" value={specifications['feature2'] || ''} onChange={(e) => handleSpecChange('feature2', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white text-xs" />
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h4 className="font-bold text-white mb-2">Sales & Operations</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Price (NPR) *</label>
                <input type="number" required min="0" step="1" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Discount (Optional)</label>
                <input type="number" min="0" step="1" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Stock Quantity *</label>
                <input type="number" required min="1" step="1" value={stock} onChange={e => setStock(e.target.value)} placeholder="1" className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Processing Time</label>
                 <select value={processingTime} onChange={e => setProcessingTime(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 appearance-none">
                  <option value="">Select...</option>
                  <option value="1-2 Days">1-2 Days</option>
                  <option value="3-5 Days">3-5 Days</option>
                  <option value="Made to Order">Made to Order</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Delivery Coverage</label>
              <input type="text" value={deliveryCoverage} onChange={e => setDeliveryCoverage(e.target.value)} placeholder="e.g. Nationwide, Kathmandu Valley only" className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Return Policy</label>
              <select value={returnPolicy} onChange={e => setReturnPolicy(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white text-sm focus:border-emerald-500 appearance-none">
                  <option value="">Select...</option>
                  <option value="7 Days Return">7 Days Return</option>
                  <option value="14 Days Return">14 Days Return</option>
                  <option value="No Returns">No Returns</option>
                </select>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h4 className="font-bold text-white mb-2">Review & Quality Score</h4>
            
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Sparkles className="w-24 h-24 text-emerald-500" />
               </div>
               <div className="relative z-10 flex flex-col items-center">
                 <div className="text-slate-400 text-xs font-bold uppercase mb-2">Listing Quality</div>
                 <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-teal-600 drop-shadow-md mb-2">
                   {listingQualityScore}%
                 </div>
                 
                 <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden mt-2 border border-slate-700">
                    <div 
                      className={`h-full transition-all duration-1000 ${listingQualityScore > 80 ? 'bg-emerald-500' : listingQualityScore > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                      style={{ width: `${listingQualityScore}%` }} 
                    />
                 </div>
                 
                 <div className="mt-4 w-full flex flex-col gap-2">
                   {listingQualityScore < 100 && (
                     <div className="bg-amber-500/10 text-amber-500 text-[10px] font-bold p-2 rounded border border-amber-500/20">
                       💡 Tip: Add more detailed features, brand, and search tags to improve discoverability.
                     </div>
                   )}
                   {listingQualityScore >= 80 && (
                     <div className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold p-2 rounded border border-emerald-500/20 flex gap-1 items-center">
                       <CheckCircle2 className="w-3 h-3" /> Excellent listing! Ready to go live.
                     </div>
                   )}
                 </div>
               </div>
            </div>

            <div className="bg-black/30 rounded-xl p-4 border border-white/5 space-y-2 mt-4 text-xs shadow-inner max-h-[150px] overflow-y-auto">
               <div className="flex justify-between"><span className="text-slate-500">Title</span> <span className="text-white font-bold">{title || '-'}</span></div>
               <div className="flex justify-between"><span className="text-slate-500">Segment</span> <span className="text-white font-bold capitalize">{segment}</span></div>
               <div className="flex justify-between"><span className="text-slate-500">Price</span> <span className="text-white font-bold">NPR {price || '0'}</span></div>
               <div className="flex justify-between"><span className="text-slate-500">Category</span> <span className="text-white font-bold">{category || '-'}</span></div>
               <div className="flex justify-between"><span className="text-slate-500">Stock</span> <span className="text-white font-bold">{stock} Unit(s)</span></div>
            </div>
            
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex flex-col pointer-events-none">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={!loading ? onClose : undefined}
          className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto"
        />
        <motion.div 
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 350, damping: 40 }}
          className="absolute bottom-0 left-0 w-full h-[90vh] flex flex-col bg-slate-900 border-t border-slate-700 rounded-t-[32px] shadow-[0_-20px_40px_rgba(0,0,0,0.8)] pointer-events-auto"
        >
          <div className="flex justify-between items-center px-6 pt-5 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-white font-bold text-lg">Product Listing Manager</h3>
              <p className="text-xs text-slate-500 font-medium">Step {step} of {totalSteps}</p>
            </div>
            <button type="button" onClick={!loading ? onClose : undefined} className="bg-slate-800 p-2 rounded-full hover:bg-slate-700 text-white disabled:opacity-50" disabled={loading}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress */}
          <div className="w-full bg-slate-800 h-1">
             <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }} />
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 rounded-xl text-sm flex gap-2 items-center mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
            
            <form id="upload-form" onSubmit={handleSubmit} className="h-full relative">
               <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderStepContent()}
                  </motion.div>
               </AnimatePresence>
            </form>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-800 bg-slate-900 flex gap-3 pb-safe">
             {loading ? (
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-xs text-slate-400 font-bold px-1">
                    <span>Uploading & Optimizing...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
             ) : (
                <>
                  {step > 1 && (
                    <button type="button" onClick={prevStep} className="px-4 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition flex items-center justify-center">
                       <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  {step < totalSteps ? (
                    <button type="button" onClick={nextStep} className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition cursor-pointer">
                      Continue <ChevronRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button form="upload-form" type="submit" disabled={listingQualityScore < 50} className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition">
                      Publish Listing
                    </button>
                  )}
                </>
             )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
