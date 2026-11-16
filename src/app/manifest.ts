import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TREX Skate School Portal",
    short_name: "TREX Portal",
    description: "Sistem Informasi Akademi & Evaluasi Sepatu Roda TREX Skate School",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#a3e635",
    icons: [
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
