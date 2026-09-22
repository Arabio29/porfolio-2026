import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
const site = process.env.PUBLIC_SITE_URL || 'http://localhost:4321';
export default defineConfig({ site, integrations: [sitemap()], vite: { plugins: [tailwindcss()] } });
