require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const path    = require('path');

const authRoutes      = require('./src/routes/auth');
const scanRoutes      = require('./src/routes/scans');
const forecastRoutes  = require('./src/routes/forecast');
const districtRoutes  = require('./src/routes/districts');
const { checkMLHealth } = require('./src/services/mlService');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── MIDDLEWARE ─────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── TEST PAGE ────────────────────────────────────────────
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test.html'));
});

// ── ROUTES ─────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/scans',     scanRoutes);
app.use('/api/forecast',  forecastRoutes);
app.use('/api/districts', districtRoutes);

// ── ROOT ───────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    service : 'KrishiSat AI — Backend',
    version : '1.0.0',
    status  : 'running ✅',
    endpoints: {
      auth     : '/api/auth',
      scans    : '/api/scans',
      forecast : '/api/forecast',
      districts: '/api/districts'
    }
  });
});

// ── HEALTH CHECK ───────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    const mlHealth = await checkMLHealth();
    res.json({
      status    : 'ok ✅',
      backend   : 'running',
      ml_service: mlHealth
    });
  } catch {
    res.json({
      status    : 'partial ⚠️',
      backend   : 'running',
      ml_service: 'unreachable'
    });
  }
});

// ── 404 HANDLER ────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error  : `Route ${req.originalUrl} not found`
  });
});

// ── ERROR HANDLER ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error  : err.message || 'Internal server error'
  });
});

// ── START ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('═'.repeat(50));
  console.log('  🌾 KrishiSat AI — Backend');
  console.log(`  🚀 Running on http://localhost:${PORT}`);
  console.log(`  🤖 ML Service: ${process.env.ML_SERVICE_URL}`);
  console.log('═'.repeat(50));
});

module.exports = app;
