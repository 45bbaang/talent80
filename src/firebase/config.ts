import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCB6P-r0xzq2rJieY1NwYvBuzCwhcaMy4A",
  authDomain: "talent-80.firebaseapp.com",
  projectId: "talent-80",
  storageBucket: "talent-80.firebasestorage.app",
  messagingSenderId: "329419285305",
  appId: "1:329419285305:web:74ed8c68bc003eb02cfee8",
  measurementId: "G-XQ21BZG221"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
