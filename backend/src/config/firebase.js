const admin = require('firebase-admin');

if (!admin.apps.length) {
  // Base64 decode — no \n issues ever!
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8')
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

module.exports = {
  db  : admin.firestore(),
  auth: admin.auth()
};
