// Mock Firebase client auth state using localStorage

export interface MockUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
}

// Track listeners
const listeners: ((user: MockUser | null) => void)[] = [];

// Helper to get mock user from localStorage
function getSavedUser(): MockUser | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem("mock_user");
  if (!data) return null;
  try {
    const parsed = JSON.parse(data);
    return {
      ...parsed,
      getIdToken: async () => "mock-id-token",
    };
  } catch {
    return null;
  }
}

// Helper to save mock user
function saveUser(user: Omit<MockUser, "getIdToken"> | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem("mock_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("mock_user");
  }
  // Notify listeners
  const mockUserObj = user ? { ...user, getIdToken: async () => "mock-id-token" } : null;
  if (auth) {
    auth.currentUser = mockUserObj;
  }
  listeners.forEach((cb) => cb(mockUserObj));
}

export const auth = {
  currentUser: null as MockUser | null,
};

// Initialize current user
if (typeof window !== "undefined") {
  auth.currentUser = getSavedUser();
}

export function onAuthStateChanged(authObj: any, callback: (user: MockUser | null) => void) {
  listeners.push(callback);
  // Call immediately with current state
  callback(getSavedUser());
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

export async function signOut(authObj: any) {
  saveUser(null);
  return Promise.resolve();
}

export async function signInWithGoogle() {
  const user = {
    uid: "mock-google-user-123",
    email: "alex.rivera@university.edu",
    displayName: "Alex Rivera",
    photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
  };
  saveUser(user);
  return { user: { ...user, getIdToken: async () => "mock-id-token" }, idToken: "mock-id-token" };
}

export async function signInWithEmail(email: string, password: string) {
  const name = email.split("@")[0];
  const displayName = name.charAt(0).toUpperCase() + name.slice(1);
  const user = {
    uid: "mock-email-user-123",
    email: email,
    displayName: displayName,
  };
  saveUser(user);
  return { user: { ...user, getIdToken: async () => "mock-id-token" }, idToken: "mock-id-token" };
}

export async function signUpWithEmail(email: string, password: string) {
  const name = email.split("@")[0];
  const displayName = name.charAt(0).toUpperCase() + name.slice(1);
  const user = {
    uid: "mock-email-user-123",
    email: email,
    displayName: displayName,
  };
  saveUser(user);
  return { user: { ...user, getIdToken: async () => "mock-id-token" }, idToken: "mock-id-token" };
}