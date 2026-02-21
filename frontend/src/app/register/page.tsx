'use client'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { registerFarmer } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export default function RegisterPage() {
  const { login } = useAuth()
  const router    = useRouter()
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    village: '', district: ''
  })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await registerFarmer(form)
      await login(form.email, form.password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { label:'Full Name',    key:'name',     type:'text',     ph:'Ramesh Patil',     req: true  },
    { label:'Email',        key:'email',    type:'email',    ph:'ramesh@email.com', req: true  },
    { label:'Password',     key:'password', type:'password', ph:'Min 6 characters', req: true  },
    { label:'Village',      key:'village',  type:'text',     ph:'Sinnar',           req: false },
    { label:'District',     key:'district', type:'text',     ph:'Nashik',           req: false },
  ]

  return (
    <div className="min-h-screen bg-grid flex items-center justify-center px-4 py-8">

      <div style={{
        position: 'fixed', top: '10%', right: '10%',
        width: '350px', height: '350px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(74,222,128,0.05) 0%, transparent 70%)',
        pointerEvents: 'none'
      }}/>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md">

        <div className="text-center mb-7">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-6xl mb-4 inline-block">
            🌾
          </motion.div>
          <h1 className="text-3xl font-black">Join <span style={{ color: '#4ade80' }}>KrishiSat AI</span></h1>
          <p className="text-sm mt-2" style={{ color: '#64748b' }}>
            Register as a farmer — it's free!
          </p>
        </div>

        <div className="glass p-6 sm:p-8">
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            {fields.map((f, i) => (
              <motion.div key={f.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}>
                <label className="text-xs font-semibold mb-1.5 block"
                       style={{ color: '#94a3b8' }}>
                  {f.label}
                  {!f.req && <span className="ml-1 opacity-50">(optional)</span>}
                </label>
                <input
                  type={f.type}
                  placeholder={f.ph}
                  value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  required={f.req}
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
              className="btn-primary w-full py-3.5 mt-1">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    ⏳
                  </motion.span>
                  Creating account...
                </span>
              ) : '📝 Create Account →'}
            </motion.button>
          </form>

          <p className="text-center text-xs mt-5" style={{ color: '#64748b' }}>
            Already have account?{' '}
            <Link href="/login"
                  className="font-bold hover:underline"
                  style={{ color: '#4ade80' }}>
              Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
