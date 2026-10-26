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
  applyActionCode,
  updateProfile,
  reload,
  User,
  type ActionCodeSettings,
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

/**
 * Where Firebase sends the user once they've clicked the verification link.
 *
 * This is the *continue* URL, not the handler — it does not move the link off
 * Firebase's own hosted page. Until the Firebase console's custom action URL
 * points at /auth/action, the link opens that hosted page and this is the
 * destination it offers afterwards; /verify-email polls for the flag, so
 * landing back there completes the flow without the user doing anything else.
 * Once the console is pointed at /auth/action, the link lands in the app
 * directly and this value becomes the post-apply redirect.
 *
 * The origin is read at call time rather than from a NEXT_PUBLIC_* var because
 * those are inlined at build time (see lib/config.ts) — dev, UAT and prod
 * would each need their own build just to get their own verification links.
 * The domain must be listed under Authentication → Settings → Authorized
 * domains in the Firebase console, or Firebase rejects the send.
 */
function verificationActionSettings(): ActionCodeSettings | undefined {
  if (typeof window === "undefined") return undefined;
  return { url: `${window.location.origin}/verify-email` };
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result;
}

export async function signInWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result;
}

/**
 * Creates the account and, when a name is supplied, writes it to the Firebase
 * profile before anything else runs. The header, profile heading and comment
 * author name all read user.displayName, so setting it here is what keeps
 * those from falling back to "Student" or the email prefix.
 */
export async function signUpWithEmail(email: string, password: string, displayName?: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const name = displayName?.trim();
  if (name) {
    await updateProfile(result.user, { displayName: name });
    // updateProfile doesn't re-emit on onAuthStateChanged, so refresh the
    // local user object to make the new name visible without a reload.
    await reload(result.user);
  }
  await sendEmailVerification(result.user, verificationActionSettings());
  return result;
}

export async function signOut() {
  return _signOut(auth);
}

/** Send (or resend) a verification email to the currently signed-in user */
export async function resendVerificationEmail() {
  if (!auth.currentUser) throw new Error("Not authenticated");
  return sendEmailVerification(auth.currentUser, verificationActionSettings());
}

/**
 * Applies an out-of-band code from an email link (verification, recovery).
 *
 * Deliberately does not require a signed-in session: the link is usually
 * opened by the mail client, which often isn't the browser that created the
 * account, and the code is validated server-side by Firebase regardless.
 */
export async function applyEmailActionCode(oobCode: string) {
  return applyActionCode(auth, oobCode);
}

/**
 * Re-fetch the current user's record from Firebase so emailVerified reflects
 * reality, and mint a fresh ID token once it does.
 *
 * The token refresh is the part that matters. reload() updates the local User
 * object but leaves the cached ID token alone, and that token carries the
 * email_verified claim the backend actually gates on — so without this, a user
 * who just verified keeps getting 403s from /student/auth/bootstrap until the
 * old token expires an hour later.
 */
export async function refreshUser(): Promise<User | null> {
  if (!auth.currentUser) return null;
  await reload(auth.currentUser);
  if (auth.currentUser.emailVerified) {
    await auth.currentUser.getIdToken(true);
  }
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
