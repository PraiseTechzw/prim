'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Bus, MapPin, Calendar, Clock, Check, Loader2, AlertCircle, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TripSeats() {
  const { id } = useParams();
  const router = useRouter();
  const [trip, setTrip] = useState<any>(null);
  const [seats, setSeats] = useState<any[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHolding, setIsHolding] = useState(false);

  useEffect(() => {
    async function fetchTrip() {
      try {
        const response = await fetch(`/api/trips/${id}/seats`);
        if (!response.ok) throw new Error('Failed to fetch trip details');
        const data = await response.json();
        setTrip(data.trip);
        setSeats(data.seats);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTrip();
  }, [id]);

  const toggleSeat = (seatId: string, status: string) => {
    if (status !== 'AVAILABLE') return;
    
    setSelectedSeats(prev => 
      prev.includes(seatId) 
        ? prev.filter(s => s !== seatId) 
        : [...prev, seatId]
    );
  };

  const currentFare = trip ? Number(trip.override_fare_usd || trip.base_fare_usd) : 0;
  const totalAmount = currentFare * selectedSeats.length;

  const handleHoldSeats = async () => {
    if (selectedSeats.length === 0) return;
    setIsHolding(true);
    
    try {
      const response = await fetch('/api/bookings/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: id,
          seatIds: selectedSeats,
          passengerName: 'Guest User' // In a real app, this would be an input form
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Successfully held! Proceed to payment/checkout
      router.push(`/checkout/${data.bookingId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsHolding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="p-4 bg-rose-50 text-rose-700 rounded-3xl border border-rose-100 flex items-center gap-3">
          <AlertCircle className="w-6 h-6" />
          <p className="font-bold">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 text-indigo-600 font-bold hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      {/* Header Info */}
      <div className="bg-indigo-700 text-white p-6 pb-20 sticky top-0 z-30 shadow-md">
        <div className="container mx-auto max-w-lg">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => router.back()} className="p-1 hover:bg-white/10 rounded-lg">
              <Bus className="w-6 h-6 rotate-180" />
            </button>
            <div>
              <h1 className="text-lg font-black">{trip.origin} → {trip.destination}</h1>
              <p className="text-white/70 text-sm flex items-center gap-2 font-medium">
                <Calendar className="w-4 h-4" /> {new Date(trip.departure_time).toLocaleDateString()}
                 • 
                <Clock className="w-4 h-4" /> {new Date(trip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2">
               <span className="p-2 bg-indigo-500 rounded-xl"><Bus className="w-5 h-5 text-indigo-100" /></span>
               <div>
                 <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Bus Class</p>
                 <p className="text-sm font-bold">{trip.bus_class}</p>
               </div>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Fare / Seat</p>
               <p className="text-xl font-black text-white">${currentFare}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-lg -mt-12 relative z-40 px-4">
        {/* Legend */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex justify-between px-6 mb-6">
           <div className="flex flex-col items-center gap-1.5">
             <div className="w-5 h-5 bg-slate-100 rounded-md border border-slate-200"></div>
             <span className="text-[10px] font-bold text-slate-500">Available</span>
           </div>
           <div className="flex flex-col items-center gap-1.5">
             <div className="w-5 h-5 bg-indigo-600 rounded-md border border-indigo-700 shadow-sm shadow-indigo-100"></div>
             <span className="text-[10px] font-bold text-slate-500">Selected</span>
           </div>
           <div className="flex flex-col items-center gap-1.5">
             <div className="w-5 h-5 bg-slate-200 rounded-md flex items-center justify-center opacity-50 overflow-hidden">
                <div className="w-full h-[1px] bg-slate-400 rotate-45 transform"></div>
             </div>
             <span className="text-[10px] font-bold text-slate-500">Occupied</span>
           </div>
        </div>

        {/* Seat Map */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 shadow-indigo-900/5 mb-8">
           <div className="mb-10 flex justify-center">
              <div className="w-24 h-12 bg-slate-100 rounded-t-3xl border-2 border-slate-200 flex items-center justify-center text-slate-400">
                <div className="w-6 h-6 border-2 border-slate-300 rounded-full"></div>
              </div>
           </div>

           {/* 2x2 seating layout logic (approx) */}
           <div className="grid grid-cols-5 gap-3 max-w-[280px] mx-auto">
             {seats.map((seat, index) => {
                const isSelected = selectedSeats.includes(seat.id);
                const isAvailable = seat.status === 'AVAILABLE';
                
                // Gap for central aisle every 5 seats? No, let's just do a 2 - 1 - 2
                // Column 3 is always the aisle gap
                const col = (index % 4) + 1;
                const isAisle = col === 3;
                
                return (
                  <React.Fragment key={seat.id}>
                    {col === 3 && <div className="w-4 h-4"></div>}
                    <motion.button 
                        whileTap={isAvailable ? { scale: 0.95 } : {}}
                        onClick={() => toggleSeat(seat.id, seat.status)}
                        className={`
                            relative h-12 rounded-xl text-[10px] font-bold flex items-center justify-center transition-all border
                            ${isAvailable 
                                ? (isSelected 
                                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-200 ring-2 ring-indigo-500/20' 
                                    : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-indigo-50 hover:border-indigo-100') 
                                : 'bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed grayscale'
                            }
                        `}
                        disabled={!isAvailable}
                    >
                        {seat.seat_identifier}
                        {isSelected && <motion.div layoutId="check" className="absolute -top-1 -right-1 bg-white rounded-full p-[1px] text-indigo-600 border border-indigo-100 shadow-sm"><Check className="w-2.5 h-2.5" /></motion.div>}
                    </motion.button>
                  </React.Fragment>
                );
             })}
           </div>
        </div>

        {/* Floating Summary Bar */}
        <AnimatePresence>
          {selectedSeats.length > 0 && (
            <motion.div 
               initial={{ y: 100, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: 100, opacity: 0 }}
               className="fixed bottom-6 left-4 right-4 bg-slate-900 text-white p-5 rounded-3xl shadow-2xl flex items-center justify-between z-50 ring-1 ring-white/10 backdrop-blur-md"
            >
              <div className="flex items-center gap-4">
                 <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg ring-1 ring-white/20">
                    <ShoppingCart className="w-6 h-6" />
                 </div>
                 <div>
                    <h5 className="text-xl font-black">${totalAmount}</h5>
                    <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-wider">{selectedSeats.length} Seats Selected</p>
                 </div>
              </div>
              <button 
                onClick={handleHoldSeats}
                disabled={isHolding}
                className="bg-white text-slate-900 font-black px-8 py-4 rounded-2xl hover:bg-slate-100 transition-colors flex items-center gap-2 group shadow-xl active:scale-[0.98]"
              >
                {isHolding ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Seats'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
