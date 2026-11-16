"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut as fbSignOut 
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: "admin" | "coach" | "parent";
}

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  userProfile: null,
  loading: true,
  signOut: async () => {},
});

// ==========================================
// DAFTAR EMAIL WHITELIST ADMIN & COACH MANUAL
// ==========================================
const ADMIN_WHITELIST = [
  "admin@trexskateschool.com",
  "krisnaoktaria@gmail.com", // Masukkan email Anda di sini
];

const COACH_WHITELIST = [
  "coach@trexskateschool.com",
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user && user.email) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          let role: "admin" | "coach" | "parent" = "parent";
          
          // Periksa apakah email masuk dalam whitelist manual
          const lowerEmail = user.email.toLowerCase();
          if (ADMIN_WHITELIST.includes(lowerEmail)) {
            role = "admin";
          } else if (COACH_WHITELIST.includes(lowerEmail)) {
            role = "coach";
          }

          if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            // Jika di database rolenya masih parent tapi emailnya ada di whitelist admin, paksa update jadi admin
            if (role !== "parent" && data.role !== role) {
              await setDoc(userRef, { role }, { merge: true });
              data.role = role;
            }
            setUserProfile(data);
          } else {
            // Jika belum ada dokumen users, buat baru otomatis
            const newProfile: UserProfile = {
              uid: user.uid,
              name: user.displayName || user.email.split("@")[0],
              email: user.email,
              role: role, // Mengikuti whitelist atau default 'parent'
            };
            await setDoc(userRef, {
              ...newProfile,
              createdAt: serverTimestamp(),
            });
            setUserProfile(newProfile);
          }
        } catch (error) {
          console.error("Gagal memuat profil pengguna:", error);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await fbSignOut(auth);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, userProfile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
