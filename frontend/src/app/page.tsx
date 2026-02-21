'use client'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.push('/dashboard')
  }, [user, loading])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4"
          style={{ background: 'linear-gradient(135deg, #080c0f 0%, #0d1f0d 50%, #080c0f 100%)' }}>

      {/* Hero */}
      <div className="text-center max-w-2xl">
        <div className="text-6xl mb-4">🌾</div>
        <h1 className="text-4xl font-bold mb-3"
            style={{ color: '#4ade80' }}>
          KrishiSat AI
        </h1>
        <p className="text-lg mb-2" style={{ color: '#86efac' }}>
          Satellite-Based Crop Disease Early Warning System
        </p>
        <p className="mb-8 text-sm" style={{ color: '#6b7280' }}>
          AI-powered disease detection for Indian farmers using Sentinel-2 satellite imagery
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { n: '91.75%', l: 'Detection Accuracy' },
            { n: '96',     l: 'Disease Classes' },
            { n: '7 Days', l: 'Risk Forecast' },
          ].map(s => (
            <div key={s.l} className="card text-center">
              <div className="text-2xl font-bold" style={{ color: '#4ade80' }}>{s.n}</div>
              <div className="text-xs mt-1" style={{ color: '#6b7280' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <button className="btn-primary text-sm px-8 py-3">
              🚀 Login
            </button>
          </Link>
          <Link href="/register">
            <button className="text-sm px-8 py-3 rounded-xl font-semibold transition-all"
                    style={{
                      background: '#111827',
                      border    : '1px solid #166534',
                      color     : '#4ade80'
                    }}>
              📝 Register
            </button>
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl w-full">
        {[
          { icon: '🔬', title: 'Disease Detection',  desc: 'Upload crop photo → instant disease identification with 91.75% accuracy' },
          { icon: '📡', title: 'Satellite Monitoring', desc: 'Sentinel-2 NDVI analysis for real-time crop health monitoring' },
          { icon: '📈', title: '7-Day Forecast',      desc: 'BiLSTM model predicts disease risk for next 7 days' },
        ].map(f => (
          <div key={f.title} className="card text-center">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-semibold mb-2" style={{ color: '#4ade80' }}>{f.title}</h3>
            <p className="text-xs" style={{ color: '#6b7280' }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
