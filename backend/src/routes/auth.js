const express = require('express');
const router  = express.Router();
const { db, auth } = require('../config/firebase');

// Register new farmer
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, village, district, state } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error  : 'email, password, name required'
      });
    }

    // Firebase Auth user banao
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name
    });

    // Firestore me farmer profile save karo
    await db.collection('farmers').doc(userRecord.uid).set({
      uid      : userRecord.uid,
      name,
      email,
      village  : village  || '',
      district : district || '',
      state    : state    || 'Maharashtra',
      createdAt: new Date().toISOString(),
      totalScans: 0
    });

    res.status(201).json({
      success: true,
      message: 'Farmer registered successfully',
      data   : {
        uid  : userRecord.uid,
        name,
        email
      }
    });

  } catch (err) {
    res.status(400).json({
      success: false,
      error  : err.message
    });
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

module.exports = router;
