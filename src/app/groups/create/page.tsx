'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Camera, UserPlus, X, Search, Check, Layers } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { API_URL } from '@/config'
import { useAuth } from '@/context/AuthContext'

interface Contact {
  _id: string
  name: string
  phone: string
  profilePhotoUrl?: string
}

export default function CreateGroupPage() {
  const { token, user } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [searchPhone, setSearchPhone] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<Contact[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Contact[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSearch = async () => {
    if (!searchPhone || !token) return
    setIsSearching(true)
    try {
      const response = await fetch(`${API_URL}/api/auth/check-contacts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `${token}`
        },
        body: JSON.stringify({ phones: [searchPhone] })
      })
      if (response.ok) {
        const results = await response.json()
        setSearchResults(results)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const toggleMember = (member: Contact) => {
    if (selectedMembers.some(m => m._id === member._id)) {
      setSelectedMembers(selectedMembers.filter(m => m._id !== member._id))
    } else {
      setSelectedMembers([...selectedMembers, member])
    }
  }

  const handleCreate = async () => {
    if (!name || isSubmitting) return
    setIsSubmitting(true)
    
    try {
      const memberIds = selectedMembers.map(m => m._id)
      const response = await fetch(`${API_URL}/api/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${token}`
        },
        body: JSON.stringify({
          name: name.toUpperCase(),
          members: memberIds
        })
      })

      if (response.ok) {
        router.push('/')
      }
    } catch (error) {
      console.error('Group creation failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-black page-transition">
      <header className="px-6 py-8 flex justify-between items-center bg-black/40 backdrop-blur-2xl sticky top-0 z-50 border-b border-white/[0.03]">
        <div className="flex items-center gap-4">
           <Link href="/" className="h-9 w-9 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-center hover:bg-white/[0.05] transition-all">
              <ChevronLeft size={18} className="text-white" />
           </Link>
           <h1 className="text-sm font-bold tracking-tight text-white uppercase">New Environment</h1>
        </div>
        <button 
          onClick={handleCreate}
          disabled={!name || isSubmitting}
          className="px-6 py-2 bg-white text-black font-bold uppercase tracking-widest text-[9px] rounded-full hover:bg-neutral-200 transition-all active:scale-90"
        >
          {isSubmitting ? '...' : 'Launch'}
        </button>
      </header>

      <main className="p-6 space-y-10 flex-1 overflow-y-auto no-scrollbar">
        <section className="flex flex-col items-center mt-6">
           <div className="relative group mb-8 transition-transform active:scale-95 duration-500">
              <div className="h-28 w-28 bg-white/[0.01] border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-white/5 hover:text-white/10 hover:border-white/10 transition-all overflow-hidden shadow-2xl">
                <Camera size={24} />
                <span className="text-[8px] font-bold uppercase tracking-[0.15em] mt-2.5">Identity</span>
              </div>
           </div>
           
           <div className="w-full max-w-xs">
              <input 
                 type="text"
                 placeholder="LABEL YOUR RECORDS"
                 className="w-full bg-transparent border-b border-white/5 focus:border-white py-4 text-center text-lg font-bold uppercase tracking-tight text-white focus:outline-none transition-all placeholder:text-white/5"
                 value={name}
                 onChange={(e) => setName(e.target.value)}
              />
           </div>
        </section>

        <section className="space-y-8">
           <div className="flex justify-between items-center px-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/20">Collaborators</p>
           </div>

           <div className="flex flex-wrap gap-2.5">
              {selectedMembers.map(m => (
                 <div key={m._id} className="flex items-center gap-2.5 bg-white/5 pl-1 pr-3 py-1 rounded-full border border-white/5 shadow-2xl animate-in zoom-in-95 duration-300">
                    <div className="h-6 w-6 rounded-full overflow-hidden border border-white/10 bg-white/[0.02]">
                       <Image src={m.profilePhotoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`} alt={m.name} width={24} height={24} />
                    </div>
                    <span className="text-[9px] font-bold text-white uppercase tracking-tight">{m.name.split(' ')[0]}</span>
                    <button onClick={() => toggleMember(m)} className="text-white/10 hover:text-white transition-colors ml-0.5">
                       <X size={10} strokeWidth={3} />
                    </button>
                 </div>
              ))}
           </div>

           <div className="relative group">
              <input 
                type="tel"
                placeholder="CONTACT REFERENCE NUMBER"
                className="w-full bg-white/[0.01] border border-white/[0.03] rounded-2xl py-5 pl-7 pr-14 text-white font-bold tracking-[0.15em] text-[10px] focus:outline-none focus:border-white/10 transition-all placeholder:text-white/5 shadow-2xl"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 h-10 w-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all disabled:opacity-10"
              >
                {isSearching ? <div className="h-4 w-4 border-2 border-white/10 border-t-white/40 rounded-full animate-spin"></div> : <Search size={16} className="text-white/40 shadow-xl" />}
              </button>
           </div>

           <div className="space-y-2.5 max-h-[350px] overflow-y-auto no-scrollbar pb-8">
              {searchResults.length > 0 ? (
                searchResults.map(result => {
                  const isSelected = selectedMembers.some(m => m._id === result._id)
                  return (
                    <div 
                      key={result._id} 
                      onClick={() => toggleMember(result)}
                      className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer active:scale-[0.98] ${isSelected ? 'bg-white/5 border-white/10 shadow-xl' : 'bg-transparent border-white/[0.02] hover:bg-white/[0.01] hover:border-white/5'}`}
                    >
                       <div className="h-10 w-10 rounded-xl overflow-hidden border border-white/5 bg-white/[0.01]">
                          <Image src={result.profilePhotoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.name}`} alt={result.name} width={40} height={40} />
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-[14px] tracking-tight">{result.name.toUpperCase()}</p>
                          <p className="text-[9px] font-bold text-white/10 uppercase tracking-[0.05em] mt-1">{result.phone}</p>
                       </div>
                       <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-white border-white shadow-xl' : 'border-white/[0.05] group-hover:border-white/20'}`}>
                          {isSelected && <Check size={12} className="text-black" strokeWidth={3} />}
                       </div>
                    </div>
                  )
                })
              ) : searchPhone.length >= 10 && !isSearching ? (
                 <div className="text-center py-20 opacity-10 border-2 border-dashed border-white/5 rounded-2xl">
                    <Layers size={36} className="mx-auto mb-3" />
                    <p className="text-[8px] font-bold tracking-[0.2em] uppercase">No trace detected</p>
                 </div>
              ) : null}
           </div>
        </section>
      </main>
    </div>
  )
}
