import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    host: true,
    proxy: {
      "/api": {
        target: "https://epi-backend.onrender.com",
        changeOrigin: true,
        secure: true,
        configure: (proxy, options) => {
          proxy.on("error", (err, req, res) => {
            console.log("❌ Proxy error:", err);
          });
          proxy.on("proxyReq", (proxyReq, req, res) => {
            console.log("📡 Proxying:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req, res) => {
            console.log("✅ Proxy response:", proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  ssr: {
    noExternal: ["flowbite-svelte-icons", "flowbite-svelte"],
  },
  optimizeDeps: {
    include: ["flowbite-svelte-icons", "flowbite-svelte"],
  },
  build: {
    rollupOptions: {
      external: [],
    },
  },
});
