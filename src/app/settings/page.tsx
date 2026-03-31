'use client'

import React from 'react'
import { LogOut, ChevronRight, User, Shield, Bell, HelpCircle, Smartphone, CreditCard, Lock, ArrowUpRight, UserCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Image from 'next/image'
import BottomNav from '@/components/BottomNav'

export default function SettingsPage() {
  const { logout, user } = useAuth()

  const SETTINGS_SECTIONS = [
    { 
      group: 'ACCOUNT IDENTITY',
      items: [
        { icon: User, label: 'Profile Identifier', value: user?.name?.toUpperCase() || 'ANONYMOUS', detail: 'Primary user designation' },
        { icon: Smartphone, label: 'Access Node', value: user?.phone || '...', detail: 'Mobile verification linked' },
        { icon: CreditCard, label: 'Financial Bridge', value: user?.upiId || 'NOT LINKED', detail: 'Primary settlement UPI' },
      ]
    },
    { 
      group: 'SYSTEM PROTOCOLS',
      items: [
        { icon: Lock, label: 'Privacy Engine', value: 'ENCRYPTED', detail: 'End-to-end data lockdown' },
        { icon: Bell, label: 'Alert Frequency', value: 'REAL-TIME', detail: 'Notification handshake active' },
      ]
    }
  ]

  return (
    <div className="flex flex-col min-h-screen bg-black page-transition">
      <header className="px-6 py-6 flex justify-between items-center bg-black/60 backdrop-blur-3xl sticky top-0 z-50 border-b border-white/10">
        <h1 className="text-sm font-black tracking-tighter text-white uppercase select-none">System Configuration</h1>
        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
      </header>

      <main className="flex-1 pb-32 px-4 select-none">
        {/* Profile Branding Module */}
        <section className="mt-8 mb-10 text-center">
           <div className="relative inline-block group">
              <div className="relative h-24 w-24 rounded-[2.5rem] bg-white/5 border border-white/10 p-1 flex items-center justify-center overflow-hidden transition-all duration-700 group-hover:border-white/30 group-hover:scale-105 shadow-2xl">
                 <Image 
                   src={user?.profilePhotoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} 
                   alt="Profile" 
                   width={96} 
                   height={96} 
                   className="object-cover rounded-[2.25rem] transition-opacity duration-300"
                   onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.opacity = '0';
                   }}
                 />
                 <UserCircle className="text-white/20 absolute inset-0 m-auto h-12 w-12" />
              </div>
              <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-black border border-white/10 rounded-2xl flex items-center justify-center text-white/40 hover:text-white transition-all shadow-xl">
                 <Smartphone size={16} />
              </div>
           </div>
           <h2 className="mt-6 text-xl font-black text-white tracking-widest uppercase">{user?.name}</h2>
           <p className="text-[10px] text-white/20 font-black tracking-[0.4em] uppercase mt-1.5 flex items-center justify-center gap-2">
             <span className="h-1 w-1 bg-white/20 rounded-full"></span> Tier-Alpha Access <span className="h-1 w-1 bg-white/20 rounded-full"></span>
           </p>
        </section>

        {/* Dynamic Section Mapping */}
        <div className="space-y-12">
           {SETTINGS_SECTIONS.map((group) => (
             <section key={group.group} className="space-y-4 px-2">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30 ml-2">{group.group}</p>
                <div className="grid gap-3">
                   {group.items.map((item) => {
                      const Icon = item.icon
                      return (
                        <div key={item.label} className="group flex items-center gap-4 p-5 rounded-[1.75rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all active:scale-[0.98] cursor-pointer shadow-lg">
                           <div className="h-11 w-11 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all shadow-inner">
                              <Icon size={18} className="text-white/40 group-hover:text-white transition-colors" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-white text-[13px] tracking-tight uppercase group-hover:text-white transition-all">{item.label}</h3>
                              <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.1em] mt-1 truncate">{item.detail}</p>
                           </div>
                           <div className="text-right flex flex-col items-end gap-1">
                              <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                                <span className="text-[9px] font-black text-white/80">{item.value}</span>
                              </div>
                           </div>
                        </div>
                      )
                   })}
                </div>
             </section>
           ))}

           {/* Termination Protocol */}
           <section className="px-2 pb-12">
              <button 
                onClick={logout}
                className="w-full h-16 rounded-[1.75rem] bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all active:scale-[0.98] group flex items-center justify-between px-8"
              >
                 <div className="flex items-center gap-4">
                    <LogOut size={20} className="text-rose-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-black tracking-[0.3em] text-rose-500 uppercase">Terminate Session</span>
                 </div>
                 <ArrowUpRight size={16} className="text-rose-500 opacity-40 group-hover:opacity-100 transition-opacity" />
              </button>
              
              <div className="mt-12 text-center pb-4">
                 <div className="h-10 w-10 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 scale-90 opacity-20">
                    <Smartphone size={16} className="text-white" />
                 </div>
                 <p className="text-[9px] font-black uppercase tracking-[0.6em] text-white/10">EQUALY PRODUCTION 1.0.4-STABLE</p>
              </div>
           </section>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
