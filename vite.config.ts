import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves project sites from https://<user>.github.io/<repo>/.
// The deploy workflow sets VITE_BASE_PATH to "/<repo>/" (or "/" for <user>.github.io repos).
// Locally (npm run dev / build) it defaults to "/".
// The app uses hash-based routing, so deep links and refreshes work without server rewrites.
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
});
