import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged as _onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as _signOut,
  sendEmailVerification,
  reload,
  User,
} from "firebase/auth";

// storageBucket / messagingSenderId / appId are unused today (no Storage or
// Analytics calls in this app) but are wired up now so adding either later
// doesn't silently fail for missing config.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

export type { User };

export function onAuthStateChanged(
  authObj: ReturnType<typeof getAuth>,
  callback: (user: User | null) => void
) {
  return _onAuthStateChanged(authObj, callback);
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result;
}

export async function signInWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result;
}

export async function signUpWithEmail(email: string, password: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(result.user);
  return result;
}

export async function signOut() {
  return _signOut(auth);
}

/** Send (or resend) a verification email to the currently signed-in user */
export async function resendVerificationEmail() {
  if (!auth.currentUser) throw new Error("Not authenticated");
  return sendEmailVerification(auth.currentUser);
}

/** Re-fetch the current user's record from Firebase so emailVerified reflects reality */
export async function refreshUser(): Promise<User | null> {
  if (!auth.currentUser) return null;
  await reload(auth.currentUser);
  return auth.currentUser;
}

/** Wait for Firebase Auth to finish initializing (needed after page refresh) */
function waitForUser(): Promise<User | null> {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }
    const unsub = _onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user);
    });
  });
}

/** Get a fresh Firebase ID token for the current user */
export async function getIdToken(forceRefresh = false): Promise<string> {
  let user = auth.currentUser;
  if (!user) {
    user = await waitForUser();
  }
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken(forceRefresh);
}