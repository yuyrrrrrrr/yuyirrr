---
title: 课程资料 RAG 问答助手
summary: 帮学生用自然语言检索分散课件，并得到带来源定位的可追溯回答。
category: ai
tech:
  - Python
  - FastAPI
  - PostgreSQL
  - pgvector
  - React
  - OpenAI API
cover: /images/projects/ai-cover.svg
gallery:
  - src: /images/projects/ai-screen.svg
    alt: 课程问答助手根据课件片段生成回答的界面
featured: true
order: 2
role: 核心开发 / RAG 工程
period: 2025.06 - 2025.09
links:
  repo: https://github.com/yuyrrrrrrr
problem: 学生知道答案在课件里，却很难在几十份 PDF 中快速找到对应页码和上下文。
background: 通用聊天模型不了解课程资料，直接生成答案又难以核验。项目目标是建立一个只基于指定资料回答、同时展示引用来源的检索系统。
goals:
  - 回答必须附对应资料、页码和原始片段。
  - 对资料外问题应明确拒答，而不是编造内容。
  - 从提问到首字输出的 P95 小于 2.5 秒。
responsibilities:
  - 设计文档清洗、切分、向量化和检索评估链路。
  - 实现混合检索、重排序、引用生成和拒答策略。
  - 构建评估集与前端引用定位体验。
architecture:
  image: /images/diagrams/ai-architecture.svg
  caption: RAG 问答服务数据流
  description: 文档处理任务生成带页码的片段和向量，查询时先并行执行关键词与向量召回，再重排、拼接上下文，并通过流式接口返回带引用答案。
features:
  - title: 带页码引用
    description: 每个关键结论都能定位到原始文档和片段。
  - title: 混合检索
    description: 结合全文检索与向量召回，改善缩写和专业术语命中。
  - title: 低置信拒答
    description: 检索结果不足或引用无法验证时明确提示资料不足。
challenges:
  - title: 固定长度切分破坏语义完整性
    solution: 先按标题和段落构建层级，再在语义边界内切分，并为片段保留页码、章节和父子关系。
  - title: 纯向量检索漏掉课程中的精确术语
    solution: 采用全文与向量混合召回，引入轻量重排序，并持续用固定评估集回归。
metrics:
  - value: 86%
    label: 有效回答率
    note: 120 条课程问题评估集
  - value: 93%
    label: 引用命中率
  - value: 2.1s
    label: 首字响应 P95
  - value: 12%
    label: 资料外问题误答率
resultsSummary: 在 120 条标注问题中有效回答率达到 86%，引用命中率 93%，资料外问题误答率降至 12%，首字响应 P95 为 2.1 秒。
reflection: 如果重做，我会先把评估集和失败分类做扎实，再优化模型；同时应把文档解析质量作为一级监控指标，因为检索链路的上限往往由输入质量决定。
publishedAt: 2025-09-18
isSample: true
---

## 项目记录

这个示例项目展示了从文档处理、检索评估到流式回答的完整 RAG 工程链路。
