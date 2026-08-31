import type { ExtractedCvData } from "@/lib/api";

export interface CvJobFields {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface CvEducationFields {
  degree: string;
  institution: string;
  graduationYear: string;
}

export interface CvStudentFields {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
}

export interface MappedCvData {
  student: CvStudentFields;
  skills: string[];
  education: CvEducationFields[];
  experience: CvJobFields[];
}

/**
 * Normalizes raw AI-extracted CV data (fields may be missing/null) into the
 * flat, always-defined shape both the upload wizard and the profile page
 * render — the single place that knows ExtractedCvData's field names, so a
 * schema change there only needs updating here.
 */
export function mapExtractedCvData(parsed: ExtractedCvData): MappedCvData {
  return {
    student: {
      fullName: parsed.name ?? "",
      email: parsed.email ?? "",
      phone: parsed.phone ?? "",
      location: parsed.location ?? "",
      linkedin: parsed.links?.linkedIn ?? "",
      github: parsed.links?.github ?? "",
      portfolio: parsed.links?.portfolio ?? "",
    },
    skills: parsed.skills ?? [],
    education: (parsed.education ?? []).map((e) => ({
      degree: e.degree ?? "",
      institution: e.institution ?? "",
      graduationYear: e.graduationYear ?? "",
    })),
    experience: (parsed.experience ?? []).map((e) => ({
      title: e.title ?? "",
      company: e.company ?? "",
      startDate: e.startDate ?? "",
      endDate: e.endDate ?? "",
      description: e.description ?? "",
    })),
  };
}
