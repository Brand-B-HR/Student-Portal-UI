"use client";

import { useEffect, useRef, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { useRouter } from "next/navigation";
import { uploadStudentCv, saveStudentProfile, getMyStudentCv } from "@/lib/api";

interface Job {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Education {
  degree: string;
  institution: string;
  graduationYear: string;
}

interface ProfileData {
  student: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    portfolio: string;
  };
  currentCv: {
    fileName: string;
    fileSizeKB: number;
    uploadedAt: string;
    status: string;
    experience: Job[];
    education: Education[];
    skills: string[];
  };
}

export default function UploadPage() {
  const router = useRouter();
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  // View states
  const [step, setStep] = useState<"upload" | "wizard">("upload");
  const [parsing, setParsing] = useState(false);
  const [parsingStepText, setParsingStepText] = useState("Uploading file...");
  
  // File states
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"pdf" | "video" | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [dragOverPdf, setDragOverPdf] = useState(false);
  const [dragOverVideo, setDragOverVideo] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Wizard states
  const [wizardStep, setWizardStep] = useState(1);
  const [newSkill, setNewSkill] = useState("");
  const [profileData, setProfileData] = useState<ProfileData>({
    student: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      portfolio: ""
    },
    currentCv: {
      fileName: "",
      fileSizeKB: 0,
      uploadedAt: "",
      status: "Draft",
      experience: [],
      education: [],
      skills: []
    }
  });

  // Load existing profile details as initial wizard mock fallback
  useEffect(() => {
    (async () => {
      try {
        const res = await getMyStudentCv();
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setProfileData(data);
          }
        }
      } catch (e) {
        console.error("Failed to load initial profile data", e);
      }
    })();
  }, []);

  // Cleanup file url on unmount
  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  // Handle Drag & Drop / Selection for PDF
  function handlePdfFile(selectedFile: File | null) {
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setErrorMessage("Please upload a valid PDF CV document.");
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      setErrorMessage("File must be 20 MB or smaller.");
      return;
    }

    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setFileType("pdf");
    setFileUrl(objectUrl);
    setErrorMessage("");
  }

  // Handle Drag & Drop / Selection for Video
  function handleVideoFile(selectedFile: File | null) {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("video/")) {
      setErrorMessage("Please upload a valid Video file.");
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      setErrorMessage("File must be 20 MB or smaller.");
      return;
    }

    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setFileType("video");
    setFileUrl(objectUrl);
    setErrorMessage("");
  }

  // Trigger fake AI parsing
  async function handleProceed() {
    if (!file) return;

    setParsing(true);
    setStep("wizard");
    setWizardStep(1);

    const stages = [
      "Uploading file securely...",
      "Analyzing document structure with AI...",
      "Running OCR text extraction...",
      "Identifying work history and dates...",
      "Extracting educational milestones...",
      "Detecting professional skills..."
    ];

    let stageIdx = 0;
    setParsingStepText(stages[0]);

    const interval = setInterval(() => {
      stageIdx++;
      if (stageIdx < stages.length) {
        setParsingStepText(stages[stageIdx]);
      } else {
        clearInterval(interval);
      }
    }, 400);

    await uploadStudentCv(file);

    setTimeout(() => {
      clearInterval(interval);
      
      setProfileData((prev) => ({
        student: {
          fullName: prev.student.fullName || "Alex Rivera",
          email: prev.student.email || "alex.rivera@university.edu",
          phone: prev.student.phone || "+1 (555) 019-2834",
          location: prev.student.location || "San Francisco, CA",
          linkedin: prev.student.linkedin || "linkedin.com/in/alex-rivera",
          portfolio: prev.student.portfolio || "alexrivera.dev"
        },
        currentCv: {
          fileName: file.name,
          fileSizeKB: Math.round(file.size / 1024),
          uploadedAt: new Date().toISOString(),
          status: "Under Review",
          experience: prev.currentCv.experience.length > 0 ? prev.currentCv.experience : [
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
          education: prev.currentCv.education.length > 0 ? prev.currentCv.education : [
            {
              degree: "Bachelor of Science in Computer Science",
              institution: "State University",
              graduationYear: "2026"
            }
          ],
          skills: prev.currentCv.skills.length > 0 ? prev.currentCv.skills : [
            "React", "Next.js", "TypeScript", "Tailwind CSS", "JavaScript", "HTML5", "Node.js", "Python", "Git"
          ]
        }
      }));

      setParsing(false);
    }, 2400);
  }

  // Handle Form changes
  function updateStudentField(key: string, value: string) {
    setProfileData((prev) => ({
      ...prev,
      student: {
        ...prev.student,
        [key]: value
      }
    }));
  }

  // Experience changes
  function updateExperience(idx: number, key: keyof Job, value: string) {
    setProfileData((prev) => {
      const exp = [...prev.currentCv.experience];
      exp[idx] = { ...exp[idx], [key]: value };
      return {
        ...prev,
        currentCv: { ...prev.currentCv, experience: exp }
      };
    });
  }

  // Add/Remove experience
  function addExperience() {
    setProfileData((prev) => ({
      ...prev,
      currentCv: {
        ...prev.currentCv,
        experience: [
          ...prev.currentCv.experience,
          { title: "", company: "", startDate: "", endDate: "", description: "" }
        ]
      }
    }));
  }

  function removeExperience(idx: number) {
    setProfileData((prev) => {
      const exp = prev.currentCv.experience.filter((_, i) => i !== idx);
      return {
        ...prev,
        currentCv: { ...prev.currentCv, experience: exp }
      };
    });
  }

  // Education changes
  function updateEducation(idx: number, key: keyof Education, value: string) {
    setProfileData((prev) => {
      const edu = [...prev.currentCv.education];
      edu[idx] = { ...edu[idx], [key]: value };
      return {
        ...prev,
        currentCv: { ...prev.currentCv, education: edu }
      };
    });
  }

  // Add/Remove education
  function addEducation() {
    setProfileData((prev) => ({
      ...prev,
      currentCv: {
        ...prev.currentCv,
        education: [
          ...prev.currentCv.education,
          { degree: "", institution: "", graduationYear: "" }
        ]
      }
    }));
  }

  function removeEducation(idx: number) {
    setProfileData((prev) => {
      const edu = prev.currentCv.education.filter((_, i) => i !== idx);
      return {
        ...prev,
        currentCv: { ...prev.currentCv, education: edu }
      };
    });
  }

  // Skills changes
  function removeSkill(skillName: string) {
    setProfileData((prev) => ({
      ...prev,
      currentCv: {
        ...prev.currentCv,
        skills: prev.currentCv.skills.filter((s) => s !== skillName)
      }
    }));
  }

  function handleAddSkill() {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    if (profileData.currentCv.skills.includes(trimmed)) {
      setNewSkill("");
      return;
    }
    setProfileData((prev) => ({
      ...prev,
      currentCv: {
        ...prev.currentCv,
        skills: [...prev.currentCv.skills, trimmed]
      }
    }));
    setNewSkill("");
  }

  // Submit profile to dashboard
  async function handleSubmit() {
    await saveStudentProfile(profileData);
    router.push("/dashboard");
  }

  const inputStyle = "w-full border-b-2 border-orange-200 bg-orange-50/20 px-3.5 py-2.5 text-sm text-ink-900 rounded-t-lg outline-none transition focus:border-orange-500 focus:bg-orange-50/40 hover:bg-orange-50/30";

  return (
    <AuthGuard>
      <main className="h-screen w-screen overflow-hidden flex flex-col bg-mint-50 p-4 sm:p-6 lg:p-8">
        
        {/* State 1: Divided Upload Container (Centered, Full Width) */}
        {step === "upload" && (
          <div className="flex-1 flex flex-col items-center justify-center min-h-0 w-full">
            <div className="w-full max-w-4xl space-y-5">
              <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest-900 to-forest-700 p-6 shadow-[0_20px_50px_-15px_rgba(45,19,5,0.4)] sm:p-7 text-center flex-shrink-0">
                <svg className="pointer-events-none absolute -top-14 -right-14 h-56 w-56 opacity-20" viewBox="0 0 200 200" fill="none">
                  <circle cx="100" cy="100" r="90" stroke="#fb923c" strokeWidth="1.5" />
                  <circle cx="100" cy="100" r="65" stroke="#f97316" strokeWidth="1.5" />
                </svg>
                
                <div className="relative z-10 space-y-1.5">
                  <span className="inline-block rounded-full bg-orange-500/20 px-3 py-0.5 text-[10px] font-semibold tracking-wider text-orange-300 uppercase">
                    Profile Onboarding
                  </span>
                  <h1 className="font-display text-xl font-bold text-white sm:text-2xl">
                    Upload your Profile Source
                  </h1>
                  <p className="mx-auto max-w-md text-xs leading-5 text-orange-100/80">
                    Select your upload type. Our AI parses either format to build your student profile instantly.
                  </p>
                </div>
              </section>

              <section className="rounded-3xl border border-orange-200 bg-white p-6 shadow-md">
                
                {/* Divided Upload Container */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* PDF Dropzone */}
                  <div
                    className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
                      dragOverPdf 
                        ? "border-orange-500 bg-orange-50/50" 
                        : fileType === "pdf"
                          ? "border-orange-400 bg-orange-50/30"
                          : "border-orange-200 bg-orange-50/10 hover:border-orange-400 hover:bg-orange-50/20"
                    }`}
                    onClick={() => pdfInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverPdf(true);
                    }}
                    onDragLeave={() => setDragOverPdf(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverPdf(false);
                      handlePdfFile(e.dataTransfer.files[0] ?? null);
                    }}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-2xl shadow-inner text-orange-600">
                      📄
                    </div>
                    <h3 className="mt-3.5 text-sm font-semibold text-forest-900">
                      Drop your PDF CV here
                    </h3>
                    <p className="mt-1 text-[11px] text-ink-400 max-w-xs">
                      Supports professional CVs (.pdf) up to 20MB
                    </p>
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => handlePdfFile(e.target.files?.[0] ?? null)}
                    />
                    {fileType === "pdf" && file && (
                      <span className="absolute top-3 right-3 text-[10px] bg-orange-600 text-white font-semibold px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>

                  {/* Video Dropzone */}
                  <div
                    className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
                      dragOverVideo 
                        ? "border-orange-500 bg-orange-50/50" 
                        : fileType === "video"
                          ? "border-orange-400 bg-orange-50/30"
                          : "border-orange-200 bg-orange-50/10 hover:border-orange-400 hover:bg-orange-50/20"
                    }`}
                    onClick={() => videoInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverVideo(true);
                    }}
                    onDragLeave={() => setDragOverVideo(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverVideo(false);
                      handleVideoFile(e.dataTransfer.files[0] ?? null);
                    }}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-2xl shadow-inner text-orange-600">
                      🎥
                    </div>
                    <h3 className="mt-3.5 text-sm font-semibold text-forest-900">
                      Drop your Video Intro here
                    </h3>
                    <p className="mt-1 text-[11px] text-ink-400 max-w-xs">
                      Supports pitch videos (.mp4, .webm, etc.) up to 20MB
                    </p>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => handleVideoFile(e.target.files?.[0] ?? null)}
                    />
                    {fileType === "video" && file && (
                      <span className="absolute top-3 right-3 text-[10px] bg-orange-600 text-white font-semibold px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>

                </div>

                {errorMessage && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-800">
                    {errorMessage}
                  </div>
                )}

                {/* Show Next Arrow Button */}
                {file && (
                  <div className="mt-5 overflow-hidden rounded-xl border border-orange-100 bg-orange-50/30 p-3.5 transition-all">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-forest-900">{file.name}</div>
                        <div className="mt-0.5 text-[10px] text-ink-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • {fileType?.toUpperCase()} Source
                        </div>
                      </div>
                      
                      <button
                        onClick={handleProceed}
                        className="group flex h-11 w-11 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-700 hover:scale-105 active:scale-95 animate-pulse"
                        title="Proceed to auto-filled fields"
                      >
                        <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-current fill-none stroke-2 transition-transform group-hover:translate-x-0.5">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {/* State 2: Split Screen Wizard (Locked Full-Height, No outer page scroll) */}
        {step === "wizard" && (
          <div className="flex-1 flex flex-col min-h-0 w-full">
            {parsing ? (
              /* AI Parsing Spinner */
              <div className="flex-1 flex flex-col items-center justify-center rounded-3xl bg-white p-8 shadow-sm">
                <div className="relative flex h-16 w-16 items-center justify-center">
                  <div className="absolute h-full w-full rounded-full border-4 border-orange-100 border-t-orange-600 animate-spin" />
                  <span className="text-xl">✨</span>
                </div>
                <h2 className="mt-5 text-base font-bold text-forest-900">AI Profile Autofilling</h2>
                <p className="mt-1.5 text-xs text-ink-600 animate-pulse">{parsingStepText}</p>
              </div>
            ) : (
              /* Full Width, Locked Viewport Split screen */
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-0 w-full">
                
                {/* Left Column: Reference View (h-full scrollable) */}
                <div className="lg:col-span-5 flex flex-col min-h-0 h-full">
                  <div className="flex items-center justify-between rounded-xl bg-forest-900 px-4 py-2.5 text-white flex-shrink-0 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{fileType === "video" ? "🎥" : "📄"}</span>
                      <span className="text-xs font-semibold truncate max-w-[200px]">
                        {file ? file.name : "CV Preview"}
                      </span>
                    </div>
                    <span className="rounded bg-orange-600 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase">
                      Source Reference
                    </span>
                  </div>

                  <div className="flex-1 overflow-hidden rounded-2xl border-2 border-orange-200 bg-white shadow-md min-h-0 relative">
                    {fileType === "pdf" && fileUrl ? (
                      <iframe 
                        src={`${fileUrl}#toolbar=0&navpanes=0`} 
                        className="h-full w-full border-0 absolute inset-0" 
                      />
                    ) : fileType === "video" && fileUrl ? (
                      <div className="absolute inset-0 flex flex-col justify-center bg-black p-2">
                        <video 
                          src={fileUrl} 
                          controls 
                          className="max-h-full max-w-full rounded-lg mx-auto" 
                        />
                      </div>
                    ) : (
                      /* Live HTML CV builder preview (internal scrollable) */
                      <div className="h-full overflow-y-auto bg-white p-6 text-left text-xs font-sans text-gray-800 absolute inset-0">
                        <div className="border-b-2 border-orange-500 pb-3 text-center">
                          <h2 className="text-xl font-bold text-orange-600">
                            {profileData.student.fullName || "Your Full Name"}
                          </h2>
                          <p className="mt-1.5 text-gray-500">
                            {profileData.student.email && `${profileData.student.email} | `}
                            {profileData.student.phone && `${profileData.student.phone} | `}
                            {profileData.student.location || "Location"}
                          </p>
                          <p className="mt-1 text-gray-500">
                            {profileData.student.linkedin && `${profileData.student.linkedin} | `}
                            {profileData.student.portfolio}
                          </p>
                        </div>

                        {/* Experience */}
                        <div className="mt-4 space-y-3">
                          <h3 className="text-[11px] font-semibold tracking-wider text-orange-600 uppercase border-b border-orange-200 pb-0.5">
                            Professional Experience
                          </h3>
                          {profileData.currentCv.experience.length === 0 ? (
                            <p className="italic text-gray-400">No experience items added.</p>
                          ) : (
                            profileData.currentCv.experience.map((exp, idx) => (
                              <div key={idx} className="space-y-0.5">
                                <div className="flex justify-between font-semibold text-gray-900">
                                  <span>{exp.title || "Job Title"}</span>
                                  <span className="text-gray-500 text-[10px]">{exp.startDate || "Start"} – {exp.endDate || "End"}</span>
                                </div>
                                <div className="italic text-orange-700">{exp.company || "Company Name"}</div>
                                <p className="text-gray-600 whitespace-pre-line pl-2 border-l border-orange-100 text-[11px]">
                                  {exp.description || "Work description..."}
                                </p>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Education */}
                        <div className="mt-4 space-y-2">
                          <h3 className="text-[11px] font-semibold tracking-wider text-orange-600 uppercase border-b border-orange-200 pb-0.5">
                            Education
                          </h3>
                          {profileData.currentCv.education.length === 0 ? (
                            <p className="italic text-gray-400">No education items added.</p>
                          ) : (
                            profileData.currentCv.education.map((edu, idx) => (
                              <div key={idx} className="flex justify-between">
                                <div>
                                  <span className="font-semibold text-gray-900">{edu.degree || "Degree"}</span>
                                  <span className="text-gray-500"> — {edu.institution || "Institution"}</span>
                                </div>
                                <span className="text-gray-500">{edu.graduationYear || "Year"}</span>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Skills */}
                        <div className="mt-4 space-y-1.5">
                          <h3 className="text-[11px] font-semibold tracking-wider text-orange-600 uppercase border-b border-orange-200 pb-0.5">
                            Skills
                          </h3>
                          {profileData.currentCv.skills.length === 0 ? (
                            <p className="italic text-gray-400">No skills added yet.</p>
                          ) : (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {profileData.currentCv.skills.map((s) => (
                                <span key={s} className="rounded bg-orange-100 px-1.5 py-0.5 text-[9px] font-medium text-orange-800">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Editable Wizard Form (h-full, inner content scrollable) */}
                <div className="lg:col-span-7 flex flex-col min-h-0 h-full">
                  <div className="flex-1 flex flex-col rounded-3xl border border-orange-200 bg-white p-5 shadow-md sm:p-6 min-h-0 h-full">
                    
                    {/* Wizard Progress Dots */}
                    <div className="mb-4 flex-shrink-0">
                      <div className="flex items-center justify-between text-xs font-semibold text-ink-600">
                        <span>Step {wizardStep} of 5</span>
                        <span className="text-orange-600">
                          {wizardStep === 1 && "Basic Info"}
                          {wizardStep === 2 && "Work Experience"}
                          {wizardStep === 3 && "Education"}
                          {wizardStep === 4 && "Skills Tags"}
                          {wizardStep === 5 && "Review & Confirm"}
                        </span>
                      </div>
                      
                      <div className="mt-2.5 flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <div
                            key={s}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                              s <= wizardStep ? "bg-orange-500" : "bg-orange-100"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Scrollable Form Body */}
                    <div className="flex-1 overflow-y-auto pr-1 min-h-0">
                      
                      {/* Step 1: Basic Info */}
                      {wizardStep === 1 && (
                        <div className="space-y-4">
                          <div>
                            <h2 className="text-lg font-bold text-forest-900">Basic Info</h2>
                            <p className="text-xs text-ink-400 mt-0.5">Review contact information parsed from your upload.</p>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-ink-600 flex items-center justify-between">
                                <span>Full Name</span>
                                <span className="text-[9px] text-orange-500 bg-orange-50 px-1 py-0.5 rounded">Auto-filled</span>
                              </label>
                              <input
                                type="text"
                                className={inputStyle}
                                value={profileData.student.fullName}
                                onChange={(e) => updateStudentField("fullName", e.target.value)}
                                placeholder="Jane Doe"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-ink-600 flex items-center justify-between">
                                <span>Email Address</span>
                                <span className="text-[9px] text-orange-500 bg-orange-50 px-1 py-0.5 rounded">Auto-filled</span>
                              </label>
                              <input
                                type="email"
                                className={inputStyle}
                                value={profileData.student.email}
                                onChange={(e) => updateStudentField("email", e.target.value)}
                                placeholder="jane.doe@university.edu"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-ink-600 flex items-center justify-between">
                                <span>Phone Number</span>
                                <span className="text-[9px] text-orange-500 bg-orange-50 px-1 py-0.5 rounded">Auto-filled</span>
                              </label>
                              <input
                                type="text"
                                className={inputStyle}
                                value={profileData.student.phone}
                                onChange={(e) => updateStudentField("phone", e.target.value)}
                                placeholder="+1 (555) 000-0000"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-ink-600 flex items-center justify-between">
                                <span>Location</span>
                                <span className="text-[9px] text-orange-500 bg-orange-50 px-1 py-0.5 rounded">Auto-filled</span>
                              </label>
                              <input
                                type="text"
                                className={inputStyle}
                                value={profileData.student.location}
                                onChange={(e) => updateStudentField("location", e.target.value)}
                                placeholder="New York, NY"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-ink-600 flex items-center justify-between">
                                <span>LinkedIn Link</span>
                                <span className="text-[9px] text-orange-500 bg-orange-50 px-1 py-0.5 rounded">Auto-filled</span>
                              </label>
                              <input
                                type="text"
                                className={inputStyle}
                                value={profileData.student.linkedin}
                                onChange={(e) => updateStudentField("linkedin", e.target.value)}
                                placeholder="linkedin.com/in/janedoe"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-ink-600 flex items-center justify-between">
                                <span>Portfolio / Website</span>
                                <span className="text-[9px] text-orange-500 bg-orange-50 px-1 py-0.5 rounded">Auto-filled</span>
                              </label>
                              <input
                                type="text"
                                className={inputStyle}
                                value={profileData.student.portfolio}
                                onChange={(e) => updateStudentField("portfolio", e.target.value)}
                                placeholder="janedoe.com"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 2: Experience */}
                      {wizardStep === 2 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h2 className="text-lg font-bold text-forest-900">Experience</h2>
                              <p className="text-xs text-ink-400 mt-0.5">Review work history details, and adjust job entries as needed.</p>
                            </div>
                            <button
                              type="button"
                              onClick={addExperience}
                              className="rounded-xl bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700 transition hover:bg-orange-200"
                            >
                              + Add Job
                            </button>
                          </div>

                          {profileData.currentCv.experience.length === 0 ? (
                            <div className="text-center py-8 rounded-2xl border border-dashed border-orange-200 bg-orange-50/10 text-ink-400 text-xs">
                              No experience items added. Click "+ Add Job" to create one.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {profileData.currentCv.experience.map((exp, idx) => (
                                <div key={idx} className="relative space-y-2.5 rounded-2xl border border-orange-100 bg-orange-50/10 p-3.5">
                                  <button
                                    type="button"
                                    onClick={() => removeExperience(idx)}
                                    className="absolute right-3 top-3 text-xs bg-orange-50 hover:bg-orange-100 px-1.5 py-0.5 rounded-md text-orange-700 transition font-bold"
                                    title="Delete Job"
                                  >
                                    ✕
                                  </button>
                                  
                                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-semibold text-ink-600">Job Title</label>
                                      <input
                                        type="text"
                                        className={inputStyle}
                                        value={exp.title}
                                        onChange={(e) => updateExperience(idx, "title", e.target.value)}
                                        placeholder="Software Engineer"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-semibold text-ink-600">Company Name</label>
                                      <input
                                        type="text"
                                        className={inputStyle}
                                        value={exp.company}
                                        onChange={(e) => updateExperience(idx, "company", e.target.value)}
                                        placeholder="TechCorp Solutions"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-semibold text-ink-600">Start Date</label>
                                      <input
                                        type="text"
                                        className={inputStyle}
                                        value={exp.startDate}
                                        onChange={(e) => updateExperience(idx, "startDate", e.target.value)}
                                        placeholder="June 2024"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-semibold text-ink-600">End Date</label>
                                      <input
                                        type="text"
                                        className={inputStyle}
                                        value={exp.endDate}
                                        onChange={(e) => updateExperience(idx, "endDate", e.target.value)}
                                        placeholder="Present"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] font-semibold text-ink-600">Description</label>
                                    <textarea
                                      rows={2}
                                      className={`${inputStyle} resize-none`}
                                      value={exp.description}
                                      onChange={(e) => updateExperience(idx, "description", e.target.value)}
                                      placeholder="Responsibilities and accomplishments..."
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Step 3: Education */}
                      {wizardStep === 3 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h2 className="text-lg font-bold text-forest-900">Education</h2>
                              <p className="text-xs text-ink-400 mt-0.5">Review degrees, academic institutions, and graduation timelines.</p>
                            </div>
                            <button
                              type="button"
                              onClick={addEducation}
                              className="rounded-xl bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700 transition hover:bg-orange-200"
                            >
                              + Add Education
                            </button>
                          </div>

                          {profileData.currentCv.education.length === 0 ? (
                            <div className="text-center py-8 rounded-2xl border border-dashed border-orange-200 bg-orange-50/10 text-ink-400 text-xs">
                              No academic details added yet. Click "+ Add Education" to create.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {profileData.currentCv.education.map((edu, idx) => (
                                <div key={idx} className="relative space-y-2.5 rounded-2xl border border-orange-100 bg-orange-50/10 p-3.5">
                                  <button
                                    type="button"
                                    onClick={() => removeEducation(idx)}
                                    className="absolute right-3 top-3 text-xs bg-orange-50 hover:bg-orange-100 px-1.5 py-0.5 rounded-md text-orange-700 transition font-bold"
                                    title="Delete Education"
                                  >
                                    ✕
                                  </button>

                                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                                    <div className="sm:col-span-2 space-y-1">
                                      <label className="text-[10px] font-semibold text-ink-600">Degree & Major</label>
                                      <input
                                        type="text"
                                        className={inputStyle}
                                        value={edu.degree}
                                        onChange={(e) => updateEducation(idx, "degree", e.target.value)}
                                        placeholder="B.S. in Computer Science"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-semibold text-ink-600">Graduation Year</label>
                                      <input
                                        type="text"
                                        className={inputStyle}
                                        value={edu.graduationYear}
                                        onChange={(e) => updateEducation(idx, "graduationYear", e.target.value)}
                                        placeholder="2026"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] font-semibold text-ink-600">Institution</label>
                                    <input
                                      type="text"
                                      className={inputStyle}
                                      value={edu.institution}
                                      onChange={(e) => updateEducation(idx, "institution", e.target.value)}
                                      placeholder="State University"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Step 4: Skills tag pills */}
                      {wizardStep === 4 && (
                        <div className="space-y-4">
                          <div>
                            <h2 className="text-lg font-bold text-forest-900">Skills</h2>
                            <p className="text-xs text-ink-400 mt-0.5">Extracted skills tags are shown below. Click '✕' to remove, or type to add custom pills.</p>
                          </div>

                          <div className="space-y-2.5">
                            <label className="text-xs font-semibold text-ink-600">Extracted Skills Pills</label>
                            {profileData.currentCv.skills.length === 0 ? (
                              <div className="p-4 text-center border border-dashed border-orange-200 bg-orange-50/10 text-ink-400 text-xs rounded-xl">
                                No skills added. Type one below to start!
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2 rounded-2xl border border-orange-100 bg-orange-50/10 p-3.5">
                                {profileData.currentCv.skills.map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => removeSkill(s)}
                                    className="flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-600 active:scale-95"
                                    title="Click to remove"
                                  >
                                    <span>{s}</span>
                                    <span className="text-[9px] opacity-75 font-normal">✕</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2 pt-1">
                            <label className="text-xs font-semibold text-ink-600">Add New Skill Pill</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                className={inputStyle}
                                value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddSkill();
                                  }
                                }}
                                placeholder="Type a skill and hit Enter"
                              />
                              <button
                                type="button"
                                onClick={handleAddSkill}
                                className="rounded-xl bg-orange-600 px-4 text-xs font-semibold text-white transition hover:bg-orange-700"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 5: Summary */}
                      {wizardStep === 5 && (
                        <div className="space-y-4">
                          <div>
                            <h2 className="text-lg font-bold text-forest-900">Review & Confirm</h2>
                            <p className="text-xs text-ink-400 mt-0.5">Perform a final check of your details before saving.</p>
                          </div>

                          <div className="space-y-3 text-xs text-ink-900">
                            <div className="rounded-2xl border border-orange-100 bg-orange-50/15 p-3.5 space-y-1.5">
                              <h3 className="font-semibold text-orange-600 text-[10px] uppercase tracking-wider">Contact Info</h3>
                              <div><strong className="text-ink-600">Name:</strong> {profileData.student.fullName || "—"}</div>
                              <div><strong className="text-ink-600">Email:</strong> {profileData.student.email || "—"}</div>
                              <div><strong className="text-ink-600">Phone:</strong> {profileData.student.phone || "—"}</div>
                              <div><strong className="text-ink-600">Location:</strong> {profileData.student.location || "—"}</div>
                              <div><strong className="text-ink-600">Links:</strong> {profileData.student.linkedin || "—"} | {profileData.student.portfolio || "—"}</div>
                            </div>

                            <div className="rounded-2xl border border-orange-100 bg-orange-50/15 p-3.5 space-y-1.5">
                              <h3 className="font-semibold text-orange-600 text-[10px] uppercase tracking-wider">Experience ({profileData.currentCv.experience.length})</h3>
                              {profileData.currentCv.experience.map((exp, idx) => (
                                <div key={idx} className="border-b border-orange-100 last:border-b-0 pb-1 last:pb-0 pt-0.5 first:pt-0">
                                  <strong>{exp.title}</strong> at <span className="text-orange-700">{exp.company}</span>
                                </div>
                              ))}
                            </div>

                            <div className="rounded-2xl border border-orange-100 bg-orange-50/15 p-3.5 space-y-1.5">
                              <h3 className="font-semibold text-orange-600 text-[10px] uppercase tracking-wider">Education ({profileData.currentCv.education.length})</h3>
                              {profileData.currentCv.education.map((edu, idx) => (
                                <div key={idx} className="border-b border-orange-100 last:border-b-0 pb-1 last:pb-0 pt-0.5 first:pt-0">
                                  <strong>{edu.degree}</strong> from <span className="text-orange-700">{edu.institution}</span>
                                </div>
                              ))}
                            </div>

                            <div className="rounded-2xl border border-orange-100 bg-orange-50/15 p-3.5 space-y-1.5">
                              <h3 className="font-semibold text-orange-600 text-[10px] uppercase tracking-wider">Skills ({profileData.currentCv.skills.length})</h3>
                              <div className="flex flex-wrap gap-1">
                                {profileData.currentCv.skills.map((s) => (
                                  <span key={s} className="rounded bg-orange-100 px-1.5 py-0.5 text-[9px] text-orange-800 font-medium">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Step Action Buttons */}
                    <div className="mt-4 flex items-center justify-between border-t border-orange-100 pt-4 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (wizardStep === 1) {
                            setStep("upload");
                          } else {
                            setWizardStep((s) => s - 1);
                          }
                        }}
                        className="rounded-xl border border-orange-100 bg-white px-5 py-2.5 text-xs font-semibold text-forest-900 transition hover:bg-orange-50"
                      >
                        Back
                      </button>
                      
                      {wizardStep < 5 ? (
                        <button
                          type="button"
                          onClick={() => setWizardStep((s) => s + 1)}
                          className="rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-orange-500/10 transition hover:bg-orange-700"
                        >
                          Next Step
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSubmit}
                          className="rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-orange-500/10 transition hover:bg-orange-700"
                        >
                          Confirm & Save
                        </button>
                      )}
                    </div>

                  </div>
                </div>

              </div>
            )}
          </div>
        )}

      </main>
    </AuthGuard>
  );
}