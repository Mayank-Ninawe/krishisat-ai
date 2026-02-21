'use client'
import { useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'

const fadeUp = {
  hidden : { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } }
}
const stagger = {
  visible: { transition: { staggerChildren: 0.15 } }
}

export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.push('/dashboard')
  }, [user, loading])

  return (
    <main className="min-h-screen bg-grid overflow-hidden">

      {/* ── NAVBAR ── */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between px-8 py-5"
        style={{ borderBottom: '1px solid rgba(74,222,128,0.1)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl float">🌾</span>
          <div>
            <span className="font-black text-xl text-glow"
                  style={{ color: '#4ade80' }}>KrishiSat</span>
            <span className="font-black text-xl text-white"> AI</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="text-sm px-5 py-2.5 rounded-xl font-semibold"
              style={{
                background: 'transparent',
                border    : '1px solid rgba(74,222,128,0.3)',
                color     : '#4ade80'
              }}>
              Login
            </motion.button>
          </Link>
          <Link href="/register">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary text-sm px-5 py-2.5">
              Get Started →
            </motion.button>
          </Link>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <motion.section
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center text-center px-4 pt-20 pb-16"
      >
        {/* Badge */}
        <motion.div variants={fadeUp}
          className="flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-semibold"
          style={{
            background: 'rgba(74,222,128,0.08)',
            border    : '1px solid rgba(74,222,128,0.2)',
            color     : '#4ade80'
          }}>
          <span className="pulse-dot"></span>
          AI-Powered Crop Disease Detection System
        </motion.div>

        {/* Headline */}
        <motion.h1 variants={fadeUp}
          className="text-5xl md:text-7xl font-black mb-6 leading-tight">
          <span style={{ color: '#f1f5f9' }}>Protect Your</span><br/>
          <span className="text-glow" style={{ color: '#4ade80' }}>
            Crops with AI
          </span>
        </motion.h1>

        <motion.p variants={fadeUp}
          className="text-lg mb-10 max-w-xl"
          style={{ color: '#64748b', lineHeight: 1.7 }}>
          Satellite imagery + Deep Learning = Early disease detection.
          Scan any crop leaf and get instant diagnosis with
          <span style={{ color: '#4ade80' }}> 91.75% accuracy</span>.
        </motion.p>

        {/* CTA */}
        <motion.div variants={fadeUp} className="flex gap-4 flex-wrap justify-center mb-16">
          <Link href="/register">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 10px 40px rgba(74,222,128,0.4)' }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary text-base px-10 py-4">
              🚀 Start Free →
            </motion.button>
          </Link>
          <Link href="/login">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="text-base px-10 py-4 rounded-xl font-semibold"
              style={{
                background: 'rgba(15,23,42,0.8)',
                border    : '1px solid #1e293b',
                color     : '#94a3b8'
              }}>
              Login
            </motion.button>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div variants={stagger}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl w-full mb-16">
          {[
            { n: '91.75%', l: 'Top-1 Accuracy',    icon: '🎯' },
            { n: '99.66%', l: 'Top-5 Accuracy',    icon: '🏆' },
            { n: '96',     l: 'Disease Classes',   icon: '🔬' },
            { n: '7 Days', l: 'Risk Forecast',     icon: '📈' },
          ].map((s, i) => (
            <motion.div key={s.l} variants={fadeUp}
              whileHover={{ scale: 1.05, y: -4 }}
              className="glass text-center p-5"
              style={{ cursor: 'default' }}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-2xl font-black" style={{ color: '#4ade80' }}>{s.n}</div>
              <div className="text-xs mt-1" style={{ color: '#64748b' }}>{s.l}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* ── FEATURES ── */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto px-4 pb-24"
      >
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-black text-center mb-12"
          style={{ color: '#f1f5f9' }}>
          Everything you need to
          <span style={{ color: '#4ade80' }}> protect your crops</span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon : '🔬',
              title: 'Instant Disease Detection',
              desc : 'Upload any leaf photo → AI identifies disease in seconds with confidence score and treatment recommendation.',
              color: '#4ade80',
              glow : 'rgba(74,222,128,0.1)'
            },
            {
              icon : '📡',
              title: 'Satellite NDVI Monitoring',
              desc : 'Sentinel-2 satellite data tracks crop health over 30 days using NDVI vegetation index.',
              color: '#60a5fa',
              glow : 'rgba(96,165,250,0.1)'
            },
            {
              icon : '🤖',
              title: '7-Day AI Risk Forecast',
              desc : 'BiLSTM neural network predicts disease outbreak risk for next 7 days based on weather patterns.',
              color: '#fbbf24',
              glow : 'rgba(251,191,36,0.1)'
            },
          ].map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8, boxShadow: `0 20px 60px ${f.glow}` }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="card"
              style={{ cursor: 'default' }}>
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold mb-3" style={{ color: f.color }}>
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── FOOTER ── */}
      <div className="text-center pb-8"
           style={{ color: '#374151', fontSize: '0.75rem' }}>
        Built for Deep Learning Laboratory Capstone — 2025-26 🌾
      </div>
    </main>
  )
}
