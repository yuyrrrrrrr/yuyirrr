import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('首页首屏呈现 made by yuyirrr 与作品胶卷', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Made by yuyirrr');
  await expect(page.locator('[data-gravity-canvas]')).toBeVisible();
  await expect(page.getByRole('link', { name: /联系我/ }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /查看全部项目/ })).toBeVisible();
  await expect(page.locator('[data-film-frame]')).toHaveCount(5);
});

test('3D 胶卷的每个画面都能打开对应详情，关闭后保留位置', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-film]')).toHaveAttribute('data-webgl', 'true', {
    timeout: 15_000
  });
  await page.evaluate(() => {
    const section = document.querySelector<HTMLElement>('[data-film]');
    if (!section) return;
    window.scrollTo({
      top: section.getBoundingClientRect().top + window.scrollY,
      behavior: 'instant'
    });
  });
  await expect(page.locator('[data-film]')).toHaveAttribute('data-pinned', 'true');
  await page.waitForTimeout(500);

  const box = await page.locator('[data-film-viewport]').boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  const titles = [
    '校园二手交易平台',
    '课程资料 RAG 问答助手',
    '校园路径规划可视化',
    '组件化学习仪表盘',
    '校园活动报名 API'
  ];
  const dialog = page.locator('[data-film-dialog]');
  const heading = dialog.getByRole('heading', { level: 2 });
  const count = page.locator('[data-film-count]');
  const clickPanel = async (xRatio: number, expectedTitle: string) => {
    await page.mouse.click(box.x + box.width * xRatio, box.y + box.height * 0.45);
    await expect(dialog).toBeVisible();
    await expect(heading).toHaveText(expectedTitle);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  };

  // 右侧相邻画面也能独立打开自己的项目。
  await clickPanel(0.9, titles[1]);

  // 键盘切换后，详情内容仍然对应新的作品。
  await page.locator('[data-film-caption][data-active="true"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(count).toHaveText('02');
  await page.waitForTimeout(700);

  for (let index = 0; index < titles.length; index += 1) {
    await page.locator('[data-film-tick]').nth(index).click();
    await expect(count).toHaveText(String(index + 1).padStart(2, '0'));
    await page.waitForTimeout(700);

    const position = await page.evaluate(() => window.scrollY);
    await clickPanel(0.5, titles[index]);
    expect(await page.evaluate(() => window.scrollY)).toBe(position);
  }

  await page.locator('[data-film-caption][data-active="true"]').click();
  await expect(dialog).toBeVisible();
  await expect(heading).toHaveText(titles[titles.length - 1]);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('关闭 JavaScript 时首页作品胶卷仍可浏览', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Made by yuyirrr');
  await expect(page.locator('[data-film-frame]')).toHaveCount(5);
  await expect(page.getByRole('link', { name: /校园二手交易平台/ }).first()).toBeVisible();
  await context.close();
});

test('减少动态效果时首屏直接显示可读文字', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/');
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toBeVisible();
  const box = await heading.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThan(100);
  await context.close();
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

test('简历 PDF 与博客可访问，RSS 已移除', async ({ page, request }) => {
  const response = await request.get('/resume.pdf');
  expect(response.ok()).toBeTruthy();
  expect(response.headers()['content-type']).toContain('application/pdf');

  await page.goto('/blog/');
  await expect(page.locator('.blog-card')).toHaveCount(2);
  await page.getByRole('link', { name: /为什么我把个人网站改成静态优先/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('静态优先');

  const rss = await request.get('/rss.xml');
  expect(rss.status()).toBe(404);
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


