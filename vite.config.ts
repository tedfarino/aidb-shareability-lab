import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/aidb-shareability-lab/",
  plugins: [react()],
});
