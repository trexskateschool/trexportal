"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile } from "@/types/database";

interface AuthContextValue {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  userProfile: null,
  loading: true,
  refreshProfile: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrCreateProfile = useCallback(async (user: User) => {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      setUserProfile(snap.data() as UserProfile);
    } else {
      const defaultName =
        user.displayName ||
        (user.email ? user.email.split("@")[0] : "Wali Murid");

      const newProfile: UserProfile = {
        uid: user.uid,
        name: defaultName,
        email: user.email || "",
        whatsapp: "",
        role: "parent",
      };

      await setDoc(
        userRef,
        {
          ...newProfile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      const updatedSnap = await getDoc(userRef);
      if (updatedSnap.exists()) {
        setUserProfile(updatedSnap.data() as UserProfile);
      } else {
        setUserProfile(newProfile);
      }
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) return;
    await loadOrCreateProfile(auth.currentUser);
  }, [loadOrCreateProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          await loadOrCreateProfile(user);
        } catch (error) {
          console.error("Gagal memuat profil pengguna:", error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadOrCreateProfile]);

  const logout = async () => {
    await signOut(auth);
    setFirebaseUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        loading,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
