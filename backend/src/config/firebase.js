const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
    // Storage remove kar diya — free plan
  });
}

const db   = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
