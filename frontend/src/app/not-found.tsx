'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-grid flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0], y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="text-8xl mb-6">
          🌾
        </motion.div>
        <h1 className="text-6xl font-black mb-3"
            style={{ color: '#4ade80' }}>404</h1>
        <p className="text-xl font-bold mb-2">Page Not Found</p>
        <p className="text-sm mb-8" style={{ color: '#64748b' }}>
          Ye page toh khet mein kho gaya! 🌿
        </p>
        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary">
            🏠 Go Home
          </motion.button>
        </Link>
      </motion.div>
    </div>
  )
}
