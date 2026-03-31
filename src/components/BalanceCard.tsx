'use client'

import React from 'react'

interface BalanceCardProps {
  name: string
  owe: number
  owed: number
}

import NextImage from 'next/image'

export default function BalanceCard({ name, owe, owed }: BalanceCardProps) {
  const round = (num: number) => num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="relative group w-full transition-all duration-700 select-none">
      <div className="credit-card-premium !rounded-[1.5rem] bg-neutral-900/60 border-white/20 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] p-5 overflow-hidden">
        {/* Dynamic Glassmorphic Lighting */}
        <div className="absolute top-0 right-0 w-64 h-full bg-rose-500/[0.04] blur-[110px] rounded-full translate-x-12 translate-y-[-20%] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-2/3 bg-white/[0.03] blur-[100px] rounded-full translate-x-[-10%] translate-y-[20%] pointer-events-none"></div>

        {/* Subtle Branding Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
          <span className="text-[6rem] font-black tracking-tighter text-white uppercase">EQ</span>
        </div>

        <div className="relative z-10 flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-white rounded-lg flex items-center justify-center shadow-sm overflow-hidden border border-black/5">
                <NextImage src="/icon.png" alt="Logo" width={40} height={40} className="object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-black tracking-[0.25em] uppercase text-white leading-tight">EQUALY</span>
                <span className="text-[7px] font-bold tracking-[0.1em] text-white/30 uppercase mt-0.5">Signature Edition</span>
              </div>
            </div>
            <div className="text-[7px] font-black text-white/60 uppercase tracking-[0.3em] border border-white/20 px-3 py-1.5 rounded-full bg-white/5 shadow-inner backdrop-blur-md">
              Secure
            </div>
          </div>

          <div className="flex items-end justify-between gap-6 pb-1">
            <div className="flex-1 space-y-1.5">
              <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">Owe (Net)</p>
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl font-black tracking-tighter text-white">₹{round(owe)}</span>
              </div>
            </div>
            <div className="flex-1 text-right space-y-1.5">
              <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">Owed (Net)</p>
              <div className="flex items-baseline justify-end gap-2.5">
                <span className="text-2xl font-black tracking-tighter text-emerald-400">₹{round(owed)}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-between items-center">
            <div>
              <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Authenticated Entity</p>
              <p className="text-[11px] font-black text-white/70 tracking-tight uppercase">{name}</p>
            </div>
            <div className="flex gap-1.5 opacity-40">
              {[1, 2].map(i => <div key={i} className={`h-1 w-1 rounded-full ${i === 2 ? 'w-4 bg-white' : 'bg-white/40'}`}></div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
