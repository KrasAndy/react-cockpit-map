// scripts/verify-build.mjs
// Build + start preview + screenshot 7 scenarios
//
// Usage:
//   node scripts/verify-build.mjs
//
// Pre-req: examples/vite-demo 已经 npm install 过

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, statSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DEMO = resolve(ROOT, 'examples/vite-demo');
const SHOTS = resolve(ROOT, 'examples/screenshots');

const log = (...a) => console.log('[verify]', ...a);

function run(cmd, args, opts = {}) {
  return new Promise((resolveP, rejectP) => {
    log(`> ${cmd} ${args.join(' ')}`);
    const p = spawn(cmd, args, { stdio: 'inherit', shell: true, cwd: opts.cwd ?? ROOT, ...opts });
    p.on('exit', (code) => {
      if (code === 0) resolveP(0);
      else rejectP(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

async function ensureDemoInstalled() {
  if (existsSync(resolve(DEMO, 'node_modules'))) return;
  log('installing example dependencies…');
  await run('npm', ['install'], { cwd: DEMO });
}

async function ensureBrowsers() {
  // playwright-core ships without; skip auto-install, only run if cached
  const cache = resolve(ROOT, 'node_modules', '.cache', 'ms-playwright');
  if (!existsSync(cache)) {
    log('NOTE: playwright browsers not cached. Screenshots will be skipped.');
    log('      Run: npx playwright-core install chromium   to enable.');
    return false;
  }
  return true;
}

async function ensureDist() {
  if (!existsSync(resolve(ROOT, 'dist'))) {
    log('dist/ missing — running build first…');
    await run('npm', ['run', 'build']);
  }
  const expected = [
    'react-cockpit-map.cjs.js',
    'react-cockpit-map.es.js',
    'index.d.ts',
    'style.css',
  ];
  for (const f of expected) {
    const p = resolve(ROOT, 'dist', f);
    if (!existsSync(p)) {
      throw new Error(`missing dist/${f}`);
    }
    const size = statSync(p).size;
    if (size < 100) throw new Error(`dist/${f} suspiciously small (${size} bytes)`);
    log(`  dist/${f}  ${(size / 1024).toFixed(1)} KB`);
  }
  log('✓ dist artifacts present');
}

async function ensureTypes() {
  // tsc --noEmit on the package sources
  await run('npx', ['tsc', '--noEmit', '-p', 'tsconfig.json']);
  log('✓ types OK');
}

async function runScreenshots() {
  const have = await ensureBrowsers();
  if (!have) return;

  mkdirSync(SHOTS, { recursive: true });

  // start vite preview on the demo (which already links the local package)
  log('starting vite preview on :4174…');
  const preview = spawn('npx', ['vite', 'preview', '--port', '4174', '--strictPort'], {
    cwd: DEMO,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // wait for "Local:" line
  await new Promise((resolveP, rejectP) => {
    const onData = (chunk) => {
      const s = chunk.toString();
      if (s.includes('Local:')) resolveP();
    };
    preview.stdout.on('data', onData);
    preview.stderr.on('data', onData);
    setTimeout(() => rejectP(new Error('preview timeout')), 15000);
  });
  log('preview ready');

  try {
    const { chromium } = await import('playwright-core');
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();

    const tabs = [
      { id: 'gis', label: '1-gis' },
      { id: 'bigscreen', label: '2-bigscreen' },
      { id: 'personnel', label: '3-personnel' },
      { id: 'track', label: '4-track' },
      { id: 'beidou', label: '5-beidou' },
      { id: 'device', label: '6-device' },
      { id: 'pipeline', label: '7-pipeline' },
    ];

    await page.goto('http://localhost:4174/', { waitUntil: 'networkidle' });
    // give leaflet a moment to render first frame
    await page.waitForTimeout(1500);

    for (const t of tabs) {
      const btn = await page.$(`text=/^${t.id === 'gis' ? '1' : t.id === 'bigscreen' ? '2' : t.id === 'personnel' ? '3' : t.id === 'track' ? '4' : t.id === 'beidou' ? '5' : t.id === 'device' ? '6' : '7'}/`);
      // simpler: click by index
      const tabButtons = await page.$$('.tab');
      const idx = tabs.findIndex((x) => x.id === t.id);
      if (tabButtons[idx]) {
        await tabButtons[idx].click();
        await page.waitForTimeout(1200);
      }
      const out = resolve(SHOTS, `${t.label}.png`);
      await page.screenshot({ path: out, fullPage: false });
      log(`  ✓ ${t.label}.png`);
    }

    await browser.close();
  } finally {
    preview.kill('SIGTERM');
  }

  log(`screenshots saved to examples/screenshots/`);
}

async function main() {
  log('=== step 1: dist artifacts ===');
  await ensureDist();

  log('=== step 2: type check ===');
  await ensureTypes();

  log('=== step 3: demo install ===');
  await ensureDemoInstalled();

  log('=== step 4: screenshots (optional) ===');
  await runScreenshots();

  log('=== ALL OK ===');
}

main().catch((e) => {
  console.error('[verify] FAILED:', e.message);
  process.exit(1);
});