# yuyirrr 个人作品集

内容驱动、静态优先的个人作品集，包含首页、项目案例、关于、在线简历、PDF 简历、博客和 RSS。

## 技术栈

- Astro 5 + TypeScript
- Astro Content Collections + Markdown/MDX
- 原生 CSS 设计令牌与响应式布局
- Playwright 端到端测试与简历 PDF 生成
- GitHub Actions + rsync + Nginx 自动部署

## 本地开发

```bash
npm install
npx playwright install chromium
npm run dev
```

默认开发地址为 `http://localhost:4321`。简历 PDF 在完整构建后生成：

```bash
npm run build
npm run preview
npm run test:e2e
```

## 内容维护

1. 修改 `src/config/site.ts`：姓名、角色、简介、邮箱、GitHub、SEO 与技能组。
2. 修改 `src/config/resume.ts`：在线简历和 PDF 共用的结构化数据。
3. 新增项目：复制 `src/content/projects/` 下的 Markdown 文件，并完整填写 frontmatter。
4. 新增笔记：在 `src/content/blog/` 添加 Markdown/MDX，标签需使用 `src/config/taxonomy.ts` 中的键。
5. 当前示例内容均为占位资料，正式上线前应替换并移除 `isSample` 标记。

项目主分类支持 `frontend`、`backend`、`fullstack`、`algorithm`、`ai`、`other`。分类元数据统一维护在 `src/config/taxonomy.ts`，无效分类会导致构建失败。

## 构建产物

`npm run build` 依次执行：

1. `astro check` 类型与内容模型检查。
2. `astro build` 生成纯静态页面、站点地图和 RSS。
3. Playwright 打开打印版简历并生成 `dist/resume.pdf`。

## 部署

部署目标为 Ubuntu/Debian 服务器上的 Nginx，域名是 `https://yuyirrr.com`。首次服务器初始化、GitHub Secrets 和验证步骤见 [deploy/README.md](deploy/README.md)。

推送到 `main` 会触发 `.github/workflows/deploy.yml`。工作流构建成功后上传版本目录并原子切换软链接；服务器密钥只保存在 GitHub Environment Secrets 中。
