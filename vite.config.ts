import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import { devvit } from '@devvit/start/vite';

const isWeb = process.env.MODOS_WEB === '1';

export default defineConfig({
  plugins: isWeb ? [react(), tailwind()] : [react(), tailwind(), devvit()],
  build: {
    outDir: isWeb ? 'dist-web' : undefined,
  },
});
