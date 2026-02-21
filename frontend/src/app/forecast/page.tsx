'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getForecast, getDistricts } from '@/lib/api'
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import Link from 'next/link'

export default function ForecastPage() {
  const { user } = useAuth()
  const [districts,   setDistricts]   = useState<any[]>([])
  const [selectedDist,setSelectedDist]= useState<any>(null)
  const [result,      setResult]      = useState<any>(null)
  const [loading,     setLoading]     = useState(false)

  useEffect(() => {
    getDistricts().then(r => {
      setDistricts(r.data)
      setSelectedDist(r.data[0])
    })
  }, [])

  const handleForecast = async () => {
    if (!selectedDist) return
    setLoading(true)
    try {
      // Sample declining NDVI for demo
      const ndvi = Array.from({ length: 30 }, (_, i) =>
        parseFloat((0.65 - i * 0.012 + (Math.random() * 0.02 - 0.01)).toFixed(3))
      )
      const weather = { temp: 28, humidity: 72, rainfall: 3, day_of_year: 52 }
      const res = await getForecast(ndvi, weather, selectedDist.id)
      setResult(res.data)
    } finally {
      setLoading(false)
    }
  }

  const riskColor = (score: number) => {
    if (score >= 0.65) return '#f87171'
    if (score >= 0.35) return '#fbbf24'
    return '#4ade80'
  }

  return (
    <div className="min-h-screen" style={{ background: '#080c0f' }}>
      <nav className="flex items-center justify-between px-6 py-4 border-b"
           style={{ background: '#0d1117', borderColor: '#1f2937' }}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🌾</span>
          <span className="font-bold" style={{ color: '#4ade80' }}>KrishiSat AI</span>
        </Link>
        <Link href="/dashboard" className="text-xs" style={{ color: '#6b7280' }}>
          ← Dashboard
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#e2e8f0' }}>
          📈 7-Day Risk Forecast
        </h1>
        <p className="text-sm mb-8" style={{ color: '#6b7280' }}>
          Select district → get disease risk forecast for next 7 days
        </p>

        {/* District Select */}
        <div className="card mb-6">
          <p className="text-xs mb-3" style={{ color: '#9ca3af' }}>
            Select District (Maharashtra)
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {districts.map(d => (
              <button key={d.id}
                      onClick={() => setSelectedDist(d)}
                      className="text-xs px-3 py-2 rounded-lg font-semibold transition-all"
                      style={{
                        background: selectedDist?.id === d.id ? '#166534' : '#111827',
                        border    : `1px solid ${selectedDist?.id === d.id ? '#4ade80' : '#1f2937'}`,
                        color     : selectedDist?.id === d.id ? '#4ade80' : '#9ca3af'
                      }}>
                📍 {d.name}
              </button>
            ))}
          </div>

          {selectedDist && (
            <div className="p-3 rounded-lg mb-4"
                 style={{ background: '#0d1117', border: '1px solid #1f2937' }}>
              <p className="text-xs" style={{ color: '#6b7280' }}>
                🌾 Main crops: <span style={{ color: '#86efac' }}>{selectedDist.crop}</span>
              </p>
            </div>
          )}

          <button onClick={handleForecast}
                  disabled={loading || !selectedDist}
                  className="btn-primary w-full"
                  style={{ opacity: loading ? 0.5 : 1 }}>
            {loading ? '🔄 Fetching forecast...' : '📡 Get 7-Day Forecast'}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg" style={{ color: '#e2e8f0' }}>
                Forecast — {selectedDist?.name}
              </h2>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{
                      background: riskColor(result.max_risk_score) + '20',
                      color     : riskColor(result.max_risk_score)
                    }}>
                Peak: Day {result.peak_risk_day} — {result.max_risk_level}
              </span>
            </div>

            {/* Bar Chart */}
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={result.forecast}
                        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="day"
                       tickFormatter={v => `Day ${v}`}
                       tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis domain={[0, 1]}
                       tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#111827', border: '1px solid #1f2937',
                    borderRadius: '8px', color: '#e2e8f0'
                  }}
                  formatter={(val: any) => [val.toFixed(3), 'Risk Score']}
                  labelFormatter={l => `Day ${l}`}
                />
                <Bar dataKey="risk_score" radius={[4, 4, 0, 0]}>
                  {result.forecast.map((entry: any, i: number) => (
                    <Cell key={i} fill={riskColor(entry.risk_score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Day Cards */}
            <div className="grid grid-cols-7 gap-2 mt-4">
              {result.forecast.map((f: any) => (
                <div key={f.day}
                     className="text-center p-2 rounded-lg"
                     style={{ background: '#0d1117', border: '1px solid #1f2937' }}>
                  <p className="text-xs mb-1" style={{ color: '#6b7280' }}>
                    D{f.day}
                  </p>
                  <p className="text-xs font-bold"
                     style={{ color: riskColor(f.risk_score) }}>
                    {f.risk_level}
                  </p>
                  <p className="text-xs" style={{ color: '#9ca3af' }}>
                    {(f.risk_score * 100).toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>

            {/* Recommendation */}
            <div className="p-3 rounded-lg mt-4"
                 style={{ background: '#0d1f0d', border: '1px solid #166534' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#4ade80' }}>
                💊 Recommendation
              </p>
              <p className="text-sm" style={{ color: '#86efac' }}>
                {result.recommendation}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
