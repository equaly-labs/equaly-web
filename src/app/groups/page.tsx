'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Plus, Users, Search, RefreshCw, Layers, UserCircle, ArrowRight, Share2, MoreHorizontal } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { API_URL } from '@/config'

interface Group {
  _id: string
  name: string
  balance: number
  members: any[]
  groupPhoto?: string
}

export default function GroupsPage() {
  const { user, token, isLoading: authLoading } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const initialized = useRef(false)

  const round = (num: number) => num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const fetchGroups = useCallback(async (showIndicator = true) => {
    if (!token) return
    if (showIndicator) setIsLoading(true)
    else setRefreshing(true)

    try {
      const response = await fetch(`${API_URL}/api/groups`, {
        headers: { 'Authorization': `${token}` },
        cache: 'no-store'
      })
      if (response.ok) {
        const data = await response.json()
        setGroups(data)
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => {
    if (!authLoading && user && !initialized.current) {
      initialized.current = true
      fetchGroups(true)
    }
  }, [authLoading, user, fetchGroups])

  if (authLoading || (isLoading && groups.length === 0)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-4 w-4 border border-white/5 border-t-white/30 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex flex-col min-h-screen bg-black page-transition relative overflow-x-hidden">
      <header className="px-6 py-6 flex justify-between items-center bg-black/60 backdrop-blur-3xl sticky top-0 z-50 border-b border-white/10">
        <div className="flex flex-col">
          <h1 className="text-sm font-black tracking-tighter text-white uppercase leading-none">Environments</h1>
          <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> Active Clusters
          </p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => fetchGroups(false)}
            className={`h-8 w-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all group shadow-lg ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={12} className="text-white/60 group-hover:text-white" />
          </button>
          <Link href="/groups/create">
            <button className="h-8 w-8 bg-white text-black border border-white/10 rounded-lg flex items-center justify-center hover:bg-neutral-100 transition-all group shadow-xl">
               <Plus size={14} strokeWidth={3} className="text-black" />
            </button>
          </Link>
        </div>
      </header>

      <main className="flex-1 pb-32 px-4 select-none">
        {/* Statistics Cluster */}
        <section className="mt-8 mb-12 grid grid-cols-2 gap-4 px-2">
           <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[2rem] shadow-lg">
              <h4 className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Total Nodes</h4>
              <p className="text-2xl font-black text-white tracking-widest leading-none">{groups.length}</p>
           </div>
           <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[2rem] shadow-lg">
              <h4 className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Active Split</h4>
              <p className="text-2xl font-black text-emerald-400 tracking-widest leading-none">100%</p>
           </div>
        </section>

        {/* Dynamic Groups List */}
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 ml-6 mb-6">Directory Listing</p>
        <section className="space-y-3.5 px-1 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {groups.length > 0 ? (
            groups.map((group) => (
              <Link href={`/groups/${group._id}`} key={group._id} className="block group">
                <div className="flex items-center gap-5 p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all hover:translate-x-1 shadow-lg relative overflow-hidden">
                   {/* Background Gradient Detail */}
                   <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.02] blur-3xl rounded-full transition-all duration-700 group-hover:bg-white/[0.05]"></div>
                   
                   <div className="h-14 w-14 rounded-2xl overflow-hidden border border-white/5 bg-white/5 flex items-center justify-center flex-shrink-0 relative shadow-inner group-hover:border-white/20 group-hover:scale-105 transition-all">
                      {group.groupPhoto ? (
                        <Image src={group.groupPhoto} alt={group.name} fill className="object-cover transition-opacity duration-700 opacity-80 group-hover:opacity-100" />
                      ) : null}
                      <Layers size={18} className="text-white/10 group-hover:text-white/40" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-[15px] tracking-tight truncate group-hover:text-white uppercase transition-all">{group.name}</h3>
                      <div className="flex items-center gap-2 mt-1.5 opacity-60">
                         <Users size={10} className="text-white/40" />
                         <p className="text-[9px] text-white/30 font-black uppercase tracking-widest">{group.members.length} Entities Enrolled</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="h-10 w-10 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-white/40 group-hover:text-white group-hover:bg-white/10 transition-all">
                         <ArrowRight size={18} />
                      </div>
                   </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="py-24 text-center space-y-6">
              <div className="h-20 w-20 bg-white/[0.02] rounded-[2rem] border border-white/5 flex items-center justify-center mx-auto shadow-inner shadow-white/10">
                <Layers size={24} className="text-white/10" />
              </div>
              <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em]">No Active Clusters Found</p>
              <Link href="/groups/create">
                 <button className="px-8 py-3 bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_15px_40px_rgba(255,255,255,0.15)]">Initialize New Cluster</button>
              </Link>
            </div>
          )}
        </section>

        {/* Signature Branding Detail */}
        <div className="mt-20 py-10 opacity-[0.05] border-t border-white/10 text-center">
           <Image src="/icon.png" alt="Signature" width={32} height={32} className="mx-auto mb-6 grayscale" />
           <p className="text-[10px] font-black uppercase tracking-[1em] text-white ml-2">EQUALY SYSTEM DIRECTORY</p>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
