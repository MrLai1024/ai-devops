import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9397;
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
  'http://localhost:8787/#/requirements'
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
const defectIds = () => evaluate(`Array.from(document.querySelectorAll('.defect-table tbody tr[data-id]')).map((tr) => tr.dataset.id)`);
const setInput = async (id, value) => {
  await evaluate(`(() => { const el = document.getElementById('${id}'); el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  await sleep(250);
};
const setSelect = async (id, value) => {
  await evaluate(`(() => { const el = document.getElementById('${id}'); el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  await sleep(250);
};

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
  await waitDom(`document.querySelectorAll('.req-table tbody tr[data-id]').length === 10`);

  const sidebarLabels = await evaluate(`Array.from(document.querySelectorAll('.sidebar .side-item[data-action="nav"]')).map((el) => el.textContent.trim())`);
  check('agent tasks sidebar sits after requirements', sidebarLabels[0].startsWith('需求管理') && sidebarLabels[1] === 'Agent 任务' && sidebarLabels.includes('代码仓'), sidebarLabels.join(' | '));

  const tabLabels = await evaluate(`Array.from(document.querySelectorAll('.req-page > .tabs .tab')).map((el) => el.textContent.trim())`);
  check('requirements tabs are list, defects and release', tabLabels.length === 3 && tabLabels[0].startsWith('需求列表') && tabLabels[1].startsWith('缺陷单') && tabLabels[2] === '发布管理' && !tabLabels.some((label) => label.includes('任务看板')), tabLabels.join(' | '));

  await evaluate(`document.querySelector('[data-action="req-tab"][data-tab="defects"]').click()`);
  await waitDom(`!!document.querySelector('.defect-table') && document.querySelectorAll('.defect-table tbody tr[data-id]').length === 5`);
  check('defect tab lists current iteration defects', (await defectIds()).join(',') === 'BUG-201,BUG-202,BUG-203,BUG-204,BUG-205', (await defectIds()).join(','));
  const defectHeaders = await evaluate(`Array.from(document.querySelectorAll('.defect-table thead tr:first-child th')).map((th) => th.textContent.trim())`);
  check('defect table shows triage fields', ['缺陷编号', '缺陷标题', '严重程度', '状态', '优先级', '责任人', '关联需求', '更新'].every((label) => defectHeaders.includes(label)), defectHeaders.join(' | '));
  const firstDefect = await evaluate(`document.querySelector('.defect-table tbody tr[data-id="BUG-201"]')?.innerText || ''`);
  check('defect row shows severity, owner and linked requirement', firstDefect.includes('严重') && firstDefect.includes('处理中') && firstDefect.includes('陈晨') && firstDefect.includes('RQ-104') && firstDefect.includes('订单导出性能优化'), firstDefect.replace(/\n/g, ' / '));
  await sleep(250);
  await send('Page.captureScreenshot', { format: 'png' }).then((shot) => writeFileSync('d:/Code/AI/ai-devops/.tmp-e2e/defect-list.png', Buffer.from(shot.data, 'base64')));

  await setSelect('defect-severity-filter', '严重');
  check('defect severity filter works', (await defectIds()).join(',') === 'BUG-201,BUG-204', (await defectIds()).join(','));
  await setSelect('defect-severity-filter', 'all');
  await setSelect('defect-status-filter', '待处理');
  check('defect status filter works', (await defectIds()).join(',') === 'BUG-204,BUG-205', (await defectIds()).join(','));
  await setSelect('defect-status-filter', 'all');
  await setSelect('defect-req-filter', 'RQ-104');
  check('defect requirement filter works', (await defectIds()).join(',') === 'BUG-201', (await defectIds()).join(','));
  await setSelect('defect-req-filter', 'all');
  await setInput('defect-title-filter', '导出');
  check('defect keyword filter matches title', (await defectIds()).join(',') === 'BUG-201', (await defectIds()).join(','));
  await evaluate(`document.querySelector('[data-action="reset-defect-filters"]').click()`);
  await waitDom(`document.querySelectorAll('.defect-table tbody tr[data-id]').length === 5`);

  await evaluate(`document.querySelector('.defect-table tbody tr[data-id="BUG-201"]').click()`);
  await waitDom(`!!document.querySelector('.overlay.open #defect-edit-form')`);
  const detail = await evaluate(`(() => { const root = document.querySelector('.overlay.open .drawer'); return { title: root.querySelector('#defect-edit-title')?.value, severity: root.querySelector('#defect-edit-severity')?.value, status: root.querySelector('#defect-edit-status')?.value, owner: root.querySelector('#defect-edit-owner')?.value, requirement: root.querySelector('#defect-edit-requirement')?.value, reporter: root.innerText.includes('李娜'), task: root.innerText.includes('T-207') }; })()`);
  check('defect detail exposes triage fields and linked task', detail.title === '订单导出大批量数据时接口超时' && detail.severity === '严重' && detail.status === '处理中' && detail.owner === '陈晨' && detail.requirement === 'RQ-104' && detail.reporter && detail.task, JSON.stringify(detail));
  await sleep(250);
  await send('Page.captureScreenshot', { format: 'png' }).then((shot) => writeFileSync('d:/Code/AI/ai-devops/.tmp-e2e/defect-detail.png', Buffer.from(shot.data, 'base64')));

  await evaluate(`(() => { document.querySelector('#defect-edit-status').value = '待验证'; document.querySelector('#defect-edit-owner').value = '张明'; document.querySelector('#defect-edit-form').requestSubmit(); return true; })()`);
  await waitDom(`document.querySelector('.overlay.open #defect-edit-status')?.value === '待验证'`);
  const savedDetail = await evaluate(`(() => { const root = document.querySelector('.overlay.open .drawer'); return { status: root.querySelector('#defect-edit-status')?.value, owner: root.querySelector('#defect-edit-owner')?.value, toast: document.body.innerText.includes('缺陷已更新') }; })()`);
  check('defect detail saves status and owner', savedDetail.status === '待验证' && savedDetail.owner === '张明' && savedDetail.toast, JSON.stringify(savedDetail));
  await evaluate(`document.querySelector('.overlay.open [data-action="close-overlay"]').click()`);
  await waitDom(`document.querySelector('.defect-table tbody tr[data-id="BUG-201"]')?.innerText.includes('待验证')`);
  check('saved defect changes are reflected in the list', (await evaluate(`document.querySelector('.defect-table tbody tr[data-id="BUG-201"]')?.innerText.includes('张明')`)) === true);

  await evaluate(`document.querySelector('.defect-table tbody tr[data-id="BUG-204"]').click()`);
  await waitDom(`!!document.querySelector('.overlay.open [data-action="assign-defect-agent"]')`);
  await evaluate(`document.querySelector('.overlay.open [data-action="assign-defect-agent"]').click()`);
  await waitDom(`!!document.querySelector('.overlay.open [data-action="view-defect-task"]')`);
  const assigned = await evaluate(`(() => { const root = document.querySelector('.overlay.open .drawer'); return { status: root.querySelector('#defect-edit-status')?.value, text: root.innerText.includes('缺陷修复 · 异常单自动分派命中离职人员'), toast: document.body.innerText.includes('已创建') }; })()`);
  check('assigning a defect creates an agent repair task', assigned.status === '处理中' && assigned.text && assigned.toast, JSON.stringify(assigned));
  await evaluate(`document.querySelector('.overlay.open [data-action="close-overlay"]').click()`);
  await sleep(200);

  await evaluate(`document.querySelector('.defect-table tbody tr[data-id="BUG-203"]').click()`);
  await waitDom(`document.querySelector('.overlay.open #defect-edit-status')?.value === '待验证'`);
  await evaluate(`document.querySelector('.overlay.open [data-action="assign-defect-agent"]').click()`);
  await waitDom(`document.querySelector('.overlay.open #defect-edit-status')?.value === '处理中'`);
  check('assigning a pending-verification defect reopens it', (await evaluate(`!!document.querySelector('.overlay.open [data-action="view-defect-task"]')`)) === true);
  await evaluate(`document.querySelector('.overlay.open [data-action="close-overlay"]').click()`);
  await sleep(200);

  await evaluate(`document.querySelector('[data-action="new-defect"]').click()`);
  await waitDom(`!!document.querySelector('#defect-form')`);
  await evaluate(`(() => { const form = document.querySelector('#defect-form'); form.elements.title.value = '测试缺陷 · 移动端筛选失效'; form.elements.severity.value = '轻微'; form.elements.priority.value = 'P3'; form.elements.owner.value = '张明'; form.elements.requirementId.value = 'RQ-101'; form.elements.desc.value = '移动端切换筛选条件后列表未刷新，需要手动返回。'; form.requestSubmit(); return true; })()`);
  await waitDom(`document.querySelectorAll('.defect-table tbody tr[data-id]').length === 6`);
  const createdRow = await evaluate(`(() => { const row = Array.from(document.querySelectorAll('.defect-table tbody tr[data-id]')).find((tr) => tr.innerText.includes('测试缺陷 · 移动端筛选失效')); return row ? { id: row.dataset.id, text: row.innerText } : null; })()`);
  check('new defect appears in the defect list', !!createdRow && createdRow.id.startsWith('BUG-') && createdRow.text.includes('轻微') && createdRow.text.includes('张明') && createdRow.text.includes('RQ-101'), JSON.stringify(createdRow));
  const defectTabCount = await evaluate(`document.querySelector('[data-action="req-tab"][data-tab="defects"] .tab-count')?.textContent.trim()`);
  check('defect tab count updates after creation', defectTabCount === '6', String(defectTabCount));
  await evaluate(`(() => { const row = Array.from(document.querySelectorAll('.defect-table tbody tr[data-id]')).find((tr) => tr.innerText.includes('测试缺陷 · 移动端筛选失效')); row.click(); return true; })()`);
  await waitDom(`document.querySelector('.overlay.open #defect-edit-title')?.value === '测试缺陷 · 移动端筛选失效'`);
  check('new defect keeps its requirement and description', (await evaluate(`(() => { const root = document.querySelector('.overlay.open .drawer'); return root.querySelector('#defect-edit-requirement')?.value === 'RQ-101' && root.querySelector('#defect-edit-desc')?.value.includes('移动端切换筛选条件'); })()`)) === true);
  await evaluate(`document.querySelector('.overlay.open [data-action="close-overlay"]').click()`);
  await sleep(200);

  await evaluate(`document.querySelector('[data-action="project-switch"]').click()`);
  await waitDom(`!!document.querySelector('.project-option[data-id="p-support"]')`);
  await evaluate(`document.querySelector('.project-option[data-id="p-support"]').click()`);
  await waitDom(`document.querySelector('.sidebar .project-meta b')?.textContent === '智能客服' && !!document.querySelector('.req-table')`);
  check('project switch resets to requirement list', (await evaluate(`document.querySelector('.req-page > .tabs .tab.active')?.textContent.includes('需求列表')`)) === true);
  await evaluate(`document.querySelector('[data-action="req-tab"][data-tab="defects"]').click()`);
  await waitDom(`!!document.querySelector('.defect-table') && document.querySelectorAll('.defect-table tbody tr[data-id]').length === 1`);
  check('defect tab is project scoped', (await defectIds()).join(',') === 'BUG-207', (await defectIds()).join(','));
  await evaluate(`document.querySelector('[data-action="project-switch"]').click()`);
  await waitDom(`!!document.querySelector('.project-option[data-id="p-order"]')`);
  await evaluate(`document.querySelector('.project-option[data-id="p-order"]').click()`);
  await waitDom(`document.querySelector('.sidebar .project-meta b')?.textContent === '订单中心' && !!document.querySelector('.req-table')`);

  await evaluate(`document.querySelector('.sidebar [data-action="nav"][data-route="#/agents"]').click()`);
  await waitDom(`location.hash === '#/agents' && !!document.querySelector('.task-kanban')`);
  check('agent tasks sidebar opens the task board', (await evaluate(`document.querySelector('.page-title')?.textContent.trim() === 'Agent 任务' && document.querySelector('.sidebar .side-item.active')?.textContent.includes('Agent 任务') && document.querySelectorAll('.task-kanban .kanban-col').length === 5`)) === true);
  const boardHeads = await evaluate(`Array.from(document.querySelectorAll('.task-kanban .kanban-head b')).map((el) => el.textContent.trim())`);
  check('task board columns keep execution stages', JSON.stringify(boardHeads) === JSON.stringify(['排队中', '运行中', '待确认', '已完成', '失败']), boardHeads.join(','));
  check('defect repair task appears on the board', (await evaluate(`Array.from(document.querySelectorAll('.task-card')).some((el) => el.innerText.includes('缺陷修复 · 异常单自动分派命中离职人员'))`)) === true);
  await evaluate(`document.querySelector('[data-action="open-task-page"][data-id="T-207"]').click()`);
  await waitDom(`location.hash === '#/tasks/T-207' && !!document.querySelector('.task-page-title')`);
  check('task detail from the board keeps agent sidebar context', (await evaluate(`document.querySelector('.sidebar .side-item.active')?.textContent.includes('Agent 任务') && !document.querySelector('.req-page .tabs')`)) === true);
  await evaluate(`document.querySelector('[data-action="back-task"]').click()`);
  await waitDom(`location.hash === '#/agents' && !!document.querySelector('.task-kanban')`);
  check('task detail back returns to the agent task board', (await evaluate(`document.querySelector('.sidebar .side-item.active')?.textContent.includes('Agent 任务')`)) === true);

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
