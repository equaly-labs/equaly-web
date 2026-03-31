'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Plus, Users, Search, Bell, RefreshCw, Layers, UserCircle, X, ReceiptText, Home, PieChart, Settings, ArrowRight, Smartphone, CreditCard, Lock, ArrowUpRight, Diamond, ArrowDownLeft, Activity, TrendingUp, TrendingDown, ChevronRight, LogOut, User, ArrowLeft, Check } from 'lucide-react'
import BalanceCard from '@/components/BalanceCard'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { API_URL } from '@/config'

// --- Types ---
interface Group {
  _id: string
  name: string
  balance: number
  members: any[]
  groupPhoto?: string
}

interface Expense {
  _id: string
  title: string
  amount: number
  paidBy: { _id: string; name: string }
  createdAt: string
  group: { _id: string; name: string }
}

interface Contact {
  _id: string
  name: string
  phone: string
  profilePhotoUrl?: string
}

const round = (num: number) => num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Global Cache
let groupCache: Group[] | null = null
let expenseCache: Expense[] | null = null

export default function UnifiedMainInterface() {
  const { user, token, isLoading: authLoading, showSplash, logout } = useAuth()

  // Navigation State
  const [activeViewIdx, setActiveViewIdx] = useState(0) 
  const [activeHomeTab, setActiveHomeTab] = useState<'groups' | 'splits'>('groups')
  const homeScrollRef = useRef<HTMLDivElement>(null)

  // Creation State (In-Drawer)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [drawerStep, setDrawerStep] = useState(0) // 0: select, 1: group, 2: individual, 3: expense
  const [newGroupName, setNewGroupName] = useState('')
  const [searchPhone, setSearchPhone] = useState('')
  const [searchResults, setSearchResults] = useState<Contact[]>([])
  const [selectedMembers, setSelectedMembers] = useState<Contact[]>([])
  const [isSearchingContacts, setIsSearchingContacts] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Expense State
  const [expAmount, setExpAmount] = useState('')
  const [expTitle, setExpTitle] = useState('')
  const [targetGroupId, setTargetGroupId] = useState('')

  // Scroll Reset Logic
  useEffect(() => {
    if (homeScrollRef.current) homeScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeHomeTab])

  // Data State
  const [groups, setGroups] = useState<Group[]>(groupCache || [])
  const [expenses, setExpenses] = useState<Expense[]>(expenseCache || [])
  const [isLoading, setIsLoading] = useState(!groupCache)
  const [refreshing, setRefreshing] = useState(false)
  const initialized = useRef(false)

  // Fetch Logic
  const fetchData = useCallback(async (showIndicator = true) => {
    if (!token) return
    if (showIndicator) setIsLoading(true)
    else setRefreshing(true)

    try {
      const [groupsRes, expensesRes] = await Promise.all([
        fetch(`${API_URL}/api/groups`, { headers: { 'Authorization': `${token}` }, cache: 'no-store' }),
        fetch(`${API_URL}/api/expenses`, { headers: { 'Authorization': `${token}` }, cache: 'no-store' })
      ])

      let gData = []
      let eData = []

      if (groupsRes.ok) gData = await groupsRes.json()
      if (expensesRes.ok) eData = await expensesRes.json()

      setGroups(gData)
      groupCache = gData
      const sortedExpenses = eData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setExpenses(sortedExpenses)
      expenseCache = sortedExpenses
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [token])

  const handleContactSearch = useCallback(async (query: string) => {
    if (query.length < 10 || !token) {
       setSearchResults([])
       return
    }
    setIsSearchingContacts(true)
    try {
       const response = await fetch(`${API_URL}/api/auth/check-contacts`, {
          method: 'POST',
          headers: { 
             'Content-Type': 'application/json',
             'Authorization': `${token}`
          },
          body: JSON.stringify({ phones: [query] })
       })
       if (response.ok) {
          const results = await response.json()
          setSearchResults(results)
       }
    } catch (error) {
       console.error('Contact search failed:', error)
    } finally {
       setIsSearchingContacts(false)
    }
  }, [token])

  useEffect(() => {
    if (searchPhone.length === 10) {
      handleContactSearch(searchPhone)
    } else {
      setSearchResults([])
    }
  }, [searchPhone, handleContactSearch])

  const toggleMember = (member: Contact) => {
     if (selectedMembers.some(m => m._id === member._id)) {
        setSelectedMembers(selectedMembers.filter(m => m._id !== member._id))
     } else if (selectedMembers.length < 10) {
        setSelectedMembers([...selectedMembers, member])
     }
  }

  const handleCreate = async (isIndividual: boolean) => {
    if (isCreating || !token) return
    setIsCreating(true)
    try {
       const response = await fetch(`${API_URL}/api/groups`, {
          method: 'POST',
          headers: { 
             'Content-Type': 'application/json',
             'Authorization': `${token}`
          },
          body: JSON.stringify({ 
             name: newGroupName || (isIndividual ? 'Individual' : 'New Group'),
             members: selectedMembers.map(m => m._id)
          })
       })
       if (response.ok) {
          setNewGroupName('')
          setSearchPhone('')
          setSelectedMembers([])
          setDrawerStep(0)
          setIsDrawerOpen(false)
          fetchData(false)
       }
    } catch (error) {
       console.error('Failed to create:', error)
    } finally {
       setIsCreating(false)
    }
  }

  const handleLogExpense = async () => {
    if (isCreating || !token || !targetGroupId || !expAmount || !expTitle) return
    setIsCreating(true)
    try {
      const resp = await fetch(`${API_URL}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `${token}` },
        body: JSON.stringify({
          title: expTitle,
          amount: parseFloat(expAmount),
          groupId: targetGroupId,
          splitType: 'EQUAL'
        })
      })
      if (resp.ok) {
        setExpAmount('')
        setExpTitle('')
        setTargetGroupId('')
        setDrawerStep(0)
        setIsDrawerOpen(false)
        fetchData(false)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsCreating(false)
    }
  }

  useEffect(() => {
    if (!authLoading && user && !initialized.current && !showSplash) {
      initialized.current = true
      fetchData(!groupCache)
      const interval = setInterval(() => fetchData(false), 60000)
      return () => clearInterval(interval)
    }
  }, [authLoading, user, fetchData, showSplash])

  if (authLoading || showSplash) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[200]">
        <div className="relative group p-4 border border-white/5 bg-white/[0.03] rounded-[2.5rem]">
          <Image src="/icon.png" alt="Splash Icon" width={64} height={64} className="grayscale contrast-[1.2] invert brightness-200" priority />
        </div>
        <div className="mt-12 text-center animate-in slide-in-from-bottom-8">
          <h1 className="text-2xl font-black text-white tracking-[0.8em] ml-[0.8em] uppercase leading-none">EQUALY</h1>
          <p className="mt-6 text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Setting up your space</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  // Analytics Calculation
  const now = new Date()
  const thisMonthExpenses = expenses.filter(e => {
    const d = new Date(e.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const monthTotal = thisMonthExpenses.reduce((acc, e) => acc + e.amount, 0)
  const userPaidMonth = thisMonthExpenses.filter(e => e.paidBy._id === user?._id).reduce((acc, e) => acc + e.amount, 0)
  const payRatio = monthTotal > 0 ? (userPaidMonth / monthTotal) * 100 : 0

  const totalOwe = Math.abs(groups.reduce((acc, g) => (g.balance < 0 ? acc + g.balance : acc), 0))
  const totalOwed = groups.reduce((acc, g) => (g.balance > 0 ? acc + g.balance : acc), 0)
  const groupList = groups.filter(g => g.members.length !== 2)
  const splitList = groups.filter(g => g.members.length === 2)

  return (
    <div className="flex flex-col h-screen bg-black relative overflow-hidden">
      
      {/* 1. HEADER */}
      <header className="fixed top-0 left-0 right-0 h-[88px] flex justify-between items-center bg-black/80 backdrop-blur-[30px] z-[100] border-b border-white/[0.08] px-6 shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-2xl overflow-hidden border border-white/10 bg-white/5 relative cursor-pointer" onClick={() => setActiveViewIdx(3)}>
            <Image src={user.profilePhotoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="Profile" fill className="object-cover" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tighter text-white uppercase leading-none">EQUALY</h1>
            <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.25em] mt-1.5 flex items-center gap-1.5 opacity-80">
              <span className="h-1 w-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> Online
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => fetchData(false)} className={`h-9 w-9 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all ${refreshing ? 'animate-spin' : ''}`}><RefreshCw size={14} className="text-white/60" /></button>
          <button className="h-9 w-9 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"><Bell size={14} className="text-white/60" /></button>
        </div>
      </header>

      {/* 2. MAIN SPA CONTAINER */}
      <div className="flex-1 mt-[88px] relative overflow-hidden h-[calc(100vh-168px)]">
        <div className="flex h-full transition-transform duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform" style={{ transform: `translateX(-${activeViewIdx * 25}%)`, width: '400%' }}>
          
          {/* VIEW 0: HOME */}
          <div ref={homeScrollRef} className="w-1/4 h-full flex-shrink-0 overflow-y-auto no-scrollbar px-4 pb-24">
            <div className="mt-4 mb-8"><BalanceCard name={user.name} owe={totalOwe} owed={totalOwed} /></div>
            <div className="relative border-b border-white/10 mx-[-16px] mb-6 flex">
              <button onClick={() => setActiveHomeTab('groups')} className={`flex-1 text-[9px] font-black uppercase tracking-[0.2em] py-4 transition-colors ${activeHomeTab === 'groups' ? 'text-white' : 'text-white/20'}`}>Groups</button>
              <button onClick={() => setActiveHomeTab('splits')} className={`flex-1 text-[9px] font-black uppercase tracking-[0.2em] py-4 transition-colors ${activeHomeTab === 'splits' ? 'text-white' : 'text-white/20'}`}>Individual</button>
              <div className="absolute bottom-0 h-[2.5px] bg-white transition-transform duration-[500ms]" style={{ width: '50%', transform: activeHomeTab === 'groups' ? 'translateX(0%)' : 'translateX(100%)' }}></div>
            </div>
            <div className="relative overflow-hidden min-h-[300px]">
              <div className="flex transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]" style={{ transform: `translateX(${activeHomeTab === 'groups' ? '0%' : '-50%'})`, width: '200%' }}>
                <div className="w-1/2 flex-shrink-0 space-y-3">
                  {groupList.length > 0 ? groupList.map(g => (
                    <Link href={`/groups/${g._id}`} key={g._id} className="block p-4 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all group active:scale-[0.98] shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center relative overflow-hidden border border-white/10 shadow-inner">{g.groupPhoto ? <Image src={g.groupPhoto} alt={g.name} fill className="object-cover" /> : <Layers size={18} className="text-white/10" />}</div>
                        <div className="flex-1 min-w-0"><h3 className="font-bold text-white text-[14px] uppercase truncate tracking-tight">{g.name}</h3><p className="text-[8px] text-white/30 font-black uppercase mt-1 tracking-widest">{g.members.length} Members</p></div>
                        <div className="text-right"><p className={`font-black text-[14px] tracking-tighter ${g.balance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>₹{round(Math.abs(g.balance))}</p></div>
                      </div>
                    </Link>
                  )) : (
                    <div className="py-24 text-center space-y-4 opacity-20"><Layers size={32} className="mx-auto" /><p className="text-[9px] font-black uppercase tracking-widest">No Groups Found</p></div>
                  )}
                </div>
                <div className="w-1/2 flex-shrink-0 space-y-3">
                  {splitList.length > 0 ? splitList.map(g => (
                    <Link href={`/groups/${g._id}`} key={g._id} className="block p-4 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all group active:scale-[0.98] shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center relative border border-white/10 shadow-inner"><UserCircle size={20} className="text-white/10" /></div>
                        <div className="flex-1 min-w-0"><h3 className="font-bold text-white text-[14px] uppercase truncate tracking-tight">{g.name}</h3><p className="text-[8px] text-white/30 font-black uppercase mt-1 tracking-widest">Individual Split</p></div>
                        <div className="text-right"><p className={`font-black text-[14px] tracking-tighter ${g.balance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>₹{round(Math.abs(g.balance))}</p></div>
                      </div>
                    </Link>
                  )) : (
                    <div className="py-24 text-center space-y-4 opacity-20"><Activity size={32} className="mx-auto" /><p className="text-[9px] font-black uppercase tracking-widest">No Individual Splits</p></div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* VIEW 1: GROUPS */}
          <div className="w-1/4 h-full flex-shrink-0 overflow-y-auto no-scrollbar px-5 pb-24">
            <div className="mt-8 mb-8 grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/[0.03] border border-white/5 rounded-[2rem] shadow-xl"><p className="text-[8px] font-black text-white/20 uppercase mb-2 tracking-[0.3em]">Groups</p><p className="text-xl font-black text-white leading-none">{groups.length}</p></div>
              <div className="p-4 bg-white/[0.03] border border-white/5 rounded-[2rem] shadow-xl"><p className="text-[8px] font-black text-white/20 uppercase mb-2 tracking-[0.3em]">Status</p><p className="text-xl font-black text-emerald-400 leading-none">Sync On</p></div>
            </div>
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] ml-4 mb-4">Environment Handshake</p>
            <div className="space-y-2.5 px-1">
              {groups.map(g => (
                <Link href={`/groups/${g._id}`} key={g._id} className="block group">
                  <div className="flex items-center gap-4 p-4 rounded-[2rem] bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] transition-all active:scale-[0.98]">
                    <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center relative overflow-hidden border border-white/10">{g.groupPhoto ? <Image src={g.groupPhoto} alt={g.name} fill className="object-cover" /> : <Layers size={16} className="text-white/10" />}</div>
                    <div className="flex-1 min-w-0"><h3 className="font-bold text-white text-[13px] uppercase truncate tracking-tight">{g.name}</h3><p className="text-[8px] text-white/20 font-black mt-1 uppercase tracking-widest">{g.members.length} Members</p></div>
                    <ChevronRight size={16} className="text-white/20 group-hover:text-white" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* VIEW 2: ACTIVITY */}
          <div className="w-1/4 h-full flex-shrink-0 overflow-y-auto no-scrollbar px-5 pb-24">
            <div className="mt-8 mb-8 p-6 bg-white/[0.03] border border-white/5 rounded-[2.5rem] relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.05] blur-[80px] rounded-full"></div>
              <div className="flex justify-between items-start mb-6">
                 <div><h4 className="text-[8px] font-black text-white/20 uppercase tracking-[0.45em] mb-2 leading-none">This Month</h4><p className="text-2xl font-black text-white leading-none tracking-tight">₹{round(monthTotal)}</p></div>
                 <div className="text-right"><h4 className="text-[8px] font-black text-emerald-400/20 uppercase tracking-[0.45em] mb-2 leading-none">You Paid</h4><p className="text-lg font-black text-emerald-400 leading-none tracking-tight">₹{round(userPaidMonth)}</p></div>
              </div>
              <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-6"><div className="absolute top-0 left-0 h-full bg-emerald-500/40 transition-all duration-[1.5s]" style={{ width: `${payRatio}%` }}></div></div>
              <div className="flex justify-between items-center text-[7px] font-black uppercase text-white/20 tracking-widest">
                 <p>{round(payRatio)}% Paid by You</p>
                 <Activity size={10} className="text-emerald-500" />
              </div>
            </div>
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] ml-4 mb-4">Execution Stream</p>
            <div className="space-y-2.5 px-1">
              {expenses.map(e => (
                <div key={e._id} className="flex items-center gap-4 p-4 rounded-[2rem] bg-white/[0.02] border border-white/[0.04] transition-all hover:bg-white/[0.05]">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${e.paidBy._id === user._id ? 'bg-emerald-400/5 text-emerald-400' : 'bg-rose-400/5 text-rose-400'}`}>{e.paidBy._id === user._id ? <TrendingUp size={16} /> : <TrendingDown size={16} />}</div>
                  <div className="flex-1 min-w-0"><h3 className="font-bold text-white text-[13px] uppercase truncate tracking-tight">{e.title}</h3><p className="text-[8px] text-white/20 font-black uppercase mt-1 truncate tracking-widest"><span className="px-1 py-0.5 bg-white/5 rounded-md text-[7px] mr-1">{e.group.name.toUpperCase()}</span> {e.paidBy._id === user._id ? 'You' : e.paidBy.name.toUpperCase()}</p></div>
                  <div className="text-right font-black text-white text-[13px]">₹{round(e.amount)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* VIEW 3: SETTINGS */}
          <div className="w-1/4 h-full flex-shrink-0 overflow-y-auto no-scrollbar px-5 pb-24">
            <div className="mt-12 text-center pb-10">
              <div className="h-28 w-28 rounded-[3.25rem] bg-white/5 border border-white/10 p-1 relative mx-auto overflow-hidden shadow-2xl"><Image src={user.profilePhotoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="Profile" fill className="object-cover rounded-[3rem]" /></div>
              <h2 className="mt-6 text-xl font-black text-white uppercase tracking-widest leading-none">{user.name}</h2>
              <p className="text-[8px] text-white/30 font-black uppercase mt-2 tracking-[0.4em]">Verified User Node</p>
            </div>
            <div className="space-y-3 px-2 mb-16">
              {[ { icon: User, label: 'Profile Name', value: user.name.toUpperCase() }, { icon: Smartphone, label: 'Mobile Number', value: user.phone || '...' }, { icon: CreditCard, label: 'UPI ID', value: user.upiId || 'NOT LINKED' }].map(item => (
                <div key={item.label} className="flex items-center gap-4 p-5 bg-white/[0.03] border border-white/5 rounded-[2rem] active:scale-[0.98] transition-all">
                  <div className="h-9 w-9 bg-white/5 rounded-xl flex items-center justify-center"><item.icon size={16} className="text-white/30" /></div>
                  <div className="flex-1"><h3 className="font-bold text-white text-[11px] uppercase mb-0.5 tracking-tight">{item.label}</h3><p className="text-[9px] text-white/20 font-black uppercase tracking-widest leading-none">{item.value}</p></div>
                </div>
              ))}
              <button onClick={logout} className="w-full h-14 rounded-[2rem] bg-rose-500/5 border border-rose-500/10 flex items-center justify-between px-8 mt-10 active:scale-[0.98] transition-all group shadow-[0_15px_30px_rgba(244,63,94,0.1)]">
                <div className="font-black text-[11px] text-rose-500 uppercase tracking-widest">Logout</div>
                <LogOut size={18} className="text-rose-500" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Primary Floating Action Button (FAB) */}
      {activeViewIdx < 2 && (
         <button onClick={() => { setIsDrawerOpen(true); setDrawerStep(0); }} className="fixed bottom-[108px] right-8 h-15 w-15 bg-white rounded-[1.65rem] flex items-center justify-center shadow-2xl z-[110] border-[3px] border-black active:scale-[0.8] transition-all group overflow-hidden animate-in zoom-in-50 duration-500">
           <Plus size={28} strokeWidth={3.5} className="text-black group-hover:rotate-90 transition-transform duration-500" />
         </button>
      )}

      {/* NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 h-[88px] bg-black/80 backdrop-blur-[40px] border-t border-white/[0.08] flex z-[120] px-4 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
        {[ { icon: Home, label: 'Home' }, { icon: Users, label: 'Groups' }, { icon: PieChart, label: 'Activity' }, { icon: Settings, label: 'Settings' } ].map((item, idx) => {
           const active = activeViewIdx === idx;
           return (
            <button key={item.label} onClick={() => setActiveViewIdx(idx)} className={`flex-1 flex flex-col items-center justify-center gap-2 outline-none transition-all duration-500 ${active ? 'text-white' : 'text-white/20 hover:text-white/40'}`}>
              <item.icon size={22} strokeWidth={active ? 3.5 : 2} className={`transition-all duration-500 ${active ? 'scale-125 -translate-y-2' : ''}`} />
              <span className={`text-[8.5px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${active ? 'opacity-100 scale-105' : 'opacity-40'}`}>{item.label}</span>
            </button>
           )
        })}
        <div className="absolute bottom-0 h-[2.5px] bg-white transition-transform duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)]" style={{ width: '25%', transform: `translateX(${activeViewIdx * 100}%)`, left: 0 }}></div>
      </nav>

      {/* GLOBAL ACTION DRAWER */}
      <div className={`fixed inset-0 z-[160] bg-black/60 backdrop-blur-[20px] transition-all duration-700 ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className={`absolute bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-white/[0.1] rounded-t-[3.5rem] p-6 pb-12 transition-all duration-[700ms] ease-[cubic-bezier(0.19,1,0.22,1)] shadow-[0_-50px_100px_rgba(0,0,0,1)] ${isDrawerOpen ? 'translate-y-0' : 'translate-y-full'} ${drawerStep > 0 ? 'h-[85vh]' : 'h-[320px]'}`}>
          
          <div className="flex justify-between items-center mb-8 px-2 select-none">
            <h3 className="font-black text-[10px] tracking-[0.4em] text-white uppercase leading-none opacity-40">{drawerStep === 0 ? 'Protocol Select' : drawerStep === 1 ? 'New Group' : drawerStep === 2 ? 'Add Person' : 'Log Expense'}</h3>
            <button onClick={() => { setIsDrawerOpen(false); setDrawerStep(0); }} className="h-9 w-9 bg-white/5 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all"><X size={16} /></button>
          </div>
          
          <div className="relative h-[calc(100%-80px)] overflow-hidden">
             <div className="flex h-full transition-transform duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)]" style={{ width: '400%', transform: `translateX(-${drawerStep * 25}%)` }}>
                
                {/* STEP 0: ENTRY GRID (Optimized) */}
                <div className="w-1/4 flex-shrink-0 flex flex-col gap-4">
                   <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setDrawerStep(1)} className="h-28 bg-white/[0.03] border border-white/5 rounded-[2rem] flex flex-col items-center justify-center gap-3 text-white font-black text-[10px] uppercase transition-all hover:bg-white/[0.06] active:scale-95 group shadow-xl"><Users size={20} className="text-white/20 group-hover:text-white transition-all" /> Create Group</button>
                      <button onClick={() => setDrawerStep(2)} className="h-28 bg-white/[0.03] border border-white/5 rounded-[2rem] flex flex-col items-center justify-center gap-3 text-white font-black text-[10px] uppercase transition-all hover:bg-white/[0.06] active:scale-95 group shadow-xl"><UserCircle size={20} className="text-white/20 group-hover:text-white transition-all" /> Double Split</button>
                   </div>
                   <button onClick={() => setDrawerStep(3)} className="h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center justify-center gap-4 text-emerald-400 font-black text-[11px] uppercase tracking-[0.3em] transition-all hover:bg-emerald-500/20 active:scale-[0.98] shadow-2xl group"><CreditCard size={18} className="group-hover:scale-110 transition-transform duration-500" /> Log Expense</button>
                </div>

                {/* STEP 1: CREATE GROUP */}
                <div className="w-1/4 flex-shrink-0 flex flex-col space-y-8">
                   <div className="flex-1 overflow-y-auto no-scrollbar space-y-8 pb-4 pr-1">
                      <div className="space-y-3"><label className="text-[9px] font-black uppercase text-white/30 ml-2 tracking-widest">Identify Group</label><input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="ENTER NAME" className="w-full h-14 bg-white/[0.02] border border-white/10 rounded-2xl px-6 text-white font-black uppercase text-[13px] focus:outline-none focus:border-white/40 transition-all shadow-inner" /></div>
                      <div className="space-y-5"><label className="text-[9px] font-black uppercase text-white/30 ml-2 tracking-widest">Active Members ({selectedMembers.length}/10)</label>
                         {selectedMembers.length > 0 && <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">{selectedMembers.map(m => (<div key={m._id} className="flex-shrink-0 flex items-center gap-2.5 bg-white/5 border border-white/10 pl-1.5 pr-3.5 py-1.5 rounded-2xl shadow-xl transition-all"><div className="h-6 w-6 rounded-lg overflow-hidden border border-white/10"><Image src={m.profilePhotoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`} alt={m.name} width={24} height={24} /></div><span className="text-[9px] font-bold text-white uppercase">{m.name.split(' ')[0]}</span><button onClick={() => toggleMember(m)} className="text-white/20 hover:text-white"><X size={10} /></button></div>))}</div>}
                         <div className="relative"><input value={searchPhone} onChange={e => setSearchPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-DIGIT MOBILE NUMBER" className="w-full h-14 bg-white/[0.02] border border-white/10 rounded-2xl pl-12 pr-6 text-white font-black text-[10px] tracking-[0.2em] focus:border-white/30" /><Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" />{isSearchingContacts && <div className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 border-2 border-white/30 border-t-transparent rounded-full animate-spin"></div>}</div>
                         <div className="space-y-2">{searchResults.map(res => { const isSel = selectedMembers.some(m => m._id === res._id); return (<button key={res._id} onClick={() => toggleMember(res)} className={`w-full flex items-center gap-4 p-4 rounded-[2rem] border transition-all ${isSel ? 'bg-white/5 border-white/20 scale-[0.98]' : 'border-white/5 hover:bg-white/[0.01]'}`}><div className="h-9 w-9 rounded-2xl bg-white/10 overflow-hidden shadow-inner"><Image src={res.profilePhotoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${res.name}`} alt={res.name} width={36} height={36} /></div><div className="flex-1 text-left"><p className="font-bold text-white uppercase text-[12px]">{res.name}</p><p className="text-[8px] text-white/20 font-black tracking-widest">{res.phone}</p></div>{isSel && <Check size={14} className="text-emerald-400" />}</button>)})}</div>
                      </div>
                   </div>
                   <div className="flex gap-3 pt-6 border-t border-white/10 bg-[#0a0a0a]"><button onClick={() => setDrawerStep(0)} className="h-14 w-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/40 active:scale-95"><ArrowLeft size={18} /></button><button onClick={() => handleCreate(false)} disabled={!newGroupName || selectedMembers.length === 0 || isCreating} className="flex-1 h-14 bg-white text-black rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl disabled:opacity-20 active:scale-[0.98] transition-all">{isCreating ? 'Creating Group...' : 'Initialize Group'}</button></div>
                </div>

                {/* STEP 2: INDIVIDUAL SPLIT */}
                <div className="w-1/4 flex-shrink-0 flex flex-col space-y-8">
                   <div className="flex-1 overflow-y-auto no-scrollbar space-y-8 pb-4 pr-1">
                      <div className="space-y-3"><label className="text-[9px] font-black uppercase text-white/30 ml-2 tracking-widest">Entry Name</label><input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="E.G. RENT, DINNER" className="w-full h-14 bg-white/[0.02] border border-white/10 rounded-2xl px-6 text-white font-black uppercase text-[13px] shadow-inner focus:border-white/40" /></div>
                      <div className="space-y-5"><label className="text-[9px] font-black uppercase text-white/30 ml-2 tracking-widest">Locate Peer</label>
                         {selectedMembers.length > 0 && <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-[2rem] shadow-xl animate-in fade-in zoom-in-95"><div className="h-10 w-10 rounded-2xl overflow-hidden border border-white/20 shadow-inner"><Image src={selectedMembers[0].profilePhotoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedMembers[0].name}`} alt={selectedMembers[0].name} width={40} height={40} /></div><div className="flex-1 text-left"><p className="font-bold text-white uppercase text-[12px]">{selectedMembers[0].name}</p><p className="text-[8px] text-white/20 font-black uppercase tracking-widest">{selectedMembers[0].phone}</p></div><button onClick={() => setSelectedMembers([])} className="h-8 w-8 bg-white/5 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all"><X size={14} /></button></div>}
                         <div className="relative"><input value={searchPhone} onChange={e => setSearchPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-DIGIT MOBILE NUMBER" className="w-full h-14 bg-white/[0.02] border border-white/10 rounded-2xl pl-12 pr-6 text-white font-black text-[10px] tracking-widest" /><Smartphone size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" /></div>
                         <div className="space-y-2">{searchResults.map(res => (<button key={res._id} onClick={() => setSelectedMembers([res])} className="w-full flex items-center gap-4 p-4 rounded-[2rem] border border-white/5 bg-transparent hover:bg-white/[0.05] group transition-all active:scale-[0.98] shadow-lg"><div className="h-9 w-9 rounded-2xl bg-white/10 overflow-hidden shadow-inner"><Image src={res.profilePhotoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${res.name}`} alt={res.name} width={36} height={36} /></div><div className="flex-1 text-left"><p className="font-bold text-white uppercase text-[12px] group-hover:text-emerald-400 transition-colors uppercase">{res.name}</p><p className="text-[8px] text-white/20 font-black tracking-widest uppercase">{res.phone}</p></div><ChevronRight size={16} className="text-white/20 group-hover:text-white" /></button>))}</div>
                      </div>
                   </div>
                   <div className="flex gap-3 pt-6 border-t border-white/10 bg-[#0a0a0a]"><button onClick={() => setDrawerStep(0)} className="h-14 w-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/40 active:scale-95"><ArrowLeft size={18} /></button><button onClick={() => handleCreate(true)} disabled={selectedMembers.length === 0 || isCreating} className="flex-1 h-14 bg-white text-black rounded-2xl font-black text-[11px] uppercase tracking-widest disabled:opacity-20 active:scale-[0.98] transition-all shadow-2xl">{isCreating ? 'Linking...' : 'Add Individual'}</button></div>
                </div>

                {/* STEP 3: LOG EXPENSE */}
                <div className="w-1/4 flex-shrink-0 flex flex-col space-y-8">
                   <div className="flex-1 overflow-y-auto no-scrollbar space-y-7 pb-4 pr-1">
                      <div className="space-y-3"><label className="text-[9px] font-black uppercase text-white/30 ml-2 tracking-widest">Amount</label><div className="relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 font-black text-lg select-none">₹</span><input value={expAmount} onChange={e => setExpAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" className="w-full h-14 bg-white/[0.02] border border-white/10 rounded-2xl pl-12 pr-6 text-white font-black text-[18px] tracking-tighter focus:border-white/40 shadow-inner" /></div></div>
                      <div className="space-y-3"><label className="text-[9px] font-black uppercase text-white/30 ml-2 tracking-widest">Description</label><input value={expTitle} onChange={e => setExpTitle(e.target.value)} placeholder="ENTER LABEL" className="w-full h-14 bg-white/[0.02] border border-white/10 rounded-2xl px-6 text-white font-black uppercase text-[13px] shadow-inner focus:border-white/40" /></div>
                      <div className="space-y-4"><label className="text-[9px] font-black uppercase text-white/30 ml-2 tracking-widest">Select Target Workspace</label>
                         <div className="space-y-2">
                            {groups.map(g => {
                               const active = targetGroupId === g._id;
                               return (
                                  <button key={g._id} onClick={() => setTargetGroupId(g._id)} className={`w-full flex items-center gap-4 p-4 rounded-[2rem] border transition-all active:scale-[0.98] shadow-lg ${active ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-transparent border-white/5 hover:bg-white/[0.02]'}`}>
                                     <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center relative overflow-hidden border border-white/10">{g.groupPhoto ? <Image src={g.groupPhoto} alt={g.name} fill className="object-cover" /> : <Layers size={16} className="text-white/10" />}</div>
                                     <div className="flex-1 text-left"><p className={`font-bold text-[12px] uppercase tracking-tight ${active ? 'text-emerald-400' : 'text-white'}`}>{g.name}</p><p className="text-[8px] text-white/20 font-black uppercase tracking-widest leading-none">{g.members.length} Members</p></div>
                                     {active && <div className="h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]"><Check size={12} strokeWidth={4} className="text-black" /></div>}
                                  </button>
                               )
                            })}
                         </div>
                      </div>
                   </div>
                   <div className="flex gap-3 pt-6 border-t border-white/10 bg-[#0a0a0a]"><button onClick={() => setDrawerStep(0)} className="h-14 w-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/40 active:scale-95"><ArrowLeft size={18} /></button><button onClick={handleLogExpense} disabled={!expAmount || !expTitle || !targetGroupId || isCreating} className="flex-1 h-14 bg-emerald-500 text-black rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-[0_20px_50px_-10px_rgba(16,185,129,0.4)] transition-all active:scale-[0.98] disabled:opacity-20">{isCreating ? 'Recording...' : 'Record Expense'}</button></div>
                </div>

             </div>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 h-1 w-12 bg-white/10 rounded-full"></div>
        </div>
      </div>
    </div>
  )
}
