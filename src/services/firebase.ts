// firebase.ts
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  setDoc,
} from "firebase/firestore";
import { User } from "../types";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD30mclxTAYY82gUcj68eckM0CUcuKi66A",
  authDomain: "natural-language-queryin-66a4d.firebaseapp.com",
  projectId: "natural-language-queryin-66a4d",
  storageBucket: "natural-language-queryin-66a4d.firebasestorage.app",
  messagingSenderId: "667244631446",
  appId: "1:667244631446:web:b8778caf58455cbbdd79b7",
  measurementId: "G-MPZ2V4GKBN",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
const auth = getAuth(app);

export interface AuthUser {
  uid: string;
  email: string | null;
  name: string;
  token?: string;
}

// Registration
export async function register(
  email: string,
  password: string
): Promise<AuthUser> {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;
  const token = await user.getIdToken();

  return {
    uid: user.uid,
    email: user.email,
    name: user.displayName || "",
    token,
  };
}

// Sign in with email/password
export async function loginWithEmail(
  email: string,
  password: string
): Promise<AuthUser> {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  console.log(userCredential);

  const user = userCredential.user;
  const token = await user.getIdToken();

  return {
    uid: user.uid,
    email: user.email,
    name: user.displayName || "",
    token,
  };
}

// Google login
export async function loginWithGoogle(): Promise<AuthUser> {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  const user = userCredential.user;
  const token = await user.getIdToken();

  return {
    uid: user.uid,
    email: user.email,
    name: user.displayName || "",
    token,
  };
}

export const saveUser = async (user: {
  uid: string;
  name: string;
  email: string;
}) => {
  const userRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(userRef);
  console.log(userRef);
  console.log(docSnap);

  if (!docSnap.exists()) {
    // New user → set createdAt
    await setDoc(userRef, {
      uid: user.uid,
      name: user.name,
      email: user.email,
      provider: "google",
      createdAt: new Date(),
      lastLogin: new Date(),
    });
    await addDoc(collection(db, "users", user.uid, "sessions"), {
      startedAt: new Date(),
      device: "Chrome on Windows",
      status: "active",
    });
  } else {
    // Existing user → only update lastLogin
    await setDoc(
      userRef,
      {
        lastLogin: new Date(),
      },
      { merge: true }
    );
  }
};

// Logout
export async function logout(): Promise<void> {
  await firebaseSignOut(auth);
}
