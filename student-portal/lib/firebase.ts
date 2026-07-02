import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

// Prevent re-initializing on hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();
  return { user: result.user, idToken };
}

export async function signInWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await result.user.getIdToken();
  return { user: result.user, idToken };
}

export async function signUpWithEmail(email: string, password: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const idToken = await result.user.getIdToken();
  return { user: result.user, idToken };
}