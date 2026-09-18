import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const projectDir = join(root, 'public', 'images', 'projects');
const diagramDir = join(root, 'public', 'images', 'diagrams');

const projectArt = [
  {
    slug: 'frontend',
    index: '01',
    title: 'LEARNING / DASHBOARD',
    subtitle: '课程进度 · 任务风险 · 成绩趋势',
    accent: '#2559d6',
    secondary: '#9db8ff',
    kind: 'dashboard'
  },
  {
    slug: 'backend',
    index: '02',
    title: 'EVENT / API',
    subtitle: '原子名额 · 幂等请求 · 可靠通知',
    accent: '#0f766e',
    secondary: '#80d5c8',
    kind: 'service'
  },
  {
    slug: 'fullstack',
    index: '03',
    title: 'CAMPUS / MARKET',
    subtitle: '发布 · 检索 · 沟通 · 交付',
    accent: '#6941c6',
    secondary: '#c9b2ff',
    kind: 'market'
  },
  {
    slug: 'algorithm',
    index: '04',
    title: 'ROUTE / EXPLAIN',
    subtitle: '多目标寻路 · 偏好权重 · 路径解释',
    accent: '#b45309',
    secondary: '#f4c05f',
    kind: 'route'
  },
  {
    slug: 'ai',
    index: '05',
    title: 'COURSE / RAG',
    subtitle: '混合检索 · 来源引用 · 低置信拒答',
    accent: '#be185d',
    secondary: '#f7a7c5',
    kind: 'rag'
  }
];

const diagramLabels = {
  frontend: ['DATA SOURCES', 'ADAPTER', 'PINIA', 'CARD VIEWS'],
  backend: ['CLIENT', 'API GATEWAY', 'REDIS LUA', 'OUTBOX → NOTIFY'],
  fullstack: ['VUE WEB', 'REST API', 'POSTGRES', 'REDIS + OBJECT'],
  algorithm: ['OSM + FIELD DATA', 'GRAPH INDEX', 'WEB WORKER', 'MAP + EXPLAIN'],
  ai: ['DOCUMENTS', 'HYBRID RETRIEVAL', 'RERANK', 'CITED ANSWER']
};

function coverSvg(item) {
  const animation = item.kind === 'route'
    ? '<circle cx="895" cy="300" r="15" fill="#fff"><animate attributeName="r" values="10;18;10" dur="2.8s" repeatCount="indefinite"/></circle><path d="M235 510 C440 390 680 545 945 276" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="15 16"><animate attributeName="stroke-dashoffset" values="0;-62" dur="2.6s" repeatCount="indefinite"/></path>'
    : item.kind === 'rag'
      ? '<circle cx="910" cy="310" r="110" fill="none" stroke="#fff" stroke-width="2" opacity=".7"><animate attributeName="r" values="72;122;72" dur="4s" repeatCount="indefinite"/></circle><circle cx="910" cy="310" r="28" fill="#fff" opacity=".9"/><circle cx="1030" cy="230" r="12" fill="#fff"><animate attributeName="cy" values="250;210;250" dur="3s" repeatCount="indefinite"/></circle>'
      : '<g transform="translate(820 130)"><rect width="250" height="150" rx="22" fill="#fff" opacity=".16"/><rect y="24" width="155" height="14" rx="7" fill="#fff" opacity=".9"/><rect y="58" width="200" height="9" rx="4.5" fill="#fff" opacity=".55"/><rect y="82" width="178" height="9" rx="4.5" fill="#fff" opacity=".4"/><circle cx="36" cy="125" r="16" fill="#fff" opacity=".85"/></g>';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${item.accent}"/><stop offset="1" stop-color="${item.secondary}"/></linearGradient><pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="#fff" stroke-opacity=".12"/></pattern><style>@media (prefers-reduced-motion: reduce){*{animation:none!important}}</style></defs>
  <rect width="1200" height="760" rx="36" fill="url(#bg)"/><rect width="1200" height="760" rx="36" fill="url(#grid)"/>
  <text x="72" y="96" fill="#fff" opacity=".72" font-size="20" font-family="Arial, sans-serif" letter-spacing="5">${item.index} / SAMPLE PROJECT</text>
  <text x="72" y="225" fill="#fff" font-size="64" font-weight="700" font-family="Arial, sans-serif">${item.title}</text>
  <text x="72" y="280" fill="#fff" opacity=".83" font-size="24" font-family="Arial, sans-serif">${item.subtitle}</text>
  <path d="M72 335H520" stroke="#fff" stroke-width="2" opacity=".4"/>
  <g opacity=".9">${animation}</g>
  <g transform="translate(72 600)"><circle cx="8" cy="8" r="8" fill="#fff"/><text x="28" y="15" fill="#fff" opacity=".82" font-size="18" font-family="Arial, sans-serif">STATIC FIRST · CONTENT DRIVEN</text></g>
</svg>`;
}

function screenSvg(item) {
  const cards = item.kind === 'route'
    ? '<path d="M220 540 L430 290 L660 480 L900 210 L1120 390" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><circle cx="430" cy="290" r="18" fill="#fff"/><circle cx="900" cy="210" r="18" fill="#fff"/>'
    : item.kind === 'rag'
      ? '<rect x="210" y="180" width="760" height="120" rx="22" fill="#fff" opacity=".94"/><rect x="210" y="330" width="500" height="230" rx="22" fill="#fff" opacity=".2"/><rect x="740" y="330" width="420" height="230" rx="22" fill="#fff" opacity=".95"/><circle cx="260" cy="230" r="16" fill="' + item.accent + '"/><rect x="290" y="218" width="480" height="24" rx="12" fill="' + item.accent + '" opacity=".28"/>'
      : '<rect x="210" y="190" width="480" height="310" rx="24" fill="#fff" opacity=".96"/><rect x="730" y="190" width="430" height="145" rx="24" fill="#fff" opacity=".25"/><rect x="730" y="365" width="430" height="135" rx="24" fill="#fff" opacity=".25"/><rect x="250" y="235" width="210" height="26" rx="13" fill="' + item.accent + '" opacity=".78"/><rect x="250" y="290" width="350" height="14" rx="7" fill="' + item.accent + '" opacity=".18"/><rect x="250" y="325" width="290" height="14" rx="7" fill="' + item.accent + '" opacity=".18"/>';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900">
  <rect width="1440" height="900" rx="34" fill="#f5f6f2"/><rect x="40" y="40" width="1360" height="820" rx="28" fill="#1d2026"/>
  <rect x="72" y="78" width="250" height="12" rx="6" fill="#fff" opacity=".16"/><circle cx="1330" cy="86" r="10" fill="${item.secondary}"/>
  <g transform="translate(72 132)"><rect width="1296" height="688" rx="24" fill="url(#screenBg)"/><defs><linearGradient id="screenBg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${item.accent}" stop-opacity=".95"/><stop offset="1" stop-color="${item.secondary}" stop-opacity=".78"/></linearGradient></defs>${cards}</g>
  <text x="104" y="835" fill="#fff" opacity=".55" font-size="18" font-family="Arial, sans-serif">SAMPLE SCREEN · REPLACE WITH REAL SCREENSHOT</text>
</svg>`;
}

