'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Plus, Users, Search, RefreshCw, Layers, UserCircle, PieChart, TrendingUp, TrendingDown, ReceiptText, MoreHorizontal, ArrowLeftRight, CreditCard, Activity } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { API_URL } from '@/config'

interface Expense {
  _id: string
  title: string
  amount: number
  paidBy: {
    _id: string
    name: string
  }
  createdAt: string
  group: {
    _id: string
    name: string
  }
}

export default function ActivityPage() {
  const { user, token, isLoading: authLoading } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const initialized = useRef(false)

  const round = (num: number) => num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const fetchActivity = useCallback(async (showIndicator = true) => {
    if (!token) return
    if (showIndicator) setIsLoading(true)
    else setRefreshing(true)

    try {
      const response = await fetch(`${API_URL}/api/expenses`, {
        headers: { 'Authorization': `${token}` },
        cache: 'no-store'
      })
      if (response.ok) {
        const data = await response.json()
        // Sort by date descending
        const sorted = data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setExpenses(sorted)
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => {
    if (!authLoading && user && !initialized.current) {
      initialized.current = true
      fetchActivity(true)
    }
  }, [authLoading, user, fetchActivity])

  if (authLoading || (isLoading && expenses.length === 0)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-4 w-4 border border-white/5 border-t-white/30 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) return null

  const totalVolume = expenses.reduce((acc, exp) => acc + exp.amount, 0)
  const myOwedVolume = expenses.filter(e => e.paidBy._id === user._id).reduce((acc, exp) => acc + exp.amount, 0)

  return (
    <div className="flex flex-col min-h-screen bg-black page-transition relative overflow-x-hidden">
      <header className="px-6 py-6 flex justify-between items-center bg-black/60 backdrop-blur-3xl sticky top-0 z-50 border-b border-white/10">
        <div className="flex flex-col">
          <h1 className="text-sm font-black tracking-tighter text-white uppercase leading-none">Activity Log</h1>
          <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span> System Handshake Logs
          </p>
        </div>
        <button
          onClick={() => fetchActivity(false)}
          className={`h-8 w-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all group shadow-lg ${refreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={12} className="text-white/60 group-hover:text-white" />
        </button>
      </header>

      <main className="flex-1 pb-32 px-4 select-none">
        {/* Expenditure Analytics Cluster */}
        <section className="mt-8 mb-12 space-y-6">
           <div className="p-8 bg-white/[0.03] border border-white/5 rounded-[2.5rem] shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/[0.05] blur-[80px] rounded-full pointer-events-none"></div>
              <Activity size={48} strokeWidth={1} className="absolute -bottom-4 -right-4 text-white/[0.03] group-hover:scale-110 transition-transform duration-1000" />
              
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <h4 className="text-[9px] font-black text-white/20 uppercase tracking-[0.35em] mb-2">Aggregate Velocity</h4>
                    <p className="text-2xl font-black text-white tracking-widest leading-none">₹{round(totalVolume)}</p>
                 </div>
                 <div className="h-10 w-10 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-blue-400 shadow-inner">
                    <TrendingUp size={20} />
                 </div>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                 <div className="h-full bg-white/40 w-1/3 animate-in fade-in slide-in-from-left-4 duration-1000"></div>
              </div>
              <p className="mt-4 text-[8px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
                 <span className="h-1 w-1 bg-emerald-500 rounded-full"></span> Data Integrity Confirmed
              </p>
           </div>
        </section>

        {/* Real-time Chronological Stream */}
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 ml-6 mb-6">Chronological stream</p>
        <section className="space-y-3.5 px-0 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {expenses.length > 0 ? (
            expenses.map((expense) => {
              const isPayer = expense.paidBy._id === user._id
              return (
                <div key={expense._id} className="group flex items-center gap-4 p-5 rounded-[1.75rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all shadow-lg mx-1">
                  <div className={`h-11 w-11 border border-white/5 rounded-xl flex items-center justify-center transition-all shadow-inner ${isPayer ? 'bg-emerald-400/5' : 'bg-rose-400/5'}`}>
                     {isPayer ? <TrendingUp size={18} className="text-emerald-400" /> : <TrendingDown size={18} className="text-rose-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-[14px] tracking-tight truncate group-hover:text-white uppercase transition-all">{expense.title}</h3>
                     </div>
                     <p className="text-[8px] text-white/20 font-black uppercase tracking-[0.15em] mt-1.5 flex items-center gap-1.5 truncate">
                        <span className="px-1.5 py-0.5 border border-white/5 rounded-[4px] bg-white/5 text-[7px] text-white/40">{expense.group.name.toUpperCase()}</span>
                        {isPayer ? 'Initiated by you' : `Signed by ${expense.paidBy.name}`}
                     </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                     <p className="font-black text-[15px] tracking-tighter text-white">₹{round(expense.amount)}</p>
                     <p className="text-[7px] font-black text-white/10 uppercase tracking-[0.1em]">{new Date(expense.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }).toUpperCase()}</p>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-24 text-center space-y-6 opacity-20">
               <ReceiptText size={40} strokeWidth={1} className="mx-auto mb-5" />
               <p className="text-[10px] font-black uppercase tracking-[0.35em]">No Data Points Logged</p>
            </div>
          )}
        </section>
        
        {/* System Signature Detail */}
        <div className="mt-20 py-10 opacity-10 border-t border-white/10 text-center">
           <Activity size={24} className="mx-auto mb-6 text-white" />
           <p className="text-[10px] font-black uppercase tracking-[1em] text-white ml-2">EQUALY ANALYTICS NODE</p>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
