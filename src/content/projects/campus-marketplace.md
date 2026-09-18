---
title: 校园二手交易平台
summary: 让校内闲置物品在可信身份下更快完成发布、检索、沟通和线下交付。
category: fullstack
tech:
  - Java
  - Spring Boot
  - Vue 3
  - PostgreSQL
  - Redis
  - Docker
cover: /images/projects/fullstack-cover.svg
gallery:
  - src: /images/projects/fullstack-screen.svg
    alt: 校园二手交易平台首页和商品筛选界面
featured: true
order: 1
role: 项目负责人 / 全栈开发
period: 2025.02 - 2025.05
links:
  repo: https://github.com/yuyrrrrrrr
problem: 校内交易群信息沉淀差、检索困难，买卖双方也难以判断对方是否属于校园社区。
background: 课程设计阶段对 80 名学生进行访谈后发现，发布门槛和沟通效率比复杂支付更关键。项目因此聚焦可信身份、结构化商品信息和轻量沟通。
goals:
  - 让用户在三分钟内完成商品发布。
  - 支持关键词、分类、价格与校区组合筛选。
  - 建立从发布到下架的完整状态流转和内容治理能力。
responsibilities:
  - 负责需求访谈、领域模型、迭代排期和最终部署。
  - 完成商品、收藏、消息和管理端核心接口。
  - 设计移动优先界面并推动可访问性与性能优化。
architecture:
  image: /images/diagrams/fullstack-architecture.svg
  caption: 校园交易平台整体架构
  description: Vue 客户端通过 REST API 访问 Spring Boot 服务；PostgreSQL 保存交易事实，Redis 缓存热门列表和会话，对象存储承接图片资源。
features:
  - title: 结构化发布
    description: 通过表单模板、图片压缩和草稿保存降低发布成本。
  - title: 组合检索
    description: 支持分类、价格、校区和关键词多条件筛选。
  - title: 状态化交易
    description: 覆盖在售、预订、完成、下架与申诉状态，避免线下沟通失控。
challenges:
  - title: 商品列表筛选随条件增加快速变慢
    solution: 为高频组合建立复合索引，将热门首页缓存，并用游标分页替代大偏移分页。
  - title: 图片上传导致移动端发布中断
    solution: 客户端先压缩与裁切，服务端异步生成缩略图，上传失败时保留草稿并支持重试。
metrics:
  - value: 1,200+
    label: 测试用户
  - value: 340ms
    label: 列表 P95 响应
    note: 10 万条模拟商品数据
  - value: 2.6min
    label: 平均发布耗时
  - value: 78%
    label: 次周留存
    note: 课程项目灰度测试
resultsSummary: 在课程项目灰度测试中服务 1,200+ 名用户，商品列表 P95 为 340ms，平均发布耗时缩短到 2.6 分钟。
reflection: 如果重做，我会更早拆分交易履约和社区治理边界，并增加端到端监控；同时应该限制首版范围，把聊天能力延后到核心交易闭环稳定之后。
publishedAt: 2025-05-28
isSample: true
---

## 项目记录

这个示例项目完整覆盖需求调研、全栈实现、性能优化和部署，是最接近真实作品集形态的案例。
