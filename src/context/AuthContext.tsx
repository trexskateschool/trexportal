"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
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
  logout: () => Promise<void>;          // Ditambahkan sebagai alias untuk mengatasi error Navbar
  refreshProfile: () => Promise<void>;  // Ditambahkan agar AuthContext mendukung refreshProfile
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  userProfile: null,
  loading: true,
  signOut: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

// ==========================================
// DAFTAR EMAIL WHITELIST ADMIN & COACH MANUAL
// ==========================================
const ADMIN_WHITELIST = [
  "admin@trexskateschool.com",
  "krisnaoktaria@gmail.com",
];

const COACH_WHITELIST = [
  "coach@trexskateschool.com",
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (user: FirebaseUser) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      let role: "admin" | "coach" | "parent" = "parent";
      
      const lowerEmail = (user.email || "").toLowerCase();
      if (ADMIN_WHITELIST.includes(lowerEmail)) {
        role = "admin";
      } else if (COACH_WHITELIST.includes(lowerEmail)) {
        role = "coach";
      }

      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        if (role !== "parent" && data.role !== role) {
          await setDoc(userRef, { role }, { merge: true });
          data.role = role;
        }
        setUserProfile(data);
      } else {
        const newProfile: UserProfile = {
          uid: user.uid,
          name: user.displayName || lowerEmail.split("@")[0],
          email: user.email || "",
          role: role,
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
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await fetchUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);

  const signOut = async () => {
    await fbSignOut(auth);
    setUserProfile(null);
  };

  const refreshProfile = async () => {
    if (firebaseUser) {
      await fetchUserProfile(firebaseUser);
    }
  };

  return (
    <AuthContext.Provider value={{ firebaseUser, userProfile, loading, signOut, logout: signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
