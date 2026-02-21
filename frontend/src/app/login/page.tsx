'use client'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

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
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-grid flex items-center justify-center px-4">

      {/* Background orbs */}
      <div style={{
        position: 'fixed', top: '15%', left: '10%',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(74,222,128,0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }}/>
      <div style={{
        position: 'fixed', bottom: '15%', right: '10%',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(96,165,250,0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }}/>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="text-6xl mb-4 inline-block">
            🌾
          </motion.div>
          <h1 className="text-3xl font-black" style={{ color: '#f1f5f9' }}>
            Welcome back
          </h1>
          <p className="text-sm mt-2" style={{ color: '#64748b' }}>
            Login to KrishiSat AI
          </p>
        </div>

        {/* Card */}
        <div className="glass p-6 sm:p-8">
          <form onSubmit={handleLogin} className="flex flex-col gap-5">

            {['Email', 'Password'].map((label, i) => (
              <motion.div key={label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}>
                <label className="text-xs font-semibold mb-2 block"
                       style={{ color: '#94a3b8' }}>
                  {label}
                </label>
                <input
                  type={label === 'Password' ? 'password' : 'email'}
                  value={label === 'Email' ? email : password}
                  onChange={e => label === 'Email'
                    ? setEmail(e.target.value)
                    : setPassword(e.target.value)}
                  placeholder={label === 'Email' ? 'ramesh@example.com' : '••••••••'}
                  required
                  className="input-field"
                />
              </motion.div>
            ))}

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-center py-2 px-3 rounded-lg"
                  style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
                  ⚠️ {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="btn-primary w-full mt-2 py-3.5">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    ⏳
                  </motion.span>
                  Logging in...
                </span>
              ) : '🚀 Login'}
            </motion.button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: '#64748b' }}>
            Account nahi hai?{' '}
            <Link href="/register"
                  className="font-bold hover:underline"
                  style={{ color: '#4ade80' }}>
              Register karo
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
