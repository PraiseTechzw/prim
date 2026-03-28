'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Bus, MapPin, Clock, 
  Users, ChevronRight, FileText, Settings, LayoutDashboard, Database, CreditCard 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminTrips() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllTrips() {
      try {
        const res = await fetch('/api/admin/trips'); // Need to implement
        const data = await res.json();
        setTrips(data.trips || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAllTrips();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
      {/* Sidebar - Desktop Only */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 text-white min-h-screen hidden md:block sticky top-0">
         <div className="p-8 pb-10 flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl"><Bus className="w-6 h-6" /></div>
            <h2 className="text-xl font-black">ZimBus Admin</h2>
         </div>
         
         <nav className="px-4 space-y-1">
            {[
               { icon: <LayoutDashboard className="w-5 h-5"/>, label: 'Dashboard', active: false },
               { icon: <Bus className="w-5 h-5"/>, label: 'Trip Management', active: true },
               { icon: <FileText className="w-5 h-5"/>, label: 'Manifests', active: false },
               { icon: <Users className="w-5 h-5"/>, label: 'Staff & Roles', active: false },
               { icon: <CreditCard className="w-5 h-5"/>, label: 'Finance & Reconcile', active: false },
               { icon: <Database className="w-5 h-5"/>, label: 'Inventory', active: false },
               { icon: <Settings className="w-5 h-5"/>, label: 'Settings', active: false },
            ].map((item) => (
              <button 
                key={item.label}
                className={`
                  w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all
                  ${item.active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}
                `}
              >
                {item.icon} {item.label}
              </button>
            ))}
         </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
           <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Trip Management</h1>
              <p className="text-slate-500 font-medium mt-1">Schedule, monitor and manage active bus trips.</p>
           </div>
           
           <div className="flex items-center gap-3">
              <button className="bg-white border border-slate-200 text-slate-600 px-5 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-all">
                <Search className="w-5 h-5" /> Search Trip
              </button>
              <button className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-900/10 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Plus className="w-6 h-6" /> Create New Trip
              </button>
           </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
           {[
             { label: 'Active Trips Today', val: '24', color: 'bg-emerald-50 text-emerald-600' },
             { label: 'System Occupancy', val: '78.5%', color: 'bg-indigo-50 text-indigo-600' },
             { label: 'Avg Passenger Load', val: '41 / 52', color: 'bg-amber-50 text-amber-600' }
           ].map((stat) => (
             <div key={stat.label} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className={`text-3xl font-black ${stat.color.split(' ')[1]}`}>{stat.val}</p>
             </div>
           ))}
        </div>

        {/* Trips Table */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-indigo-900/5 overflow-hidden">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b border-slate-50">
                       <th className="px-8 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-widest">Route & Carrier</th>
                       <th className="px-8 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-widest">Departure Time</th>
                       <th className="px-8 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-widest">Bus Status</th>
                       <th className="px-8 py-5 text-xs font-extrabold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="hover:bg-slate-50/50 group transition-colors cursor-pointer">
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                               <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                                  <Bus className="w-6 h-6" />
                               </div>
                               <div>
                                  <p className="font-black text-slate-800 tracking-tight">Harare → Bulawayo</p>
                                  <p className="text-xs font-bold text-slate-400 uppercase mt-0.5">Luxury • REG: AGE-44{i}2</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <p className="font-bold text-slate-800">Today, 08:30 AM</p>
                            <p className="text-xs text-slate-500 font-medium">Standard Route</p>
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                               <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-3 py-1.5 rounded-full">On Schedule</span>
                            </div>
                         </td>
                         <td className="px-8 py-6 text-right">
                            <button className="p-3 hover:bg-white rounded-xl hover:shadow-sm border border-transparent hover:border-slate-200 transition-all text-indigo-600 font-bold flex items-center gap-1.5 float-right">
                               <FileText className="w-5 h-5" /> <span>View Manifest</span>
                            </button>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
           
           <footer className="p-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-400">Showing 5 of 24 trips scheduled for today.</p>
              <div className="flex gap-2">
                 <button className="p-2 border border-slate-200 rounded-lg hover:bg-white transition-colors"><ChevronRight className="w-5 h-5 rotate-180" /></button>
                 <button className="p-2 border border-slate-200 rounded-lg hover:bg-white transition-colors"><ChevronRight className="w-5 h-5" /></button>
              </div>
           </footer>
        </section>
      </main>
    </div>
  );
}
