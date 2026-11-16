"use client";

import { useState } from "react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
}

export default function BrandLogo({ size = "md" }: BrandLogoProps) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: "w-9 h-9 text-xs rounded-lg",
    md: "w-10 h-10 text-sm rounded-xl",
    lg: "w-14 h-14 text-xl rounded-2xl",
  }[size];

  if (imgError) {
    return (
      <div
        className={`${sizeClasses} bg-lime-400 text-slate-950 font-black flex items-center justify-center shrink-0 shadow-xs`}
      >
        TX
      </div>
    );
  }

  return (
    <img
      src="/logo.png"
      alt="Logo TREX Skate School"
      onError={() => setImgError(true)}
      className={`${sizeClasses} object-cover bg-white shrink-0 shadow-xs`}
    />
  );
}
