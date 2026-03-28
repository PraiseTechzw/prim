'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Bus, CreditCard, Smartphone, ShieldCheck, 
  Clock, ArrowRight, Loader2, Info, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CheckoutPage() {
  const { id: bookingId } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [paymentStep, setPaymentStep] = useState<'SELECT' | 'PENDING' | 'SUCCESS'>('SELECT');
  const [selectedMethod, setSelectedMethod] = useState<string>('ECOCASH');

  // Timer logic for seat hold
  const startTimer = useCallback((expiryStr: string) => {
    const expiry = new Date(expiryStr).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = Math.floor((expiry - now) / 1000);
      
      if (diff <= 0) {
        clearInterval(interval);
        setTimeRemaining(0);
        // Handle expiry (e.g., redirect with error)
      } else {
        setTimeRemaining(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`); // I need to create this API endpoint
        if (!res.ok) throw new Error('Booking not found or expired');
        const data = await res.json();
        setBooking(data.booking);
        startTimer(data.booking.expires_at);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [bookingId, startTimer]);

  const handlePayment = async () => {
    setPaymentLoading(true);
    setPaymentStep('PENDING');
    
    // Simulate API call to EcoCash/InnBucks
    setTimeout(() => {
       setPaymentStep('SUCCESS');
       setPaymentLoading(false);
    }, 3000);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return (
     <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
     </div>
  );

  if (!booking && !loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
      <h2 className="text-xl font-bold">Booking Not Found</h2>
      <p className="text-slate-500 text-center mt-2 max-w-sm">
        This link may have expired or the booking session has timed out. Seats have been released.
      </p>
      <button 
        onClick={() => router.push('/')}
        className="mt-6 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold"
      >
        Start New Booking
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-white border-b border-slate-100 py-6 px-4 sticky top-0 z-50">
         <div className="container mx-auto max-w-2xl flex items-center justify-between">
            <h1 className="text-xl font-black text-slate-900">Secure Checkout</h1>
            <div className="flex items-center gap-2 bg-rose-50 text-rose-600 px-3 py-1.5 rounded-full font-bold text-xs ring-1 ring-rose-100">
               <Clock className="w-4 h-4" />
               <span>{formatTime(timeRemaining)}</span>
            </div>
         </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 mt-8">
        <div className="grid grid-cols-1 gap-8">
          
          {/* Booking Summary Card */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
             <div className="flex items-start justify-between mb-6">
                <div>
                   <h2 className="text-xs uppercase font-extrabold tracking-widest text-slate-400 mb-1">Booking Reference</h2>
                   <p className="text-2xl font-black text-indigo-600 font-mono">{booking.reference_code}</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                   <Bus className="w-7 h-7" />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-6 border-t border-slate-50 pt-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Trip Details</p>
                  <p className="text-sm font-bold text-slate-800">{booking.origin} to {booking.destination}</p>
                  <p className="text-xs font-medium text-slate-500 mt-1">{new Date(booking.departure_time).toDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Seats Selected</p>
                  <p className="text-sm font-bold text-slate-800">{booking.seats?.map((s:any) => s.seat_identifier).join(', ')}</p>
                  <p className="text-xs font-medium text-slate-500 mt-1">{booking.seats?.length} Passengers</p>
                </div>
             </div>

             <div className="mt-8 bg-slate-900 rounded-3xl p-6 text-white flex items-center justify-between relative overflow-hidden">
                <div className="relative z-10">
                   <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">Total Amount Due</p>
                   <h3 className="text-4xl font-black">${booking.total_amount} <span className="text-lg font-medium opacity-50 ml-1">USD</span></h3>
                </div>
                <ShieldCheck className="w-20 h-20 absolute -right-4 -bottom-4 text-white/5" />
             </div>
          </section>

          {/* Payment Methods */}
          <section className="space-y-4">
             <h3 className="text-lg font-bold text-slate-800 px-1">Choose Payment Method</h3>
             
             <div className="grid grid-cols-1 gap-3">
               {[
                 { id: 'ECOCASH', name: 'EcoCash Mobile Money', icon: <Smartphone className="text-blue-500" />, desc: 'Instant USSD PIN Prompt' },
                 { id: 'INNBUCKS', name: 'InnBucks', icon: <Smartphone className="text-emerald-500" />, desc: 'Scan to pay via App' },
                 { id: 'ZIPIT', name: 'Zimswitch / ZIPIT', icon: <CreditCard className="text-indigo-500" />, desc: 'Instant Bank Transfer' },
                 { id: 'CASH', name: 'Cash at Branch', icon: <CreditCard className="text-slate-500" />, desc: 'Pay at the station office' }
               ].map((method) => (
                 <button 
                   key={method.id}
                   onClick={() => setSelectedMethod(method.id)}
                   className={`
                     p-4 rounded-2xl border text-left flex items-center gap-4 transition-all
                     ${selectedMethod === method.id 
                       ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/10' 
                       : 'bg-white border-slate-100 hover:border-slate-300'}
                   `}
                 >
                   <div className={`p-3 rounded-xl ${selectedMethod === method.id ? 'bg-white' : 'bg-slate-50'}`}>
                      {method.icon}
                   </div>
                   <div className="flex-1">
                      <p className="font-bold text-slate-800">{method.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{method.desc}</p>
                   </div>
                   {selectedMethod === method.id && <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white"><CheckCircle2 className="w-4 h-4" /></div>}
                 </button>
               ))}
             </div>
          </section>

          {/* Action Button */}
          <footer className="mt-4">
             <button 
                onClick={handlePayment}
                disabled={paymentLoading || timeRemaining <= 0}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-3xl transition-all shadow-xl shadow-indigo-900/10 flex items-center justify-center gap-3 text-xl disabled:opacity-50 disabled:grayscale"
             >
                {paymentLoading ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <>
                    Complete Booking
                    <ArrowRight className="w-6 h-6" />
                  </>
                )}
             </button>
             <p className="text-center text-slate-400 text-xs mt-6 px-8 leading-relaxed font-medium">
                By completing this booking, you agree to the conditions of carriage for inter-city travel within the SADC region.
             </p>
          </footer>
        </div>
      </main>

      {/* Payment Processing Overlay */}
      <AnimatePresence>
        {paymentStep === 'PENDING' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-8 text-center"
          >
             <div className="relative mb-8">
                <div className="w-32 h-32 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <Smartphone className="w-12 h-12 text-white absolute inset-0 m-auto animate-pulse" />
             </div>
             <h4 className="text-2xl font-black text-white mb-2 underline decoration-indigo-500 underline-offset-8">Waiting for Payment</h4>
             <p className="text-indigo-200 text-sm max-w-xs font-medium leading-relaxed">
               Please check your phone for the <strong>EcoCash PIN Prompt</strong>. 
               Input your PIN to authorize the transaction.
             </p>
          </motion.div>
        )}

        {paymentStep === 'SUCCESS' && (
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-8 text-center"
           >
              <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-indigo-200">
                 <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
              <h4 className="text-4xl font-black text-slate-900 mb-2 font-display">Booking Confirmed!</h4>
              <p className="text-slate-500 text-lg mb-10 max-w-sm font-medium">
                Your payment was successful and your seat is secured. Your ticket has been sent via SMS.
              </p>
              
              <div className="bg-slate-50 w-full max-w-xs rounded-3xl p-6 border border-slate-100 mb-10">
                 <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">Your Reference</p>
                 <p className="text-3xl font-black text-indigo-600 font-mono tracking-tighter">{booking.reference_code}</p>
              </div>

              <div className="flex flex-col w-full max-w-xs gap-4">
                 <button className="bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-colors shadow-xl">
                    Download PDF Ticket
                 </button>
                 <button 
                  onClick={() => router.push('/')}
                  className="text-indigo-600 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-colors"
                 >
                    Back to Home
                 </button>
              </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
