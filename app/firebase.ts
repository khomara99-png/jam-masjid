import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBrzRb7qoYLb8QtMkAr5vCGe1UDI_-RFCk",
  authDomain: "jam-masjid-nurulhuda.firebaseapp.com",
  databaseURL: "https://jam-masjid-nurulhuda-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "jam-masjid-nurulhuda",
  storageBucket: "jam-masjid-nurulhuda.firebasestorage.app",
  messagingSenderId: "765958582270",
  appId: "1:765958582270:web:007e2a5e7aa9de2315daaf",
  measurementId: "G-3P2TBBB7HT"
};

// Mencegah inisialisasi ganda di Next.js
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

export { db };