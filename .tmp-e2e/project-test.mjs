import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9396;
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
  'http://localhost:8787/#/projects'
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
  await waitDom(`document.querySelectorAll('.project-card').length === 3`);
  await sleep(350);

  check('project space opens a project list', (await evaluate(`document.querySelector('.page-title')?.textContent.trim() === '项目空间' && document.querySelectorAll('.project-card').length === 3`)) === true);
  check('project list has no overview widgets', (await evaluate(`!document.querySelector('.kpi-grid') && !document.querySelector('.pending-list') && !document.querySelector('.project-card .tabs')`)) === true);
  check('project list hides project sidebar', (await evaluate(`document.querySelector('#shell').classList.contains('no-sidebar') && getComputedStyle(document.querySelector('.sidebar')).display === 'none'`)) === true);
  check('project list exposes create action', (await evaluate(`!!document.querySelector('.page-actions [data-action="new-project"]') && !!document.querySelector('.project-new-card')`)) === true);
  check('project cards show created time and members', (await evaluate(`(() => { const card = document.querySelector('.project-card[data-id="p-order"]'); return !!card && /创建于\\s*2026-03-12/.test(card.innerText) && card.innerText.includes('7 名成员'); })()`)) === true);
  check('project cards expose release action', (await evaluate(`document.querySelectorAll('.project-card [data-action="release-project"]').length === 3`)) === true);
  await send('Page.captureScreenshot', { format: 'png' }).then((shot) => writeFileSync('d:/Code/AI/ai-devops/.tmp-e2e/project-list.png', Buffer.from(shot.data, 'base64')));

  await evaluate(`document.querySelector('.project-card[data-id="p-order"]').click()`);
  await waitDom(`location.hash === '#/requirements' && !!document.querySelector('.req-table')`);
  check('clicking a project enters the project', (await evaluate(`document.querySelector('.sidebar .project-meta b')?.textContent === '订单中心' && document.querySelector('.sidebar .side-item.active')?.textContent.includes('需求管理')`)) === true);
  check('project sidebar is restored after entering', (await evaluate(`!document.querySelector('#shell').classList.contains('no-sidebar') && getComputedStyle(document.querySelector('.sidebar')).display !== 'none'`)) === true);

  await evaluate(`document.querySelector('[data-action="project-switch"]').click()`);
  await waitDom(`!!document.querySelector('.overlay.open .project-option')`);
  check('project switcher no longer creates projects', (await evaluate(`!document.querySelector('.overlay.open [data-action="new-project"]')`)) === true);
  await evaluate(`document.querySelector('.overlay.open [data-action="close-overlay"]').click()`);
  await sleep(250);

  await evaluate(`document.querySelector('.nav-item[data-route="#/projects"]').click()`);
  await waitDom(`location.hash === '#/projects' && document.querySelectorAll('.project-card').length === 3`);
  check('top nav returns to project list', (await evaluate(`document.querySelector('.page-title')?.textContent.trim() === '项目空间' && document.querySelector('#shell').classList.contains('no-sidebar')`)) === true);

  await evaluate(`document.querySelector('.page-actions [data-action="new-project"]').click()`);
  await waitDom(`!!document.querySelector('#project-form')`);
  await evaluate(`(() => { const form = document.querySelector('#project-form'); form.elements.name.value = '测试项目'; form.elements.code.value = 'TESTPROJ'; form.elements.desc.value = '项目列表与释放验证'; form.requestSubmit(); return true; })()`);
  await waitDom(`document.querySelectorAll('.project-card').length === 4`);
  const createdCard = await evaluate(`(() => { const card = Array.from(document.querySelectorAll('.project-card')).find((el) => el.innerText.includes('测试项目')); return card ? { created: card.innerText.includes('创建于'), members: card.innerText.includes('1 名成员'), release: !!card.querySelector('[data-action="release-project"]') } : null; })()`);
  check('new project appears in the list with metadata', !!createdCard && createdCard.created && createdCard.members && createdCard.release, JSON.stringify(createdCard));

  await evaluate(`(() => { const card = Array.from(document.querySelectorAll('.project-card')).find((el) => el.innerText.includes('测试项目')); card.querySelector('[data-action="release-project"]').click(); return true; })()`);
  await waitDom(`!!document.querySelector('.overlay.open [data-action="confirm-release-project"]')`);
  check('release project asks for confirmation', (await evaluate(`document.querySelector('.overlay.open .drawer')?.innerText.includes('释放后项目将被删除')`)) === true);
  await sleep(350);
  await send('Page.captureScreenshot', { format: 'png' }).then((shot) => writeFileSync('d:/Code/AI/ai-devops/.tmp-e2e/project-release.png', Buffer.from(shot.data, 'base64')));
  await evaluate(`document.querySelector('.overlay.open [data-action="confirm-release-project"]').click()`);
  await waitDom(`document.querySelectorAll('.project-card').length === 3`);
  check('released project is removed from the list', (await evaluate(`!Array.from(document.querySelectorAll('.project-card')).some((el) => el.innerText.includes('测试项目')) && !document.querySelector('.overlay.open')`)) === true);

  await evaluate(`(() => { const card = Array.from(document.querySelectorAll('.project-card')).find((el) => el.innerText.includes('智能客服')); card.querySelector('[data-action="release-project"]').click(); return true; })()`);
  await waitDom(`!!document.querySelector('.overlay.open [data-action="confirm-release-project"]')`);
  await evaluate(`document.querySelector('.overlay.open [data-action="confirm-release-project"]').click()`);
  await waitDom(`document.querySelectorAll('.project-card').length === 2`);
  check('releasing a seeded project keeps the list usable', (await evaluate(`!Array.from(document.querySelectorAll('.project-card')).some((el) => el.innerText.includes('智能客服')) && document.querySelectorAll('.project-card').length === 2`)) === true);

  await evaluate(`(() => { const input = document.querySelector('#global-search'); input.value = '客服'; input.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  await sleep(250);
  check('released project data leaves global search', (await evaluate(`!document.querySelector('#search-results')?.innerText.includes('RQ-107') && !document.querySelector('#search-results')?.innerText.includes('智能客服')`)) === true);

  await evaluate(`location.hash = '#/requirements'`);
  await waitDom(`!!document.querySelector('.req-table tbody tr[data-id="RQ-104"]')`);
  const deferredRow = await evaluate(`document.querySelector('.req-table tbody tr[data-id="RQ-104"]')?.innerText || ''`);
  check('deferred requirement repoints after target project release', deferredRow.includes('Backlog') && !deferredRow.includes('it-25'), deferredRow);
  await evaluate(`location.hash = '#/projects'`);
  await waitDom(`document.querySelectorAll('.project-card').length === 2`);

  for (const [name, remaining] of [['订单中心', 1], ['客户运营', 0]]) {
    await evaluate(`(() => { const card = Array.from(document.querySelectorAll('.project-card')).find((el) => el.innerText.includes('${name}')); card.querySelector('[data-action="release-project"]').click(); return true; })()`);
    await waitDom(`!!document.querySelector('.overlay.open [data-action="confirm-release-project"]')`);
    await evaluate(`document.querySelector('.overlay.open [data-action="confirm-release-project"]').click()`);
    await waitDom(`document.querySelectorAll('.project-card').length === ${remaining}`);
  }
  check('empty project list keeps a create entry', (await evaluate(`document.querySelector('.empty h2')?.textContent.includes('还没有项目') && !!document.querySelector('.page-actions [data-action="new-project"]') && document.querySelector('#shell').classList.contains('no-sidebar')`)) === true);

  await evaluate(`location.hash = '#/requirements'`);
  await waitDom(`document.querySelector('.page-title')?.textContent.trim() === '项目空间' && document.querySelector('.empty h2')?.textContent.includes('还没有项目')`);
  check('project routes fall back to the list when no project exists', (await evaluate(`document.querySelector('#shell').classList.contains('no-sidebar') && !document.querySelector('.req-table')`)) === true);

  await evaluate(`location.hash = '#/tasks/T-201'`);
  await waitDom(`document.querySelector('.page-title')?.textContent.trim() === '项目空间' && document.querySelector('.empty h2')?.textContent.includes('还没有项目')`);
  check('dynamic task route falls back without crashing', true);

  await evaluate(`location.hash = '#/code/repo-order-api'`);
  await waitDom(`document.querySelector('.page-title')?.textContent.trim() === '项目空间' && document.querySelector('.empty h2')?.textContent.includes('还没有项目')`);
  check('dynamic repo route falls back without crashing', true);

  await evaluate(`location.hash = '#/admin/environments'`);
  await waitDom(`document.querySelector('.page-title')?.textContent.trim() === '环境与配额'`);
  check('released project quota is purged', (await evaluate(`!document.querySelector('#main').innerText.includes('智能客服')`)) === true);

  await evaluate(`location.hash = '#/projects'`);
  await waitDom(`document.querySelector('.page-title')?.textContent.trim() === '项目空间' && document.querySelector('.empty h2')?.textContent.includes('还没有项目')`);
  await evaluate(`document.querySelector('.page-actions [data-action="new-project"]').click()`);
  await waitDom(`!!document.querySelector('#project-form')`);
  await evaluate(`(() => { const form = document.querySelector('#project-form'); form.elements.name.value = '重建项目'; form.elements.code.value = 'REBUILD'; form.elements.desc.value = '空项目列表恢复验证'; form.requestSubmit(); return true; })()`);
  await waitDom(`document.querySelectorAll('.project-card').length === 1`);
  check('empty list can create a project again', (await evaluate(`document.querySelector('.project-card')?.innerText.includes('重建项目') && document.querySelector('#shell').classList.contains('no-sidebar')`)) === true);

  check('no console errors', errors.length === 0, errors.join(' | '));
} catch (error) {
  check('test harness completed', false, error.stack || String(error));
} finally {
  try { await send('Browser.close'); } catch { /* noop */ }
  try { ws?.close(); } catch { /* noop */ }
  if (edge.pid) spawnSync('taskkill', ['/pid', String(edge.pid), '/T', '/F'], { stdio: 'ignore' });
  const failed = results.filter((item) => !item.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}
