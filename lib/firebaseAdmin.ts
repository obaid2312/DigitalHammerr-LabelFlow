import admin from 'firebase-admin';

const getDecryptedPrivateKey = () => {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey) return undefined;
  return privateKey.replace(/\\n/g, '\n');
};

const initializeAdmin = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getDecryptedPrivateKey();

  let app: admin.app.App;

  if (projectId && clientEmail && privateKey) {
    try {
      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      app.firestore().settings({ ignoreUndefinedProperties: true });
      return app;
    } catch (error) {
      console.error('Failed to initialize Firebase Admin with credentials:', error);
    }
  }

  // Fallback to application default credentials (useful for GCP environments or if running locally with GCP CLI)
  try {
    app = admin.initializeApp();
    app.firestore().settings({ ignoreUndefinedProperties: true });
    return app;
  } catch (error) {
    console.warn(
      'Firebase Admin initialized with default configuration. Ensure correct environment variables are set for production.'
    );
    app = admin.initializeApp({
      projectId: projectId || 'labelflow-placeholder-id',
    });
    app.firestore().settings({ ignoreUndefinedProperties: true });
    return app;
  }
};

const adminApp = initializeAdmin();
const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminApp, adminDb, adminAuth };
