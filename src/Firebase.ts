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
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "firebase/firestore";

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

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider =
  new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  const result =
    await signInWithPopup(
      auth,
      googleProvider
    );

  const userRef = doc(
    db,
    "users",
    result.user.uid
  );

  const userSnap =
    await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      username:
        result.user.displayName,
      email:
        result.user.email,
      createdAt:
        new Date().toISOString(),
      scores: {},
      completedMissions: []
    });
  }

  return result.user;
};

export const registerWithEmail = async (
  email: string,
  password: string,
  username: string
) => {
  const result =
    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

  await updateProfile(
    result.user,
    {
      displayName: username
    }
  );

  await setDoc(
    doc(
      db,
      "users",
      result.user.uid
    ),
    {
      username,
      email,
      createdAt:
        new Date().toISOString(),
      scores: {},
      completedMissions: []
    }
  );

  return result.user;
};

export const loginWithEmail = async (
  email: string,
  password: string
) => {
  const result =
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  return result.user;
};

export const logOut = async () => {
  await signOut(auth);
};

export const getUserProgress = async (
  userId: string
) => {
  const userSnap =
    await getDoc(
      doc(db, "users", userId)
    );

  if (!userSnap.exists()) {
    return {
      scores: {},
      completedMissions: []
    };
  }

  const data =
    userSnap.data();

  return {
    scores:
      data.scores || {},
    completedMissions:
      Array.isArray(
        data.completedMissions
      )
        ? data.completedMissions
        : []
  };
};

export const saveUserScore = async (
  userId: string,
  tier: string,
  score: number,
  total: number
) => {
  const safeTotal =
    Math.max(0, total);

  const safeScore =
    Math.min(
      Math.max(0, score),
      safeTotal
    );

  const userRef =
    doc(db, "users", userId);

  const userSnap =
    await getDoc(userRef);

  const previous =
    userSnap.exists()
      ? userSnap.data().scores?.[tier]
      : undefined;

  const previousFinalScore =
    previous &&
    typeof previous.finalScore ===
      "number"
      ? previous.finalScore
      : undefined;

  if (
    previousFinalScore !==
      undefined &&
    previousFinalScore >= safeScore
  ) {
    return;
  }

  const existingTierData =
    previous &&
    typeof previous === "object"
      ? previous
      : {};

  await setDoc(
    userRef,
    {
      scores: {
        [tier]: {
          ...existingTierData,
          score: safeScore,
          total: safeTotal,
          finalScore: safeScore,
          finalTotal: safeTotal,
          timestamp:
            new Date().toISOString()
        }
      }
    },
    { merge: true }
  );
};

export const savePreTestScore = async (
  userId: string,
  tier: string,
  preTestScore: number,
  preTestTotal: number
) => {
  const safeTotal =
    Math.max(0, preTestTotal);

  const safeScore =
    Math.min(
      Math.max(0, preTestScore),
      safeTotal
    );

  const userRef =
    doc(db, "users", userId);

  const userSnap =
    await getDoc(userRef);

  const previous =
    userSnap.exists()
      ? userSnap.data().scores?.[tier]
      : undefined;

  const existingTierData =
    previous &&
    typeof previous === "object"
      ? previous
      : {};

  await setDoc(
    userRef,
    {
      scores: {
        [tier]: {
          ...existingTierData,
          preTestScore:
            safeScore,
          preTestTotal:
            safeTotal,
          preTestTimestamp:
            new Date().toISOString()
        }
      }
    },
    { merge: true }
  );
};

export const saveCompletedMissions = async (
  uid: string,
  missions: string[]
) => {
  try {
    await setDoc(
      doc(db, "users", uid),
      {
        completedMissions:
          missions
      },
      { merge: true }
    );
  } catch (error) {
    console.error(
      "Error saving missions:",
      error
    );

    throw error;
  }
};