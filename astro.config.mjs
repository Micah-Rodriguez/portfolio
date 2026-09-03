import { defineConfig } from 'astro/config';

const [owner = '', repository = ''] = (process.env.GITHUB_REPOSITORY ?? '').split('/');
const isProjectPage = Boolean(repository && repository !== `${owner}.github.io`);

export default defineConfig({
  output: 'static',
  site: process.env.SITE_URL ?? (owner ? `https://${owner}.github.io` : 'https://example.com'),
  base: process.env.BASE_PATH ?? (isProjectPage ? `/${repository}` : '/'),
});
