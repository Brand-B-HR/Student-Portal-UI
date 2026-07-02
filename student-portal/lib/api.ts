import { auth } from "./firebase";

export async function studentFetch(path: string, options?: RequestInit) {
  const idToken = await auth.currentUser?.getIdToken(true); // true = force refresh
  const headers = new Headers(options?.headers);

  if (!(options?.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (idToken) {
    headers.set("Authorization", `Bearer ${idToken}`);
  }

  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers,
  });
}

export async function bootstrapStudentProfile() {
  return studentFetch("/api/auth/bootstrap", {
    method: "POST",
  });
}

export async function uploadStudentCv(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return studentFetch("/api/student/cv", {
    method: "POST",
    body: formData,
  });
}

export async function getMyStudentCv() {
  return studentFetch("/api/student/cv");
}

export async function downloadMyStudentCv() {
  return studentFetch("/api/student/cv/file");
}