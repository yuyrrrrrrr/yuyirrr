import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root = process.cwd();
const printPage = join(root, 'dist', 'resume', 'print', 'index.html');
const output = join(root, 'dist', 'resume.pdf');

if (!existsSync(printPage)) {
  throw new Error('Missing dist/resume/print/index.html. Run `npm run build:site` first.');
}

await mkdir(join(root, 'dist'), { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined
});
const page = await browser.newPage();
await page.goto(pathToFileURL(resolve(printPage)).toString(), { waitUntil: 'networkidle' });
await page.emulateMedia({ media: 'print' });
await page.evaluate(() => document.fonts.ready);
await page.pdf({
  path: output,
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true
});
await browser.close();

console.log(`Generated ${output}`);
