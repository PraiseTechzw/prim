'use client';

import React, { useEffect, useState } from 'react';
import { 
  CreditCard, DollarSign, Smartphone, ShieldCheck, 
  Search, Calendar, Filter, Download, ArrowRight, 
  CheckCircle2, XCircle, AlertCircle, Info, User, LayoutGrid, ListFilter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReconciliationPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchRecon = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reconciliation?date=${selectedDate}`);
      const data = await res.json();
      setData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecon();
  }, [selectedDate]);

  const handleVerify = async (paymentId: string) => {
    setVerifyingId(paymentId);
    try {
        const res = await fetch('/api/admin/reconciliation', {
            method: 'POST',
            body: JSON.stringify({ paymentId, action: 'APPROVE', notes: 'Manually verified via Finance view' })
        });
        if (res.ok) fetchRecon(); // Refresh on success
    } catch (e) {
        console.error(e);
    } finally {
        setVerifyingId(null);
    }
  };

  if (loading && !data) return (
     <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
     </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">
      <header className="bg-white border-b border-slate-100 py-8 px-8 sticky top-0 z-50">
         <div className="container mx-auto max-w-6xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
               <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-indigo-600 bg-indigo-50 p-1.5 rounded-xl" /> Finance Reconciliation
               </h1>
               <p className="text-slate-500 font-medium mt-1">Audit local cash-up and digital collection streams.</p>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-12 pr-6 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm"
                  />
               </div>
               <button className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                  <Download className="w-6 h-6 text-slate-400" />
               </button>
            </div>
         </div>
      </header>

      <main className="container mx-auto max-w-6xl px-8 mt-10">
        
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
           {[
             { label: 'Total Collections', val: '$1,290.00', color: 'text-slate-900', bg: 'bg-white' },
             { label: 'Physical Cash (USD)', val: '$840.00', color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
             { label: 'EcoCash Mobile', val: '$320.00', color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
             { label: 'Pending Verification', val: `$${data?.pending?.reduce((a:number, b:any) => a + parseFloat(b.amount), 0) || 0}`, color: 'text-amber-600', bg: 'bg-amber-50/50' },
           ].map((stat) => (
             <div key={stat.label} className={`${stat.bg} p-6 rounded-3xl border border-slate-100/50 backdrop-blur-md shadow-sm`}>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className={`text-2xl font-black ${stat.color}`}>{stat.val}</p>
             </div>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           
           {/* Left Column: Clerk & Provider breakdown */}
           <div className="lg:col-span-2 space-y-10">
              <section className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-indigo-900/5 overflow-hidden">
                 <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Clerk Sales Summary</h2>
                    <div className="p-2 bg-slate-50 rounded-xl"><User className="w-5 h-5 text-slate-400" /></div>
                 </div>
                 
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-slate-50/30">
                             <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Office Clerk</th>
                             <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Method</th>
                             <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Count</th>
                             <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Total USD</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50 font-medium">
                          {(data?.clerkBreakdown || [1, 2, 3]).map((clerk: any, i: number) => (
                             <tr key={i} className="group transition-colors hover:bg-slate-50/50 cursor-pointer">
                                <td className="px-8 py-6">
                                   <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-indigo-50 shadow-sm ${i === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{clerk.clerk_name?.[0] || 'C'}</div>
                                      <span className="font-bold text-slate-800">{clerk.clerk_name || 'Clerk Placeholder'}</span>
                                   </div>
                                </td>
                                <td className="px-8 py-6">
                                   <span className="px-3 py-1.5 bg-slate-100 rounded-full text-[10px] font-black uppercase text-slate-500 flex items-center w-fit gap-1.5">
                                      {clerk.provider === 'CASH' ? <DollarSign className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                                      {clerk.provider || 'CASH'}
                                   </span>
                                </td>
                                <td className="px-8 py-6 text-right font-bold text-slate-500">{clerk.count || '0'}</td>
                                <td className="px-8 py-6 text-right font-black text-slate-900">${clerk.total_amount || '0.00'}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </section>

              <section className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-indigo-900/5 overflow-hidden">
                 <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Manual Verification Queue</h2>
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">{data?.pending?.length || 0} Action Required</span>
                 </div>
                 
                 <div className="p-2">
                    {data?.pending?.length > 0 ? data.pending.map((p: any) => (
                       <motion.div 
                          key={p.id}
                          className="flex items-center justify-between p-6 bg-slate-50/50 rounded-2xl mb-2 border border-transparent hover:border-indigo-100 hover:bg-white transition-all group"
                       >
                          <div className="flex items-start gap-5">
                             <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 group-hover:text-indigo-600 transition-colors">
                                <CreditCard className="w-7 h-7" />
                             </div>
                             <div>
                                <p className="font-black text-slate-800 flex items-center gap-2">
                                   {p.booking_reference} <ArrowRight className="w-4 h-4 text-slate-300" /> ${p.amount} {p.currency}
                                </p>
                                <p className="text-xs font-bold text-indigo-500 mt-1 flex items-center gap-1.5">
                                   REF: <span className="underline decoration-indigo-200 underline-offset-4">{p.provider_reference}</span> • {p.provider}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-2 font-medium">Submitted {new Date(p.created_at).toLocaleString()}</p>
                             </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                             <button className="px-5 py-3 text-slate-400 font-bold text-xs hover:text-rose-500 transition-colors">Reject</button>
                             <button 
                                onClick={() => handleVerify(p.id)}
                                disabled={verifyingId === p.id}
                                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-indigo-600 transition-all flex items-center gap-2 disabled:opacity-50"
                             >
                                {verifyingId === p.id ? 'Processing...' : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" /> Verify & Ticket
                                    </>
                                )}
                             </button>
                          </div>
                       </motion.div>
                    )) : (
                       <div className="py-20 text-center">
                          <div className="p-4 bg-emerald-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck className="w-10 h-10 text-emerald-500" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-800">Queue Clear</h3>
                          <p className="text-slate-500 mt-2 text-sm font-medium">All manual transfers have been reconciled.</p>
                       </div>
                    )}
                 </div>
              </section>
           </div>

           {/* Right Column: Breakdown by Provider stats */}
           <aside className="space-y-8">
              <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                 <div className="relative z-10">
                    <h3 className="text-indigo-400 text-xs font-black uppercase tracking-widest mb-6">Channel Health</h3>
                    <div className="space-y-8">
                       {[
                         { icon: <DollarSign className="w-5 h-5" />, label: 'Standard Cash (USD)', percent: 65 },
                         { icon: <Smartphone className="w-5 h-5" />, label: 'EcoCash Merchant', percent: 24 },
                         { icon: <CreditCard className="w-5 h-5" />, label: 'Bank Transfers', percent: 11 }
                       ].map((c) => (
                         <div key={c.label}>
                            <div className="flex justify-between text-sm font-bold mb-3">
                               <span className="flex items-center gap-2">{c.icon} {c.label}</span>
                               <span className="text-indigo-400">{c.percent}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                               <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${c.percent}%` }}
                                  transition={{ duration: 1, ease: 'easeOut' }}
                                  className="h-full bg-indigo-500 rounded-full"
                               />
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
                 <LayoutGrid className="absolute -bottom-10 -right-10 w-48 h-48 opacity-5 group-hover:scale-110 transition-transform duration-1000" />
              </section>

              <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                 <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-6 flex items-center justify-between">
                    Audit Log Preview <Info className="w-4 h-4" />
                 </h4>
                 <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                       <div key={i} className="flex gap-4 items-start pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                          <div className="w-2 h-2 rounded-full bg-indigo-200 mt-1.5 flex-shrink-0"></div>
                          <div>
                             <p className="text-xs font-bold text-slate-800 leading-tight">Clerk Sarah manual-confirmed booking ZB-AX29-P1 ($15.00 Cash)</p>
                             <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">12:4{i} PM • Branch: Mbare</p>
                          </div>
                       </div>
                    ))}
                 </div>
                 <button className="w-full mt-6 py-3 border border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all">View Full Logs</button>
              </section>
           </aside>

        </div>
      </main>
    </div>
  );
}
