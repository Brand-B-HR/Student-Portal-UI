import type { ApplicationProgress } from "@/lib/jobs";

interface ProgressCopy {
  label: string;
  /** One calm sentence under the label. */
  description: (company: string) => string;
  tone: "brand" | "neutral" | "solid" | "outline";
}

const COPY: Record<ApplicationProgress, ProgressCopy> = {
  Applied: {
    label: "Applied",
    description: (company) => `Your application has been sent to ${company}.`,
    tone: "neutral",
  },
  UnderReview: {
    label: "Under review",
    description: () => "Your application is being looked at.",
    tone: "brand",
  },
  Shortlisted: {
    label: "Shortlisted",
    description: (company) => `${company} has shortlisted you. They may contact you using the details on your profile.`,
    tone: "solid",
  },
  NotProgressing: {
    label: "Not progressing",
    description: () => "This application isn't moving forward at the moment.",
    tone: "outline",
  },
};

/**
 * What to show for a progress value. An unrecognised value (say, a newer server) reads as plain
 * "Applied" rather than printing something raw the student was never meant to see.
 */
export function progressCopy(progress: string): ProgressCopy {
  return COPY[progress as ApplicationProgress] ?? COPY.Applied;
}
