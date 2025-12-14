import type { MetadataRoute } from "next";
import { description } from "@/lib/home-content";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Octomod",
    short_name: "Octomod",
    description: description,
    start_url: "/new",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/favicon/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/favicon/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
