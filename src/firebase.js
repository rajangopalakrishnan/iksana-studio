import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

/**
 * Loads data from a Firestore document.
 */
export async function loadFromFirebase(key, fallback) {
  try {
    const docRef = doc(db, "iksana_storage", key);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const parsed = JSON.parse(docSnap.data().data);
      if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(fallback) && fallback.length > 0) {
        return fallback;
      }
      return parsed;
    }
  } catch (error) {
    console.error(`Error loading ${key} from Firebase:`, error);
  }
  return fallback;
}

/**
 * Saves data to a Firestore document.
 */
export async function saveToFirebase(key, val) {
  try {
    const docRef = doc(db, "iksana_storage", key);
    await setDoc(docRef, { data: JSON.stringify(val) });
  } catch (error) {
    console.error(`Error saving ${key} to Firebase:`, error);
  }
}
