'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, Plus, MoreHorizontal, ArrowUpRight, ArrowDownLeft, ReceiptText, Layers, UserCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { API_URL } from '@/config'

interface Member {
  _id: string
  name: string
  phone: string
  profilePhotoUrl?: string
}

interface Expense {
  _id: string
  title: string
  amount: number
  paidBy: {
    _id: string
    name: string
  }
  createdAt: string
  splits: any[]
}

let detailCache: Record<string, { group: any; expenses: Expense[]; balances: any }> = {}

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  const groupId = resolvedParams.id
  const { user, token } = useAuth()
  const initialized = useRef(false)
  
  const [group, setGroup] = useState<any>(detailCache[groupId]?.group || null)
  const [expenses, setExpenses] = useState<Expense[]>(detailCache[groupId]?.expenses || [])
  const [balances, setBalances] = useState<any>(detailCache[groupId]?.balances || {})
  const [isLoading, setIsLoading] = useState(!detailCache[groupId])

  const round = (num: number) => num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const fetchGroupData = useCallback(async (showIndicator = true) => {
    if (!token) return
    if (showIndicator) setIsLoading(true)
    
    try {
      const [groupsRes, expensesRes, balancesRes] = await Promise.all([
        fetch(`${API_URL}/api/groups`, { headers: { 'Authorization': `${token}` }, cache: 'no-store' }),
        fetch(`${API_URL}/api/expenses/group/${groupId}`, { headers: { 'Authorization': `${token}` }, cache: 'no-store' }),
        fetch(`${API_URL}/api/expenses/group/${groupId}/balances`, { headers: { 'Authorization': `${token}` }, cache: 'no-store' })
      ])

      if (groupsRes.ok && expensesRes.ok && balancesRes.ok) {
        const allGroups = await groupsRes.json()
        const selectedGroup = allGroups.find((g: any) => g._id === groupId)
        const expData = await expensesRes.json()
        const balData = await balancesRes.json()

        if (selectedGroup) {
          setGroup(selectedGroup)
          setExpenses(expData)
          setBalances(balData)
          detailCache[groupId] = { group: selectedGroup, expenses: expData, balances: balData }
        }
      }
    } catch (error) {
      console.error('Failed to fetch group detail:', error)
    } finally {
      setIsLoading(false)
    }
  }, [token, groupId])

  useEffect(() => {
    if (!initialized.current && token) {
      initialized.current = true
      fetchGroupData(!detailCache[groupId])
      const interval = setInterval(() => fetchGroupData(false), 30000)
      return () => clearInterval(interval)
    }
  }, [fetchGroupData, token])

  if (isLoading && !group) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!group || !user) return null

  const myId = user._id
  const settlementData = group.members
    .filter((m: any) => m._id !== myId)
    .map((member: any) => {
      let net = 0
      if (balances[myId] && balances[myId][member._id]) net -= balances[myId][member._id]
      if (balances[member._id] && balances[member._id][myId]) net += balances[member._id][myId]
      return { ...member, balance: net }
    })

  const handleSettle = async (memberId: string) => {
    if (!token) return
    const expensesToSettle = expenses.filter(exp => 
      exp.paidBy._id === memberId && 
      exp.splits.some(s => s.user._id === myId && !s.isSettled)
    )
    if (expensesToSettle.length === 0) return
    try {
      await Promise.all(expensesToSettle.map(exp => 
        fetch(`${API_URL}/api/expenses/${exp._id}/settle/${myId}`, {
          method: 'PUT',
          headers: { 'Authorization': `${token}` }
        })
      ))
      fetchGroupData(false)
    } catch (error) {
      console.error('Settlement failed:', error)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-black page-transition">
      <header className="px-6 py-8 flex justify-between items-center bg-black/60 backdrop-blur-3xl sticky top-0 z-50 border-b border-white/10">
        <div className="flex items-center gap-4">
           <Link href="/" className="h-9 w-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all group shadow-lg">
              <ChevronLeft size={18} className="text-white group-hover:scale-110 transition-transform" />
           </Link>
           <div>
              <h1 className="text-sm font-black tracking-tighter text-white uppercase">{group.name}</h1>
              <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
                 <span className="h-1 w-1 rounded-full bg-emerald-500"></span> {group.members.length} ENTITIES ACTIVE
              </p>
           </div>
        </div>
        <button className="h-9 w-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all group shadow-lg">
           <MoreHorizontal size={18} className="text-white/60 group-hover:text-white" />
        </button>
      </header>

      <main className="flex-1 pb-40 px-6">
        <section className="mt-10">
           <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30 mb-6 px-1">Settle Obligations</p>
           <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar">
              {settlementData.map((member: any) => (
                <div key={member._id} className="min-w-[155px] p-6 rounded-[1.75rem] bg-white/[0.03] border border-white/10 flex flex-col items-center gap-5 group hover:border-white/20 transition-all shadow-lg hover:translate-y-[-4px]">
                   <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-white/10 bg-white/10 group-hover:border-white/30 transition-all flex items-center justify-center shadow-inner">
                      <Image 
                        src={member.profilePhotoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} 
                        alt={member.name} 
                        fill 
                        className="object-cover transition-opacity duration-300"
                        onError={(e) => {
                           const target = e.target as HTMLImageElement;
                           target.style.opacity = '0';
                        }}
                      />
                      <UserCircle className="text-white/20 absolute inset-0 m-auto h-8 w-8" />
                   </div>
                   <div className="text-center">
                      <h4 className="font-bold text-[12px] text-white tracking-tight uppercase group-hover:text-white transition-all">{member.name.split(' ')[0]}</h4>
                      <p className={`text-[11px] font-black tracking-tight mt-1.5 ${member.balance < 0 ? 'text-rose-400' : member.balance > 0 ? 'text-emerald-400' : 'text-white/20'}`}>
                         {member.balance === 0 ? 'STATUS: CLEAR' : `₹${round(Math.abs(member.balance))}`}
                      </p>
                   </div>
                   
                   {member.balance < 0 ? (
                     <button 
                        onClick={() => handleSettle(member._id)}
                        className="w-full py-2.5 bg-white text-black text-[9px] font-black uppercase tracking-[0.25em] rounded-xl hover:bg-neutral-100 active:scale-95 transition-all shadow-xl shadow-white/20"
                     >
                        Release
                     </button>
                   ) : member.balance > 0 ? (
                     <div className="w-full text-center py-2 border border-emerald-400/20 rounded-xl bg-emerald-400/10 shadow-lg shadow-emerald-400/5">
                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">CREDIT DUE</span>
                     </div>
                   ) : (
                      <div className="h-10 flex items-center justify-center opacity-[0.1]">
                        <Layers size={14} />
                      </div>
                   )}
                </div>
              ))}
           </div>
        </section>

        <section className="mt-12 space-y-6">
           <div className="flex justify-between items-end px-1">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">Chronological Logs</p>
           </div>
           <div className="space-y-3.5">
              {expenses.length > 0 ? (
                expenses.map((expense) => {
                  const isPayer = expense.paidBy._id === myId
                  return (
                    <div key={expense._id} className="group flex items-center gap-5 p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all hover:translate-x-1 shadow-lg">
                      <div className={`h-11 w-11 border border-white/10 rounded-xl flex items-center justify-center transition-all shadow-inner ${isPayer ? 'bg-emerald-400/10' : 'bg-rose-400/10'}`}>
                         {isPayer ? <ArrowUpRight size={18} className="text-emerald-400" /> : <ArrowDownLeft size={18} className="text-rose-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                         <h3 className="font-bold text-white text-[14px] tracking-tight truncate group-hover:text-white transition-all uppercase">{expense.title}</h3>
                         <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.1em] mt-1.5">
                            {isPayer ? 'LOGGED BY YOU' : `SOURCE: ${expense.paidBy.name.toUpperCase()}`} · {new Date(expense.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }).toUpperCase()}
                         </p>
                      </div>
                      <div className="text-right">
                         <p className="font-black text-[16px] tracking-tighter text-white">₹{round(expense.amount)}</p>
                         <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.1em] mt-1.5 opacity-60">UNIT SPLIT</p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="py-24 text-center opacity-20">
                   <ReceiptText size={40} strokeWidth={1} className="mx-auto mb-5" />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Logged Data</p>
                </div>
              )}
           </div>
        </section>
      </main>

      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center">
         <Link href={`/groups/${groupId}/add-expense`}>
            <button className="h-16 w-16 bg-white rounded-[1.5rem] flex flex-col items-center justify-center text-black shadow-[0_25px_60px_-15px_rgba(255,255,255,0.4)] hover:scale-110 active:scale-90 transition-all border-2 border-black group overflow-hidden relative">
               <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-[0.05] transition-opacity"></div>
               <Plus size={32} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500 relative z-10" />
            </button>
         </Link>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none z-50"></div>
    </div>
  )
}
