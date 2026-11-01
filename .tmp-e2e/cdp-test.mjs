import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9366;
const PROFILE = mkdtempSync(join(tmpdir(), 'ai-devops-edge-'));
const results = [];
const errors = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const edge = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
  'http://localhost:8787/#/projects'
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, timeout = 12000) {
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
  await waitDom(`document.readyState === 'complete' && document.querySelectorAll('.project-card').length === 3`);

  check('sidebar has team entry', (await evaluate(`Array.from(document.querySelectorAll('.side-item')).some((el) => el.textContent.includes('团队管理'))`)) === true);
  const navLabels = await evaluate(`Array.from(document.querySelectorAll('.sidebar .side-item[data-action="nav"]')).map((el) => el.textContent.trim())`);
  check('team management is last menu item', navLabels[navLabels.length - 1] === '团队管理', navLabels.join(' | '));
  check('project card member count = 7', (await evaluate(`document.querySelector('.project-card-footer')?.textContent.includes('7 名成员')`)) === true);
  await evaluate(`location.hash = '#/members'`);
  await waitDom(`document.querySelector('.page-title')?.textContent === '团队管理'`);
  await sleep(450);

  check('initial member rows = 5 per page', (await evaluate(`document.querySelectorAll('.card table')[0]?.querySelectorAll('tbody tr').length === 5 && document.querySelector('.card table tbody tr')?.textContent.includes('张明')`)) === true);
  check('member total KPI = 7', (await evaluate(`document.querySelector('.kpi-value')?.textContent`)) === '7');
  check('last login column removed', (await evaluate(`!document.querySelector('.card table thead')?.textContent.includes('最近登录')`)) === true);
  check('pagination shows 2 pages', (await evaluate(`document.querySelector('.pagination-info')?.textContent.includes('第 1 / 2 页') && document.querySelectorAll('.page-btn[data-page]').length === 4`)) === true);
  check('owner row is locked', (await evaluate(`(() => { const row = Array.from(document.querySelectorAll('.card table tbody tr')).find((tr) => tr.textContent.includes('张明')); return !!row && row.textContent.includes('项目负责人') && !row.querySelector('[data-action="member-role"]') && !row.querySelector('[data-action="remove-member"]'); })()`)) === true);
  check('four role selects on first page', (await evaluate(`document.querySelectorAll('[data-action="member-role"]').length`)) === 4);
  check('role matrix rendered', (await evaluate(`document.querySelector('.role-matrix')?.textContent.includes('审批发布')`)) === true);
  check('recent changes starts empty', (await evaluate(`Array.from(document.querySelectorAll('.card')).some((el) => el.textContent.includes('最近成员变更') && el.textContent.includes('暂无成员变更'))`)) === true);

  const dims1 = await evaluate(`(() => { const el = document.querySelector('.member-table'); return { client: el.clientHeight, scroll: el.scrollHeight }; })()`);
  check('member table fixed height with 5 rows', dims1.client === 338 && dims1.scroll <= dims1.client + 1, JSON.stringify(dims1));

  await evaluate(`document.querySelector('.page-btn[data-page="2"]').click()`);
  await waitDom(`document.querySelector('.pagination-info')?.textContent.includes('第 2 / 2 页')`);
  check('second page shows remaining members', (await evaluate(`document.querySelectorAll('.card table')[0].querySelectorAll('tbody tr').length === 2 && Array.from(document.querySelectorAll('.card table')[0].querySelectorAll('tbody tr')).some((tr) => tr.textContent.includes('陈晨')) && Array.from(document.querySelectorAll('.card table')[0].querySelectorAll('tbody tr')).some((tr) => tr.textContent.includes('李娜'))`)) === true);
  const dims2 = await evaluate(`(() => { const el = document.querySelector('.member-table'); return { client: el.clientHeight, scroll: el.scrollHeight }; })()`);
  check('table height stays fixed on page 2', dims2.client === 338 && dims2.client === dims1.client, JSON.stringify(dims2));
  await evaluate(`document.querySelector('.page-btn[data-page="1"]').click()`);
  await waitDom(`document.querySelector('.pagination-info')?.textContent.includes('第 1 / 2 页')`);

  await evaluate(`document.querySelector('[data-action="add-member"]').click()`);
  await waitDom(`!!document.querySelector('#member-form')`);
  check('add member modal opens', true);
  await sleep(400);
  const optionValues = await evaluate(`Array.from(document.querySelectorAll('#member-user option')).map((option) => option.value)`);
  check('eligible options exclude existing members and admins', !optionValues.includes('u-1') && !optionValues.includes('u-2') && !optionValues.includes('u-4') && !optionValues.includes('u-6') && optionValues.includes('u-5'), optionValues.join(','));
  await send('Page.captureScreenshot', { format: 'png' }).then((shot) => writeFileSync('d:/Code/AI/ai-devops/.tmp-e2e/member-add-modal.png', Buffer.from(shot.data, 'base64')));

  await evaluate(`(() => { const form = document.querySelector('#member-form'); form.elements.userId.value = 'u-5'; form.elements.role.value = 'Auditor'; form.requestSubmit(); return true; })()`);
  await waitDom(`Array.from(document.querySelectorAll('.card table')[0].querySelectorAll('tbody tr')).some((tr) => tr.textContent.includes('赵敏'))`);
  check('member added', (await evaluate(`Array.from(document.querySelectorAll('.card table')[0].querySelectorAll('tbody tr')).some((tr) => tr.textContent.includes('赵敏') && tr.textContent.includes('Auditor'))`)) === true);
  check('member total KPI = 8', (await evaluate(`document.querySelector('.kpi-value')?.textContent`)) === '8');
  check('add change recorded', (await evaluate(`document.body.innerText.includes('添加项目成员') && document.body.innerText.includes('最近成员变更')`)) === true);

  await evaluate(`document.querySelector('#toasts').innerHTML = ''`);
  await sleep(400);
  await send('Page.captureScreenshot', { format: 'png' }).then((shot) => writeFileSync('d:/Code/AI/ai-devops/.tmp-e2e/members-page.png', Buffer.from(shot.data, 'base64')));

  await evaluate(`(() => { const select = document.querySelector('[data-action="member-role"][data-id="u-5"]'); select.value = 'Viewer'; select.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  await waitDom(`document.querySelector('[data-action="member-role"][data-id="u-5"]')?.value === 'Viewer'`);
  check('role change applied', (await evaluate(`document.querySelector('[data-action="member-role"][data-id="u-5"]')?.value`)) === 'Viewer');
  check('role change recorded', (await evaluate(`document.body.innerText.includes('调整成员角色')`)) === true);

  await evaluate(`document.querySelector('[data-action="remove-member"][data-id="u-5"]').click()`);
  await waitDom(`!!document.querySelector('[data-action="confirm-remove-member"]')`);
  check('remove confirmation opens', true);
  await evaluate(`document.querySelector('[data-action="confirm-remove-member"]').click()`);
  await waitDom(`!Array.from(document.querySelectorAll('.card table')[0].querySelectorAll('tbody tr')).some((tr) => tr.textContent.includes('赵敏'))`);
  check('member removed', (await evaluate(`!Array.from(document.querySelectorAll('.card table')[0].querySelectorAll('tbody tr')).some((tr) => tr.textContent.includes('赵敏'))`)) === true);
  check('remove change recorded', (await evaluate(`document.body.innerText.includes('移除项目成员')`)) === true);

  await evaluate(`document.querySelector('[data-action="project-switch"]').click()`);
  await waitDom(`!!document.querySelector('.project-option[data-id="p-customer"]')`);
  await evaluate(`document.querySelector('.project-option[data-id="p-customer"]').click()`);
  await waitDom(`document.querySelector('.sidebar .project-meta b')?.textContent === '客户运营'`);
  await waitDom(`document.querySelector('.page-title')?.textContent === '团队管理'`);
  await sleep(350);
  check('members are project-scoped', (await evaluate(`document.querySelectorAll('.card table')[0].querySelectorAll('tbody tr').length === 2 && Array.from(document.querySelectorAll('.card table')[0].querySelectorAll('tbody tr')).some((tr) => tr.textContent.includes('李娜')) && Array.from(document.querySelectorAll('.card table')[0].querySelectorAll('tbody tr')).some((tr) => tr.textContent.includes('赵敏'))`)) === true);
  check('customer project owner locked', (await evaluate(`(() => { const row = Array.from(document.querySelectorAll('.card table')[0].querySelectorAll('tbody tr')).find((tr) => tr.textContent.includes('李娜')); return !!row && row.textContent.includes('项目负责人'); })()`)) === true);

  await evaluate(`location.hash = '#/projects'`);
  await waitDom(`document.querySelectorAll('.project-card').length === 3`);
  await evaluate(`document.querySelector('.page-actions [data-action="new-project"]').click()`);
  await waitDom(`!!document.querySelector('#project-form')`);
  await evaluate(`(() => { const form = document.querySelector('#project-form'); form.elements.name.value = '成员验证项目'; form.elements.code.value = 'MEMBERLAB'; form.elements.desc.value = '成员自动初始化验证'; form.requestSubmit(); return true; })()`);
  await waitDom(`document.querySelectorAll('.project-card').length === 4`);
  await evaluate(`location.hash = '#/members'`);
  await waitDom(`document.querySelector('.page-title')?.textContent === '团队管理'`);
  await sleep(300);
  check('new project initializes owner membership', (await evaluate(`document.querySelectorAll('.card table')[0].querySelectorAll('tbody tr').length === 1 && Array.from(document.querySelectorAll('.card table')[0].querySelectorAll('tbody tr')).some((tr) => tr.textContent.includes('张明') && tr.textContent.includes('项目负责人'))`)) === true);
  check('new project member total = 1', (await evaluate(`document.querySelector('.kpi-value')?.textContent`)) === '1');
  check('no console errors', errors.length === 0, errors.join(' | '));
} catch (error) {
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
