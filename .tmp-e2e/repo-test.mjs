import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9399;
const PROFILE = mkdtempSync(join(tmpdir(), 'ai-devops-edge-'));
const results = [];
const errors = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const edge = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
  'http://localhost:8787/#/code'
], { stdio: 'ignore' });

async function waitFor(fn, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { const value = await fn(); if (value) return value; } catch { /* retry */ }
    await sleep(150);
  }
  throw new Error('timeout');
}

let ws;
let nextId = 0;
const pending = new Map();
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
  return response.result.value;
}
const waitDom = (expression, timeout) => waitFor(async () => (await evaluate(expression)) || false, timeout);

try {
  const target = await waitFor(async () => {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    return list.find((item) => item.type === 'page' && item.url.includes('localhost:8787'));
  });
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
      return;
    }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map((arg) => arg.value || arg.description || '').join(' '));
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await waitDom(`document.querySelectorAll('.repo-card').length >= 4`);
  await sleep(350);

  check('repo page is a pure list', (await evaluate(`(() => { const main = document.querySelector('#main'); return !!main && main.querySelectorAll('.tabs .tab').length === 0 && main.querySelectorAll('.repo-card').length === 4; })()`)) === true);
  check('repo sidebar item active', (await evaluate(`document.querySelector('.sidebar .side-item.active')?.textContent.includes('代码仓')`)) === true);
  await send('Page.captureScreenshot', { format: 'png' }).then((shot) => writeFileSync('d:/Code/AI/ai-devops/.tmp-e2e/repo-list.png', Buffer.from(shot.data, 'base64')));

  await evaluate(`document.querySelector('[data-action="open-repo"][data-id="repo-order-api"]').click()`);
  await waitDom(`!!document.querySelector('.repo-detail')`);
  check('repo card opens repo detail', (await evaluate(`location.hash === '#/code/repo-order-api' && document.querySelector('.repo-title-row h1')?.textContent.trim() === 'order-api'`)) === true);
  check('repo detail keeps code sidebar active', (await evaluate(`document.querySelector('.sidebar .side-item.active')?.textContent.includes('代码仓')`)) === true);
  const repoTabs = await evaluate(`Array.from(document.querySelectorAll('.repo-tabs .tab')).map((el) => el.textContent.trim())`);
  check('repo detail has code, mrs and settings tabs', repoTabs.length === 3 && repoTabs[0].includes('代码') && repoTabs[1].includes('合并请求') && repoTabs[2].includes('配置'), repoTabs.join(','));
  check('repo code tab has branch selector and commit bar', (await evaluate(`!!document.querySelector('.repo-branch-select') && !!document.querySelector('.repo-commit')`)) === true);
  check('repo file tree and README rendered', (await evaluate(`document.querySelectorAll('[data-action="repo-file"]').length >= 5 && document.querySelector('.repo-file-head')?.textContent.includes('README.md')`)) === true);
  await sleep(250);
  await send('Page.captureScreenshot', { format: 'png' }).then((shot) => writeFileSync('d:/Code/AI/ai-devops/.tmp-e2e/repo-detail.png', Buffer.from(shot.data, 'base64')));

  await evaluate(`document.querySelector('[data-action="repo-file"][data-path="go.mod"]').click()`);
  await waitDom(`document.querySelector('.repo-file-head')?.textContent.includes('go.mod')`);
  check('clicking file loads its code', (await evaluate(`document.querySelector('.repo-code')?.innerText.includes('module platform/order-api')`)) === true);
  await evaluate(`(() => { const select = document.querySelector('.repo-branch-select'); select.value = 'feat/order-timeout'; select.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  await waitDom(`document.querySelector('.repo-branch-select')?.value === 'feat/order-timeout'`);
  check('branch selector switches branch', true);

  await evaluate(`document.querySelector('[data-action="repo-tab"][data-tab="mrs"]').click()`);
  await waitDom(`!!document.querySelector('[data-action="open-mr-page"][data-id="!128"]')`);
  check('repo mrs tab lists only repo mrs', (await evaluate(`document.querySelectorAll('[data-action="open-mr-page"]').length === 1`)) === true);
  await evaluate(`document.querySelector('[data-action="open-mr-page"][data-id="!128"]').click()`);
  await waitDom(`!!document.querySelector('.mr-detail')`);
  check('mr opens as full page', (await evaluate(`location.hash === '#/code/repo-order-api/mrs/128' && !!document.querySelector('.mr-detail')`)) === true);
  check('mr detail has description and linked requirement', (await evaluate(`document.querySelector('.mr-description')?.textContent.includes('超时阈值') && document.querySelector('.mr-detail .relation-item')?.textContent.includes('RQ-101')`)) === true);
  check('mr detail has pipeline and review comments', (await evaluate(`(() => { const text = document.querySelector('#mr-conversation')?.innerText || ''; return document.querySelector('.gate-list')?.innerText.includes('build') && text.includes('代码评审') && text.includes('timeout.go') && text.includes('thresholds'); })()`)) === true);
  await sleep(250);
  await send('Page.captureScreenshot', { format: 'png' }).then((shot) => writeFileSync('d:/Code/AI/ai-devops/.tmp-e2e/mr-detail.png', Buffer.from(shot.data, 'base64')));

  await evaluate(`(() => { const input = document.querySelector('#mr-comment-input'); input.value = '测试评论：review 通过后合并'; document.querySelector('[data-action="add-mr-comment"]').click(); return true; })()`);
  await waitDom(`document.querySelector('#mr-conversation')?.innerText.includes('测试评论：review 通过后合并')`);
  check('mr comment can be added', true);
  await evaluate(`document.querySelector('[data-action="approve-mr"]').click()`);
  await waitDom(`document.querySelector('.mr-title-row .pill')?.textContent.trim() === '已批准'`);
  check('mr can be approved', (await evaluate(`!document.querySelector('[data-action="approve-mr"]')`)) === true);

  await evaluate(`document.querySelector('[data-action="back-repo-mrs"]').click()`);
  await waitDom(`!!document.querySelector('.repo-detail') && document.querySelector('.repo-tabs .tab.active')?.textContent.includes('合并请求')`);
  check('back returns to repo mrs tab with updated status', (await evaluate(`document.querySelector('[data-action="open-mr-page"][data-id="!128"]')?.innerText.includes('已批准')`)) === true);

  await evaluate(`document.querySelector('[data-action="repo-tab"][data-tab="settings"]').click()`);
  await waitDom(`!!document.querySelector('#repo-setting-name')`);
  await evaluate(`(() => { const form = document.querySelector('form[data-form="repo-settings"]'); form.elements.name.value = 'order-api-core'; form.elements.description.value = '订单履约核心 API（重构）'; form.elements.defaultBranch.value = 'feat/order-timeout'; form.elements.visibility.value = '公开'; form.requestSubmit(); return true; })()`);
  await waitDom(`document.querySelector('.repo-title-row h1')?.textContent.trim() === 'order-api-core'`);
  check('repo settings save updates header', (await evaluate(`document.querySelector('.repo-desc')?.textContent.includes('重构') && document.querySelector('.repo-title-row')?.textContent.includes('公开')`)) === true);
  await sleep(250);
  await send('Page.captureScreenshot', { format: 'png' }).then((shot) => writeFileSync('d:/Code/AI/ai-devops/.tmp-e2e/repo-settings.png', Buffer.from(shot.data, 'base64')));

  await evaluate(`document.querySelector('[data-action="back-repo-list"]').click()`);
  await waitDom(`!!document.querySelector('.repo-card')`);
  check('repo list reflects saved settings', (await evaluate(`document.querySelector('[data-action="open-repo"][data-id="repo-order-api"]')?.innerText.includes('order-api-core') && document.querySelector('[data-action="open-repo"][data-id="repo-order-api"]')?.innerText.includes('重构') && document.querySelector('[data-action="open-repo"][data-id="repo-order-api"]')?.innerText.includes('公开')`)) === true);

  check('no console errors', errors.length === 0, errors.join(' | '));
} catch (error) {
  if (errors.length) console.log(`CONSOLE ERRORS: ${errors.join(' | ')}`);
  check('test harness completed', false, error.stack || String(error));
} finally {
  try { await send('Browser.close'); } catch { /* noop */ }
  try { ws?.close(); } catch { /* noop */ }
  if (edge.pid) spawnSync('taskkill', ['/pid', String(edge.pid), '/T', '/F'], { stdio: 'ignore' });
  await sleep(800);
  try { rmSync(PROFILE, { recursive: true, force: true }); } catch { /* noop */ }
  const failed = results.filter((item) => !item.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}
