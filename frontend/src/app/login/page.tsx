'use client'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const { login } = useAuth()
  const router    = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4"
          style={{ background: '#080c0f' }}>
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌾</div>
          <h1 className="text-2xl font-bold" style={{ color: '#4ade80' }}>
            Welcome Back
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
            Login to KrishiSat AI
          </p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#9ca3af' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ramesh@example.com"
                required
                className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                style={{
                  background  : '#0d1117',
                  border      : '1px solid #1f2937',
                  color       : '#e2e8f0',
                  fontSize    : '16px'
                }}
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#9ca3af' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                style={{
                  background: '#0d1117',
                  border    : '1px solid #1f2937',
                  color     : '#e2e8f0',
                  fontSize  : '16px'
                }}
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 text-center">{error}</p>
            )}

            <button type="submit" className="btn-primary w-full mt-2"
                    disabled={loading}>
              {loading ? 'Logging in...' : '🚀 Login'}
            </button>
          </form>

          <p className="text-center text-xs mt-4" style={{ color: '#6b7280' }}>
            Account nahi hai?{' '}
            <Link href="/register"
                  style={{ color: '#4ade80' }}
                  className="font-semibold hover:underline">
              Register karo
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
