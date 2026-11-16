import { MasteryLevel, SkatingSkill } from "@/types/database";

export const DEFAULT_SKILLS: SkatingSkill[] = [
  {
    id: "basic-standing",
    order: 1,
    name: "Basic Standing",
    description:
      "Postur tubuh dasar, posisi lutut menekuk seimbang, dan berdiri stabil di atas roda.",
  },
  {
    id: "balance",
    order: 2,
    name: "Balance",
    description:
      "Keseimbangan bertumpu pada satu kaki serta teknik jatuh aman dengan pelindung.",
  },
  {
    id: "forward-skating",
    order: 3,
    name: "Forward Skating",
    description:
      "Teknik dorongan kaki (stride) dan meluncur lurus ke depan secara stabil.",
  },
  {
    id: "stopping",
    order: 4,
    name: "Stopping",
    description:
      "Penguasaan teknik pengereman terkendali (Heel Brake dan T-Stop).",
  },
  {
    id: "turning",
    order: 5,
    name: "Turning",
    description:
      "Manuver berbelok halus (A-Frame Turn dan Parallel Turn) tanpa kehilangan keseimbangan.",
  },
  {
    id: "backward-skating",
    order: 6,
    name: "Backward Skating",
    description:
      "Meluncur mundur dengan kontrol tumpuan kaki dan arah pandang terjaga.",
  },
  {
    id: "cross-over",
    order: 7,
    name: "Cross Over",
    description:
      "Teknik menyilangkan kaki untuk mempertahankan kecepatan saat melewati tikungan.",
  },
  {
    id: "advanced-skating",
    order: 8,
    name: "Advanced Skating",
    description:
      "Kombinasi kelincahan, kecepatan lintasan, dan kesiapan mengikuti kompetisi.",
  },
];

export const MASTERY_LABELS: Record<
  MasteryLevel,
  { label: string; shortLabel: string; colorClass: string }
> = {
  1: {
    label: "Belum dipelajari",
    shortLabel: "Belum",
    colorClass: "bg-slate-100 text-slate-600 border-slate-200",
  },
  2: {
    label: "Sedang belajar",
    shortLabel: "Belajar",
    colorClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
  3: {
    label: "Mulai berkembang",
    shortLabel: "Berkembang",
    colorClass: "bg-blue-50 text-blue-800 border-blue-200",
  },
  4: {
    label: "Sudah dikuasai",
    shortLabel: "Dikuasai",
    colorClass: "bg-lime-100 text-slate-900 border-lime-400",
  },
};

export const REGULAR_TRAINING = {
  day: "Sabtu",
  startTime: "16:00",
  endTime: "18:00",
  timezone: "WIB",
};
