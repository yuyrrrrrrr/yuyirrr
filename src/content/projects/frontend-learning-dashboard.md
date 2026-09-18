---
title: 组件化学习仪表盘
summary: 把分散的课程进度、任务和成绩聚合为一个快速、可定制的个人学习首页。
category: frontend
tech:
  - TypeScript
  - Vue 3
  - Pinia
  - ECharts
cover: /images/projects/frontend-cover.svg
gallery:
  - src: /images/projects/frontend-screen.svg
    alt: 学习仪表盘的多列数据卡片与趋势图界面
featured: false
order: 4
role: 独立开发
period: 2025.10 - 2025.12
links:
  repo: https://github.com/yuyrrrrrrr
problem: 学生需要在多个系统之间切换，才能确认今天要做什么、哪些课程正在落后。
background: 课程平台、待办工具和表格各自保存数据，零散信息让每周复盘成本很高。目标是做一个只读聚合层，让学习状态在十秒内可被理解。
goals:
  - 在同一页面展示今日任务、课程进度、成绩趋势和风险提醒。
  - 首屏在常见校园网络下稳定低于 1.5 秒完成可交互。
  - 通过组件属性和主题令牌支持后续接入不同数据源。
responsibilities:
  - 设计信息层级、组件拆分和响应式布局。
  - 实现仪表盘状态管理、图表联动和本地偏好设置。
  - 完成性能预算、无障碍检查和部署流程。
architecture:
  image: /images/diagrams/frontend-architecture.svg
  caption: 学习仪表盘的数据流
  description: 数据适配层将不同课程源统一为领域模型，Pinia 管理页面快照，视图组件按卡片独立订阅。
features:
  - title: 聚合视图
    description: 今日任务、课程风险和趋势图集中在可配置网格中。
  - title: 图表联动
    description: 点击课程卡片后，成绩和任务图表同步切换上下文。
  - title: 本地定制
    description: 支持卡片排序、隐藏与布局偏好持久化。
challenges:
  - title: 多个数据源的字段结构不一致
    solution: 定义统一的 CourseSnapshot 模型，并让每个适配器只负责转换和校验，隔离上游变化。
  - title: 图表组件让首屏包体持续增长
    solution: 将图表按卡片懒加载，拆分路由包，并用构建产物体积门禁阻止回退。
metrics:
  - value: 62%
    label: 首屏包体下降
    note: 从 418KB 降至 159KB
  - value: 1.2s
    label: 可交互时间
    note: 校园网络测试中位数
  - value: "96"
    label: Lighthouse 性能分
    note: 移动端模拟测试
resultsSummary: 完成可独立运行的演示版本，学习信息整理时间从约 8 分钟缩短到 2 分钟，并形成一套可复用卡片组件。
reflection: 如果重做，我会更早固定数据契约，并把图表库从主包中彻底隔离；同时先和真实用户验证卡片优先级，再投入主题定制能力。
publishedAt: 2025-12-20
isSample: true
---

## 项目记录

这个示例项目用一个清晰的聚合层连接多个学习数据源，重点验证信息架构、状态管理和前端性能预算。

