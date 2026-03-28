'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bus, MapPin, Clock, Users, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ConductorTrips() {
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrips() {
      try {
        const res = await fetch('/api/conductor/trips/today');
        if (!res.ok) throw new Error('Failed to fetch assigned trips');
        const data = await res.json();
        setTrips(data.trips || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTrips();
  }, []);

  if (loading) return (
     <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
     </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans pb-10">
      <header className="p-8 border-b border-white/5 sticky top-0 bg-slate-900/80 backdrop-blur-md z-50">
         <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20"><Bus className="w-6 h-6" /></div>
            <h1 className="text-2xl font-black tracking-tight">ZimBus Terminal</h1>
         </div>
         <p className="text-slate-400 text-sm font-medium">Daily assigned departures & boarding control.</p>
      </header>

      <main className="p-6 space-y-6">
        {error && (
           <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 font-bold">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
           </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {trips.length > 0 ? trips.map((trip) => (
             <motion.div 
                key={trip.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/conductor/trips/${trip.id}`)}
                className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-colors cursor-pointer group relative overflow-hidden"
             >
                <div className="flex justify-between items-start mb-6">
                   <div>
                      <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">Status: {trip.status}</p>
                      <h2 className="text-xl font-black">{trip.origin} → {trip.destination}</h2>
                   </div>
                   <div className="p-3 bg-white/5 rounded-2xl text-white group-hover:text-indigo-400 transition-colors"><ChevronRight className="w-6 h-6" /></div>
                </div>

                <div className="space-y-4 mb-8">
                   <div className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      {new Date(trip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Departure
                   </div>
                   <div className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                      <Bus className="w-4 h-4 text-indigo-400" />
                      REG: <span className="text-white font-bold">{trip.registration_number}</span>
                   </div>
                </div>

                <footer className="flex items-center gap-4 pt-6 border-t border-white/5">
                   <div className="flex-1">
                      <div className="flex justify-between text-[10px] font-black uppercase mb-1.5">
                         <span className="text-slate-400">Boarding Progress</span>
                         <span className="text-indigo-400">{(Number(trip.boarded) / Number(trip.confirmed) * 100 || 0).toFixed(0)}%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full">
                         <div 
                            className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                            style={{ width: `${(Number(trip.boarded) / Number(trip.confirmed) * 100) || 0}%` }}
                         />
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">Boarded</p>
                      <p className="text-lg font-black">{trip.boarded} / <span className="text-slate-500">{trip.confirmed}</span></p>
                   </div>
                </footer>
             </motion.div>
           )) : !loading && (
              <div className="col-span-full py-20 text-center bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                 <Bus className="w-16 h-16 text-white/5 mx-auto mb-6" />
                 <h3 className="text-xl font-bold">No trips assigned for today</h3>
                 <p className="text-slate-400 mt-2">Check back later or contact Operations.</p>
              </div>
           )}
        </div>
      </main>
    </div>
  );
}
