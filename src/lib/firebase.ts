import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function checkFirebaseEnv() {
  const missing: string[] = [];
  if (!firebaseConfig.apiKey) missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!firebaseConfig.authDomain) missing.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!firebaseConfig.projectId) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (!firebaseConfig.storageBucket) missing.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  if (!firebaseConfig.messagingSenderId) missing.push("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  if (!firebaseConfig.appId) missing.push("NEXT_PUBLIC_FIREBASE_APP_ID");

  return {
    isValid: missing.length === 0,
    missing,
    projectId: firebaseConfig.projectId || "(belum diatur)",
  };
}

const safeConfig = firebaseConfig.apiKey
  ? firebaseConfig
  : {
      apiKey: "placeholder-api-key",
      authDomain: "placeholder.firebaseapp.com",
      projectId: "placeholder-project",
      storageBucket: "placeholder.appspot.com",
      messagingSenderId: "000000000000",
      appId: "1:000000000000:web:000000000000",
    };

const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(safeConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };
