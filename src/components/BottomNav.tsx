'use client'

import React from 'react'
import { Home, Settings, PieChart, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Users, label: 'Groups', href: '/groups' },
  { icon: PieChart, label: 'Activity', href: '/activity' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const activeIndex = navItems.findIndex(item => 
    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
  )

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-black/80 backdrop-blur-3xl border-t border-white/10 flex justify-between items-center safe-area-inset-bottom shadow-[0_-20px_50px_rgba(0,0,0,0.5)] h-[72px] px-2">
      {/* Sliding Highlight System */}
      <div 
        className="absolute bottom-0 h-[2px] bg-white transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform shadow-[0_0_15px_white]"
        style={{ 
          width: `${100 / navItems.length}%`,
          transform: `translateX(${activeIndex * 100}%)`
        }}
      ></div>

      {navItems.map((item, idx) => {
        const Icon = item.icon
        const isActive = activeIndex === idx
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex-1 flex flex-col items-center gap-1.5 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform h-full justify-center ${
              isActive ? 'text-white translate-y-[-4px] scale-105' : 'text-white/20 hover:text-white/40'
            }`}
          >
            <div className="relative">
              <Icon size={20} strokeWidth={isActive ? 3.5 : 2} />
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full animate-in zoom-in-50 duration-500 shadow-[0_0_10px_white]"></div>
              )}
            </div>
            <span className={`text-[8px] font-black uppercase tracking-[0.1em] transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
