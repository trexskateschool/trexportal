"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import RoleGuard from "@/components/RoleGuard";
import { DEFAULT_SKILLS, MASTERY_LABELS } from "@/lib/constants";

type SkillLevel = 1 | 2 | 3 | 4;
type AttendanceStatus = "present" | "sick" | "excused";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

interface StudentItem {
  id: string;
  fullName: string;
  studentCode: string;
  level: string;
  coachName: string;
}

interface ReportItem {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  level: string;
  coachName: string;
  month: number;
  year: number;
  status: "draft" | "published";
  presentCount: number;
  totalSessions: number;
  skills: Record<string, number>;
  masteredSkills: string[];
  developingSkills: string[];
  notes: string;
  nextRecommendation: string;
}

interface ProgressItem {
  id: string;
  studentId: string;
  skillId: string;
  masteryLevel: SkillLevel;
  date: string;
  notes?: string;
  nextRecommendation?: string;
}

interface AttendanceItem {
  id: string;
  studentId: string;
  studentName?: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
}

export default function AdminReportsPage() {
  const [tab, setTab] = useState<"rapor" | "evaluasi" | "absensi">("rapor");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);

  // Tab 1: Rapor
  const now = new Date();
  const [repStudentId, setRepStudentId] = useState("");
  const [repMonth, setRepMonth] = useState(now.getMonth() + 1);
  const [repYear, setRepYear] = useState(now.getFullYear());
  const [repStatus, setRepStatus] = useState<"published" | "draft">("published");
  const [repNotes, setRepNotes] = useState("");
  const [repRec, setRepRec] = useState("");
  const [savingRep, setSavingRep] = useState(false);
  const [preview, setPreview] = useState<ReportItem | null>(null);

  // Tab 2: Evaluasi 8 Skill
  const [evalStudentId, setEvalStudentId] = useState("");
  const [editingEval, setEditingEval] = useState(false);
  const [evalDate, setEvalDate] = useState(now.toISOString().split("T")[0]);
  const [evalScores, setEvalScores] = useState<Record<string, SkillLevel>>({});
  const [evalNote, setEvalNote] = useState("");
  const [evalRec, setEvalRec] = useState("");
  const [savingEval, setSavingEval] = useState(false);

  // Tab 3: Absensi Per Latihan
  const [attDate, setAttDate] = useState(now.toISOString().split("T")[0]);
  const [attStatuses, setAttStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [attNotes, setAttNotes] = useState<Record<string, string>>({});
  const [savingAtt, setSavingAtt] = useState(false);
  const [filterAttStudent, setFilterAttStudent] = useState("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const [sSnap, rSnap, pSnap, aSnap] = await Promise.all([
        getDocs(collection(db, "students")),
        getDocs(collection(db, "monthlyReports")),
        getDocs(collection(db, "progressRecords")),
        getDocs(collection(db, "attendance")),
      ]);

      const sList: StudentItem[] = [];
      const sMap: Record<string, StudentItem> = {};
      sSnap.forEach((d) => {
        const data = d.data();
        const item: StudentItem = {
          id: d.id,
          fullName: data.fullName || "Tanpa Nama",
          studentCode: data.studentCode || "-",
          level: data.level || "Beginner",
          coachName: data.coachName || "Tim Coach TREX",
        };
        sMap[d.id] = item;
        sList.push(item);
      });
      sList.sort((a, b) => a.fullName.localeCompare
