'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { API_URL } from '@/config'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [upiId, setUpiId] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password, upiId }),
      })

      const data = await response.json()

      if (response.ok) {
        // Backend doesn't return token on register, redirect to login
        router.push('/login?registered=true')
      } else {
        setError(data.message || 'Registration failed. Please try again.')
      }
    } catch (err) {
      setError('Connection error. Please check your internet.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-black">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <div className="h-20 w-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 mb-4 overflow-hidden">
             <Image 
              src="/icon.png" 
              alt="EQUALY Logo" 
              width={60} 
              height={60} 
              className="object-contain"
             />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">EQUALY</h1>
          <p className="mt-2 text-white/50 text-sm">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold text-center">
              {error}
            </div>
          )}
          
          <input
            type="text"
            required
            className="w-full px-6 py-4 text-white bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-medium placeholder:text-white/20"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="tel"
            required
            className="w-full px-6 py-4 text-white bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-medium placeholder:text-white/20"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <input
            type="text"
            className="w-full px-6 py-4 text-white bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-medium placeholder:text-white/20"
            placeholder="UPI ID (Optional)"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
          />

          <input
            type="password"
            required
            className="w-full px-6 py-4 text-white bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-medium placeholder:text-white/20"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-4 text-black font-black uppercase tracking-widest bg-white rounded-2xl hover:bg-white/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-white/40 text-sm font-medium">
          Already have an account?{' '}
          <Link href="/login" className="text-white font-bold underline underline-offset-4 decoration-white/20 hover:decoration-white transition-all">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
