'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Bus, ChevronLeft, Loader2, Info, Users, 
  MapPin, Clock, ShieldCheck, ArrowRight, UserCheck, Armchair
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SeatSelectionPage() {
  const { tripId } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [holding, setHolding] = useState(false);

  useEffect(() => {
    async function fetchSeats() {
      try {
        const res = await fetch(`/api/trips/${tripId}/seats`);
        if (!res.ok) throw new Error('Trip not found');
        const d = await res.json();
        setData(d);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSeats();
  }, [tripId]);

  const toggleSeat = (id: string, isLocked: boolean) => {
    if (isLocked) return;
    setSelectedSeats(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleBooking = async () => {
    if (!selectedSeats.length) return;
    setHolding(true);
    
    try {
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, seatIds: selectedSeats })
      });
      const d = await res.json();
      
      if (d.success) {
        router.push(`/checkout/${d.bookingId}`);
      } else {
        alert(d.error || 'Could not lock seats');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setHolding(false);
    }
  };

  if (loading) return (
     <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
     </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-40">
      
      {/* Header */}
      <header className="fixed top-0 inset-x-0 bg-white shadow-sm z-50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
         <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
               <ChevronLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div>
               <h2 className="text-lg font-black tracking-tight">{data.trip.origin} → {data.trip.destination}</h2>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(data.trip.departure_time).toLocaleDateString()} • {new Date(data.trip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
         </div>
      </header>

      <main className="container mx-auto px-6 pt-24 max-w-2xl">
         
         {/* Bus Legend */}
         <div className="grid grid-cols-3 gap-4 mb-10 bg-white p-6 rounded-3xl border border-slate-100">
            <div className="flex flex-col items-center gap-2">
               <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200" />
               <span className="text-[10px] font-bold text-slate-400 uppercase">Available</span>
            </div>
            <div className="flex flex-col items-center gap-2">
               <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200"><Armchair className="w-4 h-4" /></div>
               <span className="text-[10px] font-bold text-indigo-600 uppercase">Selected</span>
            </div>
            <div className="flex flex-col items-center gap-2 opacity-50">
               <div className="w-8 h-8 rounded-lg bg-slate-200 border border-slate-300 flex items-center justify-center cursor-not-allowed"><Armchair className="w-4 h-4 text-slate-400" /></div>
               <span className="text-[10px] font-bold text-slate-400 uppercase">Booked</span>
            </div>
         </div>

         {/* Seat Map - 4 Abreast (A B - C D) */}
         <div className="relative bg-white p-10 rounded-[3rem] shadow-xl shadow-indigo-900/5 border border-slate-100 overflow-hidden">
            {/* Bus Nose */}
            <div className="absolute top-0 inset-x-0 h-16 bg-slate-50 flex items-center justify-center border-b border-slate-100">
               <div className="w-16 h-2 bg-slate-200 rounded-full" />
            </div>

            <div className="mt-10 grid grid-cols-4 gap-4 px-4">
               {data.seats.map((seat: any) => {
                  const isSelected = selectedSeats.includes(seat.id);
                  const isLocked = seat.isLocked;
                  
                  return (
                     <motion.div 
                        key={seat.id}
                        whileTap={!isLocked ? { scale: 0.9 } : {}}
                        onClick={() => toggleSeat(seat.id, isLocked)}
                        className={`
                           aspect-square rounded-2xl flex flex-col items-center justify-center text-[10px] font-black transition-all cursor-pointer relative
                           ${isLocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 
                             isSelected ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/10 scale-105' : 
                             'bg-slate-50 border border-slate-200 text-slate-800 hover:border-indigo-400 hover:bg-white'}
                        `}
                     >
                        <Armchair className={`w-5 h-5 mb-0.5 ${isLocked ? 'text-slate-200' : isSelected ? 'text-white' : 'text-slate-400'}`} />
                        {seat.seat_identifier}
                        
                        {/* Aisle Indicator between B and C */}
                        {(seat.seat_identifier.endsWith('B')) && (
                           <div className="absolute -right-3 top-0 bottom-0 w-2 bg-transparent border-r-2 border-dotted border-slate-100" />
                        )}
                     </motion.div>
                  );
               })}
            </div>
         </div>

         {/* Selection Summary Overlay (Fixed Bottom) */}
         <AnimatePresence>
            {selectedSeats.length > 0 && (
               <motion.div 
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="fixed bottom-8 left-6 right-6 z-[100]"
               >
                  <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-2xl flex flex-col gap-6 ring-4 ring-white">
                     <div className="flex justify-between items-center px-2">
                        <div>
                           <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest leading-none mb-1.5">SELECTED SEATS ({selectedSeats.length})</p>
                           <p className="font-mono text-xs flex gap-1.5 flex-wrap">
                              {selectedSeats.map(sid => {
                                 const s = data.seats.find((s:any) => s.id === sid);
                                 return <span key={sid} className="px-2 py-0.5 bg-white/10 rounded-lg">{s?.seat_identifier}</span>;
                              })}
                           </p>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5 italic">Total Fare</p>
                           <p className="text-3xl font-black">${(parseFloat(data.trip.override_fare_usd || data.trip.base_fare_usd) * selectedSeats.length).toFixed(2)}</p>
                        </div>
                     </div>
                     <button 
                         onClick={handleBooking}
                         disabled={holding}
                         className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-indigo-900/50"
                     >
                        {holding ? <Loader2 className="w-6 h-6 animate-spin" /> : <><ShieldCheck className="w-6 h-6" /> CONFIRM SEATS</>}
                     </button>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

      </main>
    </div>
  );
}
