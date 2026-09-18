export const resume = {
  isSample: true,
  name: '你的名字',
  headline: '计算机专业学生 · 全栈 / AI 方向',
  contact: {
    email: 'hello@example.com',
    github: 'https://github.com/yuyrrrrrrr',
    location: '中国 · 可远程',
    website: 'https://yuyirrr.com'
  },
  summary:
    '计算机专业本科在读，具备从需求拆解、原型设计到前后端实现的基础工程能力。参与过 Web 全栈、算法优化与 RAG 应用项目，习惯用可量化指标验证结果，持续通过写作和复盘沉淀方法。',
  education: [
    {
      school: '示例大学',
      degree: '计算机科学与技术 · 本科',
      period: '2023.09 - 2027.06',
      details: ['GPA：3.8 / 4.0（示例）', '主修课程：数据结构、操作系统、数据库、机器学习']
    }
  ],
  experience: [
    {
      organization: '示例科技工作室',
      role: '全栈开发实习生（示例）',
      period: '2025.07 - 2025.09',
      details: [
        '参与校园服务类产品的前后端开发，负责接口设计与数据看板。',
        '将高频查询响应时间从 820ms 降至 180ms，并补齐关键链路测试。'
      ]
    },
    {
      organization: '开源与课程项目',
      role: '项目负责人 / 核心开发',
      period: '2024.03 - 至今',
      details: [
        '主导需求拆分、任务协作、部署与复盘，累计完成 5 个可演示项目。',
        '持续维护技术笔记，沉淀前端性能、后端可靠性与 RAG 实践。'
      ]
    }
  ],
  skillGroups: [
    {
      label: '前端',
      items: ['TypeScript', 'React', 'Vue', 'Astro', 'HTML / CSS', 'ECharts']
    },
    {
      label: '后端与数据',
      items: ['Java', 'Spring Boot', 'Node.js', 'PostgreSQL', 'Redis', 'REST API']
    },
    {
      label: '算法与 AI',
      items: ['Python', 'PyTorch', 'RAG', '向量检索', 'SQL', '数据分析']
    },
    {
      label: '工程工具',
      items: ['Git', 'Linux', 'Docker', 'Nginx', 'GitHub Actions']
    }
  ],
  selectedProjects: [
    {
      name: '课程资料 RAG 问答助手',
      description: '面向学生的资料检索问答工具，将有效回答率提升到 86%。',
      tech: 'Python · FastAPI · PostgreSQL · React'
    },
    {
      name: '校园二手交易平台',
      description: '覆盖发布、检索、沟通和管理的校园全栈应用，服务 1,200+ 测试用户。',
      tech: 'Java · Spring Boot · Vue · Redis'
    },
    {
      name: '校园路径规划可视化',
      description: '支持多约束路径求解与动态回放的可视化实验平台。',
      tech: 'TypeScript · ECharts · Web Worker'
    }
  ],
  awards: [
    '全国大学生计算机设计大赛省级二等奖（示例）',
    '校级一等奖学金（示例）',
    '程序设计竞赛校赛前 10%（示例）'
  ]
} as const;
