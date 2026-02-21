const express = require('express');
const router  = express.Router();
const { db }  = require('../config/firebase');

const DISTRICTS = [
  { id:1, name:'Nashik',   bbox:[73.6,19.9,74.2,20.4], lat:20.0, lon:73.8, crop:'Wheat, Onion'       },
  { id:2, name:'Pune',     bbox:[73.7,18.4,74.0,18.7], lat:18.5, lon:73.9, crop:'Sugarcane'           },
  { id:3, name:'Nagpur',   bbox:[78.9,21.0,79.3,21.3], lat:21.1, lon:79.1, crop:'Orange, Soybean'     },
  { id:4, name:'Solapur',  bbox:[75.7,17.5,76.1,17.9], lat:17.7, lon:75.9, crop:'Soybean, Jowar'      },
  { id:5, name:'Amravati', bbox:[77.6,20.8,77.9,21.1], lat:20.9, lon:77.8, crop:'Cotton, Soybean'     },
  { id:6, name:'Aurangabad',bbox:[75.2,19.7,75.5,20.0],lat:19.9, lon:75.3, crop:'Cotton, Soybean'     },
  { id:7, name:'Latur',    bbox:[76.4,18.2,76.7,18.5], lat:18.4, lon:76.5, crop:'Soybean, Tur'        },
  { id:8, name:'Kolhapur', bbox:[74.1,16.5,74.4,16.8], lat:16.7, lon:74.2, crop:'Sugarcane, Rice'     }
];

// GET /api/districts — All districts
router.get('/', (req, res) => {
  res.json({ success: true, count: DISTRICTS.length, data: DISTRICTS });
});

// GET /api/districts/:id — Single district
router.get('/:id', (req, res) => {
  const district = DISTRICTS.find(d => d.id === parseInt(req.params.id));
  if (!district) {
    return res.status(404).json({ success: false, error: 'District not found' });
  }
  res.json({ success: true, data: district });
});

// GET /api/districts/:id/risk — Latest risk for district
router.get('/:id/risk', async (req, res) => {
  try {
    const snapshot = await db.collection('forecasts')
      .where('districtId', '==', parseInt(req.params.id))
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.json({
        success: true,
        data   : { districtId: req.params.id, message: 'No forecast available yet' }
      });
    }

    res.json({ success: true, data: snapshot.docs[0].data() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
