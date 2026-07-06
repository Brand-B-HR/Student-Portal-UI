// Mock API helpers for Student-Portal

const defaultProfile = {
  student: {
    fullName: "Alex Rivera",
    email: "alex.rivera@university.edu",
    phone: "+1 (555) 019-2834",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/alex-rivera",
    portfolio: "alexrivera.dev",
  },
  currentCv: {
    fileName: "Alex_Rivera_CV.pdf",
    fileSizeKB: 245,
    uploadedAt: new Date().toISOString(),
    status: "Reviewed",
    reviews: [
      {
        score: 9,
        feedback: "Excellent resume structure. The project descriptions are clear, quantified, and action-oriented. Consider expanding slightly on your database experience.",
      }
    ],
    experience: [
      {
        title: "Software Engineering Intern",
        company: "TechCorp Solutions",
        startDate: "June 2025",
        endDate: "Present",
        description: "Developed and maintained responsive web applications using React and Next.js. Improved page load speed by 35% through image optimization and code splitting. Collaborated with cross-functional teams to deliver critical user-facing features."
      },
      {
        title: "Web Developer",
        company: "University Design Studio",
        startDate: "September 2024",
        endDate: "May 2025",
        description: "Designed and implemented website features for various university departments. Managed database integration and API services."
      }
    ],
    education: [
      {
        degree: "Bachelor of Science in Computer Science",
        institution: "State University",
        graduationYear: "2026"
      }
    ],
    skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "JavaScript", "HTML5", "Node.js", "Python", "Git"]
  }
};

function mockResponse(data: any, status = 200, isBlob = false): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => typeof data === "string" ? data : JSON.stringify(data),
    blob: async () => {
      if (isBlob) {
        // Return a mock dummy PDF blob
        const pdfText = "%PDF-1.4 ... Mock PDF content ...";
        return new Blob([pdfText], { type: "application/pdf" });
      }
      return new Blob([JSON.stringify(data)], { type: "application/json" });
    },
  } as unknown as Response;
}

let lastUploadedFileUrl: string | null = null;

export async function bootstrapStudentProfile() {
  return mockResponse({ success: true });
}

export async function uploadStudentCv(file: File) {
  if (typeof window !== "undefined") {
    if (lastUploadedFileUrl) {
      URL.revokeObjectURL(lastUploadedFileUrl);
    }
    lastUploadedFileUrl = URL.createObjectURL(file);
    
    let currentData = localStorage.getItem("mock_student_profile");
    let profile = currentData ? JSON.parse(currentData) : { ...defaultProfile };
    profile.currentCv = {
      ...profile.currentCv,
      fileName: file.name,
      fileSizeKB: Math.round(file.size / 1024),
      uploadedAt: new Date().toISOString(),
      status: "Processing"
    };
    localStorage.setItem("mock_student_profile", JSON.stringify(profile));
  }
  return mockResponse({ success: true });
}

export async function saveStudentProfile(profileData: any) {
  if (typeof window !== "undefined") {
    localStorage.setItem("mock_student_profile", JSON.stringify(profileData));
  }
  return mockResponse({ success: true });
}

export async function getMyStudentCv() {
  if (typeof window !== "undefined") {
    let currentData = localStorage.getItem("mock_student_profile");
    if (!currentData) {
      localStorage.setItem("mock_student_profile", JSON.stringify(defaultProfile));
      currentData = JSON.stringify(defaultProfile);
    }
    return mockResponse(JSON.parse(currentData));
  }
  return mockResponse(defaultProfile);
}

export async function downloadMyStudentCv() {
  if (lastUploadedFileUrl) {
    try {
      const res = await fetch(lastUploadedFileUrl);
      return res;
    } catch (e) {
      console.error("Failed to fetch uploaded file URL, falling back", e);
    }
  }

  // Base64 for a minimal valid 1-page PDF:
  const base64Pdf = "JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqMiAwIG9iajw8L1R5cGUvUGFnZXMvS2lkc1szIDAgUl0vQ291bnQgMT4+ZW5kb2JqMyAwIG9iajw8L1R5cGUvUGFnZS9QYXJlbnQgMiAwIFIvTWVkaWFCb3hbMCAwIDU5NSA4NDJdL0NvbnRlbnRzIDQgMCBSPj5lbmRvYmo0IDAgb2JqPDwvTGVuZ3RoIDU5Pj5zdHJlYW0KQlQKL0YxIDEyIFRmCjcyIDcyMCBUZCAoTW9jayBDViBQREYgRG9jdW1lbnQpIFRqCkVOCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDUKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTYgMDAwMDAgbiAKMDAwMDAwMDExMSAwMDAwMCBuIAowMDAwMDAwMjEyIDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA1L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMzIyCiUlRU9G";
  if (typeof window !== "undefined") {
    const binary = atob(base64Pdf);
    const len = binary.length;
    const buffer = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      buffer[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([buffer], { type: "application/pdf" });
    return new Response(blob);
  }
  return mockResponse({ mockPdf: true }, 200, true);
}