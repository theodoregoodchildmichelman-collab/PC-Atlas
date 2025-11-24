import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA7ubplpyeEMOZKgD5yk3xUrWB8Q4ztltI",
  authDomain: "pc-repository.firebaseapp.com",
  projectId: "pc-repository",
  storageBucket: "pc-repository.firebasestorage.app",
  messagingSenderId: "938359035802",
  appId: "1:938359035802:web:27cf9ff75c2f4edf6acc23",
  measurementId: "G-4L9QX1QJPC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
export default app;
