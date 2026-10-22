import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The site is published on a custom domain (public/CNAME), so it lives at "/".
// Set VITE_BASE_PATH (e.g. "/<repo>/") only to build for a github.io/<repo>/ project URL.
// The app uses hash-based routing, so deep links and refreshes work without server rewrites.
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
});
