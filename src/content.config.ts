import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { BLOG_TAG_KEYS, PROJECT_CATEGORY_KEYS } from './config/taxonomy';

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string().min(1),
    summary: z.string().min(1),
    category: z.enum(PROJECT_CATEGORY_KEYS),
    tech: z.array(z.string().min(1)).min(1),
    cover: z.string().startsWith('/'),
    gallery: z
      .array(
        z.object({
          src: z.string().startsWith('/'),
          alt: z.string().min(1)
        })
      )
      .default([]),
    featured: z.boolean().default(false),
    order: z.number().int().nonnegative().default(99),
    role: z.string().min(1),
    period: z.string().min(1),
    links: z
      .object({
        demo: z.string().url().optional(),
        repo: z.string().url().optional()
      })
      .default({}),
    problem: z.string().min(1),
    background: z.string().min(1),
    goals: z.array(z.string().min(1)).min(1),
    responsibilities: z.array(z.string().min(1)).min(1),
    architecture: z.object({
      image: z.string().startsWith('/'),
      caption: z.string().min(1),
      description: z.string().min(1)
    }),
    features: z
      .array(z.object({ title: z.string().min(1), description: z.string().min(1) }))
      .min(1),
    challenges: z
      .array(z.object({ title: z.string().min(1), solution: z.string().min(1) }))
      .min(1),
    metrics: z
      .array(
        z.object({
          value: z.string().min(1),
          label: z.string().min(1),
          note: z.string().optional()
        })
      )
      .min(1),
    resultsSummary: z.string().min(1),
    reflection: z.string().min(1),
    publishedAt: z.coerce.date(),
    isSample: z.boolean().default(false),
    draft: z.boolean().default(false)
  })
});

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    tags: z.array(z.enum(BLOG_TAG_KEYS)).min(1),
    cover: z.string().startsWith('/').optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false)
  })
});

export const collections = { projects, blog };
