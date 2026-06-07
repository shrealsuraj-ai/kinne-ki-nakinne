import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ShieldAlert, CheckCircle2, XCircle, Play, Pause, Trash2, ShieldCheck, Tag, Plus, Save, DollarSign, TrendingUp, Download, Clock, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';
import { useDomains } from '../contexts/DomainContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Treemap } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, name, depth } = props;
  if (depth === 1) {
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} style={{ fill: '#4f46e5', stroke: '#1e293b', strokeWidth: 2, opacity: 0.8 }} />
        {width > 50 && height > 30 && (
          <text x={x + width / 2} y={y + height / 2} textAnchor="middle" fill="#fff" fontSize={12} fontWeight="bold">
            {name.toUpperCase()}
          </text>
        )}
      </g>
    );
  }
  return null;
};

export default function AdminDashboardTab() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [casualUsers, setCasualUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'videos' | 'users' | 'categories' | 'revenue' | 'audits'>('videos');
  const { domains, commissions } = useDomains();
  const [currentCommissions, setCurrentCommissions] = useState<Record<string, number>>({});
  const [currentDomains, setCurrentDomains] = useState<any[]>([]);
  const [savingCommissions, setSavingCommissions] = useState(false);

  const [addingSegmentTo, setAddingSegmentTo] = useState<string | null>(null);
  const [newSegmentLabel, setNewSegmentLabel] = useState('');
  const [newSegmentId, setNewSegmentId] = useState('');

  const [addingCategoryTo, setAddingCategoryTo] = useState<{domainId: string, segmentId: string} | null>(null);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [newSubcategories, setNewSubcategories] = useState('');

  useEffect(() => {
    setCurrentCommissions(commissions);
  }, [commissions]);

  useEffect(() => {
    setCurrentDomains(domains);
  }, [domains]);

  const handleSaveCategories = async () => {
    if (!window.confirm("Are you sure you want to update category structures and commission rates? This will affect all new listings under these categories.")) {
      return;
    }
    setSavingCommissions(true);
    try {
      const prevCommissions = commissions;
      await updateDoc(doc(db, 'platform_configs', 'domain_settings'), {
        commissions: currentCommissions,
        domains: currentDomains
      });
      
      await addDoc(collection(db, 'commission_audits'), {
        changedBy: user?.email || user?.uid || 'Admin',
        timestamp: serverTimestamp(),
        previousRates: prevCommissions,
        newRates: currentCommissions
      });

      alert('Categories and Commissions updated successfully!');
    } catch (err) {
      console.error('Failed to update categories:', err);
      alert('Failed to update categories.');
    }
    setSavingCommissions(false);
  };

  const addSegment = (domainId: string) => {
    if (!newSegmentLabel || !newSegmentId) return;
    
    setCurrentDomains(prev => prev.map(d => {
      if (d.id === domainId) {
        return {
          ...d,
          segments: [...d.segments, { id: newSegmentId, label: newSegmentLabel, color: 'blue', defaultTransactionType: 'buy', allowedTransactionTypes: ['buy'], categories: [] }]
        };
      }
      return d;
    }));
    
    setAddingSegmentTo(null);
    setNewSegmentLabel('');
    setNewSegmentId('');
  };

  const removeSegment = (domainId: string, segmentId: string) => {
    setCurrentDomains(prev => prev.map(d => {
      if (d.id === domainId) {
        return {
           ...d,
           segments: d.segments.filter((s: any) => s.id !== segmentId)
        };
      }
      return d;
    }));
  };

  const addCategory = (domainId: string, segmentId: string) => {
    if (!newCategoryLabel) return;
    const catId = newCategoryLabel.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const subs = newSubcategories.split(',').map(s => s.trim()).filter(Boolean);

    setCurrentDomains(prev => prev.map(d => {
      if (d.id === domainId) {
         return {
            ...d,
            segments: d.segments.map((s: any) => {
               if (s.id === segmentId) {
                  return {
                     ...s,
                     categories: [...(s.categories || []), { id: catId, label: newCategoryLabel, subcategories: subs }]
                  };
               }
               return s;
            })
         };
      }
      return d;
    }));
    
    setAddingCategoryTo(null);
    setNewCategoryLabel('');
    setNewSubcategories('');
  };

  const removeCategory = (domainId: string, segmentId: string, categoryId: string) => {
    setCurrentDomains(prev => prev.map(d => {
      if (d.id === domainId) {
         return {
            ...d,
            segments: d.segments.map((s: any) => {
               if (s.id === segmentId) {
                  return {
                     ...s,
                     categories: (s.categories || []).filter((c: any) => c.id !== categoryId)
                  };
               }
               return s;
            })
         };
      }
      return d;
    }));
  };

  const revenueStats = React.useMemo(() => {
    let totalRevenue = 0;
    const segmentRevenue: Record<string, number> = {};
    const itemRevenue: Record<string, { title: string, segment: string, rev: number, count: number }> = {};
    const timeseriesMap: Record<string, number> = {};

    orders.forEach(order => {
      let orderDate = 'Unknown Date';
      if (order.timestamp) {
        let d: Date;
        if (order.timestamp.toDate) {
          d = order.timestamp.toDate();
        } else {
          d = new Date(order.timestamp);
        }
        orderDate = `${d.getMonth() + 1}/${d.getDate().toString().padStart(2, '0')}`;
      }

      // Assuming all orders count for now
      if (order.items && Array.isArray(order.items)) {
         order.items.forEach((item: any) => {
            const qty = item.selectedSize ? item.quantity : (item.quantity || 1); // handles wholesale or basic
            const price = item.price || 0;
            const basePrice = item.basePrice;
            
            let currentCommissionRate = commissions[item.segment || ''] || 0;
            if (item.category) {
               const catId = item.category.toLowerCase().replace(/[^a-z0-9]/g, '-');
               if (commissions[`cat_${catId}`] !== undefined) {
                  currentCommissionRate = commissions[`cat_${catId}`];
               }
               if (item.subcategory && commissions[`subcat_${catId}_${item.subcategory}`] !== undefined) {
                  currentCommissionRate = commissions[`subcat_${catId}_${item.subcategory}`];
               }
            }
            const commissionRate = item.commissionRate !== undefined ? item.commissionRate : currentCommissionRate;
            
            let rev = 0;
            if (basePrice !== undefined) {
               rev = (price - basePrice) * qty;
            } else {
               // Fallback if basePrice wasn't saved, try to deduce from current rate
               rev = (price - (price / (1 + (commissionRate / 100)))) * qty; 
            }
            
            totalRevenue += rev;
            timeseriesMap[orderDate] = (timeseriesMap[orderDate] || 0) + rev;
            
            const seg = item.segment || 'Unknown';
            segmentRevenue[seg] = (segmentRevenue[seg] || 0) + rev;

            if (!itemRevenue[item.id]) {
               itemRevenue[item.id] = { title: item.title, segment: seg, rev: 0, count: 0 };
            }
            itemRevenue[item.id].rev += rev;
            itemRevenue[item.id].count += qty;
         });
      }
    });
    
    let timeseries = Object.entries(timeseriesMap).map(([date, revenue]) => ({ date, revenue }));
    if (timeseries.length === 0) {
       // Mock for empty state preview
       timeseries = [
         { date: '10/01', revenue: 0 },
         { date: '10/02', revenue: 0 },
         { date: '10/03', revenue: 0 }
       ];
    } else {
      // sort chronologically loosely
       timeseries.sort((a,b) => a.date.localeCompare(b.date));
    }

    return { totalRevenue, segmentRevenue, itemRevenue: Object.values(itemRevenue).sort((a,b) => b.rev - a.rev), timeseries };
  }, [orders, commissions]);

  useEffect(() => {
    // Listen to all products
    const pQ = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubProducts = onSnapshot(pQ, (snapshot) => {
      const fetchedProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(fetchedProducts);
      setLoading(false);
    }, (error) => console.error("Error fetching products in AdminDashboardTab: ", error));

    const sQ = query(collection(db, 'sellers'));
    const unsubSellers = onSnapshot(sQ, (snapshot) => {
      setSellers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Error fetching sellers in AdminDashboardTab: ", error));

    const cQ = query(collection(db, 'casual_users'));
    const unsubCasual = onSnapshot(cQ, (snapshot) => {
      setCasualUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Error fetching casual_users in AdminDashboardTab: ", error));

    const oQ = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
    const unsubOrders = onSnapshot(oQ, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Error fetching orders in AdminDashboardTab: ", error));

    const aQ = query(collection(db, 'commission_audits'), orderBy('timestamp', 'desc'));
    const unsubAudits = onSnapshot(aQ, (snapshot) => {
      setAuditLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Error fetching audits in AdminDashboardTab: ", error));

    return () => {
      unsubProducts();
      unsubSellers();
      unsubCasual();
      unsubOrders();
      unsubAudits();
    };
  }, []);

  const handleApprove = async (productId: string) => {
    try {
      await updateDoc(doc(db, 'products', productId), {
        moderationStatus: 'approved'
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleFlag = async (productId: string) => {
    try {
      await updateDoc(doc(db, 'products', productId), {
        moderationStatus: 'flagged'
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
      // Cloud function should ideally delete the storage file
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifySeller = async (sellerId: string, isVerified: boolean) => {
    try {
      await updateDoc(doc(db, 'sellers', sellerId), {
        isVerified
      });
    } catch (err) {
      console.error(err);
    }
  };

  const downloadRevenueReport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Commission Revenue Report', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    doc.setFontSize(14);
    doc.setTextColor(0);
    // @ts-ignore
    doc.text('Overview', 14, 45);
    doc.setFontSize(12);
    doc.text(`Total Commission Revenue: NPR ${revenueStats.totalRevenue.toFixed(2)}`, 14, 53);

    doc.setFontSize(14);
    doc.text('Revenue by Category Segment', 14, 70);
    
    const segmentData = Object.entries(revenueStats.segmentRevenue).sort((a: [string, any], b: [string, any]) => (b[1] as number) - (a[1] as number)).map(([seg, rev]: [string, any]) => [
      seg.toUpperCase(),
      `NPR ${(rev as number).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 75,
      head: [['Category', 'Revenue Generated']],
      body: segmentData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] }
    });
    
    // @ts-ignore
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text('Top Performing Products', 14, finalY);

    const productData = revenueStats.itemRevenue.slice(0, 20).map(item => [
      item.title,
      item.segment,
      item.count.toString(),
      `NPR ${item.rev.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Product/Service', 'Segment', 'Sales Count', 'Commission']],
      body: productData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] }
    });

    doc.save(`Revenue_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const INDUSTRY_BENCHMARKS: Record<string, number> = {
    wholesale: 5, retail: 15, services: 10, rental: 12, digital: 20, tickets: 8
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center justify-between mb-4 bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-rose-500" />
          <div>
            <h3 className="text-white font-bold">Admin Portal</h3>
            <p className="text-slate-400 text-xs">Manage rules, products, and users.</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button 
          onClick={() => setActiveTab('videos')}
          className={`flex-1 py-2 text-sm font-bold transition-all rounded-lg ${activeTab === 'videos' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Videos ({products.filter(p => p.type === 'video').length})
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 text-sm font-bold transition-all rounded-lg ${activeTab === 'users' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Users ({sellers.length + casualUsers.length})
        </button>
        <button 
          onClick={() => setActiveTab('categories')}
          className={`flex-1 py-2 text-sm font-bold transition-all rounded-lg flex items-center justify-center gap-1 ${activeTab === 'categories' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Tag className="w-4 h-4" /> Categories
        </button>
        <button 
          onClick={() => setActiveTab('revenue')}
          className={`flex-1 py-2 text-sm font-bold transition-all rounded-lg flex items-center justify-center gap-1 ${activeTab === 'revenue' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <DollarSign className="w-4 h-4" /> Revenue
        </button>
        <button 
          onClick={() => setActiveTab('audits')}
          className={`flex-1 py-2 text-sm font-bold transition-all rounded-lg flex items-center justify-center gap-1 ${activeTab === 'audits' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Clock className="w-4 h-4" /> Audits
        </button>
      </div>

      <div className="space-y-4 pt-2">
        {activeTab === 'videos' && (
          products.filter(p => p.type === 'video').length === 0 ? (
            <p className="text-slate-400 text-center py-8">No video products found.</p>
          ) : (
            products.filter(p => p.type === 'video').map(product => (
              <div key={product.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex gap-4">
                  <div className="w-20 h-32 bg-black rounded-lg overflow-hidden shrink-0 relative border border-slate-700">
                    <video src={product.url} className="w-full h-full object-cover" muted crossOrigin="anonymous" />
                    {product.moderationStatus === 'flagged' && (
                      <div className="absolute inset-0 bg-rose-500/20 flex flex-col items-center justify-center backdrop-blur-sm">
                        <ShieldAlert className="text-rose-500 w-6 h-6 drop-shadow" />
                      </div>
                    )}
                    {product.moderationStatus === 'approved' && (
                      <div className="absolute top-1 right-1 bg-emerald-500 rounded-full p-0.5">
                        <CheckCircle2 className="text-white w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-white font-bold text-sm line-clamp-1">{product.title}</p>
                      <button onClick={() => handleDelete(product.id)} className="text-slate-500 hover:text-rose-500 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-slate-400 text-xs mb-2 truncate">Seller: @{product.seller || product.sellerId}</p>
                    
                    <div className="mt-auto flex gap-2">
                      <button 
                        onClick={() => handleApprove(product.id)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${product.moderationStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                      >
                        <CheckCircle2 className="w-3 h-3" /> Approve
                      </button>
                      <button 
                        onClick={() => handleFlag(product.id)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${product.moderationStatus === 'flagged' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                      >
                        <XCircle className="w-3 h-3" /> Flag Waitlist
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-emerald-400 font-bold uppercase text-xs tracking-wider mb-3">Sellers ({sellers.length})</h4>
              <div className="space-y-2">
                {sellers.length === 0 ? (
                  <p className="text-slate-400 text-xs">No sellers found</p>
                ) : (
                  sellers.map(s => (
                    <div key={s.id} className="bg-slate-800/80 p-3 rounded-lg flex flex-col gap-3 border border-slate-700">
                      <div className="flex justify-between items-center">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs">
                             {(s.displayName || s.email || s.id)[0].toUpperCase()}
                           </div>
                           <div>
                             <p className="text-white text-sm font-bold flex items-center gap-2">
                               {s.displayName || s.email || 'Unknown User'}
                               {s.isVerified && <CheckCircle2 className="w-3 h-3 text-blue-400" />}
                             </p>
                             <p className="text-slate-400 text-[10px] font-mono">{s.id}</p>
                           </div>
                         </div>
                         <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.isVerified ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-300'}`}>
                           {s.isVerified ? 'Verified' : 'Unverified'}
                         </span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleVerifySeller(s.id, true)}
                          disabled={s.isVerified}
                          className={`flex-1 py-1.5 rounded-md text-xs font-bold transition flex items-center justify-center gap-1 ${s.isVerified ? 'bg-blue-500/20 text-blue-400 opacity-50 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                        >
                          <ShieldCheck className="w-3 h-3" /> Approve
                        </button>
                        <button 
                          onClick={() => handleVerifySeller(s.id, false)}
                          disabled={!s.isVerified}
                          className={`flex-1 py-1.5 rounded-md text-xs font-bold transition flex items-center justify-center gap-1 ${!s.isVerified ? 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed' : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400'}`}
                        >
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h4 className="text-blue-400 font-bold uppercase text-xs tracking-wider mb-3">Casual Users ({casualUsers.length})</h4>
              <div className="space-y-2">
                {casualUsers.length === 0 ? (
                  <p className="text-slate-400 text-xs">No casual users found</p>
                ) : (
                  casualUsers.map(c => (
                    <div key={c.id} className="bg-slate-800/80 p-3 rounded-lg flex justify-between items-center border border-slate-700">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs">
                           {(c.email || c.id)[0].toUpperCase()}
                         </div>
                         <div>
                           <p className="text-white text-sm font-bold">{c.email || 'Unknown User'}</p>
                           <p className="text-slate-400 text-[10px] mono">{c.id}</p>
                         </div>
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
               <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <div>
                      <h4 className="text-white font-bold mb-1">Global Commissions</h4>
                      <p className="text-slate-400 text-xs">Set platform fee % per category segment.</p>
                    </div>
                    <button 
                      onClick={handleSaveCategories}
                      disabled={savingCommissions}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 disabled:opacity-50 shrink-0"
                    >
                      <Save className="w-4 h-4" /> Save All
                    </button>
                  </div>

                  <div className="space-y-4">
                    {currentDomains.map(domain => (
                      <div key={domain.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-4">
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800">
                          <h3 className="text-emerald-400 font-bold uppercase text-xs tracking-wider">
                            {domain.name} ({domain.label})
                          </h3>
                        </div>
                        <div className="space-y-3">
                          {domain.segments.map((segment: any) => (
                            <div key={segment.id} className="bg-slate-800/30 p-3 rounded-xl border border-slate-700/50 space-y-3">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                   <button onClick={() => removeSegment(domain.id, segment.id)} className="text-slate-500 hover:text-rose-500 p-1 rounded transition-colors mr-1">
                                      <Trash2 className="w-4 h-4" />
                                   </button>
                                   <Tag className="w-4 h-4 text-emerald-400" />
                                   <span className="text-white font-bold text-sm">{segment.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                   <span className="text-slate-400 text-xs font-bold">Commission %</span>
                                   <input 
                                     type="number" 
                                     min="0" 
                                     max="100" 
                                     value={currentCommissions[segment.id] ?? ''}
                                     onChange={(e) => setCurrentCommissions(prev => ({ ...prev, [segment.id]: parseFloat(e.target.value) || 0 }))}
                                     placeholder="e.g. 10"
                                     className="w-20 bg-slate-800 border border-slate-700 rounded-lg py-1.5 px-3 text-white text-sm focus:border-emerald-500 text-right"
                                   />
                                </div>
                              </div>
                              
                              <div className="pl-8 space-y-2">
                                 {segment.categories?.map((cat: any) => (
                                    <div key={cat.id} className="bg-slate-800 p-2 rounded-lg border border-slate-700 flex flex-col gap-2">
                                       <div className="flex justify-between items-start">
                                          <div className="flex items-center gap-2">
                                             <button onClick={() => removeCategory(domain.id, segment.id, cat.id)} className="text-slate-500 hover:text-rose-500 p-0.5 rounded transition">
                                                <Trash2 className="w-3 h-3" />
                                             </button>
                                             <span className="text-slate-300 font-bold text-xs">{cat.label}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                             <span className="text-slate-500 text-[10px] font-bold">Comm %</span>
                                             <input 
                                                type="number" 
                                                min="0" 
                                                max="100" 
                                                value={currentCommissions[`cat_${cat.id}`] ?? ''}
                                                onChange={(e) => {
                                                   const val = e.target.value;
                                                   setCurrentCommissions(prev => {
                                                      const next = { ...prev };
                                                      if (val === '') delete next[`cat_${cat.id}`];
                                                      else next[`cat_${cat.id}`] = parseFloat(val);
                                                      return next;
                                                   });
                                                }}
                                                placeholder="inherit"
                                                className="w-16 bg-slate-900 border border-slate-700 rounded py-0.5 px-2 text-white text-[10px] focus:border-indigo-500 text-right"
                                             />
                                          </div>
                                       </div>
                                       {cat.subcategories && cat.subcategories.length > 0 && (
                                          <div className="flex flex-col gap-1 mt-1 ml-5 border-l border-slate-700 pl-2">
                                             {cat.subcategories.map((sub: string, i: number) => (
                                                <div key={i} className="flex justify-between items-center bg-slate-700/20 px-2 py-1 rounded">
                                                   <span className="text-slate-400 text-[10px] uppercase font-bold">{sub}</span>
                                                   <div className="flex items-center gap-2">
                                                      <span className="text-slate-500 text-[10px] font-bold">Comm %</span>
                                                      <input 
                                                        type="number" 
                                                        min="0" 
                                                        max="100" 
                                                        value={currentCommissions[`subcat_${cat.id}_${sub}`] ?? ''}
                                                        onChange={(e) => {
                                                           const val = e.target.value;
                                                           setCurrentCommissions(prev => {
                                                              const next = { ...prev };
                                                              if (val === '') delete next[`subcat_${cat.id}_${sub}`];
                                                              else next[`subcat_${cat.id}_${sub}`] = parseFloat(val);
                                                              return next;
                                                           });
                                                        }}
                                                        placeholder="inherit"
                                                        className="w-16 bg-slate-800 border border-slate-600 rounded py-0.5 px-2 text-white text-[10px] focus:border-indigo-500 text-right"
                                                      />
                                                   </div>
                                                </div>
                                             ))}
                                          </div>
                                       )}
                                    </div>
                                 ))}
                                 
                                 {addingCategoryTo?.domainId === domain.id && addingCategoryTo?.segmentId === segment.id ? (
                                    <div className="bg-slate-800/80 p-2 rounded-lg border border-indigo-500/50 flex flex-col gap-2">
                                       <input 
                                          type="text" placeholder="Category Name (e.g. Electronics)" 
                                          value={newCategoryLabel} onChange={e => setNewCategoryLabel(e.target.value)}
                                          className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-white text-xs focus:border-indigo-500"
                                       />
                                       <input 
                                          type="text" placeholder="Subcategories (comma separated)" 
                                          value={newSubcategories} onChange={e => setNewSubcategories(e.target.value)}
                                          className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-white text-xs focus:border-indigo-500"
                                       />
                                       <div className="flex gap-2 justify-end">
                                          <button onClick={() => { setAddingCategoryTo(null); setNewCategoryLabel(''); setNewSubcategories(''); }} className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1">Cancel</button>
                                          <button onClick={() => addCategory(domain.id, segment.id)} className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded hover:bg-indigo-600 transition">Add</button>
                                       </div>
                                    </div>
                                 ) : (
                                    <button 
                                      onClick={() => setAddingCategoryTo({ domainId: domain.id, segmentId: segment.id })} 
                                      className="text-indigo-400 hover:text-indigo-300 text-xs font-bold transition flex items-center gap-1 py-1"
                                    >
                                      <Plus className="w-3 h-3" /> Add Category
                                    </button>
                                 )}
                              </div>
                            </div>
                          ))}
                          
                          {addingSegmentTo === domain.id ? (
                            <div className="bg-slate-800 p-3 rounded-xl border border-emerald-500/50 flex items-center gap-2">
                              <input
                                 type="text"
                                 placeholder="Category ID (e.g. gadgets)"
                                 value={newSegmentId}
                                 onChange={e => setNewSegmentId(e.target.value)}
                                 className="flex-1 bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-3 text-white text-sm focus:border-emerald-500"
                              />
                              <input
                                 type="text"
                                 placeholder="Display Label"
                                 value={newSegmentLabel}
                                 onChange={e => setNewSegmentLabel(e.target.value)}
                                 className="flex-1 bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-3 text-white text-sm focus:border-emerald-500"
                              />
                              <button onClick={() => addSegment(domain.id)} className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 transition-colors">
                                 <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => { setAddingSegmentTo(null); setNewSegmentLabel(''); setNewSegmentId(''); }} className="bg-slate-700 text-slate-300 p-2 rounded-lg hover:bg-slate-600 transition-colors">
                                 <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setAddingSegmentTo(domain.id)} 
                              className="w-full py-2 border border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-slate-300 hover:border-slate-500 text-xs font-bold transition flex items-center justify-center gap-2"
                            >
                              <Plus className="w-3 h-3" /> Add Category to {domain.name}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
               
               <div className="w-full md:w-64 shrink-0">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sticky top-4">
                     <h4 className="text-white font-bold text-sm mb-1 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-400" /> Industry Benchmarks</h4>
                     <p className="text-slate-400 text-xs mb-4">Average commission rates for common marketplace models.</p>
                     <div className="space-y-2">
                        {Object.entries(INDUSTRY_BENCHMARKS).map(([industry, rate]) => (
                           <div key={industry} className="flex justify-between items-center text-sm py-1 border-b border-slate-800/50 last:border-0">
                              <span className="text-slate-300 capitalize">{industry}</span>
                              <span className="text-emerald-400 font-bold">{rate}%</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5"><DollarSign className="w-32 h-32 text-indigo-400" /></div>
               <span className="text-indigo-400 font-bold uppercase text-xs tracking-wider mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Total Platform Revenue</span>
               <h2 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 drop-shadow-sm">NPR {revenueStats.totalRevenue.toFixed(2)}</h2>
               <p className="text-slate-400 text-xs mt-3 max-w-sm mb-4">Total commission revenue generated across all processed orders based on active category rates.</p>
               <button 
                  onClick={downloadRevenueReport}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
               >
                  <Download className="w-4 h-4" /> Download PDF Report
               </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
              <h3 className="text-white font-bold text-sm mb-4 border-b border-slate-800 pb-2">Category Revenue Heatmap</h3>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={[{ name: 'Categories', children: Object.entries(revenueStats.segmentRevenue).map(([name, size]) => ({ name, size: size || 1 })) }]}
                    dataKey="size"
                    stroke="#1e293b"
                    fill="#4f46e5"
                    content={<CustomTreemapContent />}
                  >
                    <Tooltip 
                      formatter={(value: number) => [`NPR ${value.toFixed(2)}`, 'Revenue']}
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    />
                  </Treemap>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
              <h3 className="text-white font-bold text-sm mb-4 border-b border-slate-800 pb-2">Revenue Trend</h3>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueStats.timeseries}>
                    <XAxis 
                      dataKey="date" 
                      stroke="#475569" 
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                    />
                    <YAxis 
                      stroke="#475569" 
                      tick={{ fill: '#94a3b8', fontSize: 10 }} 
                      tickFormatter={(value) => `NPR ${value}`}
                      width={80}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#34d399', fontWeight: 'bold' }}
                      labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                      formatter={(value: number) => [`NPR ${value.toFixed(2)}`, 'Revenue']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#34d399" 
                      strokeWidth={3}
                      dot={{ fill: '#0f172a', stroke: '#34d399', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#34d399' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-white font-bold text-sm mb-4 border-b border-slate-800 pb-2">Revenue by Category Segment</h3>
                <div className="space-y-3">
                   {Object.entries(revenueStats.segmentRevenue).sort((a: [string, any], b: [string, any]) => (b[1] as number) - (a[1] as number)).map(([seg, rev]: [string, any]) => (
                     <div key={seg} className="flex justify-between items-center bg-slate-800/30 rounded-lg p-3 border border-slate-800/50">
                        <span className="text-slate-300 font-bold text-xs uppercase">{seg}</span>
                        <span className="text-emerald-400 font-black text-sm">NPR {(rev as number).toFixed(2)}</span>
                     </div>
                   ))}
                   {Object.keys(revenueStats.segmentRevenue).length === 0 && (
                     <p className="text-slate-500 text-xs text-center py-4">No segment revenue data available.</p>
                   )}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-white font-bold text-sm mb-4 border-b border-slate-800 pb-2">Top Performing Products</h3>
                <div className="space-y-3">
                   {revenueStats.itemRevenue.slice(0, 10).map((item, idx) => (
                     <div key={idx} className="flex justify-between items-center bg-slate-800/30 rounded-lg p-3 border border-slate-800/50">
                        <div className="flex flex-col">
                          <span className="text-slate-200 font-bold text-xs line-clamp-1">{item.title}</span>
                          <span className="text-slate-500 text-[10px] uppercase font-bold mt-0.5">{item.segment} • {item.count} Sales</span>
                        </div>
                        <span className="text-emerald-400 font-black text-sm shrink-0">NPR {item.rev.toFixed(2)}</span>
                     </div>
                   ))}
                   {revenueStats.itemRevenue.length === 0 && (
                     <p className="text-slate-500 text-xs text-center py-4">No product revenue data available.</p>
                   )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audits' && (
          <div className="space-y-4">
             <h3 className="text-white font-bold text-sm mb-4 border-b border-slate-800 pb-2">Commission Audit Logs</h3>
             {auditLogs.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">No audit logs found.</p>
             ) : (
                <div className="space-y-3">
                   {auditLogs.map(log => {
                      const dt = log.timestamp ? (log.timestamp.toDate ? log.timestamp.toDate().toLocaleString() : new Date(log.timestamp).toLocaleString()) : 'Unknown time';
                      return (
                         <div key={log.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                               <span className="text-emerald-400 font-bold text-xs uppercase bg-emerald-500/10 px-2 py-1 rounded-md">Rates Updated</span>
                               <span className="text-slate-400 text-[10px] font-mono">{dt}</span>
                            </div>
                            <p className="text-white text-sm">Changed by: <span className="font-bold">{log.changedBy}</span></p>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                               <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700/50">
                                  <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Previous Rates</p>
                                  <div className="max-h-24 overflow-y-auto hide-scrollbar text-xs font-mono text-slate-300 space-y-1">
                                     {Object.entries(log.previousRates || {}).map(([k,v]) => <div key={k}><span className="text-slate-500">{k}:</span> {v as React.ReactNode}%</div>)}
                                  </div>
                               </div>
                               <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700/50">
                                  <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">New Rates</p>
                                  <div className="max-h-24 overflow-y-auto hide-scrollbar text-xs font-mono text-emerald-300 space-y-1">
                                     {Object.entries(log.newRates || {}).map(([k,v]) => <div key={k}><span className="text-emerald-500/50">{k}:</span> {v as React.ReactNode}%</div>)}
                                  </div>
                               </div>
                            </div>
                         </div>
                      );
                   })}
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
