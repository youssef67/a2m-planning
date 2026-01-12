import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    server: {
      deps: {
        inline: ['@prisma/client'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/generated/prisma': path.resolve(__dirname, './src/generated/prisma/client.ts'),
    },
  },
});
