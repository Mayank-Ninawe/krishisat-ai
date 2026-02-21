'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { getFarmerProfile, getScanHistory } from '@/lib/api'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const [profile,  setProfile]  = useState<any>(null)
  const [scans,    setScans]    = useState<any[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const [profileRes, scansRes] = await Promise.all([
          getFarmerProfile(user.uid),
          getScanHistory(5)
        ])
        setProfile(profileRes.data)
        setScans(scansRes.data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setFetching(false)
      }
    }
    load()
  }, [user])

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: '#080c0f' }}>
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🌾</div>
          <p style={{ color: '#4ade80' }}>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const riskColor = (level: string) => {
    if (level === 'HIGH')   return '#f87171'
    if (level === 'MEDIUM') return '#fbbf24'
    return '#4ade80'
  }

  return (
    <div className="min-h-screen" style={{ background: '#080c0f' }}>

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b"
           style={{ background: '#0d1117', borderColor: '#1f2937' }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌾</span>
          <span className="font-bold" style={{ color: '#4ade80' }}>KrishiSat AI</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: '#9ca3af' }}>
            👨‍🌾 {profile?.name || user?.email}
          </span>
          <button
            onClick={() => { logout(); router.push('/') }}
            className="text-xs px-4 py-2 rounded-lg"
            style={{ background: '#1c0a0a', border: '1px solid #7f1d1d', color: '#fca5a5' }}>
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Welcome */}
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#e2e8f0' }}>
          Namaste, {profile?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm mb-8" style={{ color: '#6b7280' }}>
          📍 {profile?.village}, {profile?.district}
        </p>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { n: profile?.totalScans || 0,              l: 'Total Scans',    icon: '🔬' },
            { n: profile?.riskBreakdown?.HIGH || 0,     l: 'High Risk',      icon: '🔴' },
            { n: profile?.riskBreakdown?.MEDIUM || 0,   l: 'Medium Risk',    icon: '🟡' },
            { n: profile?.riskBreakdown?.LOW || 0,      l: 'Healthy Scans',  icon: '🟢' },
          ].map(s => (
            <div key={s.l} className="card text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold" style={{ color: '#4ade80' }}>{s.n}</div>
              <div className="text-xs mt-1" style={{ color: '#6b7280' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link href="/scan">
            <div className="card cursor-pointer hover:border-green-600 transition-all"
                 style={{ borderColor: '#166534' }}>
              <div className="flex items-center gap-4">
                <div className="text-4xl">🔬</div>
                <div>
                  <h3 className="font-bold" style={{ color: '#4ade80' }}>
                    Scan Crop Disease
                  </h3>
                  <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                    Upload leaf image → instant AI detection
                  </p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/forecast">
            <div className="card cursor-pointer hover:border-blue-600 transition-all"
                 style={{ borderColor: '#1e3a5f' }}>
              <div className="flex items-center gap-4">
                <div className="text-4xl">📈</div>
                <div>
                  <h3 className="font-bold" style={{ color: '#60a5fa' }}>
                    7-Day Risk Forecast
                  </h3>
                  <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                    NDVI + weather → disease risk prediction
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Scans */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold" style={{ color: '#e2e8f0' }}>
              🕒 Recent Scans
            </h2>
            <Link href="/history"
                  className="text-xs" style={{ color: '#4ade80' }}>
              View All →
            </Link>
          </div>

          {scans.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🌿</div>
              <p className="text-sm" style={{ color: '#6b7280' }}>
                No scans yet — scan your first crop!
              </p>
              <Link href="/scan">
                <button className="btn-primary text-sm mt-4">
                  Start Scanning
                </button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {scans.map((scan: any) => (
                <div key={scan.scanId}
                     className="flex items-center justify-between p-3 rounded-lg"
                     style={{ background: '#0d1117', border: '1px solid #1f2937' }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>
                      {scan.disease?.replace(/___/g, ' → ').replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                      {scan.cropType} • {new Date(scan.scannedAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold px-2 py-1 rounded-full"
                          style={{
                            background: riskColor(scan.riskLevel) + '20',
                            color     : riskColor(scan.riskLevel)
                          }}>
                      {scan.riskLevel}
                    </span>
                    <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                      {scan.confidence?.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
