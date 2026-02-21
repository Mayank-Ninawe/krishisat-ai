'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAuth } from '@/context/AuthContext'
import { scanDisease } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ScanPage() {
  const { user } = useAuth()
  const router   = useRouter()
  const [file,     setFile]     = useState<File | null>(null)
  const [preview,  setPreview]  = useState<string>('')
  const [cropType, setCropType] = useState('Tomato')
  const [result,   setResult]   = useState<any>(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const onDrop = useCallback((files: File[]) => {
    const f = files[0]
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1
  })

  const handleScan = async () => {
    if (!file || !user) return
    setLoading(true); setError('')
    try {
      const res = await scanDisease(file, cropType, 'My Field')
      setResult(res.data)
    } catch (e: any) {
      setError(e.response?.data?.error || 'Scan failed')
    } finally {
      setLoading(false)
    }
  }

  const riskColor = (level: string) => {
    if (level === 'HIGH')   return '#f87171'
    if (level === 'MEDIUM') return '#fbbf24'
    return '#4ade80'
  }

  const crops = ['Tomato','Potato','Corn','Wheat','Rice',
                 'Apple','Grape','Soybean','Pepper','Strawberry']

  return (
    <div className="min-h-screen" style={{ background: '#080c0f' }}>

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b"
           style={{ background: '#0d1117', borderColor: '#1f2937' }}>
        <Link href="/dashboard"
              className="flex items-center gap-2">
          <span className="text-2xl">🌾</span>
          <span className="font-bold" style={{ color: '#4ade80' }}>KrishiSat AI</span>
        </Link>
        <Link href="/dashboard"
              className="text-xs" style={{ color: '#6b7280' }}>
          ← Dashboard
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#e2e8f0' }}>
          🔬 Scan Crop Disease
        </h1>
        <p className="text-sm mb-8" style={{ color: '#6b7280' }}>
          Upload a clear leaf image for instant AI-powered disease detection
        </p>

        {/* Crop Type Select */}
        <div className="card mb-4">
          <label className="text-xs mb-2 block" style={{ color: '#9ca3af' }}>
            Crop Type
          </label>
          <div className="flex flex-wrap gap-2">
            {crops.map(c => (
              <button key={c}
                      onClick={() => setCropType(c)}
                      className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
                      style={{
                        background  : cropType === c ? '#166534' : '#111827',
                        border      : `1px solid ${cropType === c ? '#4ade80' : '#1f2937'}`,
                        color       : cropType === c ? '#4ade80' : '#6b7280'
                      }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Dropzone */}
        <div {...getRootProps()}
             className="card mb-4 cursor-pointer transition-all"
             style={{
               border     : `2px dashed ${isDragActive ? '#4ade80' : '#1f2937'}`,
               background : isDragActive ? '#0d1f0d' : '#111827',
               textAlign  : 'center',
               padding    : '40px 20px'
             }}>
          <input {...getInputProps()} />
          {preview ? (
            <div>
              <img src={preview} alt="preview"
                   className="max-h-48 mx-auto rounded-lg mb-3 object-contain" />
              <p className="text-xs" style={{ color: '#4ade80' }}>
                ✅ {file?.name}
              </p>
            </div>
          ) : (
            <div>
              <div className="text-5xl mb-3">📸</div>
              <p className="font-semibold mb-1" style={{ color: '#e2e8f0' }}>
                {isDragActive ? 'Drop image here!' : 'Drag & drop leaf image'}
              </p>
              <p className="text-xs" style={{ color: '#6b7280' }}>
                or click to browse — JPG, PNG supported
              </p>
            </div>
          )}
        </div>

        {/* Scan Button */}
        <button
          onClick={handleScan}
          disabled={!file || loading}
          className="btn-primary w-full mb-6"
          style={{ opacity: (!file || loading) ? 0.5 : 1 }}>
          {loading ? '🔍 Analyzing...' : '🔬 Scan for Disease'}
        </button>

        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}

        {/* Result */}
        {result && (
          <div className="card">
            <h2 className="font-bold mb-4 text-lg" style={{ color: '#e2e8f0' }}>
              🧪 Scan Result
            </h2>

            {/* Disease + Risk */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs mb-1" style={{ color: '#6b7280' }}>Detected Disease</p>
                <p className="font-bold text-lg" style={{ color: '#4ade80' }}>
                  {result.disease?.replace(/___/g, ' → ').replace(/_/g, ' ')}
                </p>
                <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                  Confidence: {result.confidence?.toFixed(1)}%
                </p>
              </div>
              <span className="text-sm font-bold px-3 py-1.5 rounded-full"
                    style={{
                      background: riskColor(result.risk_level) + '20',
                      color     : riskColor(result.risk_level),
                      border    : `1px solid ${riskColor(result.risk_level)}40`
                    }}>
                {result.risk_level} RISK
              </span>
            </div>

            {/* Recommendation */}
            <div className="p-3 rounded-lg mb-4"
                 style={{ background: '#0d1f0d', border: '1px solid #166534' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#4ade80' }}>
                💊 Recommendation
              </p>
              <p className="text-sm" style={{ color: '#86efac' }}>
                {result.recommendation}
              </p>
            </div>

            {/* Top 5 */}
            <div>
              <p className="text-xs mb-2" style={{ color: '#6b7280' }}>
                Top 5 Predictions
              </p>
              {result.top5?.map((t: any, i: number) => (
                <div key={i}
                     className="flex items-center gap-3 mb-2">
                  <span className="text-xs w-4" style={{ color: '#6b7280' }}>
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-xs" style={{ color: '#e2e8f0' }}>
                        {t.disease?.replace(/___/g, ' → ').replace(/_/g, ' ').substring(0, 35)}
                      </span>
                      <span className="text-xs" style={{ color: '#4ade80' }}>
                        {t.confidence?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: '#1f2937' }}>
                      <div className="h-1.5 rounded-full"
                           style={{
                             width     : `${t.confidence}%`,
                             background: i === 0 ? '#4ade80' : '#374151'
                           }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
