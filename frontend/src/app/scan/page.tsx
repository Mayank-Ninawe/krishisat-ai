'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAuth } from '@/context/AuthContext'
import { scanDisease } from '@/lib/api'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

const riskColor = (l: string) =>
  l === 'HIGH' ? '#f87171' : l === 'MEDIUM' ? '#fbbf24' : '#4ade80'

export default function ScanPage() {
  const { user }  = useAuth()
  const [file,     setFile]     = useState<File | null>(null)
  const [preview,  setPreview]  = useState<string>('')
  const [cropType, setCropType] = useState('Tomato')
  const [result,   setResult]   = useState<any>(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const onDrop = useCallback((files: File[]) => {
    setFile(files[0])
    setPreview(URL.createObjectURL(files[0]))
    setResult(null); setError('')
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

  const crops = ['Tomato','Potato','Corn','Wheat','Rice',
                 'Apple','Grape','Soybean','Pepper','Strawberry']

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
        <Link href="/dashboard" className="text-sm font-medium"
              style={{ color: '#64748b' }}>
          ← Dashboard
        </Link>
      </motion.nav>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8">
          <h1 className="text-3xl font-black mb-2">🔬 Scan Crop Disease</h1>
          <p className="text-sm" style={{ color: '#64748b' }}>
            Upload a clear leaf photo → AI diagnoses disease instantly
          </p>
        </motion.div>

        {/* Crop Select */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-4">
          <p className="text-xs font-semibold mb-3" style={{ color: '#94a3b8' }}>
            Select Crop Type
          </p>
          <div className="flex flex-wrap gap-2">
            {crops.map((c, i) => (
              <motion.button key={c}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCropType(c)}
                className="text-xs px-3 py-2 rounded-lg font-semibold transition-all"
                style={{
                  background: cropType === c ? 'rgba(74,222,128,0.15)' : 'rgba(15,23,42,0.8)',
                  border    : `1px solid ${cropType === c ? '#4ade80' : '#1e293b'}`,
                  color     : cropType === c ? '#4ade80' : '#64748b'
                }}>
                {c}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Dropzone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}>
          <div
            {...getRootProps()}
            className="card mb-4 cursor-pointer"
            style={{
              border    : `2px dashed ${isDragActive ? '#4ade80' : '#1e293b'}`,
              background: isDragActive ? 'rgba(74,222,128,0.05)' : '',
              textAlign : 'center',
              padding   : '40px 24px',
              transition: 'all 0.3s'
            }}>
            <input {...getInputProps()} />

          <AnimatePresence mode="wait">
            {preview ? (
              <motion.div key="preview"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}>
                <img src={preview} alt="preview"
                     className="max-h-52 mx-auto rounded-xl mb-3 object-contain"
                     style={{ boxShadow: '0 0 30px rgba(74,222,128,0.2)' }} />
                <p className="text-xs font-semibold" style={{ color: '#4ade80' }}>
                  ✅ {file?.name}
                </p>
              </motion.div>
            ) : (
              <motion.div key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}>
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-5xl mb-4">
                  📸
                </motion.div>
                <p className="font-bold mb-1" style={{ color: isDragActive ? '#4ade80' : '#94a3b8' }}>
                  {isDragActive ? '🎯 Drop it here!' : 'Drag & drop leaf image'}
                </p>
                <p className="text-xs" style={{ color: '#475569' }}>
                  or click to browse — JPG, PNG
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </motion.div>

        {/* Scan Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleScan}
            disabled={!file || loading}
            className="btn-primary w-full mb-6 py-4 text-base">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  🔍
                </motion.span>
                Analyzing image...
              </span>
            ) : '🔬 Scan for Disease'}
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-sm mb-4 py-2 px-4 rounded-lg"
              style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }}>
              ⚠️ {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 100 }}
              className="card"
              style={{
                border    : `1px solid ${riskColor(result.risk_level)}30`,
                boxShadow : `0 0 40px ${riskColor(result.risk_level)}10`
              }}>

              <h2 className="font-black text-xl mb-5">🧪 Scan Result</h2>

              {/* Disease name + Risk badge */}
              <div className="flex items-start justify-between mb-5 gap-3">
                <div>
                  <p className="text-xs mb-1" style={{ color: '#64748b' }}>
                    Detected Disease
                  </p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="font-black text-xl"
                    style={{ color: '#4ade80' }}>
                    {result.disease?.replace(/___/g, ' → ').replace(/_/g, ' ')}
                  </motion.p>
                  <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                    Confidence: {result.confidence?.toFixed(1)}%
                  </p>
                </div>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.3 }}
                  className="text-sm font-black px-3 py-2 rounded-xl whitespace-nowrap"
                  style={{
                    background: riskColor(result.risk_level) + '18',
                    color     : riskColor(result.risk_level),
                    border    : `1px solid ${riskColor(result.risk_level)}40`
                  }}>
                  {result.risk_level} RISK
                </motion.span>
              </div>

              {/* Recommendation */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-4 rounded-xl mb-5"
                style={{
                  background: 'rgba(74,222,128,0.06)',
                  border    : '1px solid rgba(74,222,128,0.2)'
                }}>
                <p className="text-xs font-bold mb-1" style={{ color: '#4ade80' }}>
                  💊 Recommendation
                </p>
                <p className="text-sm" style={{ color: '#86efac', lineHeight: 1.6 }}>
                  {result.recommendation}
                </p>
              </motion.div>

              {/* Top 5 */}
              <div>
                <p className="text-xs font-semibold mb-3" style={{ color: '#64748b' }}>
                  Top 5 Predictions
                </p>
                {result.top5?.map((t: any, i: number) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.07 }}
                    className="flex items-center gap-3 mb-3">
                    <span className="text-xs w-5 text-center font-bold"
                          style={{ color: i === 0 ? '#4ade80' : '#475569' }}>
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs"
                              style={{ color: i === 0 ? '#f1f5f9' : '#64748b' }}>
                          {t.disease?.replace(/___/g, ' → ')
                            .replace(/_/g, ' ').substring(0, 38)}
                        </span>
                        <span className="text-xs font-bold"
                              style={{ color: i === 0 ? '#4ade80' : '#475569' }}>
                          {t.confidence?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden"
                           style={{ background: '#1e293b' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${t.confidence}%` }}
                          transition={{ delay: 0.5 + i * 0.07, duration: 0.6 }}
                          className="h-full rounded-full"
                          style={{
                            background: i === 0
                              ? 'linear-gradient(90deg, #166534, #4ade80)'
                              : '#1e293b'
                          }} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
