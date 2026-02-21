'use client'
import { motion } from 'framer-motion'

export default function Loading() {
  return (
    <div className="min-h-screen bg-grid flex items-center justify-center">
      <motion.div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-5xl mb-4 inline-block">
          🌾
        </motion.div>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex items-center gap-1.5 justify-center">
          {[0, 0.2, 0.4].map((delay, i) => (
            <motion.div key={i}
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 0.8, repeat: Infinity, delay }}
              className="w-2 h-2 rounded-full"
              style={{ background: '#4ade80' }} />
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
