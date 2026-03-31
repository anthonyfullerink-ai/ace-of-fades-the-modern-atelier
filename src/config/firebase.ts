import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCfIsB6ENt6p5cikmKClxCSfc-gheqjtlg",
  authDomain: "nexus-offgrid-media.firebaseapp.com",
  projectId: "nexus-offgrid-media",
  storageBucket: "nexus-offgrid-media.firebasestorage.app",
  messagingSenderId: "169833415184",
  appId: "1:169833415184:web:cecf09490805a58836c095"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Admin Whitelist
export const ADMIN_EMAILS = ['anthony@offgridmediagroup.com'];

export const isAdmin = (user: any) => {
  return user && user.email && ADMIN_EMAILS.includes(user.email);
};
