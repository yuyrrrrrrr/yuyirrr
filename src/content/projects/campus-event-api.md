---
title: 校园活动报名 API
summary: 为社团活动提供高并发报名、候补队列和可追踪的通知服务。
category: backend
tech:
  - Java
  - Spring Boot
  - PostgreSQL
  - Redis
  - Docker
cover: /images/projects/backend-cover.svg
gallery:
  - src: /images/projects/backend-screen.svg
    alt: 活动报名后台的报名统计和队列监控界面
featured: false
order: 5
role: 后端负责人
period: 2025.04 - 2025.06
links:
  repo: https://github.com/yuyrrrrrrr
problem: 热门活动开放报名时瞬时请求集中，容易出现重复报名、超卖和状态不一致。
background: 原有表单工具无法处理名额竞争，也无法向候补用户可靠地发送递补通知。项目目标是构建一个可审计、可重试的报名服务。
goals:
  - 保证名额扣减的原子性，禁止重复报名和超卖。
  - 在 1,000 并发请求下保持接口成功率高于 99%。
  - 让运营人员可以追踪报名、候补、取消和通知状态。
responsibilities:
  - 设计数据库模型、接口契约和状态机。
  - 实现 Redis 原子扣减、幂等键和异步通知。
  - 编写集成测试、容器化本地环境与基础监控。
architecture:
  image: /images/diagrams/backend-architecture.svg
  caption: 报名请求与异步通知链路
  description: API 网关完成鉴权和限流，报名服务通过 Redis Lua 脚本原子扣减名额，并将可靠事件交给通知消费者。
features:
  - title: 原子名额管理
    description: 通过 Lua 脚本一次性完成余量检查、扣减与报名记录创建。
  - title: 幂等提交
    description: 客户端请求键与服务端记录共同避免重复提交。
  - title: 候补递补
    description: 取消报名后自动选择队首用户并发送带重试的通知。
challenges:
  - title: 数据库与缓存状态可能短暂不一致
    solution: 将 Redis 作为实时准入层、数据库作为事实来源，通过事件日志对账并支持自动修复。
  - title: 通知失败会阻塞主链路
    solution: 使用 Outbox 模式持久化事件，消费者异步发送并对失败任务指数退避。
metrics:
  - value: 1,000
    label: 压测并发
  - value: 99.4%
    label: 接口成功率
  - value: 210ms
    label: P95 响应时间
    note: 在本机 Docker 压测环境
resultsSummary: 压测环境中实现 1,000 并发下无超卖、成功率 99.4%，并将报名状态查询接口的 P95 控制在 210ms。
reflection: 如果重做，我会在设计阶段补齐容量模型和故障演练，提前明确 Redis 不可用时的降级路径，而不是只在开发末期进行压测。
publishedAt: 2025-06-30
isSample: true
---

## 项目记录

这个示例项目关注高并发报名场景中的正确性、幂等和异步可靠性。
