const express = require('express');
const router  = express.Router();
const { db }  = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');
const { predictForecast, predictFull } = require('../services/mlService');

// POST /api/forecast — NDVI + weather → 7-day risk
router.post('/', verifyToken, async (req, res) => {
  try {
    const { ndvi_series, weather, district_id } = req.body;

    if (!ndvi_series || ndvi_series.length < 7) {
      return res.status(400).json({
        success: false,
        error  : 'Minimum 7 NDVI values required'
      });
    }

    const result = await predictForecast(ndvi_series, weather, district_id);

    // Save forecast to Firestore
    await db.collection('forecasts').add({
      farmerId  : req.user.uid,
      districtId: district_id || null,
      forecast  : result.data,
      createdAt : new Date().toISOString()
    });

    res.json({ success: true, data: result.data });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/forecast/satellite — Full satellite pipeline
router.post('/satellite', verifyToken, async (req, res) => {
  try {
    const { bbox, lat, lon, district_id } = req.body;

    if (!bbox || bbox.length !== 4) {
      return res.status(400).json({
        success: false,
        error  : 'bbox [lon_min, lat_min, lon_max, lat_max] required'
      });
    }

    const result = await predictFull(bbox, lat, lon, district_id);

    res.json({ success: true, data: result });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
