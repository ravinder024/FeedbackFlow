/*
  Local verification script (agent-friendly)

  Runs a set of checks to confirm the repo is in a runnable state before
  doing manual SauceDemo testing.

  Usage:
    node scripts/verify.mjs
    node scripts/verify.mjs --smoke
    node scripts/verify.mjs --strict
    node scripts/verify.mjs --strict --quick

  Modes:
  - Default: lightweight checks (Prisma validate). Use --smoke for runtime sanity.
  - --smoke: start `npm run dev`, ping a few endpoints, then stop it.
  - --strict: run typecheck + lint + tests (+ builds unless --quick).

  Notes:
  - --quick only affects --strict mode; it skips Next build + widget build.
*/

import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';

const args = new Set(process.argv.slice(2));
const quick = args.has('--quick');
const smoke = args.has('--smoke');
const strict = args.has('--strict');

function runStep(name, command, commandArgs, options = {}) {
  process.stdout.write(`\n==> ${name}\n`);

  const result = spawnSync(command, commandArgs, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(`${name} failed (exit ${result.status ?? 'unknown'})`);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHttpOk(url, timeoutMs) {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const resp = await fetch(url, { redirect: 'follow' });
      if (resp.ok) return;
    } catch {
      // ignore
    }

    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timeout waiting for ${url}`);
    }

    await sleep(750);
  }
}

async function httpGetJson(url) {
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} for ${url}`);
  }
  return resp.json();
}

async function smokeDevServer() {
  process.stdout.write(`\n==> Smoke: start dev server\n`);

  const dev = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      // Keep noisy middleware logging down if any code reads this.
      FEEDBACKFLOW_SMOKE: '1',
    },
  });

  try {
    const baseUrl = 'http://localhost:3000';

    await waitForHttpOk(`${baseUrl}/api/hello`, 60_000);
    process.stdout.write(`OK: ${baseUrl}/api/hello\n`);

    // Pins API is unauthenticated (dev in-memory). Useful for sanity checks.
    const pins = await httpGetJson(
      `${baseUrl}/api/pins?testGroupId=smoke&domain=saucedemo.com&pageUrl=${encodeURIComponent('https://www.saucedemo.com')}`
    );
    if (!Array.isArray(pins)) {
      throw new Error('Expected /api/pins to return an array');
    }
    process.stdout.write(`OK: ${baseUrl}/api/pins (array length ${pins.length})\n`);

    // Widget script endpoint should return JS (status 200). Content check is minimal.
    await waitForHttpOk(`${baseUrl}/api/widget/feedback-widget.js`, 20_000);
    process.stdout.write(`OK: ${baseUrl}/api/widget/feedback-widget.js\n`);
  } finally {
    process.stdout.write(`\n==> Smoke: stop dev server\n`);

    if (process.platform === 'win32') {
      // Ensure the full process tree is stopped on Windows.
      spawnSync('taskkill', ['/PID', String(dev.pid), '/T', '/F'], {
        stdio: 'ignore',
        shell: true,
      });
    } else {
      dev.kill('SIGTERM');
    }
  }
}

async function main() {
  process.stdout.write(`FeedbackFlow verification\n`);
  process.stdout.write(`Node: ${process.version}\n`);

  runStep('Prisma schema validation', 'npx', ['prisma', 'validate']);

  if (strict) {
    runStep('TypeScript typecheck (tsconfig.json)', 'npx', ['tsc', '-p', 'tsconfig.json', '--noEmit']);
    runStep('Lint', 'npm', ['run', 'lint']);
    runStep('Tests', 'npm', ['test']);

    if (!quick) {
      runStep('Build app (next build)', 'npm', ['run', 'build']);
      runStep('Build widget (webpack)', 'npm', ['run', 'build:widget']);
    } else {
      process.stdout.write(`\n==> Skipping builds (--quick)\n`);
    }
  } else {
    process.stdout.write(`\n==> Skipping strict checks (use --strict)\n`);
  }

  if (smoke) {
    await smokeDevServer();
  }

  process.stdout.write(`\nVerification complete.\n`);
  if (!strict) {
    process.stdout.write(`Tip: run again with --strict once the repo compiles cleanly.\n`);
  }
  process.stdout.write(`Next: run manual SauceDemo flow (pins + persistence + moderator view).\n`);
}

main().catch((err) => {
  console.error(`\nVerification failed: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
