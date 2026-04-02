import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

console.log("Firebase config check:", {
  hasApiKey: !!firebaseConfig.apiKey,
  hasProjectId: !!firebaseConfig.projectId,
  projectId: firebaseConfig.projectId
});

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("CRITICAL: Firebase configuration is missing! Check your .env.local file.");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Admin Whitelist
export const ADMIN_EMAILS = [
  'anthony@offgridmediagroup.com',
  'admin@offgridmediagroup.com'
];

export const isAdmin = (user: any) => {
  return user && user.email && ADMIN_EMAILS.includes(user.email);
};
