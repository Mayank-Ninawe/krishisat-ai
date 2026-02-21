const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const { v4: uuidv4 }  = require('uuid');
const { db }          = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');
const { predictDisease } = require('../services/mlService');

const upload = multer({
  storage : multer.memoryStorage(),
  limits  : { fileSize: 5 * 1024 * 1024 },  // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  }
});

// POST /api/scans — New disease scan
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { cropType, fieldLocation } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error  : 'Image file required'
      });
    }

    // 1. ML prediction
    const mlResult = await predictDisease(
      req.file.buffer,
      req.file.mimetype
    );

    // 2. Image → base64 (Storage ke bajaye)
    const base64Image = `data:${req.file.mimetype};base64,${
      req.file.buffer.toString('base64')
    }`;

    // 3. Firestore me scan record save karo
    const scanId     = uuidv4();
    const scanRecord = {
      scanId,
      farmerId      : req.user.uid,
      cropType      : cropType      || 'unknown',
      fieldLocation : fieldLocation || '',
      imageBase64   : base64Image,   // base64 stored directly
      disease       : mlResult.data.disease,
      confidence    : mlResult.data.confidence,
      riskLevel     : mlResult.data.risk_level,
      riskScore     : mlResult.data.risk_score,
      recommendation: mlResult.data.recommendation,
      top5          : mlResult.data.top5,
      scannedAt     : new Date().toISOString()
    };

    await db.collection('scans').doc(scanId).set(scanRecord);

    // 4. Farmer ka totalScans update karo
    await db.collection('farmers').doc(req.user.uid).update({
      totalScans: require('firebase-admin').firestore.FieldValue.increment(1)
    });

    // Response me base64 nahi bhejte (too large) — sirf metadata
    const { imageBase64, ...responseData } = scanRecord;

    res.status(201).json({
      success: true,
      data   : responseData
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/scans/history — Farmer ki scan history
router.get('/history', verifyToken, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const snapshot = await db.collection('scans')
      .where('farmerId', '==', req.user.uid)
      .orderBy('scannedAt', 'desc')
      .limit(parseInt(limit))
      .get();

    // Base64 exclude karo (heavy hoga response)
    const scans = snapshot.docs.map(doc => {
      const { imageBase64, ...data } = doc.data();
      return data;
    });

    res.json({
      success: true,
      count  : scans.length,
      data   : scans
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/scans/:scanId — Single scan (with image)
router.get('/:scanId', verifyToken, async (req, res) => {
  try {
    const doc = await db.collection('scans')
                        .doc(req.params.scanId)
                        .get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error  : 'Scan not found'
      });
    }

    res.json({ success: true, data: doc.data() });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
