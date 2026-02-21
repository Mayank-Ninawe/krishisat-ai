'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { getFarmerProfile, getScanHistory } from '@/lib/api'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

const riskColor = (level: string) => {
  if (level === 'HIGH')   return '#f87171'
  if (level === 'MEDIUM') return '#fbbf24'
  return '#4ade80'
}

export default function DashboardPage() {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const [profile,  setProfile]  = useState<any>(null)
  const [scans,    setScans]    = useState<any[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/')
  }, [user, loading])

  useEffect(() => {
    if (!user) return
    Promise.all([
      getFarmerProfile(user.uid),
      getScanHistory(5)
    ]).then(([p, s]) => {
      setProfile(p.data)
      setScans(s.data || [])
    }).finally(() => setFetching(false))
  }, [user])

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-grid flex items-center justify-center">
        <motion.div className="text-center"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}>
          <div className="text-6xl mb-4">🌾</div>
          <p style={{ color: '#4ade80', fontWeight: 600 }}>Loading your farm...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-grid">

      {/* ── NAVBAR ── */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between px-6 py-4 sticky top-0 z-50"
        style={{
          background  : 'rgba(3,7,18,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(74,222,128,0.1)'
        }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌾</span>
          <span className="font-black" style={{ color: '#4ade80' }}>KrishiSat AI</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1.5 rounded-full"
                style={{
                  background: 'rgba(74,222,128,0.08)',
                  border    : '1px solid rgba(74,222,128,0.15)',
                  color     : '#4ade80'
                }}>
            👨‍🌾 {profile?.name?.split(' ')[0]}
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={async () => { await logout(); router.push('/') }}
            className="text-xs px-4 py-2 rounded-lg font-semibold"
            style={{
              background: 'rgba(248,113,113,0.1)',
              border    : '1px solid rgba(248,113,113,0.2)',
              color     : '#f87171'
            }}>
            Logout
          </motion.button>
        </div>
      </motion.nav>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── WELCOME ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8">
          <h1 className="text-3xl font-black mb-1">
            Namaste, <span style={{ color: '#4ade80' }}>
              {profile?.name?.split(' ')[0]} 👋
            </span>
          </h1>
          <p className="text-sm flex items-center gap-2"
             style={{ color: '#64748b' }}>
            <span>📍</span>
            {profile?.village && `${profile.village}, `}{profile?.district}, {profile?.state}
          </p>
        </motion.div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { n: profile?.totalScans || 0,            l: 'Total Scans',   icon: '🔬', color: '#4ade80' },
            { n: profile?.riskBreakdown?.HIGH || 0,   l: 'High Risk',     icon: '🔴', color: '#f87171' },
            { n: profile?.riskBreakdown?.MEDIUM || 0, l: 'Medium Risk',   icon: '🟡', color: '#fbbf24' },
            { n: profile?.riskBreakdown?.LOW || 0,    l: 'Healthy',       icon: '🟢', color: '#4ade80' },
          ].map((s, i) => (
            <motion.div key={s.l}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="card text-center"
              style={{ cursor: 'default' }}>
              <div className="text-3xl mb-2">{s.icon}</div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1, type: 'spring' }}
                className="text-3xl font-black"
                style={{ color: s.color }}>
                {s.n}
              </motion.div>
              <div className="text-xs mt-1" style={{ color: '#64748b' }}>{s.l}</div>
            </motion.div>
          ))}
        </div>

        {/* ── ACTION CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {[
            {
              href : '/scan',
              icon : '🔬',
              title: 'Scan Crop Disease',
              desc : 'Upload leaf image → instant AI diagnosis',
              color: '#4ade80',
              bg   : 'rgba(74,222,128,0.05)',
              border:'rgba(74,222,128,0.2)'
            },
            {
              href : '/forecast',
              icon : '📈',
              title: '7-Day Risk Forecast',
              desc : 'NDVI + weather → disease risk prediction',
              color: '#60a5fa',
              bg   : 'rgba(96,165,250,0.05)',
              border:'rgba(96,165,250,0.2)'
            },
          ].map((a, i) => (
            <Link key={a.href} href={a.href}>
              <motion.div
                initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.99 }}
                className="card cursor-pointer"
                style={{
                  background: a.bg,
                  border    : `1px solid ${a.border}`
                }}>
                <div className="flex items-center gap-5">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 1.5 }}
                    className="text-5xl">
                    {a.icon}
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-lg mb-1"
                        style={{ color: a.color }}>{a.title}</h3>
                    <p className="text-sm" style={{ color: '#64748b' }}>{a.desc}</p>
                  </div>
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="ml-auto text-xl"
                    style={{ color: a.color }}>
                    →
                  </motion.span>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* ── RECENT SCANS ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-lg">🕒 Recent Scans</h2>
            <Link href="/history"
                  className="text-xs font-semibold hover:underline"
                  style={{ color: '#4ade80' }}>
              View All →
            </Link>
          </div>

          {scans.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-5xl mb-4">
                🌿
              </motion.div>
              <p className="text-sm mb-4" style={{ color: '#64748b' }}>
                No scans yet — scan your first crop!
              </p>
              <Link href="/scan">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary text-sm">
                  Start Scanning
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-3">
              {scans.map((scan, i) => (
                <motion.div key={scan.scanId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.08 }}
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{
                    background: 'rgba(15,23,42,0.8)',
                    border    : '1px solid #1e293b'
                  }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                         style={{ background: riskColor(scan.riskLevel) + '15' }}>
                      🌿
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {scan.disease?.replace(/___/g, ' → ').replace(/_/g, ' ').substring(0, 35)}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                        {scan.cropType} • {new Date(scan.scannedAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                          style={{
                            background: riskColor(scan.riskLevel) + '18',
                            color     : riskColor(scan.riskLevel),
                            border    : `1px solid ${riskColor(scan.riskLevel)}35`
                          }}>
                      {scan.riskLevel}
                    </span>
                    <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                      {scan.confidence?.toFixed(1)}%
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
