'use client';

import React, { useState } from 'react';
import { Search, MapPin, Calendar, Bus, ArrowRightLeft, Clock, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CITIES = [
  'Harare', 'Bulawayo', 'Mutare', 'Gweru', 'Masvingo', 
  'Chinhoyi', 'Beitbridge', 'Victoria Falls', 'Hwange'
];

export default function SearchPage() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    
    try {
      const res = await fetch(`/api/trips/search?from=${origin}&to=${destination}&date=${date}`);
      const data = await res.json();
      setResults(data.trips || []);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setIsSearching(false);
    }
  };

  const swapCities = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Hero Section */}
      <header className="relative bg-indigo-700 text-white overflow-hidden pt-16 pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/30 via-transparent to-transparent opacity-50"></div>
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Bus className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">ZimBus</h1>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-indigo-100 text-lg mb-8 max-w-lg"
          >
            Reliable inter-city travel across Zimbabwe. Book your seat in seconds.
          </motion.p>
        </div>
      </header>

      <main className="container mx-auto px-6 -mt-20 relative z-20 pb-20">
        {/* Search Card */}
        <section className="bg-white rounded-3xl shadow-xl shadow-indigo-900/5 p-6 md:p-8 border border-slate-100 backdrop-blur-xl bg-white/95">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            
            <div className="md:col-span-4 relative group">
              <label className="text-sm font-semibold text-slate-500 mb-2 block ml-1">From</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 w-5 h-5 pointer-events-none" />
                <select 
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 text-slate-800 appearance-none font-medium transition-all hover:bg-slate-100"
                  required
                >
                  <option value="">Select Origin</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="md:col-span-1 flex justify-center pb-2">
              <button 
                type="button"
                onClick={swapCities}
                className="p-3 bg-slate-100 rounded-full hover:bg-indigo-100 text-indigo-600 transition-colors"
                aria-label="Swap locations"
              >
                <ArrowRightLeft className="w-5 h-5 rotate-90 md:rotate-0" />
              </button>
            </div>

            <div className="md:col-span-4 relative group">
              <label className="text-sm font-semibold text-slate-500 mb-2 block ml-1">To</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 w-5 h-5 pointer-events-none" />
                <select 
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 text-slate-800 appearance-none font-medium transition-all hover:bg-slate-100"
                  required
                >
                  <option value="">Select Destination</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="text-sm font-semibold text-slate-500 mb-2 block ml-1">Travel Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 w-5 h-5 pointer-events-none" />
                <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium transition-all hover:bg-slate-100"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-12 mt-4">
              <button 
                type="submit"
                disabled={isSearching}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 rounded-2xl transition-all shadow-lg shadow-indigo-200 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-3 text-lg"
              >
                {isSearching ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Search className="w-6 h-6" />
                    Search Available Buses
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Results Section */}
        <div className="mt-12 space-y-6">
          <AnimatePresence>
            {results.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold font-display text-slate-800 flex items-center gap-2">
                    Available Trips <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">{results.length} found</span>
                  </h2>
                </div>
                {results.map((trip) => (
                  <motion.div 
                    key={trip.id}
                    layoutId={trip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group cursor-pointer"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1 flex items-start gap-4">
                        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                          <Bus className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">{trip.operator_name}</p>
                          <h3 className="text-xl font-bold flex items-center gap-2">
                             {trip.origin} <ArrowRightLeft className="w-4 h-4 text-slate-300" /> {trip.destination}
                          </h3>
                          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500 font-medium">
                            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-indigo-400" /> {new Date(trip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="flex items-center gap-1.5"><Info className="w-4 h-4 text-indigo-400" /> {trip.bus_class} Class</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:flex-col md:items-end gap-2 border-t md:border-t-0 pt-4 md:pt-0 border-slate-50">
                        <div className="text-right">
                          <p className="text-3xl font-black text-slate-900">${trip.override_fare_usd || trip.base_fare_usd}</p>
                          <p className="text-xs font-bold text-slate-400 line-through">USD 25</p>
                        </div>
                        <button className="md:w-full bg-slate-900 text-white px-8 md:px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-sm">
                          Select Seat
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : isSearching ? null : origin && destination ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200"
              >
                <div className="p-4 bg-slate-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <Bus className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">No trips found</h3>
                <p className="text-slate-500 mt-2">Try a different date or route.</p>
              </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                   <div className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden group">
                      <div className="relative z-10">
                        <h4 className="text-xl font-bold mb-2">Exclusive Regional Routes</h4>
                        <p className="text-indigo-100/80 text-sm mb-6 max-w-[240px]">We offer the fastest routes between major cities in Zimbabwe including cross-border services.</p>
                        <ul className="space-y-2 text-sm font-medium">
                           <li className="flex items-center gap-2">✅ Real-time Seat Holds</li>
                           <li className="flex items-center gap-2">✅ Instant Payout Receipts</li>
                           <li className="flex items-center gap-2">✅ Branch Pick-ups</li>
                        </ul>
                      </div>
                      <MapPin className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                   </div>
                   <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group border border-slate-800">
                      <div className="relative z-10">
                        <h4 className="text-xl font-bold mb-2">For Bus Operators</h4>
                        <p className="text-slate-400 text-sm mb-6 max-w-[240px]">Manage your fleet, tickets and branch sales with ZimBus Operator Dashboard.</p>
                        <button className="bg-white text-slate-900 font-bold px-6 py-3 rounded-2xl hover:bg-indigo-50 transition-colors">
                           Operator Portal
                        </button>
                      </div>
                      <Bus className="absolute -bottom-10 -right-10 w-64 h-64 opacity-5 group-hover:rotate-12 transition-transform duration-700" />
                   </div>
                </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer / Mobile Nav placeholder */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="container mx-auto px-6 text-center">
           <p className="text-slate-400 text-sm">© 2024 ZimBus Reservations. Part of the regional transit network.</p>
        </div>
      </footer>
    </div>
  );
}
