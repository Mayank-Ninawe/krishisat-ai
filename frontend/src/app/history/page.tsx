'use client'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getScanHistory } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface Scan {
  scanId        : string
  cropType      : string
  fieldLocation : string
  disease       : string
  confidence    : number
  riskLevel     : string
  riskScore     : number
  recommendation: string
  scannedAt     : string
}

const riskColor = (l: string) =>
  l === 'HIGH' ? '#f87171' : l === 'MEDIUM' ? '#fbbf24' : '#4ade80'

export default function HistoryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [scans,    setScans]  = useState<Scan[]>([])
  const [filter,   setFilter] = useState('ALL')
  const [fetching, setFetching] = useState(true)

  const filtered = useMemo(
    () => filter === 'ALL' ? scans : scans.filter(s => s.riskLevel === filter),
    [filter, scans]
  )

  useEffect(() => {
    if (!loading && !user) router.push('/')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    getScanHistory(50).then(r => {
      setScans(r.data || [])
    }).finally(() => setFetching(false))
  }, [user])

  if (fetching) {
    return (
      <div className="min-h-screen bg-grid flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-center">
          <div className="text-5xl mb-3">🔍</div>
          <p style={{ color: '#4ade80' }}>Loading scan history...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-grid">

      {/* Navbar */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between px-6 py-4 sticky top-0 z-50"
        style={{
          background    : 'rgba(3,7,18,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom  : '1px solid rgba(74,222,128,0.1)'
        }}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🌾</span>
          <span className="font-black" style={{ color: '#4ade80' }}>KrishiSat AI</span>
        </Link>
        <Link href="/dashboard" className="text-sm" style={{ color: '#64748b' }}>
          ← Dashboard
        </Link>
      </motion.nav>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6">
          <h1 className="text-3xl font-black mb-1">📋 Scan History</h1>
          <p className="text-sm" style={{ color: '#64748b' }}>
            {scans.length} total scans
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6 flex-wrap">
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(f => (
            <motion.button key={f}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f)}
              className="text-xs px-4 py-2 rounded-full font-bold transition-all"
              style={{
                background: filter === f
                  ? (f === 'ALL' ? 'rgba(74,222,128,0.15)'
                    : riskColor(f) + '18')
                  : 'rgba(15,23,42,0.8)',
                border: `1px solid ${filter === f
                  ? (f === 'ALL' ? '#4ade80' : riskColor(f))
                  : '#1e293b'}`,
                color: filter === f
                  ? (f === 'ALL' ? '#4ade80' : riskColor(f))
                  : '#64748b'
              }}>
              {f === 'ALL' ? '🔍 All' :
               f === 'HIGH' ? '🔴 High' :
               f === 'MEDIUM' ? '🟡 Medium' : '🟢 Low'}
              {f !== 'ALL' && (
                <span className="ml-1.5">
                  ({scans.filter(s => s.riskLevel === f).length})
                </span>
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* Scan List */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card text-center py-16">
              <div className="text-5xl mb-4">🌿</div>
              <p style={{ color: '#64748b' }}>
                {filter === 'ALL' ? 'No scans yet' : `No ${filter} risk scans`}
              </p>
              {filter === 'ALL' && (
                <Link href="/scan">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="btn-primary text-sm mt-4">
                    Start Scanning
                  </motion.button>
                </Link>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3">
              {filtered.map((scan, i) => (
                <motion.div key={scan.scanId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ x: 4, borderColor: riskColor(scan.riskLevel) + '40' }}
                  className="card p-4"
                  style={{ cursor: 'default' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                           style={{
                             background: riskColor(scan.riskLevel) + '12',
                             border    : `1px solid ${riskColor(scan.riskLevel)}25`
                           }}>
                        🌿
                      </div>
                      <div>
                        <p className="font-bold text-sm">
                          {scan.disease?.replace(/___/g, ' → ')
                            .replace(/_/g, ' ').substring(0, 45)}
                        </p>
                        <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                          🌾 {scan.cropType}
                          {scan.fieldLocation && ` • 📍 ${scan.fieldLocation}`}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                          🕒 {new Date(scan.scannedAt).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black px-2.5 py-1 rounded-full"
                            style={{
                              background: riskColor(scan.riskLevel) + '18',
                              color     : riskColor(scan.riskLevel),
                              border    : `1px solid ${riskColor(scan.riskLevel)}30`
                            }}>
                        {scan.riskLevel}
                      </span>
                      <p className="text-xs mt-1.5 font-semibold"
                         style={{ color: '#4ade80' }}>
                        {scan.confidence?.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Recommendation Preview */}
                  <div className="mt-3 pt-3"
                       style={{ borderTop: '1px solid #1e293b' }}>
                    <p className="text-xs" style={{ color: '#475569' }}>
                      💊 {scan.recommendation?.substring(0, 80)}
                      {scan.recommendation?.length > 80 ? '...' : ''}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
