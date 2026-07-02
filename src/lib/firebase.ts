import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB5jK0nK1oQCFm3dZlIFVkv75WXVFZVu2Y",
  authDomain: "hypnagogic-analyzer-rxhgq.firebaseapp.com",
  projectId: "hypnagogic-analyzer-rxhgq",
  storageBucket: "hypnagogic-analyzer-rxhgq.firebasestorage.app",
  messagingSenderId: "906472506314",
  appId: "1:906472506314:web:5a694e79ef1f9b35b0c533"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth & Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with custom database ID
export const db = getFirestore(app, "ai-studio-desafiodocofre-037a6cde-bf4e-40ba-87c7-414652cdc536");
