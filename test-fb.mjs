import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB3qXZJRHch7Lc0DnNyJdv5RGgZjPlTUPo",
  authDomain: "iksana-studio.firebaseapp.com",
  projectId: "iksana-studio",
  storageBucket: "iksana-studio.firebasestorage.app",
  messagingSenderId: "457320658157",
  appId: "1:457320658157:web:4a2cdac0b23e2c7cd748e4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  console.log("Connecting...");
  try {
    const docRef = doc(db, "iksana_storage", "test");
    await setDoc(docRef, { data: "hello" });
    console.log("Success! Document written.");
    
    const snap = await getDoc(docRef);
    console.log("Read document:", snap.data());
  } catch (error) {
    console.error("Firebase error:", error);
  }
  process.exit(0);
}

test();
