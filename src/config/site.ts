export const site = {
  name: '倪博文',
  shortName: 'NBW',
  age: 22,
  role: '数据科学与大数据技术本科 · 全栈 / AI 方向',
  eyebrow: 'PORTFOLIO · 2026',
  description:
    '数据科学与大数据技术专业毕业，关注真实问题、清晰工程和可持续迭代，正在学习与求职中，寻找软件开发的全职与项目合作机会。',
  longBio:
    '我用代码把模糊问题变成可用的产品。毕业后主要关注 Web 全栈、数据可视化和大模型应用，一边系统补齐短板，一边寻找能一起把事情做成的团队。',
  location: '中国 · 可远程',
  availability: '2026 届毕业 · 正在学习与求职，开放全职 / 项目合作机会',
  email: 'bowenni940@gmail.com',
  emailAlt: '19144718828@163.com',
  github: 'https://github.com/yuyrrrrrrr',
  siteUrl: 'https://yuyirrr.com',
  icp: '浙ICP备2026076409号',
  isSample: true,
  sampleNotice: '项目与经历为示例 · 待替换',
  seo: {
    defaultTitle: '倪博文｜数据科学与大数据技术作品集',
    titleTemplate: '%s｜倪博文',
    defaultDescription:
      '倪博文的个人作品集，数据科学与大数据技术专业，展示全栈开发、算法与 AI 项目、技术笔记和在线简历，正在寻找全职与项目合作机会。',
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
