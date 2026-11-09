import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CHISTORE NG",
    short_name: "CHISTORE",
    description: "Shop quality products at unbeatable prices.",
    start_url: "/",
    display: "standalone",
    background_color: "#fffaf5",
    theme_color: "#d97757",
    orientation: "portrait",
    categories: ["shopping", "ecommerce"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  }
}
