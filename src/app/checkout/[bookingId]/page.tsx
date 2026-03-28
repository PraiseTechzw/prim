'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Bus, ChevronLeft, Loader2, Info, Users, 
  MapPin, Clock, CreditCard, Banknote, ShieldCheck, 
  UserPlus, CheckCircle2, AlertTriangle, ArrowRight, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CheckoutPage() {
  const { bookingId } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [passengerNames, setPassengerNames] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState('ECOCASH');

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        if (!res.ok) throw new Error('Booking not found');
        const d = await res.json();
        setData(d);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [bookingId]);

  const handlePay = async () => {
    setPaying(true);
    try {
      // 1. Submit Payment - Using Mock reference for now
      const res = await fetch(`/api/payments/mock`, {
        method: 'POST',
        body: JSON.stringify({ 
            bookingId, 
            provider: paymentProvider, 
            reference: 'MOCK-PAY-' + Date.now(),
            passengerNames 
        })
      });
      const d = await res.json();
      if (d.success) {
        router.push(`/bookings/${bookingId}/ticket`);
      } else {
        alert(d.error || 'Payment failed');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return (
     <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
     </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* Header */}
      <header className="p-8 pb-16 bg-indigo-700 text-white relative">
         <div className="flex items-center gap-4 mb-8">
            <button onClick={() => router.back()} className="p-2 bg-white/10 rounded-xl transition-colors">
               <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-2xl font-black">Checkout</h1>
         </div>
      </header>

      <main className="container mx-auto px-6 -mt-10 relative z-10 space-y-6 max-w-2xl">
         
         {/* Booking Summary */}
         <section className="bg-white p-6 rounded-3xl shadow-xl shadow-indigo-900/5 border border-slate-100">
            <div className="flex justify-between items-start mb-6">
                <div>
                   <h2 className="text-xl font-bold flex items-center gap-2">{data.origin} → {data.destination}</h2>
                   <p className="text-xs font-bold text-slate-400 mt-0.5 tracking-tight">{data.operator_name}</p>
                </div>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Bus className="w-5 h-5" /></div>
            </div>
            
            <div className="flex items-center gap-6 py-4 border-y border-slate-50 text-sm font-semibold text-slate-600">
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-500" /> {new Date(data.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="flex items-center gap-2 font-mono"><Users className="w-4 h-4 text-indigo-500" /> SEATS: {data.seats.map((s:any) => s.seat_identifier).join(', ')}</div>
            </div>

            <div className="flex justify-between items-center mt-6">
               <span className="text-sm font-bold text-slate-400">Total Price</span>
               <span className="text-2xl font-black text-slate-900">${data.total_amount} <span className="text-[10px] text-slate-400 uppercase">USD</span></span>
            </div>
         </section>

         {/* Passenger Details */}
         <section className="bg-white p-6 rounded-3xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><UserPlus className="w-4 h-4" /> Passenger Information</h3>
            <div className="space-y-4">
               {data.seats.map((seat: any) => (
                  <div key={seat.seat_id} className="relative group">
                     <label className="text-[10px] font-black uppercase text-indigo-600 ml-1.5 mb-1 block">Seat {seat.seat_identifier}</label>
                     <input 
                        type="text" 
                        placeholder="Full Name as per ID" 
                        value={passengerNames[seat.seat_id] || ''}
                        onChange={(e) => setPassengerNames(prev => ({ ...prev, [seat.seat_id]: e.target.value }))}
                        className="w-full bg-slate-50 border-0 rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-300"
                        required
                     />
                  </div>
               ))}
            </div>
         </section>

         {/* Payment Selection */}
         <section className="space-y-4">
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 px-2"><CreditCard className="w-4 h-4" /> Payment Method</h3>
            <div className="grid grid-cols-2 gap-4">
               {[
                 { id: 'ECOCASH', name: 'EcoCash', icon: SmartphoneIcon },
                 { id: 'INNBUCKS', name: 'InnBucks', icon: SmartphoneIcon },
                 { id: 'ZIPIT', name: 'ZIPIT', icon: Banknote },
                 { id: 'CASH', name: 'USD Cash', icon: Banknote }
               ].map((provider) => (
                  <button
                     key={provider.id}
                     onClick={() => setPaymentProvider(provider.id)}
                     className={`p-6 rounded-3xl border text-center transition-all ${paymentProvider === provider.id ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xl' : 'bg-white border-slate-100 grayscale opacity-60'}`}
                  >
                     <div className={`w-10 h-10 rounded-2xl mx-auto flex items-center justify-center mb-3 ${paymentProvider === provider.id ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                        <provider.icon className="w-6 h-6" />
                     </div>
                     <span className="text-xs font-black uppercase tracking-tight">{provider.name}</span>
                  </button>
               ))}
            </div>
         </section>

         <footer className="pt-6">
            <button 
                onClick={handlePay}
                disabled={paying}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 rounded-3xl flex items-center justify-center gap-4 transition-all shadow-xl shadow-indigo-900/10 disabled:opacity-70 group"
            >
               {paying ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle2 className="w-6 h-6" /> PAY & FINALIZE BOOKING <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
            </button>
         </footer>

      </main>
    </div>
  );
}

function SmartphoneIcon(props: any) {
    return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>;
}
