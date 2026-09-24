import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA9loc7wpdtyRrKmwGago1S0so7j3KTj1c",
  authDomain: "sandbox-secure-thesis.firebaseapp.com",
  databaseURL: "https://sandbox-secure-thesis-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sandbox-secure-thesis",
  storageBucket: "sandbox-secure-thesis.firebasestorage.app",
  messagingSenderId: "543031512593",
  appId: "1:543031512593:web:e41386bd4bed13fe15abb0",
  measurementId: "G-L3TW6NCND0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// --- AUTH FUNCTIONS ---

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  
  // If it's a new Google user, create a doc in Firestore for them
  const userRef = doc(db, "users", result.user.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      username: result.user.displayName,
      email: result.user.email,
      createdAt: new Date().toISOString(),
      scores: {}
    });
  }
  return result.user;
};

export const registerWithEmail = async (email: string, password: string, username: string) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName: username });
  
  // Save user data to Firestore
  await setDoc(doc(db, "users", result.user.uid), {
    username: username,
    email: email,
    createdAt: new Date().toISOString(),
    scores: {}
  });
  return result.user;
};

export const loginWithEmail = async (email: string, password: string) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const logOut = async () => {
  await signOut(auth);
};

// --- DATABASE FUNCTIONS ---

export const saveUserScore = async (userId: string, tier: string, score: number, total: number) => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const currentScores = userSnap.data().scores || {};
    // Only update if the new score is better than the old score
    if (!currentScores[tier] || score > currentScores[tier].score) {
      await updateDoc(userRef, {
        scores: {
          ...currentScores,
          [tier]: { score, total, timestamp: new Date().toISOString() }
        }
      });
    }
  } else {
    await setDoc(userRef, {
      scores: {
        [tier]: { score, total, timestamp: new Date().toISOString() }
      },
      createdAt: new Date().toISOString()
    });
  }
};