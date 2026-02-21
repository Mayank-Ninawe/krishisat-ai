'use client'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { registerFarmer } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

  const inputStyle = {
    background: '#0d1117',
    border    : '1px solid #1f2937',
    color     : '#e2e8f0',
    fontSize  : '16px'
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8"
          style={{ background: '#080c0f' }}>
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌾</div>
          <h1 className="text-2xl font-bold" style={{ color: '#4ade80' }}>
            Join KrishiSat AI
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
            Register as a farmer
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            {[
              { label:'Full Name',    key:'name',     type:'text',     ph:'Ramesh Patil'    },
              { label:'Email',        key:'email',    type:'email',    ph:'ramesh@email.com'},
              { label:'Password',     key:'password', type:'password', ph:'Min 6 characters'},
              { label:'Village',      key:'village',  type:'text',     ph:'Sinnar'          },
              { label:'District',     key:'district', type:'text',     ph:'Nashik'          },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs mb-1 block" style={{ color: '#9ca3af' }}>
                  {f.label}
                </label>
                <input
                  type={f.type}
                  placeholder={f.ph}
                  value={(form as any)[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  required={['name','email','password'].includes(f.key)}
                  className="w-full px-4 py-3 rounded-lg outline-none"
                  style={inputStyle}
                />
              </div>
            ))}

            {error && (
              <p className="text-xs text-red-400 text-center">{error}</p>
            )}

            <button type="submit" className="btn-primary w-full mt-2"
                    disabled={loading}>
              {loading ? 'Registering...' : '📝 Create Account'}
            </button>
          </form>

          <p className="text-center text-xs mt-4" style={{ color: '#6b7280' }}>
            Already registered?{' '}
            <Link href="/login"
                  style={{ color: '#4ade80' }}
                  className="font-semibold hover:underline">
              Login karo
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
