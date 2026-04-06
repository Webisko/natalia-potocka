import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { SITE_URL } from './shared/siteConfig.js';

export default defineConfig({
  output: 'static',
  site: SITE_URL,
  integrations: [tailwind(), react()],
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