'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Bus, Printer, ChevronLeft, CheckCircle2, 
  User, ShieldCheck, Download, AlertTriangle, Smartphone, MapPin, Clock, Search 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ManifestPage() {
  const { tripId } = useParams();
  const router = useRouter();
  const [manifest, setManifest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchManifest() {
       try {
          const res = await fetch(`/api/admin/manifests/${tripId}`);
          const data = await res.json();
          setManifest(data);
       } catch (err) {
          console.error(err);
       } finally {
          setLoading(false);
       }
    }
    fetchManifest();
  }, [tripId]);

  const handlePrint = () => window.print();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;

  if (!manifest?.trip) return (
     <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold">Trip Not Found</h2>
        <button onClick={() => router.back()} className="mt-4 text-indigo-600 font-bold underline">Back to Management</button>
     </div>
  );

  const filteredPassengers = manifest.passengers.filter((p: any) => 
     p.passenger_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.reference_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20 print:bg-white print:pb-0">
      
      {/* Navigation Header - Hide on Print */}
      <header className="bg-white border-b border-slate-100 py-6 px-6 sticky top-0 z-50 print:hidden">
         <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
               <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <ChevronLeft className="w-6 h-6 text-slate-400" />
               </button>
               <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                     Manifest <span className="text-slate-300 font-medium">#</span>{tripId.toString().substring(0, 8)}
                  </h1>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{manifest.trip.origin} → {manifest.trip.destination}</p>
               </div>
            </div>
            
            <div className="flex items-center gap-3">
               <button className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm">
                  <Download className="w-5 h-5" /> Export CSV
               </button>
               <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl hover:shadow-indigo-900/10 active:scale-[0.98]">
                  <Printer className="w-5 h-5" /> Print Manifest
               </button>
            </div>
         </div>
      </header>

      <main className="container mx-auto max-w-5xl px-6 mt-8 print:mt-0 print:px-0">
         
         {/* Trip Context Card */}
         <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-indigo-900/5 mb-8 flex flex-wrap gap-8 justify-between relative overflow-hidden print:border-none print:shadow-none print:rounded-none">
            <div className="flex-1 min-w-[300px]">
               <h2 className="text-xs font-extrabold uppercase tracking-widest text-indigo-500 mb-4 flex items-center gap-2">
                  <Bus className="w-4 h-4" /> Trip Background
               </h2>
               <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">DEPARTURE</label>
                    <p className="font-bold text-slate-800 text-lg flex items-center gap-2"><Clock className="w-5 h-5 text-slate-400" /> {new Date(manifest.trip.departure_time).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">BUS REGISTRATION</label>
                    <p className="font-bold text-slate-800 text-lg flex items-center gap-2"><Smartphone className="w-5 h-5 text-slate-400" /> {manifest.trip.registration_number}</p>
                  </div>
               </div>
            </div>
            
            <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 min-w-[200px] flex flex-col justify-center text-center print:bg-white print:border-slate-100">
               <p className="text-indigo-600 text-5xl font-black">{manifest.total_booked}</p>
               <p className="text-indigo-500 text-xs font-black uppercase tracking-widest mt-2">{manifest.total_booked === manifest.trip.capacity ? 'BUS FULL' : `BOOKED / ${manifest.trip.capacity}`}</p>
            </div>
         </section>

         {/* Search Filter - Hide on Print */}
         <div className="relative mb-6 print:hidden">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Filter by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 shadow-sm font-medium" 
            />
         </div>

         {/* Manifest List */}
         <section className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-indigo-900/5 overflow-hidden print:shadow-none print:border-slate-200">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                     <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Seat</th>
                     <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Passenger</th>
                     <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Reference</th>
                     <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Checked-in</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {filteredPassengers.length > 0 ? filteredPassengers.map((p: any) => (
                    <motion.tr 
                      key={`${p.reference_code}-${p.seat_identifier}`} 
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                    >
                       <td className="px-8 py-6 font-black text-indigo-600 text-lg">{p.seat_identifier}</td>
                       <td className="px-8 py-6">
                          <p className="font-bold text-slate-800">{p.passenger_name || 'GUEST'}</p>
                          <p className="text-xs font-medium text-slate-400">{p.passenger_id_number || 'No ID Provided'}</p>
                       </td>
                       <td className="px-8 py-6 tracking-tight">
                          <div className="flex items-center gap-2">
                             <span className="font-mono font-bold text-slate-600">{p.reference_code}</span>
                             {p.booking_status === 'CHECKED_IN' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          </div>
                       </td>
                       <td className="px-8 py-6 text-center">
                          <button className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${p.booking_status === 'CHECKED_IN' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 hover:border-indigo-400'}`}>
                             {p.booking_status === 'CHECKED_IN' ? <CheckCircle2 className="w-5 h-5" /> : null}
                          </button>
                       </td>
                    </motion.tr>
                  )) : (
                     <tr>
                        <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest">No matching passengers</td>
                     </tr>
                  )}
               </tbody>
            </table>
         </section>

         {/* Conductor Signature - Print Only */}
         <div className="hidden print:block mt-12 px-8">
            <div className="flex justify-between items-end gap-20">
               <div className="flex-1 border-t border-slate-900 text-center pt-2 font-bold text-xs">OFFICER / CONDUCTOR NAME</div>
               <div className="flex-1 border-t border-slate-900 text-center pt-2 font-bold text-xs">OFFICER SIGNATURE</div>
               <div className="flex-1 border-t border-slate-900 text-center pt-2 font-bold text-xs">DEPARTURE AUTH SIGNATURE & STAMP</div>
            </div>
            <p className="mt-8 text-[10px] text-slate-400 italic text-center uppercase tracking-tighter">Generated by ZimBus Booking Platform | Zimbabwe Inter-city Transit Office</p>
         </div>

      </main>
    </div>
  );
}
