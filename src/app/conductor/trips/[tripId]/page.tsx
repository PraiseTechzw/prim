'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Bus, ChevronLeft, Search, Smartphone, 
  CheckCircle2, XCircle, User, Loader2, AlertCircle, 
  ShieldCheck, ArrowRight, Printer, AlertTriangle, Info, Clock, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TripBoardingPage() {
  const { tripId } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ticketInput, setTicketInput] = useState('');
  const [validating, setValidating] = useState(false);
  const [checkinStates, setCheckinStates] = useState<Record<string, boolean>>({});

  const fetchManifest = useCallback(async () => {
    try {
      const res = await fetch(`/api/conductor/trips/${tripId}/manifest`);
      if (!res.ok) throw new Error('Manifest not found');
      const d = await res.json();
      setData(d);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchManifest();
  }, [fetchManifest]);

  const handleAction = async (bookingId: string, seatId: string, action: 'CHECK_IN' | 'BOARD') => {
    const key = `${bookingId}-${seatId}`;
    setCheckinStates(prev => ({ ...prev, [key]: true }));

    try {
      const idempotencyKey = `${key}-${action}-${Date.now()}`;
      const res = await fetch('/api/conductor/checkins', {
        method: 'POST',
        body: JSON.stringify({ tripId, bookingId, seatId, action, idempotencyKey })
      });
      if (res.ok) await fetchManifest();
    } catch (err) {
      console.error(err);
    } finally {
      setCheckinStates(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketInput) return;
    setValidating(true);
    
    try {
        const res = await fetch('/api/conductor/validate-ticket', {
            method: 'POST',
            body: JSON.stringify({ ticketCode: ticketInput, tripId })
        });
        const d = await res.json();
        
        if (d.valid) {
            // Find and focus on passenger or just highlight
            setSearchTerm(ticketInput);
            setTicketInput('');
        } else {
            alert(d.message || 'Invalid Ticket');
        }
    } catch (err) {
        alert('Validation failed.');
    } finally {
        setValidating(false);
    }
  };

  const filtered = data?.passengers?.filter((p: any) => 
    p.passenger_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.reference_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
     <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
     </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans pb-32">
      
      {/* Dynamic Header */}
      <header className="p-6 border-b border-white/5 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
         <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
               <button onClick={() => router.back()} className="p-2 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-colors">
                  <ChevronLeft className="w-5 h-5" />
               </button>
               <div>
                  <h2 className="text-xl font-black mb-0.5 tracking-tight">{data.trip.origin} → {data.trip.destination}</h2>
                  <p className="text-[10px] uppercase font-black text-indigo-400 tracking-widest">{data.trip.registration_number}</p>
               </div>
            </div>
            <button className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:bg-white/10 transition-colors">
               <Printer className="w-5 h-5" />
            </button>
         </div>

         {/* Ticket Scan / Input Section */}
         <div className="flex gap-2">
            <form onSubmit={handleValidate} className="flex-1 relative">
               <input 
                  type="text" 
                  autoFocus
                  placeholder="Scan QR or Enter Reference..." 
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-lg focus:ring-2 focus:ring-indigo-600/30 transition-all placeholder:text-slate-600 tracking-wider font-mono"
               />
               <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-6 h-6" />
            </form>
            <button 
                type="button"
                className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 transition-colors active:scale-95 disabled:opacity-50"
                onClick={handleValidate}
                disabled={validating}
            >
               {validating ? <Loader2 className="w-6 h-6 animate-spin" /> : 'SEARCH'}
            </button>
         </div>
      </header>

      <main className="p-6 space-y-4">
         
         {/* Simple Search / Filter Toggle */}
         <div className="flex items-center justify-between px-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <span>{filtered?.length || 0} Passengers Loaded</span>
            {searchTerm && <button onClick={() => setSearchTerm('')} className="text-rose-500 flex items-center gap-1">Clear Filter <XCircle className="w-3 h-3" /></button>}
         </div>

         {/* Passenger Cards */}
         <div className="space-y-4">
            {filtered?.length > 0 ? filtered.map((p: any) => {
               const key = `${p.booking_id}-${p.seat_id}`;
               const isProcessing = checkinStates[key];
               const statusColor = p.boarding_status === 'BOARDED' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : p.boarding_status === 'CHECKED_IN' ? 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5' : 'text-slate-500 border-white/5 bg-white/5';
               
               return (
                  <motion.div 
                     key={key}
                     layoutId={key}
                     className={`p-6 rounded-[2rem] border transition-all ${statusColor}`}
                  >
                     <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${p.boarding_status === 'BOARDED' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-slate-400'}`}>
                              {p.seat_identifier}
                           </div>
                           <div>
                              <p className="font-black text-white text-lg leading-tight tracking-tight uppercase">{p.passenger_name || 'GUEST PASSENGER'}</p>
                              <p className="text-xs font-bold text-slate-400 mt-1 font-mono tracking-tighter">REF: <span className="text-indigo-300">{p.reference_code}</span></p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {p.boarding_status === 'BOARDED' ? <CheckCircle2 className="w-7 h-7 text-emerald-500" /> : <Info className="w-6 h-6 text-slate-600" />}
                        </div>
                     </div>

                     <div className="flex items-center gap-3">
                        {p.boarding_status === 'NOT_CHECK_IN' || p.boarding_status === 'NOT_CHECKED_IN' ? (
                           <>
                              <button 
                                 onClick={() => handleAction(p.booking_id, p.seat_id, 'CHECK_IN')}
                                 disabled={isProcessing}
                                 className="flex-1 py-4 bg-white/5 text-white font-black text-xs rounded-2xl hover:bg-white/10 transition-colors border border-white/10"
                              >
                                 {isProcessing ? '...' : 'CHECK IN'}
                              </button>
                              <button 
                                 onClick={() => handleAction(p.booking_id, p.seat_id, 'BOARD')}
                                 disabled={isProcessing}
                                 className="flex-1 py-4 bg-indigo-600 text-white font-black text-xs rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/10"
                              >
                                 {isProcessing ? '...' : 'DIRECT BOARD'}
                              </button>
                           </>
                        ) : p.boarding_status === 'CHECKED_IN' ? (
                           <button 
                              onClick={() => handleAction(p.booking_id, p.seat_id, 'BOARD')}
                               disabled={isProcessing}
                              className="w-full py-4 bg-emerald-600 text-white font-black text-xs rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-900/10 flex items-center justify-center gap-2"
                           >
                              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Smartphone className="w-4 h-4" /> CONFIRM BOARDING</>}
                           </button>
                        ) : (
                           <div className="w-full py-4 text-center font-black text-[10px] uppercase text-emerald-500/50 flex items-center justify-center gap-2">
                              <CheckCircle2 className="w-4 h-4" /> Boarding Manifest Finalized
                           </div>
                        )}
                        
                        {/* More Menu placeholder */}
                        <button className="p-4 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-colors" title="Supervisor Options">
                           <AlertTriangle className="w-5 h-5" />
                        </button>
                     </div>
                  </motion.div>
               );
            }) : (
               <div className="py-20 text-center opacity-40">
                  <User className="w-16 h-16 mx-auto mb-4" />
                  <p className="font-bold text-slate-400">No passengers found.</p>
               </div>
            )}
         </div>

      </main>

      {/* Floating Check-in Summary Mobile Card */}
      <AnimatePresence>
         {data.passengers.some((p:any) => p.boarding_status === 'BOARDED') && (
            <motion.div 
               initial={{ opacity:0, y: 100 }}
               animate={{ opacity:1, y: 0 }}
               className="fixed bottom-6 left-6 right-6 bg-slate-800 p-6 rounded-[2.5rem] shadow-2xl border border-white/10 z-[100] flex items-center justify-between"
            >
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-600 rounded-2xl shadow-lg ring-2 ring-emerald-500/20"><Bus className="w-7 h-7" /></div>
                  <div>
                     <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest leading-none mb-1.5">BOARDED</p>
                     <p className="text-2xl font-black">{data.passengers.filter((p:any) => p.boarding_status === 'BOARDED').length} / {data.passengers.length}</p>
                  </div>
               </div>
               <button className="px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl hover:bg-slate-100 transition-colors shadow-xl">
                  Finalize Trip
               </button>
            </motion.div>
         )}
      </AnimatePresence>

    </div>
  );
}
