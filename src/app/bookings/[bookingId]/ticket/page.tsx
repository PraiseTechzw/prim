'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Bus, ChevronLeft, Loader2, CheckCircle2, 
  MapPin, Clock, Printer, QrCode, ShieldCheck, 
  ArrowRight, DownloadCloud, Smartphone, Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TicketPage() {
  const { bookingId } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTicket() {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        if (!res.ok) throw new Error('Ticket not found');
        const d = await res.json();
        setData(d);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTicket();
  }, [bookingId]);

  const handlePrint = () => {
     // Direct to PDF download endpoint
     window.open(`/api/tickets/${bookingId}/pdf`, '_blank');
  };

  if (loading) return (
     <div className="min-h-screen flex items-center justify-center bg-emerald-500/5">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
     </div>
  );

  return (
    <div className="min-h-screen bg-emerald-50/30 font-sans text-slate-900 pb-20 overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-[400px] bg-emerald-600 -skew-y-6 -translate-y-[200px]" />

      <header className="relative pt-10 px-8 flex items-center justify-between text-white mb-10">
         <button onClick={() => router.push('/')} className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
            <ChevronLeft className="w-6 h-6" />
         </button>
         <h1 className="text-xl font-black uppercase tracking-widest">My Ticket</h1>
         <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md opacity-0"><Bus className="w-6 h-6" /></div>
      </header>

      <main className="container mx-auto px-6 relative z-10 max-w-lg">
         
         <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center mb-10"
         >
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/20 mb-4">
               <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-800">Booking Confirmed!</h2>
            <p className="text-sm font-bold text-slate-400 mt-1">Safe travels with {data.operator_name}</p>
         </motion.div>

         {/* Ticket UI Card */}
         <div className="bg-white rounded-[3rem] shadow-2xl shadow-indigo-900/10 overflow-hidden border border-slate-100">
            {/* Upper Section */}
            <div className="p-8 border-b-2 border-dashed border-slate-100 relative">
               <div className="flex justify-between items-start mb-8">
                  <div>
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">REFERENCE</p>
                     <h3 className="text-2xl font-black text-slate-900 tracking-wider font-mono uppercase">{data.reference_code}</h3>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <QrCode className="w-10 h-10 text-slate-800" />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-8">
                  <div>
                     <p className="text-[10px] font-black uppercase text-slate-400 mb-1">DEPARTURE</p>
                     <p className="font-bold text-slate-800 text-lg leading-tight uppercase">{data.origin}</p>
                     <p className="text-xs font-bold text-indigo-500 mt-1 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(data.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-black uppercase text-slate-400 mb-1">DESTINATION</p>
                     <p className="font-bold text-slate-800 text-lg leading-tight uppercase">{data.destination}</p>
                     <p className="text-xs font-bold text-slate-400 mt-1">Direct Service</p>
                  </div>
               </div>

               {/* Semi-Circles for ticket effect */}
               <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-emerald-50/50 rounded-full border-r border-slate-100" />
               <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-emerald-50/50 rounded-full border-l border-slate-100" />
            </div>

            {/* Lower Section (Passenger Manifest) */}
            <div className="p-8 bg-slate-50/50">
                <div className="space-y-6">
                   {data.seats.map((seat: any) => (
                      <div key={seat.seat_id} className="flex justify-between items-center group">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex flex-col justify-center items-center shadow-sm">
                               <p className="text-[10px] font-black text-slate-300 uppercase leading-none mb-1">Seat</p>
                               <p className="text-sm font-black text-slate-900 leading-none">{seat.seat_identifier}</p>
                            </div>
                            <div>
                               <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{seat.passenger_name || 'GUEST'}</p>
                               <p className="text-[10px] uppercase font-black text-emerald-600 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> CONFIRMED</p>
                            </div>
                         </div>
                         <Smartphone className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                      </div>
                   ))}
                </div>
            </div>

            <footer className="p-8 pt-2">
                <div className="flex gap-3">
                   <button 
                       onClick={handlePrint}
                       className="flex-1 py-5 bg-slate-900 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 shadow-xl"
                   >
                      <DownloadCloud className="w-5 h-5" /> EXPORT PDF
                   </button>
                   <button className="p-5 bg-white border border-slate-200 text-indigo-600 rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-slate-50 shadow-sm">
                      <Wallet className="w-5 h-5" /> WALLET
                   </button>
                </div>
            </footer>
         </div>

         {/* Advice Alert */}
         <div className="mt-8 p-6 bg-white/50 border border-white rounded-3xl backdrop-blur-sm flex items-start gap-4">
             <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600"><Info className="w-5 h-5" /></div>
             <p className="text-xs font-bold text-slate-500 leading-relaxed">
                <span className="text-slate-900 block mb-1">Terminal Boarding Advice</span>
                Please present this reference code or QR code to the conductor 15 minutes before departure. Arrive at the <strong>Mbare Terminal</strong> by 07:45 AM.
             </p>
         </div>

      </main>
    </div>
  );
}
