import React, { useState, useEffect } from 'react';
import { Banknote, Activity, Trophy, Star, TrendingUp, Share2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl shadow-xl min-w-[150px]">
        <p className="text-slate-400 text-xs mb-2 font-bold">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-2 text-xs font-bold" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}
              </span>
              <span className="text-white text-sm font-bold">
                {entry.name.includes('Sales') ? `रू${entry.value.toLocaleString()}` : entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function AnalyticsTab() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [realTotalSales, setRealTotalSales] = useState<number>(0);
  const [realTotalViews, setRealTotalViews] = useState<number>(0);
  const [segmentEarnings, setSegmentEarnings] = useState<Record<string, number>>({'feed': 0, 'arena': 0, 'remarket': 0});

  useEffect(() => {
    const fetchRealData = async () => {
      if (!user) return;
      try {
        // Fetch Seller's Products
        const productsQuery = query(collection(db, 'products'), where('sellerId', '==', user.uid));
        const productsSnap = await getDocs(productsQuery);
        
        let totalProductViews = 0;
        const productsMap: Record<string, any> = {};
        
        productsSnap.forEach(doc => {
          const data = doc.data();
          const pViews = data.views || 0;
          totalProductViews += pViews;
          productsMap[doc.id] = { ...data, id: doc.id, totalSold: 0, revenue: 0 };
        });

        // Fetch Seller's Orders
        const ordersQuery = query(collection(db, 'orders'), where('sellerId', '==', user.uid));
        const ordersSnap = await getDocs(ordersQuery);
        
        let totalSales = 0;
        
        // Structures for charts and segment splits
        const dailySalesMap: Record<string, number> = {};
        const segmentEarningsMap: Record<string, number> = {
            'feed': 0, // Maps to 'Products (Fixed)'
            'arena': 0, // Maps to 'Auction'
            'remarket': 0 // Maps to 'Second Hand'
        };

        // Initialize last 30 days in dailySalesMap
        const now = new Date();
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            dailySalesMap[dateStr] = 0;
        }

        ordersSnap.forEach(doc => {
          const data = doc.data();
          
          let orderTotal = 0;
          if (data.total) {
              orderTotal = Number(data.total);
          } else if (data.items) {
             data.items.forEach((item: any) => {
                 if (item.price && item.quantity) {
                    orderTotal += (item.price * item.quantity);
                 }
             });
          }
          
          totalSales += orderTotal;

          // Group by Date for Chart
          let orderDate = now;
          if (data.timestamp?.toDate) {
              orderDate = data.timestamp.toDate();
          } else if (data.createdAt?.toDate) {
              orderDate = data.createdAt.toDate();
          }
          const dateStr = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (dailySalesMap[dateStr] !== undefined) {
              dailySalesMap[dateStr] += orderTotal;
          }

          // Distribute into Product Leaderboard and Segment Earnings
          if (data.items) {
             data.items.forEach((item: any) => {
                 const pId = item.id || item.productId;
                 const quantity = item.quantity || 1;
                 const itemRevenue = (item.price || 0) * quantity;
                 
                 if (pId && productsMap[pId]) {
                     productsMap[pId].totalSold += quantity;
                     productsMap[pId].revenue += itemRevenue;
                     
                     const pSegment = productsMap[pId].segment;
                     if (pSegment && segmentEarningsMap[pSegment] !== undefined) {
                         segmentEarningsMap[pSegment] += itemRevenue;
                     } else {
                         // Default to feed if missing
                         segmentEarningsMap['feed'] += itemRevenue;
                     }
                 }
             });
          }
        });

        // Format data for LineChart
        const lineChartData = Object.keys(dailySalesMap).map(date => ({
            date,
            sales: Math.floor(dailySalesMap[date]),
            // We do not have historical views per day, so using local 0 or omit. We'll leave it 0 to keep the chart functional but accurate.
            views: 0 
        }));

        // Format data for Leaderboard
        const leaderboardData = Object.values(productsMap)
            .sort((a, b) => b.totalSold - a.totalSold)
            .slice(0, 5)
            .map(p => ({
                id: p.id,
                name: p.title || 'Untitled',
                sales: p.totalSold,
                demands: p.views || 0,
                shares: p.shares || 0,
                rating: p.rating || 0
            }));

        // Update states
        setRealTotalSales(totalSales);
        setRealTotalViews(totalProductViews);
        setData(lineChartData);
        setTopProducts(leaderboardData);
        setSegmentEarnings(segmentEarningsMap);

      } catch (err) {
        console.error("Error fetching real analytics data", err);
      }
    };

    fetchRealData();
  }, [user]);

  // Calculate total segment earnings for percentage widths
  const totalSegmentEarnings = Math.max(1, (segmentEarnings['feed'] || 0) + (segmentEarnings['arena'] || 0) + (segmentEarnings['remarket'] || 0));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md text-xs font-black mb-2">NPR</div>
          <span className="text-2xl font-black text-white">{realTotalSales.toLocaleString()}</span>
          <span className="text-xs text-slate-500 font-bold uppercase mt-1">Total Sales</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <Activity className="w-6 h-6 text-rose-400 mb-2" />
          <span className="text-2xl font-black text-white">{realTotalViews > 1000 ? (realTotalViews / 1000).toFixed(1) + 'K' : realTotalViews}</span>
          <span className="text-xs text-slate-500 font-bold uppercase mt-1">Video Views</span>
        </div>
      </div>
      
      {/* 30 Day Line Chart */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <h3 className="text-sm font-bold text-white mb-4">Daily Trends (Last 30 Days)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `रू${val}`} />
              <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Line yAxisId="left" type="monotone" dataKey="sales" name="Sales (NPR)" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line yAxisId="right" type="monotone" dataKey="views" name="Views" stroke="#f43f5e" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product Leaderboard */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Product Leaderboard</h3>
        </div>
        <div className="space-y-3">
          {topProducts.length === 0 && (
             <p className="text-xs text-slate-500 text-center py-4">No products found.</p>
          )}
          {topProducts.map((product, index) => (
             <div key={product.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
               <div className="flex items-center gap-3">
                 <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-amber-500/20 text-amber-400' : index === 1 ? 'bg-slate-300/20 text-slate-300' : index === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-700 text-slate-400'}`}>
                   {index + 1}
                 </div>
                 <div>
                   <h4 className="text-sm font-bold text-slate-200 line-clamp-1">{product.name}</h4>
                   <div className="flex items-center gap-3 mt-1">
                     <span className="text-[10px] text-slate-400 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-400" /> {product.sales} sold</span>
                     <span className="text-[10px] text-slate-400 flex items-center gap-1"><Activity className="w-3 h-3 text-rose-400" /> {product.demands > 1000 ? (product.demands/1000).toFixed(1) + 'k' : product.demands} views</span>
                   </div>
                 </div>
               </div>
               <div className="flex flex-col items-end gap-1">
                 <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                    <Star className="w-3 h-3 fill-current" /> {product.rating}
                 </div>
                 <div className="flex items-center gap-1 text-[10px] text-indigo-400">
                    <Share2 className="w-3 h-3" /> {product.shares} shares
                 </div>
               </div>
             </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <h3 className="text-sm font-bold text-white mb-4">Earnings by Segment</h3>
        <div className="space-y-3">
           <div className="flex items-center justify-between">
             <span className="text-xs text-emerald-400 font-bold">Products (Fixed)</span>
             <span className="text-sm text-white font-bold">NPR {segmentEarnings['feed']?.toLocaleString() || 0}</span>
           </div>
           <div className="w-full bg-slate-800 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{width: `${((segmentEarnings['feed'] || 0) / totalSegmentEarnings) * 100}%`}}></div></div>
           
           <div className="flex items-center justify-between pt-2">
             <span className="text-xs text-rose-500 font-bold">Auction</span>
             <span className="text-sm text-white font-bold">NPR {segmentEarnings['arena']?.toLocaleString() || 0}</span>
           </div>
           <div className="w-full bg-slate-800 rounded-full h-1.5"><div className="bg-rose-500 h-1.5 rounded-full" style={{width: `${((segmentEarnings['arena'] || 0) / totalSegmentEarnings) * 100}%`}}></div></div>

           <div className="flex items-center justify-between pt-2">
             <span className="text-xs text-amber-500 font-bold">Second Hand</span>
             <span className="text-sm text-white font-bold">NPR {segmentEarnings['remarket']?.toLocaleString() || 0}</span>
           </div>
           <div className="w-full bg-slate-800 rounded-full h-1.5"><div className="bg-amber-500 h-1.5 rounded-full" style={{width: `${((segmentEarnings['remarket'] || 0) / totalSegmentEarnings) * 100}%`}}></div></div>
        </div>
      </div>
    </div>
  );
}
