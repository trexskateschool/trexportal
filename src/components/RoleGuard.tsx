"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/database";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

export function getHomeRouteByRole(role?: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "coach":
      return "/coach";
    case "parent":
    default:
      return "/parent";
  }
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const router = useRouter();
  const { firebaseUser, userProfile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!firebaseUser) {
      router.replace("/login");
      return;
    }

    if (userProfile && !allowedRoles.includes(userProfile.role)) {
      router.replace(getHomeRouteByRole(userProfile.role));
    }
  }, [firebaseUser, userProfile, loading, allowedRoles, router]);

  if (loading || !firebaseUser || !userProfile) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-lime-400 rounded-full animate-spin" />
        <p className="text-sm text-slate-600 mt-4 font-medium">
          Memverifikasi hak akses akun...
        </p>
      </div>
    );
  }

  if (!allowedRoles.includes(userProfile.role)) {
    return null;
  }

  return <>{children}</>;
}
