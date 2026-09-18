import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { site } from '../config/site';
import { sortPosts } from '../lib/content';

export async function GET(context: APIContext) {
  const posts = sortPosts((await getCollection('blog')).filter((post) => !post.data.draft));

  return rss({
    title: `${site.name} · 技术笔记`,
    description: site.seo.defaultDescription,
    site: context.site ?? site.siteUrl,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: `/blog/${post.id}/`
    })),
    customData: '<language>zh-cn</language>'
  });
}
