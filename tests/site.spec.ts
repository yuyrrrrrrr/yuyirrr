import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('首页在首屏呈现身份、技能方向、项目与联系入口', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('把复杂问题');
  await expect(page.getByText('Web 全栈', { exact: false }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: '查看项目', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /联系我/ }).first()).toBeVisible();
  await expect(page.locator('[data-project-card]')).toHaveCount(3);
});

test('项目分类按钮更新 URL，并可通过 URL 深链恢复', async ({ page }) => {
  await page.goto('/projects/');
  await expect(page.locator('[data-project-card]')).toHaveCount(5);
  const aiFilter = page.getByRole('button', { name: 'AI', exact: true });
  await aiFilter.click();
  await expect(aiFilter).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(/category=ai/);
  await expect(page.locator('[data-project-card]:visible')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('[data-project-card]:visible')).toHaveCount(1);
});

test('关闭 JavaScript 时项目列表仍完整可访问', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/projects/');
  await expect(page.locator('[data-project-card]')).toHaveCount(5);
  await expect(page.locator('[data-project-card]:visible')).toHaveCount(5);
  await context.close();
});

test('项目详情包含规定的案例结构', async ({ page }) => {
  await page.goto('/projects/campus-marketplace/');
  const required = [
    '一句话',
    '背景与目标',
    '我的角色',
    '技术栈',
    '架构图 / 数据流',
    '核心功能',
    '难点与解决方案',
    '结果',
    '截图或 GIF',
    'Demo / 代码仓库',
    '复盘'
  ];
  for (const heading of required) {
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  }
});

test('简历 PDF、博客与 RSS 可访问', async ({ page, request }) => {
  const response = await request.get('/resume.pdf');
  expect(response.ok()).toBeTruthy();
  expect(response.headers()['content-type']).toContain('application/pdf');

  await page.goto('/blog/');
  await expect(page.locator('.blog-card')).toHaveCount(2);
  await page.getByRole('link', { name: /为什么我把个人网站改成静态优先/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('静态优先');

  const rss = await request.get('/rss.xml');
  expect(rss.ok()).toBeTruthy();
  expect(await rss.text()).toContain('<rss');
});

test('关键页面在移动端、平板和桌面视口无横向溢出', async ({ page }) => {
  const viewports = [
    { width: 360, height: 800 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 }
  ];
  const paths = ['/', '/projects/', '/projects/campus-marketplace/', '/resume/', '/blog/why-static-portfolio/'];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const path of paths) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${path} at ${viewport.width}px has horizontal overflow`).toBeLessThanOrEqual(1);
    }
  }
});

test('代表性页面通过基础可访问性扫描', async ({ page }) => {
  for (const path of ['/', '/projects/', '/projects/campus-marketplace/', '/blog/', '/blog/why-static-portfolio/', '/resume/', '/about/']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, `${path}: ${results.violations.map((item) => item.id).join(', ')}`).toEqual([]);
  }
});

test('未知路径返回 404 页面', async ({ request }) => {
  const response = await request.get('/this-page-does-not-exist/');
  expect(response.status()).toBe(404);
  expect(await response.text()).toContain('这条路径暂时不存在');
});


