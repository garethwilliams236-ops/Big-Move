import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Big Move",
    short_name: "Big Move",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f3",
    theme_color: "#2f5d50",
    icons: [
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
