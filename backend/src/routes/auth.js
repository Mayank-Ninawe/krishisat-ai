const express = require('express');
const router  = express.Router();
const { db, auth } = require('../config/firebase');

// Register new farmer
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone, village, district } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error  : 'Email, password aur name required hai'
      });
    }

    // Firebase me user banao
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name
    });

    // Firestore me save karo
    await db.collection('farmers').doc(userRecord.uid).set({
      uid      : userRecord.uid,
      name,
      email,
      phone    : phone || '',
      village  : village || '',
      district : district || '',
      totalScans: 0,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      uid    : userRecord.uid,
      message: 'Account created!'
    });

  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});


// Get farmer profile
router.get('/profile/:uid', async (req, res) => {
  try {
    const doc = await db.collection('farmers')
                        .doc(req.params.uid)
                        .get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error  : 'Farmer not found'
      });
    }

    res.json({
      success: true,
      data   : doc.data()
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/farmer/:uid — farmer stats with scan summary
router.get('/farmer/:uid', async (req, res) => {
  try {
    const farmerDoc = await db.collection('farmers')
                               .doc(req.params.uid)
                               .get();

    if (!farmerDoc.exists) {
      return res.status(404).json({
        success: false,
        error  : 'Farmer not found'
      });
    }

    // Last 5 scans bhi lo
    const scansSnap = await db.collection('scans')
      .where('farmerId', '==', req.params.uid)
      .orderBy('scannedAt', 'desc')
      .limit(5)
      .get();

    const recentScans = scansSnap.docs.map(doc => doc.data());

    // Risk level breakdown
    const allScansSnap = await db.collection('scans')
      .where('farmerId', '==', req.params.uid)
      .get();

    const riskBreakdown = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    allScansSnap.docs.forEach(doc => {
      const risk = doc.data().riskLevel;
      if (riskBreakdown[risk] !== undefined) riskBreakdown[risk]++;
    });

    res.json({
      success: true,
      data   : {
        ...farmerDoc.data(),
        recentScans,
        riskBreakdown
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


module.exports = router;
