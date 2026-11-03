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

  await evaluate(`(() => { const input = document.querySelector('#doc-search'); input.value = 'exception'; input.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  await waitDom(`document.querySelectorAll('#main tbody tr[data-id]').length === 1 && document.querySelector('#main tbody tr[data-id]')?.dataset.id === 'doc-1'`);
  check('doc search filters content-only tokens case-insensitively', true);

  await evaluate(`(() => { const input = document.querySelector('#doc-search'); input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true })); const select = document.querySelector('#doc-type-filter'); select.value = '运行手册'; select.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  await waitDom(`document.querySelectorAll('#main tbody tr[data-id]').length === 1 && document.querySelector('#main tbody tr[data-id]')?.dataset.id === 'doc-2'`);
  check('doc type filter works', true);

  await evaluate(`(() => { const type = document.querySelector('#doc-type-filter'); type.value = 'all'; type.dispatchEvent(new Event('change', { bubbles: true })); const req = document.querySelector('#doc-req-filter'); req.value = 'RQ-101'; req.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  await waitDom(`document.querySelectorAll('#main tbody tr[data-id]').length === 2`);
  check('doc requirement filter works', true);

  await evaluate(`document.querySelector('[data-action="project-switch"]').click()`);
  await waitDom(`!!document.querySelector('.project-option[data-id="p-customer"]')`);
  await evaluate(`document.querySelector('.project-option[data-id="p-customer"]').click()`);
  await waitDom(`document.querySelectorAll('#main tbody tr[data-id]').length === 2`);
  const switchedProject = await evaluate(`(() => ({ value: document.querySelector('#doc-req-filter')?.value, titles: Array.from(document.querySelectorAll('#main tbody tr[data-id]')).map((tr) => tr.querySelector('.cell-main b')?.textContent.trim()) }))()`);
  check('project switch clears stale knowledge filters', switchedProject.value === 'all' && switchedProject.titles.includes('客户分层运营 SOP') && switchedProject.titles.includes('客户分层看板测试方案'), JSON.stringify(switchedProject));

  await evaluate(`document.querySelector('[data-action="project-switch"]').click()`);
  await waitDom(`!!document.querySelector('.project-option[data-id="p-order"]')`);
  await evaluate(`document.querySelector('.project-option[data-id="p-order"]').click()`);
  await waitDom(`document.querySelectorAll('#main tbody tr[data-id]').length === 3`);

  await evaluate(`(() => { const type = document.querySelector('#doc-type-filter'); type.value = '测试方案'; type.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  await waitDom(`document.querySelector('#main tbody')?.innerText.includes('当前筛选下没有文档')`);
  check('filtered empty state explains active filters', (await evaluate(`document.querySelectorAll('#main tbody tr[data-id]').length === 0`)) === true);
  await evaluate(`(() => { const type = document.querySelector('#doc-type-filter'); type.value = 'all'; type.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  await waitDom(`document.querySelectorAll('#main tbody tr[data-id]').length === 3`);

  await evaluate(`document.querySelector('#doc-search').focus()`);
  await send('Input.imeSetComposition', { text: 'zhuangtai', selectionStart: 9, selectionEnd: 9 });
  const compositionValue = await evaluate(`document.querySelector('#doc-search').value`);
  const tabRect = await evaluate(`(() => { const el = document.querySelector('[data-action="knowledge-tab"][data-tab="global"]'); const rect = el.getBoundingClientRect(); return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; })()`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: tabRect.x, y: tabRect.y });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: tabRect.x, y: tabRect.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: tabRect.x, y: tabRect.y, button: 'left', clickCount: 1 });
  await waitDom(`document.querySelector('[data-action="knowledge-tab"][data-tab="global"]')?.classList.contains('active') && document.querySelectorAll('#main tbody tr[data-id]').length === 2`);
  const imeClick = await evaluate(`({ search: document.querySelector('#doc-search')?.value, activeTab: document.querySelector('.knowledge-page .tab.active')?.textContent.trim() })`);
  check('IME composition click switches tab without being swallowed', imeClick.activeTab.includes('平台总库') && imeClick.search === '', JSON.stringify({ compositionValue, ...imeClick }));

  const globalRows = await evaluate(`Array.from(document.querySelectorAll('#main tbody tr[data-id]')).map((tr) => ({ id: tr.dataset.id, text: tr.innerText }))`);
  check('global tab lists published docs from all projects', globalRows.some((row) => row.id === 'doc-4' && row.text.includes('智能客服')) && globalRows.some((row) => row.id === 'doc-5' && row.text.includes('订单中心')), JSON.stringify(globalRows));

  await evaluate(`(() => { const input = document.querySelector('#doc-search'); input.value = 'zzz'; input.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  await waitDom(`document.querySelector('#main tbody')?.innerText.includes('当前筛选下没有公开文档')`);
  check('global filtered empty state explains active filters', (await evaluate(`document.querySelectorAll('#main tbody tr[data-id]').length === 0`)) === true);
  await evaluate(`(() => { const input = document.querySelector('#doc-search'); input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  await waitDom(`document.querySelectorAll('#main tbody tr[data-id]').length === 2`);

  await evaluate(`(() => { const select = document.querySelector('#doc-source-filter'); select.value = 'p-support'; select.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  await waitDom(`document.querySelectorAll('#main tbody tr[data-id]').length === 1 && document.querySelector('#main tbody tr[data-id]')?.dataset.id === 'doc-4'`);
  check('global source filter works', true);

  await sleep(200);
  await send('Page.captureScreenshot', { format: 'png' }).then((shot) => writeFileSync('d:/Code/AI/ai-devops/.tmp-e2e/doc-list.png', Buffer.from(shot.data, 'base64')));

  await evaluate(`document.querySelector('[data-action="knowledge-tab"][data-tab="project"]').click()`);
  await waitDom(`document.querySelectorAll('#main tbody tr[data-id]').length === 3`);
  await evaluate(`document.querySelector('#main tbody tr[data-id="doc-1"]').click()`);
  await waitDom(`location.hash === '#/knowledge/doc-1' && !!document.querySelector('.doc-page')`);
  check('doc row opens preview page', (await evaluate(`document.querySelector('.doc-title')?.textContent.trim() === '订单履约状态机说明'`)) === true);
  check('preview renders markdown', (await evaluate(`(() => { const content = document.querySelector('.doc-content'); return !!content && !!content.querySelector('h1') && !!content.querySelector('ul') && !!content.querySelector('pre code') && !!content.querySelector('table'); })()`)) === true);
  check('preview renders document body text', (await evaluate(`(() => { const text = document.querySelector('.doc-content')?.innerText || ''; return text.includes('CREATED') && text.includes('支付成功') && text.includes('EXCEPTION'); })()`)) === true);
  check('preview renders inline markdown and escapes html', (await evaluate(`(() => {
    const content = document.querySelector('.doc-content');
    if (!content) return false;
    const nested = content.querySelector('strong em');
    const link = content.querySelector('a');
    const inlineCode = Array.from(content.querySelectorAll('code')).some((code) => code.textContent === 'PAID');
    return !!content.querySelector('strong')?.textContent.includes('重点') &&
      Array.from(content.querySelectorAll('em')).some((em) => em.textContent === '斜体') &&
      !!content.querySelector('del') && content.querySelector('del').textContent === '旧流程已废弃' &&
      !!nested && nested.textContent === '斜体' &&
      !!link && link.getAttribute('href') === '#/knowledge/doc-2' &&
      content.innerHTML.includes('&lt;kbd&gt;') && !content.querySelector('kbd') &&
      inlineCode;
  })()`)) === true);
  check('preview shows metadata and linked requirement', (await evaluate(`(() => { const page = document.querySelector('.doc-page'); return page.innerText.includes('doc-1') && page.innerText.includes('张明') && page.innerText.includes('RQ-112') && page.innerText.includes('仅本项目'); })()`)) === true);
  await evaluate(`document.querySelector('[data-action="back-to-knowledge"]').click()`);
  await waitDom(`location.hash === '#/knowledge' && document.querySelectorAll('#main tbody tr[data-id]').length === 3`);
  check('preview back returns to project tab', true);

  await evaluate(`document.querySelector('[data-action="knowledge-tab"][data-tab="global"]').click()`);
  await waitDom(`document.querySelectorAll('#main tbody tr[data-id]').length === 2`);
  await evaluate(`document.querySelector('#main tbody tr[data-id="doc-4"]').click()`);
  await waitDom(`location.hash === '#/knowledge/global/doc-4' && !!document.querySelector('.doc-page')`);
  check('global preview is read-only for other projects', (await evaluate(`(() => { const page = document.querySelector('.doc-page'); return page.innerText.includes('智能客服') && page.innerText.includes('只读') && !page.querySelector('[data-action="edit-doc"]') && !page.querySelector('[data-action="toggle-doc-publish"]'); })()`)) === true);
  await evaluate(`document.querySelector('[data-action="back-to-knowledge"]').click()`);
  await waitDom(`location.hash === '#/knowledge' && document.querySelectorAll('#main tbody tr[data-id]').length === 2`);
  check('global preview back returns to global tab', true);

  await evaluate(`document.querySelector('#main tbody tr[data-id="doc-5"]').click()`);
  await waitDom(`location.hash === '#/knowledge/global/doc-5' && !!document.querySelector('.doc-page')`);
  check('own published doc keeps edit action in global view', (await evaluate(`!!document.querySelector('[data-action="edit-doc"][data-id="doc-5"]')`)) === true);
  await evaluate(`location.hash = '#/knowledge/global/doc-1'`);
  await waitDom(`!!document.querySelector('.empty h2') && document.querySelector('.empty h2').innerText.includes('文档不存在')`);
  check('unpublished doc is not available in global library', true);
  await evaluate(`document.querySelector('[data-action="back-to-knowledge"]').click()`);
  await waitDom(`location.hash === '#/knowledge' && document.querySelector('[data-action="knowledge-tab"][data-tab="global"]')?.classList.contains('active') && document.querySelectorAll('#main tbody tr[data-id]').length === 2`);

  await evaluate(`location.hash = '#/knowledge/'`);
  await waitDom(`document.querySelector('.page-title')?.textContent.trim() === '知识库' && document.querySelectorAll('.knowledge-page .tab').length === 2`);
  check('knowledge trailing slash renders the list', (await evaluate(`document.querySelector('.sidebar .side-item.active')?.textContent.includes('知识库')`)) === true);

  await evaluate(`location.hash = '#/knowledge/%E0%A4%A'`);
  await waitDom(`document.querySelector('.empty h2')?.innerText.includes('文档不存在')`);
  check('malformed knowledge url renders not-found', true);

  await evaluate(`location.hash = '#/knowledge'`);
  await waitDom(`!!document.querySelector('.knowledge-page')`);
  if (await evaluate(`document.querySelector('[data-action="knowledge-tab"][data-tab="project"]')?.classList.contains('active') !== true`)) {
    await evaluate(`document.querySelector('[data-action="knowledge-tab"][data-tab="project"]').click()`);
  }
  await waitDom(`document.querySelectorAll('#main tbody tr[data-id]').length === 3`);
  await evaluate(`document.querySelector('#main tbody tr[data-id="doc-1"]').click()`);
  await waitDom(`!!document.querySelector('[data-action="edit-doc"]')`);
  await evaluate(`document.querySelector('[data-action="edit-doc"]').click()`);
  await waitDom(`location.hash === '#/knowledge/doc-1/edit' && !!document.querySelector('#doc-edit-form')`);
  check('edit page loads markdown source', (await evaluate(`document.querySelector('#doc-content-input')?.value.includes('# 订单履约状态机说明')`)) === true);
  check('edit page has live preview', (await evaluate(`!!document.querySelector('#doc-preview h1')`)) === true);
  await evaluate(`document.querySelector('[data-action="doc-format"][data-format="bold"]').click()`);
  await sleep(180);
  check('toolbar inserts markdown and updates preview', (await evaluate(`document.querySelector('#doc-content-input')?.value.includes('**加粗文本**') && document.querySelector('#doc-preview')?.innerHTML.includes('<strong>加粗文本</strong>')`)) === true);
  await evaluate(`(() => { const input = document.querySelector('#doc-content-input'); input.value = input.value + '\\n\\n## 新增章节\\n\\n编辑后的内容'; input.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  await sleep(180);
  check('typing updates live preview', (await evaluate(`!!document.querySelector('#doc-preview h2') && document.querySelector('#doc-preview').innerText.includes('新增章节')`)) === true);
  await evaluate(`(() => { const form = document.querySelector('#doc-edit-form'); form.elements.title.value = '订单履约状态机说明（已编辑）'; form.requestSubmit(); return true; })()`);
  await waitDom(`location.hash === '#/knowledge/doc-1' && document.querySelector('.doc-title')?.innerText.includes('已编辑')`);
  check('save persists title and content', (await evaluate(`document.querySelector('.doc-title')?.innerText.includes('已编辑') && document.querySelector('.doc-content')?.innerText.includes('新增章节')`)) === true);
  await waitDom(`document.querySelector('.doc-page')?.innerText.includes('已索引')`, 5000);
  check('save completes reindex', true);
  await evaluate(`document.querySelector('[data-action="back-to-knowledge"]').click()`);
  await waitDom(`document.querySelectorAll('#main tbody tr[data-id]').length === 3`);
  check('list reflects edited title', (await evaluate(`document.querySelector('#main tbody tr[data-id="doc-1"]')?.innerText.includes('已编辑')`)) === true);

  await evaluate(`document.querySelector('#main tbody tr[data-id="doc-1"]').click()`);
  await waitDom(`!!document.querySelector('[data-action="edit-doc"]')`);
  await evaluate(`document.querySelector('[data-action="edit-doc"]').click()`);
  await waitDom(`!!document.querySelector('#doc-edit-form')`);
  await evaluate(`(() => { const input = document.querySelector('#doc-content-input'); input.value = input.value + '\\n\\n这段不会被保存'; input.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  await evaluate(`document.querySelector('[data-action="cancel-doc-edit"]').click()`);
  await waitDom(`!!document.querySelector('.overlay.open [data-action="confirm-doc-discard"]')`);
  check('cancel with changes asks for confirmation', true);
  await evaluate(`document.querySelector('.overlay.open [data-action="confirm-doc-discard"]').click()`);
  await waitDom(`location.hash === '#/knowledge/doc-1' && !!document.querySelector('.doc-page')`);
  check('discard returns to preview without saving', (await evaluate(`!document.querySelector('.doc-content')?.innerText.includes('这段不会被保存')`)) === true);

  await evaluate(`document.querySelector('[data-action="edit-doc"]').click()`);
  await waitDom(`location.hash === '#/knowledge/doc-1/edit' && !!document.querySelector('#doc-edit-form')`);

  await evaluate(`(() => { const input = document.querySelector('#doc-content-input'); input.value = 'first line\\nsecond line'; input.dispatchEvent(new Event('input', { bubbles: true })); input.focus(); input.setSelectionRange(3, 3); return true; })()`);
  await sleep(600);
  await evaluate(`document.querySelector('[data-action="doc-format"][data-format="h2"]').click()`);
  await sleep(150);
  check('heading format is line-aware from mid-line', (await evaluate(`document.querySelector('#doc-content-input')?.value === '## first line\\nsecond line'`)) === true);
  await evaluate(`document.querySelector('[data-action="doc-format"][data-format="undo"]').click()`);
  await sleep(120);
  check('undo restores previous markdown', (await evaluate(`document.querySelector('#doc-content-input')?.value === 'first line\\nsecond line'`)) === true);
  await evaluate(`document.querySelector('[data-action="doc-format"][data-format="redo"]').click()`);
  await sleep(120);
  check('redo restores formatted markdown', (await evaluate(`document.querySelector('#doc-content-input')?.value === '## first line\\nsecond line'`)) === true);
  await evaluate(`document.querySelector('#doc-content-input').focus()`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'z', code: 'KeyZ', windowsVirtualKeyCode: 90, nativeVirtualKeyCode: 90, modifiers: 2 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'z', code: 'KeyZ', windowsVirtualKeyCode: 90, nativeVirtualKeyCode: 90, modifiers: 2 });
  await sleep(120);
  check('ctrl+z uses the editor history', (await evaluate(`document.querySelector('#doc-content-input')?.value === 'first line\\nsecond line'`)) === true);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Z', code: 'KeyZ', windowsVirtualKeyCode: 90, nativeVirtualKeyCode: 90, modifiers: 10 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Z', code: 'KeyZ', windowsVirtualKeyCode: 90, nativeVirtualKeyCode: 90, modifiers: 10 });
  await sleep(120);
  check('ctrl+shift+z redoes the editor history', (await evaluate(`document.querySelector('#doc-content-input')?.value === '## first line\\nsecond line'`)) === true);

  await evaluate(`(() => { const input = document.querySelector('#doc-content-input'); input.value = 'alpha'; input.dispatchEvent(new Event('input', { bubbles: true })); input.focus(); input.setSelectionRange(5, 5); document.querySelector('[data-action="doc-format"][data-format="bold"]').click(); return true; })()`);
  await sleep(120);
  await evaluate(`document.querySelector('[data-action="doc-format"][data-format="undo"]').click()`);
  await sleep(120);
  check('toolbar changes get their own undo snapshot', (await evaluate(`document.querySelector('#doc-content-input')?.value === 'alpha'`)) === true);

  await evaluate(`(() => { const input = document.querySelector('#doc-content-input'); input.value = 'one\\ntwo\\nthree'; input.dispatchEvent(new Event('input', { bubbles: true })); input.focus(); input.setSelectionRange(0, input.value.length); return true; })()`);
  await sleep(120);
  await evaluate(`document.querySelector('[data-action="doc-format"][data-format="ul"]').click()`);
  await sleep(120);
  check('list format prefixes every selected line', (await evaluate(`document.querySelector('#doc-content-input')?.value === '- one\\n- two\\n- three'`)) === true);
  await evaluate(`document.querySelector('[data-action="doc-format"][data-format="ul"]').click()`);
  await sleep(120);
  check('list format toggles off when every line is a list', (await evaluate(`document.querySelector('#doc-content-input')?.value === 'one\\ntwo\\nthree'`)) === true);

  await evaluate(`(() => { const input = document.querySelector('#doc-content-input'); input.value = 'before\\n\\nafter'; input.dispatchEvent(new Event('input', { bubbles: true })); input.focus(); input.setSelectionRange(7, 7); return true; })()`);
  await sleep(120);
  await evaluate(`document.querySelector('[data-action="doc-format"][data-format="h1"]').click()`);
  await sleep(180);
  check('heading format fills a blank line', (await evaluate(`(() => { const value = document.querySelector('#doc-content-input')?.value || ''; return value === 'before\\n# 标题\\nafter' && document.querySelector('#doc-preview h1')?.textContent === '标题'; })()`)) === true);
  await evaluate(`(() => { const input = document.querySelector('#doc-content-input'); input.value = 'before\\n\\nafter'; input.dispatchEvent(new Event('input', { bubbles: true })); input.focus(); input.setSelectionRange(7, 7); return true; })()`);
  await sleep(120);
  await evaluate(`document.querySelector('[data-action="doc-format"][data-format="ul"]').click()`);
  await sleep(180);
  check('list format fills a blank line', (await evaluate(`(() => { const value = document.querySelector('#doc-content-input')?.value || ''; return value === 'before\\n- 列表项\\nafter' && document.querySelector('#doc-preview li')?.textContent === '列表项'; })()`)) === true);

  await evaluate(`(() => { const input = document.querySelector('#doc-content-input'); input.value = '前置文本'; input.dispatchEvent(new Event('input', { bubbles: true })); input.focus(); input.setSelectionRange(2, 2); return true; })()`);
  await sleep(120);
  await evaluate(`document.querySelector('[data-action="doc-format"][data-format="code"]').click()`);
  await sleep(180);
  const codeBlockState = await evaluate(`(() => { const value = document.querySelector('#doc-content-input')?.value || ''; return { value, pre: !!document.querySelector('#doc-preview pre code'), html: document.querySelector('#doc-preview')?.innerHTML.slice(0, 200) || '' }; })()`);
  check('code template inserts a block at mid-line', codeBlockState.value.startsWith('```') && codeBlockState.value.includes('```\n\n前置文本') && codeBlockState.pre, JSON.stringify(codeBlockState));
  await evaluate(`(() => { const input = document.querySelector('#doc-content-input'); input.value = '表格前置'; input.dispatchEvent(new Event('input', { bubbles: true })); input.focus(); input.setSelectionRange(2, 2); return true; })()`);
  await sleep(120);
  await evaluate(`document.querySelector('[data-action="doc-format"][data-format="table"]').click()`);
  await sleep(180);
  const tableBlockState = await evaluate(`(() => { const value = document.querySelector('#doc-content-input')?.value || ''; return { value, table: !!document.querySelector('#doc-preview table'), html: document.querySelector('#doc-preview')?.innerHTML.slice(0, 200) || '' }; })()`);
  check('table template inserts a block at mid-line', tableBlockState.value.startsWith('| 列 1 | 列 2 |') && tableBlockState.value.includes('\n\n表格前置') && tableBlockState.table, JSON.stringify(tableBlockState));

  await evaluate(`(() => { const input = document.querySelector('#doc-content-input'); input.value = '前言\\n需要包裹的内容\\n结尾'; input.dispatchEvent(new Event('input', { bubbles: true })); input.focus(); input.setSelectionRange(3, 10); return true; })()`);
  await sleep(100);
  await evaluate(`document.querySelector('[data-action="doc-format"][data-format="code"]').click()`);
  await sleep(180);
  check('selected code template wraps the selected text', (await evaluate(`(() => { const value = document.querySelector('#doc-content-input')?.value || ''; return value.includes('\`\`\`\\n需要包裹的内容\\n\`\`\`') && document.querySelector('#doc-preview pre code')?.textContent.includes('需要包裹的内容'); })()`)) === true);
  await evaluate(`(() => { const input = document.querySelector('#doc-content-input'); input.value = '保留文本'; input.dispatchEvent(new Event('input', { bubbles: true })); input.focus(); input.setSelectionRange(0, 4); return true; })()`);
  await sleep(100);
  await evaluate(`document.querySelector('[data-action="doc-format"][data-format="table"]').click()`);
  await sleep(180);
  check('selected table template preserves the selected text', (await evaluate(`(() => { const value = document.querySelector('#doc-content-input')?.value || ''; return value.includes('保留文本') && !!document.querySelector('#doc-preview table') && document.querySelector('#doc-preview')?.innerText.includes('保留文本'); })()`)) === true);

  await evaluate(`(() => { const input = document.querySelector('#doc-content-input'); input.value = '| A | B |\\n| --- | --- |\\n| 1 | 2 | 多余尾部 |'; input.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  await sleep(180);
  check('table overflow text stays in the last cell', (await evaluate(`(() => { const cell = document.querySelector('#doc-preview tbody tr td:last-child'); return !!cell && cell.innerText.includes('多余尾部') && cell.innerText.includes('2'); })()`)) === true);

  await evaluate(`(() => { const input = document.querySelector('#doc-content-input'); input.value = input.value + '\\n\\n未保存内容'; input.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  await evaluate(`document.querySelector('[data-action="back-doc-preview"]').click()`);
  await waitDom(`!!document.querySelector('.overlay.open [data-action="confirm-doc-discard"]')`);
  check('back-to-preview guards unsaved changes', (await evaluate(`location.hash === '#/knowledge/doc-1/edit'`)) === true);
  await evaluate(`document.querySelector('[data-action="continue-doc-edit"]').click()`);
  await waitDom(`!document.querySelector('.overlay.open') && !!document.querySelector('#doc-edit-form')`);
  await evaluate(`document.querySelector('.sidebar [data-action="nav"][data-route="#/requirements"]').click()`);
  await waitDom(`!!document.querySelector('.overlay.open [data-action="confirm-doc-discard"]')`);
  check('sidebar navigation guards unsaved changes', (await evaluate(`location.hash === '#/knowledge/doc-1/edit'`)) === true);
  await evaluate(`document.querySelector('[data-action="continue-doc-edit"]').click()`);
  await waitDom(`!document.querySelector('.overlay.open') && !!document.querySelector('#doc-edit-form')`);
  await evaluate(`document.querySelector('[data-action="project-switch"]').click()`);
  await waitDom(`!!document.querySelector('.overlay.open .project-option[data-id="p-customer"]')`);
  await evaluate(`document.querySelector('.overlay.open .project-option[data-id="p-customer"]').click()`);
  await waitDom(`!!document.querySelector('.overlay.open [data-action="confirm-doc-discard"]')`);
  check('project switch guards unsaved changes', (await evaluate(`location.hash === '#/knowledge/doc-1/edit' && document.querySelector('.sidebar .project-meta b')?.textContent === '订单中心'`)) === true);
  await evaluate(`document.querySelector('[data-action="continue-doc-edit"]').click()`);
  await waitDom(`!document.querySelector('.overlay.open') && !!document.querySelector('#doc-edit-form')`);
  await evaluate(`history.back()`);
  await waitDom(`!!document.querySelector('.overlay.open [data-action="confirm-doc-discard"]')`);
  check('browser back guards unsaved changes', (await evaluate(`location.hash === '#/knowledge/doc-1/edit'`)) === true);
  await evaluate(`document.querySelector('[data-action="continue-doc-edit"]').click()`);
  await waitDom(`!document.querySelector('.overlay.open') && !!document.querySelector('#doc-edit-form')`);
  await evaluate(`document.querySelector('[data-action="cancel-doc-edit"]').click()`);
  await waitDom(`!!document.querySelector('.overlay.open [data-action="confirm-doc-discard"]')`);
  await evaluate(`document.querySelector('.overlay.open [data-action="confirm-doc-discard"]').click()`);
  await waitDom(`location.hash === '#/knowledge/doc-1' && !!document.querySelector('.doc-page')`);
  check('dirty guard discard returns to preview', true);

  await evaluate(`document.querySelector('[data-action="edit-doc"]').click()`);
  await waitDom(`location.hash === '#/knowledge/doc-1/edit' && !!document.querySelector('#doc-edit-form')`);
  await evaluate(`(() => { const input = document.querySelector('#doc-content-input'); input.value = input.value + '\\n\\n搜索守卫修改'; input.dispatchEvent(new Event('input', { bubbles: true })); const search = document.querySelector('#global-search'); search.value = '客户分层'; search.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  await waitDom(`!!document.querySelector('#search-results.open [data-action="search-result"][data-id="RQ-106"]')`);
  await evaluate(`document.querySelector('#search-results.open [data-action="search-result"][data-id="RQ-106"]').click()`);
  await waitDom(`!!document.querySelector('.overlay.open [data-action="confirm-doc-discard"]')`);
  check('search navigation guards unsaved changes', (await evaluate(`location.hash === '#/knowledge/doc-1/edit'`)) === true);
  await evaluate(`document.querySelector('[data-action="continue-doc-edit"]').click()`);
  await waitDom(`!document.querySelector('.overlay.open') && !!document.querySelector('#doc-edit-form')`);
  check('continue editing restores the document project context', (await evaluate(`document.querySelector('.sidebar .project-meta b')?.textContent === '订单中心'`)) === true);
  await evaluate(`document.querySelector('#doc-edit-form').requestSubmit()`);
  await waitDom(`location.hash === '#/knowledge/doc-1' && !!document.querySelector('.doc-page')`);
  check('guarded search result does not open a foreign drawer', (await evaluate(`location.hash === '#/knowledge/doc-1' && !!document.querySelector('.doc-page') && !document.querySelector('.overlay.open')`)) === true);
  await waitDom(`document.querySelector('.doc-page')?.innerText.includes('已索引')`, 5000);

  await evaluate(`location.hash = '#/knowledge/doc-3/edit'`);
  await waitDom(`document.querySelector('.empty h2')?.innerText.includes('文档不存在')`);
  check('cross-project edit is rejected without switching project', (await evaluate(`document.querySelector('.sidebar .project-meta b')?.textContent === '订单中心' && !document.querySelector('#doc-edit-form')`)) === true);

  await evaluate(`location.hash = '#/knowledge/doc-1/edit'`);
  await waitDom(`location.hash === '#/knowledge/doc-1/edit' && !!document.querySelector('#doc-edit-form')`);
  check('own document edit still opens', true);
  await evaluate(`(() => { document.querySelectorAll('.toast').forEach((el) => el.remove()); return true; })()`);
  await evaluate(`(() => { const form = document.querySelector('#doc-edit-form'); form.requestSubmit(); form.requestSubmit(); return true; })()`);
  await waitDom(`location.hash === '#/knowledge/doc-1' && !!document.querySelector('.doc-page')`);
  const saveToastCount = await evaluate(`Array.from(document.querySelectorAll('.toast')).filter((el) => el.innerText.includes('文档已保存')).length`);
  check('double submit shows exactly one save toast', saveToastCount === 1, String(saveToastCount));

  await evaluate(`location.hash = '#/knowledge/doc-2'`);
  await waitDom(`location.hash === '#/knowledge/doc-2' && !!document.querySelector('[data-action="edit-doc"]')`);
  await evaluate(`document.querySelector('[data-action="edit-doc"]').click()`);
  await waitDom(`location.hash === '#/knowledge/doc-2/edit' && !!document.querySelector('#doc-edit-form')`);
  await evaluate(`document.querySelector('#doc-edit-form').requestSubmit()`);
  await waitDom(`location.hash === '#/knowledge/doc-2' && !!document.querySelector('.doc-page')`);
  check('cross-doc save is not blocked by another reindex', (await evaluate(`location.hash === '#/knowledge/doc-2' && !!document.querySelector('.doc-page') && !document.querySelector('.overlay.open')`)) === true);
  await waitDom(`document.querySelector('.doc-page')?.innerText.includes('已索引')`, 5000);
  await evaluate(`location.hash = '#/knowledge/doc-1'`);
  await waitDom(`document.querySelector('.doc-page')?.innerText.includes('已索引')`, 5000);
  check('both documents completed reindexing', true);

  await evaluate(`location.hash = '#/knowledge/doc-1/edit'`);
  await waitDom(`location.hash === '#/knowledge/doc-1/edit' && !!document.querySelector('#doc-edit-form')`);
  await evaluate(`(() => { const input = document.querySelector('#doc-content-input'); input.value = input.value + '\\n\\n切换前修改'; input.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  await evaluate(`document.querySelector('[data-action="project-switch"]').click()`);
  await waitDom(`!!document.querySelector('.overlay.open .project-option[data-id="p-customer"]')`);
  await evaluate(`document.querySelector('.overlay.open .project-option[data-id="p-customer"]').click()`);
  await waitDom(`!!document.querySelector('.overlay.open [data-action="confirm-doc-discard"]')`);
  await evaluate(`document.querySelector('.overlay.open [data-action="confirm-doc-discard"]').click()`);
  await waitDom(`location.hash === '#/requirements' && document.querySelector('.sidebar .project-meta b')?.textContent === '客户运营'`);
  check('discarding a guarded project switch completes the switch', true);

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
