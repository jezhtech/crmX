import fs from "fs";
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, "certs/localhost+3-key.pem")),
      cert: fs.readFileSync(path.resolve(__dirname, "certs/localhost+3.pem")),
    },
    host: "0.0.0.0",
    port: 8080,
    cors: {
      origin: "*",
      methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: true,
      allowedHeaders: [
        "Content-Type", 
        "Authorization", 
        "X-Requested-With", 
        "Origin", 
        "Accept",
        "X-Goog-Upload-Protocol",
        "X-Goog-Upload-Command"
      ]
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Requested-With,Origin,Accept,X-Goog-Upload-Protocol,X-Goog-Upload-Command"
    }
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
