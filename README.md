# yuyirrr · 的个人作品集

在线访问：[https://yuyirrr.com](https://yuyirrr.com)

这个网站用来长期记录做过的项目、技术笔记和求职信息。项目与笔记由 Markdown/MDX 驱动，构建为纯静态页面；没有后台，也没有前端框架运行时。

## 网站内容

- **首页**：沙粒文字首屏、技术栈、连续弯曲的 3D 电影胶卷作品带、最新笔记与联系方式。
- **项目**：按前端、后端、全栈、算法、AI 等分类筛选。每个案例依次说明问题、背景、角色、技术栈、架构、核心功能、难点取舍、结果与复盘。
- **笔记**：Web 工程、静态站点、AI 与 RAG 相关的实践记录，支持标签归档。
- **简历**：在线简历页，并提供由打印版页面生成的 `resume.pdf`。
- **关于**：个人简介、教育背景、经历、技能、奖项与联系方式。

首页作品带在桌面端由 Three.js 渲染为一条连续弯曲的胶片：画面、片基、齿孔和片边共享同一条空间轨迹，并随滚动整体移动。支持滚轮、横向拖动、方向键、左右按钮和进度点切换；点击任意画面会打开对应详情层，按 `Esc` 或点击遮罩关闭，关闭后保留原浏览位置。移动端、减少动态效果或 WebGL 不可用时自动使用静态连续胶片布局；禁用 JavaScript 时仍可直接浏览并进入项目详情页。

## 技术栈

- Astro 5 + TypeScript
- Astro Content Collections + Markdown/MDX
- 原生 CSS：设计令牌、响应式布局、深色首页主题
- Three.js：首页连续曲面电影胶卷
- Playwright + axe-core：端到端与可访问性测试
- Sharp：图片处理
- GitHub Actions + Nginx：静态站点部署与版本切换

## 本地开发

```bash
npm install
npx playwright install chromium
npm run dev
```

开发地址：`http://localhost:4321`。

常用命令：

```bash
npm run dev        # 启动开发服务器
npm run check      # 类型与内容模型检查
npm run build      # 检查、构建静态站点并生成简历 PDF
npm run preview    # 预览构建产物
npm run test:e2e   # 运行 Playwright 端到端测试
npm run verify     # 完整构建并运行测试
```

## 目录结构

```text
src/
  pages/          路由：首页、项目、博客、简历、关于、404
  components/     首屏、作品胶卷、项目卡片、导航等组件
  content/        projects 与 blog 的 Markdown/MDX 内容
  config/         站点资料、简历数据、项目分类与博客标签
  data/           首页胶卷剧照数据
  scripts/        Three.js 电影胶卷场景
  layouts/        共享布局、SEO 与结构化数据
  lib/            内容排序、日期与分类工具
  styles/         全局样式与首页主题
public/images/    项目封面、截图、架构图与胶卷素材
tests/            Playwright 测试
deploy/           Nginx 配置与服务器部署说明
```

## 维护内容

- 站点资料：`src/config/site.ts`
- 简历数据：`src/config/resume.ts`
- 新增项目：在 `src/content/projects/` 添加 Markdown/MDX，frontmatter 结构见 `src/content.config.ts`
- 新增笔记：在 `src/content/blog/` 添加文件，标签需使用 `src/config/taxonomy.ts` 中的键
- 首页胶卷：替换 `public/images/film/` 中的 16:9 图片，并在 `src/data/film.ts` 中登记；场景代码位于 `src/scripts/film-reel.ts`

## 可访问性与测试

页面支持键盘操作、焦点样式、减少动态效果偏好和移动端布局；作品胶卷提供无 JavaScript 降级。测试覆盖页面结构、项目筛选、胶卷交互、无 JS 浏览、移动端横向溢出以及代表性页面的 Axe 可访问性扫描。

## 部署

推送到 `main` 后由 GitHub Actions 构建并发布到 Nginx。首次服务器初始化、证书与 GitHub Secrets 配置见 [deploy/README.md](deploy/README.md)。
