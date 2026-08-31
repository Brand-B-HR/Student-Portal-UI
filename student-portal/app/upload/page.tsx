"use client";

import { useEffect, useRef, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { useRouter } from "next/navigation";
import {
  getCvUploadUrl,
  confirmCvUpload,
  pollCvExtraction,
  getVideoUploadUrl,
  confirmVideoUpload,
  uploadToAzureBlob,
  saveProfile,
  ExtractedCvData,
} from "@/lib/api";
import { toast } from "react-toastify";
import { useEditableList } from "@/hooks/useEditableList";
import {
  mapExtractedCvData,
  type CvJobFields as Job,
  type CvEducationFields as Education,
} from "@/lib/cvMapping";
import { errorMessage as toErrorMessage } from "@/lib/errors";

// Shared with the video-file check below, and with the "up to 20MB" copy
// in the dropzone hints — keep those hints in sync if this changes.
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

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
  const [uploadProgress, setUploadProgress] = useState(0);
  
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

  // Raw extracted data returned from confirm endpoint (used to seed the wizard)
  const [extractedData, setExtractedData] = useState<ExtractedCvData | null>(null);

  // Set when extraction didn't finish with usable data by the time the wizard
  // opens, so we can tell the user the fields below are blank / may still fill in later.
  const [extractionNotice, setExtractionNotice] = useState<"failed" | "timeout" | null>(null);

  // Note: No automatic redirect here — users can intentionally come from
  // the dashboard to re-upload/update their CV.

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

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
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

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
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

  // Real Azure Blob upload via backend-generated SAS URL
  async function handleProceed() {
    if (!file) return;

    setParsing(true);
    setUploadProgress(0);
    setStep("wizard");
    setWizardStep(1);
    setExtractionNotice(null);

    const stages = [
      "Requesting secure upload URL...",
      "Uploading file to Azure Blob Storage...",
      "Extracting CV data with AI...",
      "Processing complete!"
    ];
    setParsingStepText(stages[0]);

    try {
      if (fileType === "pdf") {
        setParsingStepText(stages[0]);
        const { uploadUrl, storageKey } = await getCvUploadUrl(
          file.name,
          file.type,
          file.size
        );

        setParsingStepText(stages[1]);
        await uploadToAzureBlob(uploadUrl, file, (pct) => setUploadProgress(pct));

        setParsingStepText(stages[2]);
        // confirm enqueues extraction on a background worker and returns
        // immediately — extractionStatus is normally "processing" here.
        const confirmed = await confirmCvUpload(file.name, storageKey, file.size, file.type);

        let extractionStatus = confirmed.extractionStatus;
        let extractedDataJson = confirmed.extractedDataJson;

        if (extractionStatus === "processing") {
          setParsingStepText("Extracting CV data with AI... this can take up to a minute");
          const polled = await pollCvExtraction({ intervalMs: 2500, timeoutMs: 60000 });
          if (polled) {
            extractionStatus = polled.extractionStatus;
            extractedDataJson = polled.extractedDataJson;
          } else {
            extractionStatus = "timeout";
          }
        }

        // Always record the file name, regardless of extraction outcome.
        setProfileData((prev) => ({
          ...prev,
          currentCv: { ...prev.currentCv, fileName: file.name },
        }));

        if (extractionStatus === "extracted" && extractedDataJson) {
          try {
            const parsed: ExtractedCvData = JSON.parse(extractedDataJson);
            setExtractedData(parsed);
            const mapped = mapExtractedCvData(parsed);

            setProfileData((prev) => ({
              ...prev,
              student: {
                ...prev.student,
                fullName:  mapped.student.fullName  || prev.student.fullName,
                email:     mapped.student.email     || prev.student.email,
                phone:     mapped.student.phone     || prev.student.phone,
                location:  mapped.student.location  || prev.student.location,
                linkedin:  mapped.student.linkedin  || prev.student.linkedin,
                portfolio: mapped.student.portfolio || mapped.student.github || prev.student.portfolio,
              },
              currentCv: {
                ...prev.currentCv,
                skills: mapped.skills,
                education: mapped.education,
                experience: mapped.experience,
              }
            }));
            toast.success("CV uploaded and extracted!");
          } catch {
            setExtractionNotice("failed");
            toast.error("We received your CV but couldn't read the extracted data. Please fill in the details manually.");
          }
        } else if (extractionStatus === "failed") {
          setExtractionNotice("failed");
          toast.error("We couldn't automatically extract details from your CV. Please fill them in manually below.");
        } else if (extractionStatus === "timeout") {
          setExtractionNotice("timeout");
          toast.info("Your CV is still being processed. Feel free to fill in details manually now — check your profile page shortly for the auto-filled version.");
        }
      } else if (fileType === "video") {
        setParsingStepText(stages[0]);
        const { uploadUrl, storageKey } = await getVideoUploadUrl(
          file.name,
          file.type,
          file.size
        );

        setParsingStepText(stages[1]);
        await uploadToAzureBlob(uploadUrl, file, (pct) => setUploadProgress(pct));

        setParsingStepText(stages[2]);
        await confirmVideoUpload(file.name, storageKey, file.size, file.type);

        toast.success("Video uploaded successfully!");
        setTimeout(() => router.push("/dashboard"), 1000);
        return;
      }

      setParsingStepText(stages[3]);
    } catch (err: unknown) {
      toast.error(toErrorMessage(err, "Upload failed. Please try again."));
      setStep("upload");
    } finally {
      setParsing(false);
      setUploadProgress(0);
    }
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

  // Experience / education — generic add/update/remove, backed by profileData.
  const experience = useEditableList<Job>(profileData.currentCv.experience, (updater) =>
    setProfileData((prev) => ({
      ...prev,
      currentCv: { ...prev.currentCv, experience: updater(prev.currentCv.experience) }
    }))
  );

  const education = useEditableList<Education>(profileData.currentCv.education, (updater) =>
    setProfileData((prev) => ({
      ...prev,
      currentCv: { ...prev.currentCv, education: updater(prev.currentCv.education) }
    }))
  );

  function addExperience() {
    experience.add({ title: "", company: "", startDate: "", endDate: "", description: "" });
  }

  function addEducation() {
    education.add({ degree: "", institution: "", graduationYear: "" });
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

  // Submit reviewed profile → persist to DB → go to dashboard
  async function handleSubmit() {
  try {
    await saveProfile({
      fullName:   profileData.student.fullName  || undefined,
      email:      profileData.student.email     || undefined,
      phone:      profileData.student.phone     || undefined,
      university: profileData.student.location  || undefined,
      reviewedDataJson: JSON.stringify({
        status: "reviewed",
        name: profileData.student.fullName,
        email: profileData.student.email,
        phone: profileData.student.phone,
        location: profileData.student.location,
        links: {
          linkedIn: profileData.student.linkedin,
          github: extractedData?.links?.github,
          portfolio: profileData.student.portfolio,
          other: extractedData?.links?.other ?? [],
        },
        skills: profileData.currentCv.skills,
        education: profileData.currentCv.education,
        experience: profileData.currentCv.experience,
        rawTextLength: extractedData?.rawTextLength,
      }),
    });
    toast.success("Profile saved! Redirecting to dashboard...");
    router.push("/dashboard");
  } catch (err: unknown) {
    toast.error(toErrorMessage(err, "Failed to save profile."));
  }
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
                  <circle cx="100" cy="100" r="90" stroke="#f2b251" strokeWidth="1.5" />
                  <circle cx="100" cy="100" r="65" stroke="#ef9f26" strokeWidth="1.5" />
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
              /* CV Extraction Loading Screen */
              <div className="flex-1 flex flex-col items-center justify-center rounded-3xl bg-white p-8 shadow-sm">
                <div className="relative flex h-20 w-20 items-center justify-center">
                  <div className="absolute h-full w-full rounded-full border-4 border-orange-100 border-t-orange-500 animate-spin" />
                  <div className="absolute h-12 w-12 rounded-full border-4 border-orange-50 border-t-orange-300 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }} />
                  <span className="text-2xl">📄</span>
                </div>
                <h2 className="mt-6 text-lg font-bold text-forest-900">Extracting CV</h2>
                <p className="mt-2 text-xs text-ink-500 animate-pulse text-center max-w-xs">{parsingStepText}</p>
                <div className="mt-6 flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.18}s` }}
                    />
                  ))}
                </div>
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

                  <div className="hidden lg:block flex-1 overflow-hidden rounded-2xl border-2 border-orange-200 bg-white shadow-md min-h-0 relative">
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

                    {extractionNotice && (
                      <div className="mb-4 flex-shrink-0 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
                        {extractionNotice === "failed"
                          ? "We couldn't automatically extract details from your CV. Please fill in the fields below manually."
                          : "Still extracting your CV in the background. Fields below are blank for now — fill them in manually, or check your profile page in a bit for the auto-filled version."}
                      </div>
                    )}

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
                                    onClick={() => experience.remove(idx)}
                                    className="absolute right-3 top-3 text-xs bg-orange-50 hover:bg-orange-100 px-1.5 py-0.5 rounded-md text-orange-700 transition font-bold"
                                    title="Delete Job"
                                    aria-label={exp.title ? `Delete ${exp.title}` : "Delete this experience entry"}
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
                                        onChange={(e) => experience.update(idx, "title", e.target.value)}
                                        placeholder="Software Engineer"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-semibold text-ink-600">Company Name</label>
                                      <input
                                        type="text"
                                        className={inputStyle}
                                        value={exp.company}
                                        onChange={(e) => experience.update(idx, "company", e.target.value)}
                                        placeholder="TechCorp Solutions"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-semibold text-ink-600">Start Date</label>
                                      <input
                                        type="text"
                                        className={inputStyle}
                                        value={exp.startDate}
                                        onChange={(e) => experience.update(idx, "startDate", e.target.value)}
                                        placeholder="June 2024"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-semibold text-ink-600">End Date</label>
                                      <input
                                        type="text"
                                        className={inputStyle}
                                        value={exp.endDate}
                                        onChange={(e) => experience.update(idx, "endDate", e.target.value)}
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
                                      onChange={(e) => experience.update(idx, "description", e.target.value)}
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
                                    onClick={() => education.remove(idx)}
                                    className="absolute right-3 top-3 text-xs bg-orange-50 hover:bg-orange-100 px-1.5 py-0.5 rounded-md text-orange-700 transition font-bold"
                                    title="Delete Education"
                                    aria-label={edu.degree ? `Delete ${edu.degree}` : "Delete this education entry"}
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
                                        onChange={(e) => education.update(idx, "degree", e.target.value)}
                                        placeholder="B.S. in Computer Science"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-semibold text-ink-600">Graduation Year</label>
                                      <input
                                        type="text"
                                        className={inputStyle}
                                        value={edu.graduationYear}
                                        onChange={(e) => education.update(idx, "graduationYear", e.target.value)}
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
                                      onChange={(e) => education.update(idx, "institution", e.target.value)}
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