function diagramSvg(labels, accent) {
  const boxes = labels.map((label, index) => {
    const x = 70 + index * 282;
    const arrow = index < labels.length - 1
      ? `<path d="M${x + 210} 330H${x + 274}" stroke="${accent}" stroke-width="5" stroke-linecap="round"/><path d="M${x + 274} 330l-15-10v20z" fill="${accent}"/>`
      : '';
    return `<g><rect x="${x}" y="255" width="210" height="150" rx="22" fill="#fff" stroke="${accent}" stroke-width="3"/><rect x="${x + 24}" y="285" width="54" height="8" rx="4" fill="${accent}" opacity=".35"/><text x="${x + 24}" y="350" fill="#1b1e24" font-size="${label.length > 18 ? 16 : 19}" font-weight="700" font-family="Arial, sans-serif">${label}</text></g>${arrow}`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720">
  <rect width="1200" height="720" rx="32" fill="#f7f8f4"/><defs><pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="#9aa2ad" opacity=".35"/></pattern></defs><rect width="1200" height="720" rx="32" fill="url(#dots)"/>
  <text x="70" y="84" fill="#171a20" font-size="18" font-family="Arial, sans-serif" letter-spacing="4">ARCHITECTURE / DATA FLOW</text><text x="70" y="145" fill="#171a20" font-size="38" font-weight="700" font-family="Arial, sans-serif">从输入到结果的最小链路</text>
  <path d="M70 200H1130" stroke="${accent}" stroke-width="2" opacity=".25"/>${boxes}
  <text x="70" y="600" fill="#5d6470" font-size="18" font-family="Arial, sans-serif">示例架构图 · 正式项目中请替换为真实组件、依赖方向与数据边界</text>
  <rect x="70" y="635" width="1060" height="2" fill="${accent}" opacity=".15"/>
</svg>`;
}

function faviconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#1b1e24"/><path d="M16 18l16 18 16-18M32 36v12" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function ogSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f4f3ef"/><path d="M0 500h1200M140 0v630M1060 0v630" stroke="#171a20" stroke-opacity=".08"/><text x="86" y="115" fill="#2559d6" font-size="22" font-family="Arial, sans-serif" letter-spacing="6">PORTFOLIO / 2026</text><text x="86" y="270" fill="#171a20" font-size="78" font-weight="700" font-family="Arial, sans-serif">把复杂问题，</text><text x="86" y="365" fill="#171a20" font-size="78" font-weight="700" font-family="Arial, sans-serif">做成清晰产品。</text><text x="86" y="455" fill="#60666f" font-size="28" font-family="Arial, sans-serif">全栈开发 · 算法 · AI 应用</text><rect x="86" y="510" width="430" height="3" fill="#2559d6"/><text x="86" y="565" fill="#171a20" font-size="20" font-family="Arial, sans-serif">yuyirrr.com</text></svg>`;
}

await mkdir(projectDir, { recursive: true });
await mkdir(diagramDir, { recursive: true });

for (const item of projectArt) {
  await writeFile(join(projectDir, `${item.slug}-cover.svg`), coverSvg(item));
  await writeFile(join(projectDir, `${item.slug}-screen.svg`), screenSvg(item));
  await writeFile(
    join(diagramDir, `${item.slug}-architecture.svg`),
    diagramSvg(diagramLabels[item.slug], item.accent)
  );
}

await writeFile(join(root, 'public', 'favicon.svg'), faviconSvg());
await writeFile(join(root, 'public', 'og-default.svg'), ogSvg());
await sharp(Buffer.from(ogSvg())).png().toFile(join(root, 'public', 'og-default.png'));
console.log('Generated project art, favicon and Open Graph image.');

