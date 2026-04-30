import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDb2Npil73JYHe0tkJwq7gCeoZ07S5vI1I",
  authDomain: "samridhi-ngo.firebaseapp.com",
  projectId: "samridhi-ngo",
  storageBucket: "samridhi-ngo.firebasestorage.app",
  messagingSenderId: "338962277922",
  appId: "1:338962277922:web:1b5cc4c70dba747a16cc7b",
  measurementId: "G-19L7L35P4X"
};

// This prevents the "App already exists" Vite crash
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);