export type UserRole = "admin" | "coach" | "parent";

export type StudentStatus = "pending" | "active" | "expired" | "inactive";

export type SkillLevelCategory = "Beginner" | "Intermediate" | "Advanced";

export type MasteryLevel = 1 | 2 | 3 | 4;

export type AttendanceStatus = "present" | "excused" | "absent";

export type ScheduleStatus = "scheduled" | "holiday" | "rescheduled";

export type ReportStatus = "draft" | "published";

export type PaymentType = "initial" | "renewal";

export type PaymentStatus =
  | "unpaid"
  | "pending_verification"
  | "approved"
  | "rejected";

export type MediaType = "image" | "video";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  whatsapp: string;
  role: UserRole;
  photoUrl?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CoachProfile {
  id: string;
  uid?: string;
  name: string;
  bio: string;
  experience: string;
  specialization: string;
  photoUrl?: string;
  isActive: boolean;
  createdAt?: unknown;
}

export interface StudentProfile {
  id: string;
  studentCode: string; // Contoh: TRX-2026-001
  claimCode: string; // Kode 6 karakter untuk ditautkan orang tua
  fullName: string;
  photoUrl?: string;
  birthDate: string; // Format: YYYY-MM-DD
  gender: "L" | "P";
  level: SkillLevelCategory;
  coachId: string;
  coachName: string;
  parentName: string;
  parentWhatsapp: string;
  parentUids: string[]; // Daftar UID akun orang tua yang terhubung
  status: StudentStatus;
  registeredAt: string;
  validUntil?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ClaimCodeRecord {
  code: string;
  studentId: string;
  studentName: string;
  isClaimed: boolean;
  claimedBy?: string;
  createdAt?: unknown;
}

export interface SkatingSkill {
  id: string;
  order: number;
  name: string;
  description: string;
}

export interface TrainingSchedule {
  id: string;
  date: string; // Format: YYYY-MM-DD
  startTime: string; // Default: "16:00"
  endTime: string; // Default: "18:00"
  location: string;
  topic: string;
  status: ScheduleStatus;
  notes?: string;
  createdAt?: unknown;
}

export interface AttendanceRecord {
  id: string;
  scheduleId: string;
  date: string;
  studentId: string;
  studentName: string;
  coachId: string;
  status: AttendanceStatus;
  notes?: string;
  updatedAt?: unknown;
}

export interface ProgressRecord {
  id: string;
  studentId: string;
  studentName: string;
  coachId: string;
  coachName: string;
  scheduleId?: string;
  date: string; // Format: YYYY-MM-DD
  skillId: string;
  skillName: string;
  masteryLevel: MasteryLevel;
  notes: string;
  nextRecommendation: string;
  createdAt?: unknown;
}

export interface ReportSkillItem {
  skillId: string;
  skillName: string;
  masteryLevel: MasteryLevel;
}

export interface MonthlyReport {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  level: SkillLevelCategory;
  coachId: string;
  coachName: string;
  month: number; // 1 - 12
  year: number;
  presentCount: number;
  totalSessions: number;
  skillSummary: ReportSkillItem[];
  masteredSkills: string[];
  developingSkills: string[];
  coachNotes: string;
  nextRecommendation: string;
  status: ReportStatus;
  publishedAt?: unknown;
  publishedBy?: string;
  createdAt?: unknown;
}

export interface PaymentRecord {
  id: string;
  transactionCode: string;
  studentId: string;
  studentName: string;
  parentUid?: string;
  type: PaymentType;
  amount: number;
  paymentDate?: string;
  dueDate: string;
  status: PaymentStatus;
  proofUrl?: string;
  verifiedBy?: string;
  notes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CompetitionInfo {
  id: string;
  title: string;
  date: string;
  location: string;
  categories: string;
  requirements: string;
  fee: string;
  deadline: string;
  description: string;
  createdAt?: unknown;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  targetRole: "all" | "parent" | "coach";
  isPinned: boolean;
  createdAt?: unknown;
}

export interface MediaGalleryItem {
  id: string;
  studentIds: string[];
  allowedParentUids: string[];
  mediaType: MediaType;
  url: string;
  caption: string;
  isAllowedForParent: boolean;
  uploadedBy: string;
  createdAt?: unknown;
}
