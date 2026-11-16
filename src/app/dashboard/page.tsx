"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getHomeRouteByRole } from "@/components/RoleGuard";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { firebaseUser, userProfile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!firebaseUser) {
      router.replace("/login");
      return;
    }

    if (userProfile) {
      router.replace(getHomeRouteByRole(userProfile.role));
    }
  }, [firebaseUser, userProfile, loading, router]);

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-10 h-10 border-4 border-slate-900 border-t-lime-400 rounded-full animate-spin" />
      <p className="text-sm text-slate-600 mt-4 font-medium">
        Mengarahkan ke ruang kerja Anda...
      </p>
    </div>
  );
}
