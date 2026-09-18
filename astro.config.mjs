import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://yuyirrr.com',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/resume/print/')
    })
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-light-high-contrast',
      wrap: true
    }
  }
});

