import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from './firebase-config';

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth };
