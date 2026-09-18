export const PROJECT_CATEGORY_KEYS = [
  'frontend',
  'backend',
  'fullstack',
  'algorithm',
  'ai',
  'other'
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORY_KEYS)[number];

export const projectCategories: Record<
  ProjectCategory,
  { label: string; description: string; color: string; softColor: string }
> = {
  frontend: {
    label: '前端',
    description: '交互、可视化与 Web 体验',
    color: '#1859c9',
    softColor: '#e8f0ff'
  },
  backend: {
    label: '后端',
    description: '服务、数据与可靠系统',
    color: '#0f766e',
    softColor: '#e2f6f2'
  },
  fullstack: {
    label: '全栈',
    description: '从业务界面到数据链路',
    color: '#7c3aed',
    softColor: '#f1e9ff'
  },
  algorithm: {
    label: '算法',
    description: '建模、求解与性能优化',
    color: '#b45309',
    softColor: '#fff2d8'
  },
  ai: {
    label: 'AI',
    description: '机器学习与大模型应用',
    color: '#be185d',
    softColor: '#ffe8f1'
  },
  other: {
    label: '其他',
    description: '工具、研究与跨领域项目',
    color: '#475569',
    softColor: '#edf1f6'
  }
};

export const BLOG_TAG_KEYS = ['astro', 'web', 'ai', 'rag'] as const;

export type BlogTag = (typeof BLOG_TAG_KEYS)[number];

export const blogTags: Record<BlogTag, { label: string; description: string }> = {
  astro: {
    label: 'Astro',
    description: '静态站点、内容集合与前端构建'
  },
  web: {
    label: 'Web 工程',
    description: '性能、可访问性与工程实践'
  },
  ai: {
    label: 'AI',
    description: '大模型应用与机器学习'
  },
  rag: {
    label: 'RAG',
    description: '检索增强生成与知识库问答'
  }
};
