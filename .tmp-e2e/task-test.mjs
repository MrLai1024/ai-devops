import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9388;
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
  await waitDom(`document.querySelector('.page-title, .tabs') && document.querySelector('.tabs')`);

  await evaluate(`document.querySelector('[data-action="req-tab"][data-tab="board"]').click()`);
  await waitDom(`!!document.querySelector('.task-kanban')`);
  const boardHeads = await evaluate(`Array.from(document.querySelectorAll('.task-kanban .kanban-head b')).map((el) => el.textContent.trim())`);
  check('task board columns are by status', JSON.stringify(boardHeads) === JSON.stringify(['排队中', '运行中', '待确认', '已完成', '失败']), boardHeads.join(','));
  check('task board has task cards', (await evaluate(`document.querySelectorAll('[data-action="open-task-page"]').length`)) >= 5);
  await sleep(250);
  await send('Page.captureScreenshot', { format: 'png' }).then((shot) => writeFileSync('d:/Code/AI/ai-devops/.tmp-e2e/task-board.png', Buffer.from(shot.data, 'base64')));

  await evaluate(`document.querySelector('[data-action="open-task-page"][data-id="T-207"]').click()`);
  await waitDom(`!!document.querySelector('#main.main-task .task-page-title')`);
  check('task card switches to detail view, not overlay', (await evaluate(`location.hash === '#/tasks/T-207' && !!document.querySelector('#main.main-task') && !document.querySelector('.overlay.open')`)) === true);
  check('project shell stays visible on task detail', (await evaluate(`(() => { const shell = document.querySelector('#shell'); const sidebar = document.querySelector('#sidebar'); const main = document.querySelector('#main'); return !shell.classList.contains('no-sidebar') && !!sidebar && getComputedStyle(sidebar).display !== 'none' && sidebar.getBoundingClientRect().width > 0 && main.getBoundingClientRect().width < window.innerWidth; })()`)) === true);
  check('task detail renders inside requirements board tab', (await evaluate(`(() => { const activeTab = document.querySelector('.req-page .tabs .tab.active'); const nav = document.querySelector('.sidebar .side-item.active'); return !!activeTab && activeTab.textContent.includes('任务看板') && !!document.querySelector('.req-page .task-page') && !!nav && nav.textContent.includes('需求管理'); })()`)) === true);
  check('task header shows task info', (await evaluate(`document.querySelector('.task-page-title')?.textContent.includes('缺陷修复 · 订单导出超时') && document.querySelector('.task-page-badges')?.textContent.includes('缺陷修复') && document.querySelector('.task-page-badges')?.textContent.includes('运行中')`)) === true);
  check('workspace file tree rendered', (await evaluate(`document.querySelectorAll('.task-file-row').length`)) === 3);
  const initialEvents = await evaluate(`document.querySelectorAll('#task-agent-events > .task-event').length`);
  await sleep(5200);
  const streamedEvents = await evaluate(`document.querySelectorAll('#task-agent-events > .task-event').length`);
  check('execution stream adds events over time', streamedEvents > initialEvents && streamedEvents >= 7, `${initialEvents} -> ${streamedEvents}`);
  const streamText = await evaluate(`document.querySelector('#task-agent-events')?.innerText || ''`);
  check('stream shows thinking, tool and file events', streamText.includes('思考过程') && streamText.includes('search_code') && streamText.includes('文件变更'));

  const firstFile = await evaluate(`document.querySelector('.task-file-row')?.dataset.path || ''`);
  check('file tree contains changed files', firstFile.includes('internal/export'));

  await evaluate(`document.querySelector('.task-file-row').click()`);
  await waitDom(`document.querySelector('.overlay.open .diff')`);
  check('file diff opens in overlay', (await evaluate(`document.querySelector('.overlay.open .diff')?.innerText.includes('internal/export/worker.go')`)) === true);
  await evaluate(`document.querySelector('[data-action="close-overlay"]').click()`);
  await sleep(250);

  await evaluate(`(() => { const input = document.querySelector('#task-chat-input'); input.value = '请补充说明这次修改的测试范围'; document.querySelector('[data-action="send-task-message"]').click(); return true; })()`);
  await waitDom(`document.querySelector('#task-chat-events')?.innerText.includes('请补充说明这次修改的测试范围')`);
  check('chat message enters stream', (await evaluate(`document.querySelector('.task-chat-typing')?.textContent.includes('正在输入')`)) === true);
  await sleep(1300);
  check('agent replies to chat', (await evaluate(`document.querySelector('#task-chat-events')?.innerText.includes('我会补充运行')`)) === true);

  await send('Page.captureScreenshot', { format: 'png' }).then((shot) => writeFileSync('d:/Code/AI/ai-devops/.tmp-e2e/task-detail.png', Buffer.from(shot.data, 'base64')));

  await evaluate(`document.querySelector('[data-action="interrupt-task-page"]').click()`);
  await waitDom(`document.querySelector('.task-page-badges .pill')?.textContent.trim() === '已中止'`);
  check('interrupt stops task and keeps record', (await evaluate(`document.querySelector('#task-agent-events')?.innerText.includes('用户中断任务') && !!document.querySelector('[data-action="rerun-task-page"]')`)) === true);
  check('stop button removed after interrupt', (await evaluate(`!document.querySelector('[data-action="interrupt-task-page"]')`)) === true);

  await evaluate(`document.querySelector('[data-action="rerun-task-page"]').click()`);
  await waitDom(`document.querySelector('.task-page-badges .pill')?.textContent.trim() === '运行中'`);
  await sleep(2300);
  await waitDom(`document.querySelector('.task-page-badges .pill')?.textContent.trim() === '待确认'`);
  check('rerun completes and waits for confirmation', (await evaluate(`!!document.querySelector('[data-action="approve-task"]') && !!document.querySelector('[data-action="reject-task"]')`)) === true);
  await send('Page.captureScreenshot', { format: 'png' }).then((shot) => writeFileSync('d:/Code/AI/ai-devops/.tmp-e2e/task-detail-actions.png', Buffer.from(shot.data, 'base64')));

  await evaluate(`document.querySelector('[data-action="approve-task"]').click()`);
  await waitDom(`document.querySelector('.task-page-badges .pill')?.textContent.trim() === '成功'`);
  check('approve completes task', true);

  await evaluate(`document.querySelector('[data-action="back-task"]').click()`);
  await waitDom(`location.hash === '#/requirements' && !!document.querySelector('.task-kanban')`);
  check('back button returns to task board', (await evaluate(`document.querySelector('.sidebar') && !document.querySelector('#shell').classList.contains('no-sidebar')`)) === true);

  await evaluate(`location.hash = '#/agents'`);
  await waitDom(`!!document.querySelector('[data-action="open-task-page"][data-id="T-203"]')`);
  await evaluate(`document.querySelector('[data-action="open-task-page"][data-id="T-203"]').click()`);
  await waitDom(`location.hash === '#/tasks/T-203' && !!document.querySelector('.task-page-title')`);
  const beforeApprove = await evaluate(`document.querySelector('.task-page-badges')?.innerText || ''`);
  check('agent list opens same task page', beforeApprove.includes('待审批'));
  check('agent task detail keeps agent nav context', (await evaluate(`(() => { const nav = document.querySelector('.sidebar .side-item.active'); return !!nav && nav.textContent.includes('Agent 任务') && !document.querySelector('.req-page .tabs'); })()`)) === true);
  await sleep(400);
  const viewportDims = await evaluate(`({ html: document.documentElement.scrollHeight, body: document.body.scrollHeight, vh: innerHeight, main: Math.round(document.querySelector('#main').getBoundingClientRect().height) })`);
  check('task detail fits viewport without page scroll', viewportDims.html <= viewportDims.vh + 1 && viewportDims.body <= viewportDims.vh + 1, JSON.stringify(viewportDims));
  await send('Page.captureScreenshot', { format: 'png' }).then((shot) => writeFileSync('d:/Code/AI/ai-devops/.tmp-e2e/task-detail-agents.png', Buffer.from(shot.data, 'base64')));
  await evaluate(`document.querySelector('[data-action="back-task"]').click()`);
  await waitDom(`location.hash === '#/agents'`);
  check('back from agent list returns to list', (await evaluate(`!!document.querySelector('[data-action="open-task-page"][data-id="T-203"]')`)) === true);

  await evaluate(`location.hash = '#/requirements'`);
  await waitDom(`!!document.querySelector('.task-kanban')`);
  await evaluate(`document.querySelector('[data-action="open-task-page"][data-id="T-203"]').click()`);
  await waitDom(`!!document.querySelector('.req-page .task-page-title')`);
  await evaluate(`document.querySelector('.req-page [data-action="req-tab"][data-tab="list"]').click()`);
  await waitDom(`location.hash === '#/requirements' && !!document.querySelector('.req-table')`);
  check('switching requirements tab exits task detail', true);

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
