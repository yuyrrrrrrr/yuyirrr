import type { CollectionEntry } from 'astro:content';
import { projectCategories, type ProjectCategory } from '../config/taxonomy';

export type ProjectEntry = CollectionEntry<'projects'>;
export type BlogEntry = CollectionEntry<'blog'>;

export function sortProjects(entries: ProjectEntry[]) {
  return [...entries].sort((a, b) => {
    if (a.data.featured !== b.data.featured) return a.data.featured ? -1 : 1;
    if (a.data.order !== b.data.order) return a.data.order - b.data.order;
    return b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf();
  });
}

export function sortPosts(entries: BlogEntry[]) {
  return [...entries].sort(
    (a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf()
  );
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

export function readingTime(body = '') {
  const hanCharacters = (body.match(/[\u3400-\u9fff]/g) ?? []).length;
  const latinWords = (body.match(/[A-Za-z0-9]+/g) ?? []).length;
  return Math.max(1, Math.ceil(hanCharacters / 400 + latinWords / 220));
}

export function categoryStyle(category: ProjectCategory) {
  const item = projectCategories[category];
  return `--category-color:${item.color};--category-soft:${item.softColor}`;
}

export function isProjectCategory(value: string | null): value is ProjectCategory {
  return value !== null && value in projectCategories;
}
