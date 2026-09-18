export const site = {
  name: '你的名字',
  shortName: 'YU',
  role: '计算机专业学生 · 全栈 / AI 方向',
  eyebrow: 'PORTFOLIO · 2026',
  description:
    '关注真实问题、清晰工程和可持续迭代的学生开发者，正在寻找软件开发实习与校招机会。',
  longBio:
    '我用代码把模糊问题变成可用的产品。目前主要关注 Web 全栈、数据可视化和大模型应用，喜欢从用户场景出发做减法，再用可靠工程把它实现出来。',
  location: '中国 · 可远程',
  availability: '开放 2027 届实习 / 校招机会',
  email: 'hello@example.com',
  github: 'https://github.com/yuyrrrrrrr',
  siteUrl: 'https://yuyirrr.com',
  isSample: true,
  sampleNotice: '当前为示例内容 · 待替换为真实资料',
  seo: {
    defaultTitle: '你的名字｜全栈与 AI 方向作品集',
    titleTemplate: '%s｜你的名字',
    defaultDescription:
      '计算机专业学生个人作品集，展示全栈开发、算法与 AI 项目、技术笔记和在线简历。',
    ogImage: '/og-default.png'
  }
} as const;

export const techGroups = [
  {
    label: '前端',
    items: ['TypeScript', 'React', 'Vue', 'Astro', 'ECharts']
  },
  {
    label: '后端',
    items: ['Java / Spring Boot', 'Node.js', 'PostgreSQL', 'Redis', 'REST API']
  },
  {
    label: '算法与 AI',
    items: ['Python', 'PyTorch', 'RAG', '向量检索', '数据分析']
  },
  {
    label: '工程',
    items: ['Git', 'Linux', 'Docker', 'Nginx', 'GitHub Actions']
  }
] as const;
