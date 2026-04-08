import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { SITE_URL } from './shared/siteConfig.js';

export default defineConfig({
  output: 'static',
  site: SITE_URL,
  integrations: [react()],
  vite: {
    server: {
      proxy: {
        '/api': 'http://localhost:4321',
      },
    },
  },
  build: {
    inlineStylesheets: 'always',
  },
  compressHTML: true,
});