import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9395;
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
  'http://localhost:8787/#/knowledge'
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
  await waitDom(`document.querySelectorAll('.knowledge-page .tab').length === 2 && document.querySelectorAll('#main tbody tr[data-id]').length >= 3`);
  await sleep(300);

  const tabText = await evaluate(`Array.from(document.querySelectorAll('.knowledge-page .tab')).map((el) => el.textContent.trim())`);
  const tabCounts = await evaluate(`Array.from(document.querySelectorAll('.knowledge-page .tab-count')).map((el) => el.textContent.trim())`);
  check('knowledge has project and global tabs', tabText.length === 2 && tabText[0].includes('本项目文档') && tabText[1].includes('平台总库') && tabCounts.length === 2 && tabCounts[0] === '3' && tabCounts[1] === '2', `${tabText.join(' | ')} | ${tabCounts.join(' | ')}`);

  const projectTitles = await evaluate(`Array.from(document.querySelectorAll('#main tbody tr[data-id]')).map((tr) => tr.querySelector('.cell-main b')?.textContent.trim())`);
  check('project tab lists current project docs', projectTitles.includes('订单履约状态机说明') && projectTitles.includes('履约超时预警阈值配置') && projectTitles.includes('订单履约超时预警 PRD') && !projectTitles.includes('客户分层运营 SOP'), projectTitles.join(' | '));
  check('project row shows requirement type and scope', (await evaluate(`(() => { const row = document.querySelector('#main tbody tr[data-id="doc-5"]'); return !!row && row.innerText.includes('RQ-101') && row.innerText.includes('需求规格') && row.innerText.includes('平台总库'); })()`)) === true);

  await evaluate(`(() => { const input = document.querySelector('#doc-search'); input.value = 'EXCEPTION'; input.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  await waitDom(`document.querySelectorAll('#main tbody tr[data-id]').length === 1 && document.querySelector('#main tbody tr[data-id]')?.dataset.id === 'doc-1'`);
  check('doc search filters content-only tokens', true);

  await evaluate(`(() => { const input = document.querySelector('#doc-search'); input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true })); const select = document.querySelector('#doc-type-filter'); select.value = '运行手册'; select.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  await waitDom(`document.querySelectorAll('#main tbody tr[data-id]').length === 1 && document.querySelector('#main tbody tr[data-id]')?.dataset.id === 'doc-2'`);
  check('doc type filter works', true);

  await evaluate(`(() => { const type = document.querySelector('#doc-type-filter'); type.value = 'all'; type.dispatchEvent(new Event('change', { bubbles: true })); const req = document.querySelector('#doc-req-filter'); req.value = 'RQ-101'; req.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  await waitDom(`document.querySelectorAll('#main tbody tr[data-id]').length === 2`);
  check('doc requirement filter works', true);

  await evaluate(`document.querySelector('[data-action="knowledge-tab"][data-tab="global"]').click()`);
  await waitDom(`document.querySelectorAll('#main tbody tr[data-id]').length === 2`);
  const globalRows = await evaluate(`Array.from(document.querySelectorAll('#main tbody tr[data-id]')).map((tr) => ({ id: tr.dataset.id, text: tr.innerText }))`);
  check('global tab lists published docs from all projects', globalRows.some((row) => row.id === 'doc-4' && row.text.includes('智能客服')) && globalRows.some((row) => row.id === 'doc-5' && row.text.includes('订单中心')), JSON.stringify(globalRows));

  await evaluate(`(() => { const select = document.querySelector('#doc-source-filter'); select.value = 'p-support'; select.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  await waitDom(`document.querySelectorAll('#main tbody tr[data-id]').length === 1 && document.querySelector('#main tbody tr[data-id]')?.dataset.id === 'doc-4'`);
  check('global source filter works', true);

  await sleep(200);
  await send('Page.captureScreenshot', { format: 'png' }).then((shot) => writeFileSync('d:/Code/AI/ai-devops/.tmp-e2e/doc-list.png', Buffer.from(shot.data, 'base64')));

  check('no console errors', errors.length === 0, errors.join(' | '));
} catch (error) {
  check('test harness completed', false, error.stack || String(error));
} finally {
  try { await send('Browser.close'); } catch { /* noop */ }
  try { ws?.close(); } catch { /* noop */ }
  if (edge.pid) spawnSync('taskkill', ['/pid', String(edge.pid), '/T', '/F'], { stdio: 'ignore' });
  await sleep(500);
  try { rmSync(PROFILE, { recursive: true, force: true }); } catch { /* noop */ }
  const failed = results.filter((item) => !item.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}
