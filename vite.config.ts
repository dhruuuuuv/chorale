/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Chorale Workshop",
        short_name: "Chorales",
        description: "Hear, see and take apart Bach's four-part chorales.",
        theme_color: "#1A1D26",
        background_color: "#EEF0F3",
        display: "standalone",
        start_url: "/",
        icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
      },
      workbox: {
        // The app shell, fonts and every chorale's JSON are small: keep them all offline.
        globPatterns: ["**/*.{js,css,html,svg,woff2}", "data/*.json", "samples/*/sample-map.json"],
        // The score engraver is several MB; cache it the first time the score view is opened.
        globIgnores: ["**/verovio*.js", "**/score-worker*.js"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes("/data/xml/") || /verovio|score-worker/.test(url.pathname),
            handler: "CacheFirst",
            options: { cacheName: "score", expiration: { maxEntries: 60 } },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/samples/"),
            handler: "CacheFirst",
            options: { cacheName: "samples", expiration: { maxEntries: 400 } },
          },
        ],
      },
    }),
  ],
  worker: { format: "es" },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
