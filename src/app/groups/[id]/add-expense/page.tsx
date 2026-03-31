'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Receipt, Check, Users, Split, ShieldCheck, Info } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { API_URL } from '@/config'
import { useAuth } from '@/context/AuthContext'

export default function AddExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  const groupId = resolvedParams.id
  const { token, user } = useAuth()
  const router = useRouter()
  
  const [group, setGroup] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [selectedPayee, setSelectedPayee] = useState<string | null>(null)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchGroup = useCallback(async () => {
    if (!token) return
    try {
      const response = await fetch(`${API_URL}/api/groups`, {
        headers: { 'Authorization': `${token}` }
      })
      if (response.ok) {
        const allGroups = await response.json()
        const found = allGroups.find((g: any) => g._id === groupId)
        if (found) {
          setGroup(found)
          setSelectedPayee(user?._id || found.members[0]._id)
          setSelectedMembers(found.members.map((m: any) => m._id))
        }
      }
    } catch (error) {
      console.error('Fetch group failed:', error)
    }
  }, [token, groupId, user])

  useEffect(() => {
    fetchGroup()
  }, [fetchGroup])

  const toggleMember = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      if (selectedMembers.length > 1) {
        setSelectedMembers(selectedMembers.filter(id => id !== memberId))
      }
    } else {
      setSelectedMembers([...selectedMembers, memberId])
    }
  }

  const handleAdd = async () => {
    if (!title || !amount || !selectedPayee || selectedMembers.length === 0 || isSubmitting) return
    setIsSubmitting(true)
    const numAmount = parseFloat(amount)
    const splitAmount = numAmount / selectedMembers.length
    const splits = selectedMembers.map(mId => ({
      user: mId,
      amount: splitAmount,
      isSettled: false
    }))
    try {
      const response = await fetch(`${API_URL}/api/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${token}`
        },
        body: JSON.stringify({
          title: title.toUpperCase(),
          amount: numAmount,
          group: groupId,
          splits
        })
      })
      if (response.ok) {
        router.push(`/groups/${groupId}`)
      }
    } catch (error) {
      console.error('Add expense failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!group || !user) return null

  return (
    <div className="flex flex-col min-h-screen bg-black page-transition">
      <header className="px-6 py-8 flex justify-between items-center bg-black/40 backdrop-blur-2xl sticky top-0 z-50 border-b border-white/[0.03]">
        <div className="flex items-center gap-4">
           <Link href={`/groups/${groupId}`} className="h-9 w-9 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-center hover:bg-white/[0.05] transition-all">
              <ChevronLeft size={18} className="text-white" />
           </Link>
           <h1 className="text-sm font-bold tracking-tight text-white uppercase">New Activity</h1>
        </div>
        <button 
          onClick={handleAdd}
          disabled={!title || !amount || isSubmitting}
          className="px-6 py-2 bg-white text-black font-bold uppercase tracking-widest text-[9px] rounded-full hover:bg-neutral-200 transition-all active:scale-90"
        >
          {isSubmitting ? '...' : 'Confirm'}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-6 pb-24">
        <section className="mt-10 space-y-8 flex flex-col items-center">
           <div className="relative w-full max-w-xs transition-all animate-in zoom-in-95 duration-500">
              <span className="absolute -left-8 top-1/2 -translate-y-1/2 text-2xl font-bold text-white/5 tracking-tighter">₹</span>
              <input 
                 type="number"
                 placeholder="0"
                 autoFocus
                 className="w-full bg-transparent text-center text-5xl font-bold tracking-tighter text-white border-none focus:outline-none focus:ring-0 placeholder:text-white/5"
                 value={amount}
                 onChange={(e) => setAmount(e.target.value)}
              />
           </div>
           <input 
              type="text"
              placeholder="Record reference"
              className="w-full max-w-sm bg-transparent border-b border-white/5 focus:border-white py-3 text-center text-base font-bold tracking-tight text-white focus:outline-none transition-all placeholder:text-white/5"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
           />
        </section>

        <section className="mt-12 space-y-6">
           <div className="flex justify-between items-center px-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/20">Participants</p>
           </div>
           <div className="grid grid-cols-2 gap-3">
              {group.members.map((member: any) => {
                 const isSelected = selectedMembers.includes(member._id)
                 return (
                   <div 
                     key={member._id}
                     onClick={() => toggleMember(member._id)}
                     className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all active:scale-[0.97] ${isSelected ? 'bg-white/5 border-white/10' : 'bg-transparent border-white/[0.03] grayscale opacity-30 hover:opacity-70 hover:grayscale-0'}`}
                   >
                      <div className="h-9 w-9 rounded-xl overflow-hidden border border-white/5 bg-white/[0.02]">
                         <Image 
                           src={member.profilePhotoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} 
                           alt={member.name} 
                           width={36} 
                           height={36} 
                         />
                      </div>
                      <div className="flex-1 min-w-0">
                         <span className="text-[11px] font-bold text-white uppercase truncate block tracking-tight">{member.name.split(' ')[0]}</span>
                      </div>
                      {isSelected && (
                         <div className="h-4 w-4 bg-white rounded-full flex items-center justify-center border border-black/10">
                            <Check size={9} className="text-black" />
                         </div>
                      )}
                   </div>
                 )
              })}
           </div>
        </section>

        <section className="mt-12">
           <div className="bg-white/5 border border-white/[0.03] rounded-2xl p-8 space-y-6">
              <div className="flex items-center gap-3">
                 <div className="h-8 w-8 bg-white rounded-xl flex items-center justify-center shadow-xl">
                    <Split size={14} className="text-black" />
                 </div>
                 <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-white">Summary</h4>
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between items-end border-b border-white/[0.05] pb-3">
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.15em]">Total</p>
                    <p className="text-xl font-bold tracking-tight text-white">₹{(parseFloat(amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                 </div>
                 <div className="flex justify-between items-end pt-1">
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.15em]">Per Unit</p>
                    <div className="text-right">
                       <p className="text-xl font-bold tracking-tight text-emerald-400">
                          ₹{(selectedMembers.length > 0 ? (parseFloat(amount) || 0) / selectedMembers.length : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                       </p>
                       <p className="text-[8px] font-bold text-white/5 uppercase tracking-[0.05em] mt-1 flex items-center gap-1 justify-end">Verified <ShieldCheck size={8} className="text-emerald-500/20" /></p>
                    </div>
                 </div>
              </div>
           </div>
        </section>
      </main>
    </div>
  )
}
