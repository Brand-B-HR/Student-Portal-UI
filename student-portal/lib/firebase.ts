import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged as _onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as _signOut,
  User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
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
  return result;
}

export async function signOut() {
  return _signOut(auth);
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