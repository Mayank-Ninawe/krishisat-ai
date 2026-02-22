import admin from 'firebase-admin';

function getAdminApp() {
  if (admin.apps.length) return admin.apps[0]!;

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId  : process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey : process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')!
    })
  });
}

// Lazy getters — only initialise at request time, never at build time
export const getDb   = () => admin.firestore(getAdminApp());
export const getAuth = () => admin.auth(getAdminApp());

export { admin };
export default admin;
