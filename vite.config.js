import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";

export default defineConfig({
  plugins: [
    react(),
    // Ensure tailwindcss is installed and configured correctly
    {
      name: "vite-plugin-tailwindcss",
      config() {
        return {
          css: {
            postcss: {
              plugins: [tailwindcss],
            },
          },
        };
      },
    },
  ],

  // Server configuration (for development only)
  server: {
    proxy: {
      "/api": {
        target: "https://api.comeaway.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
        configure: (proxy, options) => {
          proxy.on("error", (err, req, res) => {
            // console.log("proxy error", err);
          });
          proxy.on("proxyReq", (proxyReq, req, res) => {
            // console.log("Sending Request to the Target:", req.method, req.url);
            // Set timeout for large file uploads
            proxyReq.setTimeout(300000); // 5 minutes
          });
          proxy.on("proxyRes", (proxyRes, req, res) => {
            // console.log(
            //   "Received Response from the Target:",
            //   proxyRes.statusCode,
            //   req.url
            // );
          });
        },
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
        timeout: 300000, // 5 minutes for large file uploads
      },
    },
    // Increase server limits for file uploads
    hmr: {
      port: 5174,
    },
  },
});
