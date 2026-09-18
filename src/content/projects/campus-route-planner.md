---
title: 校园路径规划可视化
summary: 在无障碍、夜间安全等约束下，为校园出行生成可解释的步行路线。
category: algorithm
tech:
  - TypeScript
  - Web Worker
  - ECharts
  - A* Algorithm
  - IndexedDB
cover: /images/projects/algorithm-cover.svg
gallery:
  - src: /images/projects/algorithm-screen.svg
    alt: 校园地图上的多目标路径与约束分析界面
featured: true
order: 3
role: 算法与可视化开发
period: 2024.09 - 2024.12
links:
  repo: https://github.com/yuyrrrrrrr
problem: 传统地图只给出最短距离，却没有说明夜间照明、台阶和拥挤程度是否适合当前出行者。
background: 校园路网包含大量非机动车道、室内连廊和台阶。项目把实地采样与公开地图数据结合，尝试将偏好约束转化为可解释的路径选择。
goals:
  - 支持距离、时间、夜间安全和无障碍四类路径偏好。
  - 展示每个方案被选择或排除的主要原因。
  - 千级节点路网中在一秒内返回首批结果。
responsibilities:
  - 清洗并校准校园路网和节点属性。
  - 实现多目标 A*、启发式权重和路径解释。
  - 使用 Web Worker 与 Canvas 承载计算和交互。
architecture:
  image: /images/diagrams/algorithm-architecture.svg
  caption: 路径计算与可视化数据流
  description: 主线程只负责交互，Web Worker 加载压缩路网并执行多目标搜索，结果经过解释器生成可读原因后交给地图图层渲染。
features:
  - title: 多约束寻路
    description: 将安全、无障碍和拥挤度转化为可调节代价。
  - title: 方案对比
    description: 同屏比较最优方案与备选方案的时间、距离和风险。
  - title: 可解释结果
    description: 展示影响路径评分的主要道路属性与权重。
challenges:
  - title: 主线程计算导致地图拖拽卡顿
    solution: 将路网索引和搜索迁移到 Web Worker，并通过结构化克隆传递精简结果。
  - title: 主观约束难以形成稳定评分
    solution: 使用归一化代价函数，保留原始指标和权重解释，而不是只返回一个不可理解的分数。
metrics:
  - value: 180ms
    label: 首批路径返回
    note: 2,400 节点测试路网
  - value: 60fps
    label: 地图拖拽帧率
  - value: "4"
    label: 可选偏好维度
resultsSummary: 在 2,400 节点测试路网中，首批路径平均 180ms 返回，地图拖拽保持 60fps，并实现四类偏好的解释面板。
reflection: 如果重做，我会补充真实出行者实验来衡量参数是否可信，并把权重配置从代码中抽离为可验证的实验数据。
publishedAt: 2024-12-26
isSample: true
---

## 项目记录

这个示例项目重点展示算法实现如何与明确的用户约束、可视化解释结合起来。

