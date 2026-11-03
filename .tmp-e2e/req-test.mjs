import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9377;
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
const setInput = async (id, value) => {
  await evaluate(`(() => { const el = document.getElementById('${id}'); el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  await sleep(200);
};
const setSelect = async (id, value) => {
  await evaluate(`(() => { const el = document.getElementById('${id}'); el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  await sleep(200);
};
const rowIds = () => evaluate(`Array.from(document.querySelectorAll('.req-table tbody tr[data-id]')).map((tr) => tr.dataset.id)`);
const visibleCount = () => evaluate(`document.querySelectorAll('.req-table tbody tr[data-id]').length`);

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
  await waitDom(`!!document.querySelector('.tabs') && document.querySelectorAll('.req-table tbody tr[data-id]').length === 10`);
  await sleep(450);

  const sidebarText = await evaluate(`document.querySelector('.sidebar')?.innerText || ''`);
  check('batch release nav removed', !sidebarText.includes('批次发布'), sidebarText);
  check('overview and runtime nav removed while agent tasks stay', !['项目总览', '应用运行'].some((label) => sidebarText.includes(label)) && sidebarText.includes('Agent 任务'), sidebarText);

  const newButton = await evaluate(`(() => { const btn = document.querySelector('#main .card [data-action="new-requirement"]'); const table = document.querySelector('#main .req-table'); if (!btn || !table) return null; return { text: btn.textContent.trim(), aboveTable: btn.getBoundingClientRect().top < table.getBoundingClientRect().top, leftAligned: btn.getBoundingClientRect().left <= table.getBoundingClientRect().left + 2 }; })()`);
  check('new requirement button at list top-left', !!newButton && newButton.text.includes('新建需求') && newButton.aboveTable && newButton.leftAligned, JSON.stringify(newButton));
  await evaluate(`document.querySelector('#main .card [data-action="new-requirement"]').click()`);
  await waitDom(`!!document.querySelector('#req-form')`);
  check('list new requirement button opens form', true);
  await evaluate(`document.querySelector('[data-action="close-overlay"]').click()`);
  await sleep(300);
  check('pagination shows 2 pages', (await evaluate(`document.querySelector('.pagination-info')?.textContent.includes('第 1 / 2 页') && document.querySelectorAll('[data-action="req-page"]').length === 4`)) === true);
  const reqDims1 = await evaluate(`(() => { const el = document.querySelector('.req-table').closest('.table-wrap'); return { client: el.clientHeight, scroll: el.scrollHeight }; })()`);
  check('requirements table fills available height', reqDims1.client > 500 && reqDims1.scroll <= reqDims1.client + 1, JSON.stringify(reqDims1));
  const fillDims = await evaluate(`(() => { const card = document.querySelector('.req-page-fill > .card'); return { mainFill: document.querySelector('#main').classList.contains('main-fill'), bottom: Math.round(card.getBoundingClientRect().bottom), vh: innerHeight }; })()`);
  check('list card fills viewport height', fillDims.mainFill && fillDims.bottom >= fillDims.vh - 24, JSON.stringify(fillDims));
  await evaluate(`document.querySelector('[data-action="req-page"][data-page="2"]').click()`);
  await waitDom(`document.querySelector('.pagination-info')?.textContent.includes('第 2 / 2 页')`);
  check('page 2 shows remaining requirements', (await rowIds()).length === 3 && (await rowIds()).every((id) => ['RQ-118', 'RQ-119', 'RQ-120'].includes(id)));
  const reqDims2 = await evaluate(`(() => { const el = document.querySelector('.req-table').closest('.table-wrap'); return { client: el.clientHeight, scroll: el.scrollHeight }; })()`);
  check('requirements table height stays fixed on page 2', reqDims2.client > 500 && reqDims2.client === reqDims1.client, JSON.stringify(reqDims2));
  await evaluate(`document.querySelector('[data-action="req-page"][data-page="1"]').click()`);
  await waitDom(`document.querySelectorAll('.req-table tbody tr[data-id]').length === 10`);

  const headers = await evaluate(`Array.from(document.querySelectorAll('.req-table thead tr:first-child th')).map((th) => th.textContent.trim())`);
  check('page header and iteration summary removed', (await evaluate(`!document.querySelector('#main .page-head') && !!document.querySelector('#main .tabs')`)) === true);
  check('columns split id and title', headers[0] === '需求编号' && headers[1] === '需求标题', headers.join(' | '));
  check('owner renamed to 责任人', headers.includes('责任人') && !headers.includes('Owner'), headers.join(' | '));
  check('ready column removed', !headers.includes('就绪'), headers.join(' | '));
  check('id and title query inputs exist', (await evaluate(`!!document.getElementById('req-id-filter') && !!document.getElementById('req-title-filter')`)) === true);
  const statusOptions = await evaluate(`Array.from(document.querySelectorAll('#req-status-filter option')).map((option) => option.value)`);
  check('status options are five stages', JSON.stringify(statusOptions) === JSON.stringify(['all', '分析', '设计', '开发', '测试', '发布']), statusOptions.join(','));
  const statuses = await evaluate(`Array.from(document.querySelectorAll('.req-table tbody tr[data-id] td:nth-child(3) .pill')).map((el) => el.textContent.trim())`);
  check('all rows use five-stage statuses', statuses.every((status) => ['分析', '设计', '开发', '测试', '发布'].includes(status)), statuses.join(','));
  await sleep(700);
  await send('Page.captureScreenshot', { format: 'png' }).then((shot) => writeFileSync('d:/Code/AI/ai-devops/.tmp-e2e/requirement-list.png', Buffer.from(shot.data, 'base64')));

  await setInput('req-id-filter', 'RQ-101');
  check('id query filters to one row', (await visibleCount()) === 1 && (await rowIds())[0] === 'RQ-101');
  await evaluate(`document.querySelector('[data-action="reset-req-filters"]').click()`);
  await waitDom(`document.querySelectorAll('.req-table tbody tr[data-id]').length === 10`);

  await setInput('req-title-filter', '订单');
  const titleIds = await rowIds();
  check('title query filters matching rows', titleIds.length === 4 && titleIds.every((id) => ['RQ-101', 'RQ-104', 'RQ-110', 'RQ-112'].includes(id)), titleIds.join(','));
  await evaluate(`document.querySelector('[data-action="reset-req-filters"]').click()`);
  await waitDom(`document.querySelectorAll('.req-table tbody tr[data-id]').length === 10`);

  await setSelect('req-status-filter', '测试');
  const testRows = await rowIds();
  const statusPagination = await evaluate(`document.querySelector('.pagination-info')?.textContent || ''`);
  check('status filter works', testRows.length === 6 && testRows.every((id) => !['RQ-104', 'RQ-110'].includes(id)) && statusPagination.includes('共 6 条需求') && statusPagination.includes('第 1 / 1 页'), `${testRows.join(',')} | ${statusPagination}`);
  await evaluate(`document.querySelector('[data-action="reset-req-filters"]').click()`);
  await waitDom(`document.querySelectorAll('.req-table tbody tr[data-id]').length === 10`);

  await setSelect('req-priority-filter', 'P1');
  check('priority filter works', (await rowIds()).length === 3 && (await rowIds()).every((id) => ['RQ-102', 'RQ-110', 'RQ-111'].includes(id)));
  await evaluate(`document.querySelector('[data-action="reset-req-filters"]').click()`);
  await waitDom(`document.querySelectorAll('.req-table tbody tr[data-id]').length === 10`);

  await setSelect('req-owner-filter', '陈晨');
  check('owner filter works', (await rowIds()).length === 4 && (await rowIds()).every((id) => ['RQ-102', 'RQ-104', 'RQ-111', 'RQ-113'].includes(id)));
  await evaluate(`document.querySelector('[data-action="reset-req-filters"]').click()`);
  await waitDom(`document.querySelectorAll('.req-table tbody tr[data-id]').length === 10`);

  await setSelect('req-app-filter', 'order-web');
  check('app filter works', (await rowIds()).length === 3 && (await rowIds()).every((id) => ['RQ-101', 'RQ-103', 'RQ-112'].includes(id)));
  await evaluate(`document.querySelector('[data-action="reset-req-filters"]').click()`);
  await waitDom(`document.querySelectorAll('.req-table tbody tr[data-id]').length === 10`);

  await setInput('req-updated-filter', '10:');
  check('updated filter works', (await rowIds()).length === 2 && (await rowIds()).every((id) => ['RQ-101', 'RQ-102'].includes(id)));
  await evaluate(`document.querySelector('[data-action="reset-req-filters"]').click()`);
  await waitDom(`document.querySelectorAll('.req-table tbody tr[data-id]').length === 10`);

  await setInput('req-id-filter', 'RQ-101');
  await setInput('req-title-filter', '订单');
  check('id and title queries combine', (await visibleCount()) === 1 && (await rowIds())[0] === 'RQ-101');
  await evaluate(`document.querySelector('[data-action="reset-req-filters"]').click()`);
  await waitDom(`document.querySelectorAll('.req-table tbody tr[data-id]').length === 10`);

  const deferred = await evaluate(`(() => { const rows = Array.from(document.querySelectorAll('.req-table tbody tr[data-id]')); const target = rows.find((tr) => tr.dataset.id === 'RQ-104'); return { hasTag: !!target && target.textContent.includes('已延期'), status: target?.querySelector('td:nth-child(3) .pill')?.textContent.trim(), count: rows.filter((tr) => tr.textContent.includes('已延期')).length }; })()`);
  check('deferred items keep a valid stage and tag', deferred.hasTag && deferred.status === '设计' && deferred.count === 2, JSON.stringify(deferred));

  const requirementTabs = await evaluate(`Array.from(document.querySelectorAll('.req-page > .tabs .tab')).map((el) => ({ tab: el.dataset.tab, label: el.textContent.trim() }))`);
  check('requirements tabs move the board out and add defects', requirementTabs.length === 3 && requirementTabs[0].tab === 'list' && requirementTabs[1].tab === 'defects' && requirementTabs[2].tab === 'plan' && !requirementTabs.some((item) => item.tab === 'board'), JSON.stringify(requirementTabs));
  await evaluate(`document.querySelector('[data-action="req-tab"][data-tab="defects"]').click()`);
  await waitDom(`document.querySelectorAll('.defect-table tbody tr[data-id]').length === 5`);
  check('defect tab renders current iteration defects', (await evaluate(`Array.from(document.querySelectorAll('.defect-table tbody tr[data-id]')).map((tr) => tr.dataset.id).join(',')`)) === 'BUG-201,BUG-202,BUG-203,BUG-204,BUG-205');
  await evaluate(`document.querySelector('[data-action="req-tab"][data-tab="list"]').click()`);
  await waitDom(`document.querySelectorAll('.req-table tbody tr[data-id]').length === 10`);

  await evaluate(`document.querySelector('[data-action="req-tab"][data-tab="plan"]').click()`);
  await waitDom(`!!document.querySelector('.release-manage') && document.querySelectorAll('.release-manage tbody tr[data-id]').length === 3`);
  const releaseTabLabel = await evaluate(`Array.from(document.querySelectorAll('.tabs .tab')).find((el) => el.dataset.tab === 'plan')?.textContent.trim()`);
  check('release tab renamed to release management', releaseTabLabel === '发布管理', String(releaseTabLabel));
  const releaseRows = await evaluate(`Array.from(document.querySelectorAll('.release-manage tbody tr[data-id]')).map((tr) => tr.innerText)`);
  check('release management seeds three releases', releaseRows.length === 3, String(releaseRows.length));
  const releaseState = await evaluate(`(() => { const rows = Array.from(document.querySelectorAll('.release-manage tbody tr[data-id]')); const byId = Object.fromEntries(rows.map((tr) => [tr.dataset.id, tr.innerText])); return { gray: byId['REL-101'] || '', formal: byId['REL-102'] || '', pre: byId['REL-103'] || '' }; })()`);
  check('release status derives from time window', releaseState.gray.includes('进行中') && releaseState.formal.includes('未开始') && releaseState.pre.includes('已结束') && releaseState.gray.includes('2026-10-24 09:00 ~ 2026-10-24 12:00') && releaseState.formal.includes('2026-10-24 20:00 ~ 2026-10-24 23:00'), JSON.stringify(releaseState).slice(0, 240));
  check('old release gate content removed', (await evaluate(`!document.body.innerText.includes('发布就绪检查')`)) === true);
  await sleep(250);
  await send('Page.captureScreenshot', { format: 'png' }).then((shot) => writeFileSync('d:/Code/AI/ai-devops/.tmp-e2e/release-management.png', Buffer.from(shot.data, 'base64')));
  await evaluate(`document.querySelector('[data-action="req-tab"][data-tab="list"]').click()`);
  await waitDom(`document.querySelectorAll('.req-table tbody tr[data-id]').length === 10`);

  await evaluate(`document.querySelector('[data-action="req-tab"][data-tab="plan"]').click()`);
  await waitDom(`!!document.querySelector('.release-manage')`);
  await evaluate(`document.querySelector('[data-action="new-release"]').click()`);
  await waitDom(`!!document.querySelector('#release-form')`);
  const releaseFormInfo = await evaluate(`(() => ({
    hasName: !!document.querySelector('#release-name'),
    hasStart: !!document.querySelector('#release-start'),
    hasEnd: !!document.querySelector('#release-end'),
    optionCount: document.querySelectorAll('#release-form input[name="requirements"]').length,
    hasDeferred: Array.from(document.querySelectorAll('#release-form input[name="requirements"]')).some((el) => el.value === 'RQ-104' || el.value === 'RQ-110'),
    hasLinked: Array.from(document.querySelectorAll('#release-form input[name="requirements"]')).some((el) => ['RQ-101', 'RQ-102', 'RQ-103', 'RQ-111', 'RQ-112', 'RQ-113'].includes(el.value))
  }))()`);
  check('new release form has name, time range and requirement choices', releaseFormInfo.hasName && releaseFormInfo.hasStart && releaseFormInfo.hasEnd && releaseFormInfo.optionCount === 5 && !releaseFormInfo.hasDeferred && !releaseFormInfo.hasLinked, JSON.stringify(releaseFormInfo));
  await sleep(250);
  await send('Page.captureScreenshot', { format: 'png' }).then((shot) => writeFileSync('d:/Code/AI/ai-devops/.tmp-e2e/release-form.png', Buffer.from(shot.data, 'base64')));
  await evaluate(`(() => { const form = document.querySelector('#release-form'); form.elements.name.value = 'v2.4 晚间发布'; form.elements.startAt.value = '2026-10-24T20:00'; form.elements.endAt.value = '2026-10-24T19:00'; form.requestSubmit(); return true; })()`);
  await waitDom(`document.body.innerText.includes('结束时间必须晚于开始时间')`);
  check('release rejects end before start', true);
  await evaluate(`(() => { const form = document.querySelector('#release-form'); form.elements.endAt.value = '2026-10-24T23:00'; form.requestSubmit(); return true; })()`);
  await waitDom(`document.body.innerText.includes('请至少选择一个')`);
  check('release requires at least one requirement', true);
  await evaluate(`(() => { const form = document.querySelector('#release-form'); form.querySelector('input[name="requirements"][value="RQ-116"]').click(); form.querySelector('input[name="requirements"][value="RQ-117"]').click(); form.requestSubmit(); return true; })()`);
  await waitDom(`document.querySelectorAll('.release-manage tbody tr[data-id]').length === 4`);
  const createdRelease = await evaluate(`(() => { const row = Array.from(document.querySelectorAll('.release-manage tbody tr[data-id]')).find((tr) => tr.innerText.includes('v2.4 晚间发布')); return row ? { id: row.dataset.id, text: row.innerText } : null; })()`);
  check('new release is added with derived status', !!createdRelease && createdRelease.id === 'REL-104' && createdRelease.text.includes('未开始') && createdRelease.text.includes('2 个'), JSON.stringify(createdRelease));
  await evaluate(`document.querySelector('[data-action="req-tab"][data-tab="plan"]').click()`);
  await waitDom(`!!document.querySelector('.release-manage')`);
  await evaluate(`document.querySelector('.release-manage tbody tr[data-id="REL-104"]').click()`);
  await waitDom(`!!document.querySelector('.overlay.open .drawer')`);
  const releaseDetail = await evaluate(`(() => { const root = document.querySelector('.overlay.open .drawer'); return { title: root.querySelector('.drawer-title')?.textContent || '', text: root.innerText }; })()`);
  check('release detail shows window and requirements', releaseDetail.title.includes('v2.4 晚间发布') && releaseDetail.text.includes('2026-10-24 20:00 ~ 2026-10-24 23:00') && releaseDetail.text.includes('RQ-116') && releaseDetail.text.includes('RQ-117') && releaseDetail.text.includes('发布管理仅用于排期') && !releaseDetail.text.includes('批次发布'), JSON.stringify(releaseDetail).slice(0, 240));
  await sleep(250);
  await send('Page.captureScreenshot', { format: 'png' }).then((shot) => writeFileSync('d:/Code/AI/ai-devops/.tmp-e2e/release-detail.png', Buffer.from(shot.data, 'base64')));
  await evaluate(`document.querySelector('[data-action="close-overlay"]').click()`);
  await evaluate(`document.querySelector('[data-action="req-tab"][data-tab="list"]').click()`);
  await waitDom(`document.querySelectorAll('.req-table tbody tr[data-id]').length === 10`);

  const requirementHeaders = await evaluate(`Array.from(document.querySelectorAll('.req-table thead tr:first-child th')).map((th) => th.textContent.trim())`);
  check('requirement list has release column', requirementHeaders.includes('发布'), requirementHeaders.join(' | '));
  const linkedSelect = await evaluate(`document.querySelector('[data-action="req-release-select"][data-id="RQ-101"]')?.value`);
  check('requirement row shows linked release', linkedSelect === 'REL-101', String(linkedSelect));
  const linkedReleaseRow = await evaluate(`document.querySelector('.req-table tbody tr[data-id="RQ-101"]')?.innerText || ''`);
  check('requirement row shows release time window', linkedReleaseRow.includes('2026-10-24 09:00 ~ 2026-10-24 12:00'), JSON.stringify(linkedReleaseRow).slice(0, 160));
  const releaseDisplay = await evaluate(`(() => { const el = document.querySelector('.req-table tbody tr[data-id="RQ-101"] .release-select-display'); if (!el) return null; const style = getComputedStyle(el); return { text: el.textContent, overflow: style.textOverflow, whiteSpace: style.whiteSpace, clipped: el.scrollWidth > el.clientWidth }; })()`);
  check('release display shows name and time with ellipsis', !!releaseDisplay && releaseDisplay.text === 'v2.4 灰度发布 (2026-10-24 09:00 ~ 2026-10-24 12:00)' && releaseDisplay.overflow === 'ellipsis' && releaseDisplay.whiteSpace === 'nowrap' && releaseDisplay.clipped, JSON.stringify(releaseDisplay));
  await evaluate(`document.querySelector('[data-action="req-page"][data-page="2"]').click()`);
  await waitDom(`document.querySelectorAll('.req-table tbody tr[data-id]').length === 3 && !!document.querySelector('.req-table tbody tr[data-id="RQ-120"]')`);
  const emptySelect = await evaluate(`document.querySelector('[data-action="req-release-select"][data-id="RQ-120"]')?.value`);
  check('requirement row without release is unlinked', emptySelect === '', String(emptySelect));
  await evaluate(`(() => { const select = document.querySelector('[data-action="req-release-select"][data-id="RQ-120"]'); select.value = 'REL-101'; select.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  await waitDom(`document.querySelector('[data-action="req-release-select"][data-id="RQ-120"]')?.value === 'REL-101'`);
  check('requirement list selects a release', true);
  await evaluate(`(() => { const select = document.querySelector('[data-action="req-release-select"][data-id="RQ-120"]'); select.value = 'REL-102'; select.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  await waitDom(`document.querySelector('[data-action="req-release-select"][data-id="RQ-120"]')?.value === 'REL-102'`);
  check('requirement list moves release one-to-one', true);
  await evaluate(`document.querySelector('.req-table tbody tr[data-id="RQ-120"]').click()`);
  await waitDom(`!!document.querySelector('#req-edit-release')`);
  const detailReleaseValue = await evaluate(`document.querySelector('#req-edit-release')?.value`);
  check('requirement detail shows current release', detailReleaseValue === 'REL-102', String(detailReleaseValue));
  await sleep(250);
  await send('Page.captureScreenshot', { format: 'png' }).then((shot) => writeFileSync('d:/Code/AI/ai-devops/.tmp-e2e/requirement-release-edit.png', Buffer.from(shot.data, 'base64')));
  await evaluate(`(() => { const select = document.querySelector('#req-edit-release'); select.value = 'REL-101'; document.querySelector('[data-action="save-req-edit"]').click(); return true; })()`);
  await waitDom(`document.querySelector('#req-edit-release')?.value === 'REL-101'`);
  check('requirement detail selects release', true);
  await evaluate(`document.querySelector('[data-action="req-detail-tab"][data-tab="relations"]').click()`);
  const releaseRelation = await evaluate(`document.querySelector('.overlay.open [data-pane="relations"]')?.innerText || ''`);
  check('requirement detail shows linked release', releaseRelation.includes('关联发布') && releaseRelation.includes('v2.4 灰度发布') && releaseRelation.includes('2026-10-24 09:00 ~ 2026-10-24 12:00'), releaseRelation.slice(0, 200));
  await sleep(250);
  await send('Page.captureScreenshot', { format: 'png' }).then((shot) => writeFileSync('d:/Code/AI/ai-devops/.tmp-e2e/requirement-release-detail.png', Buffer.from(shot.data, 'base64')));
  await evaluate(`document.querySelector('[data-action="close-overlay"]').click()`);
  await evaluate(`(() => { const el = document.getElementById('req-release-filter'); el.value = 'REL-101'; el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  await waitDom(`document.querySelectorAll('.req-table tbody tr[data-id]').length === 3`);
  const releaseFiltered = await rowIds();
  check('release filter works', releaseFiltered.includes('RQ-120') && releaseFiltered.includes('RQ-101') && !releaseFiltered.includes('RQ-116'), releaseFiltered.join(','));
  await evaluate(`document.querySelector('[data-action="reset-req-filters"]').click()`);
  await waitDom(`document.querySelectorAll('.req-table tbody tr[data-id]').length === 10`);

  await evaluate(`document.querySelector('.req-table tbody tr[data-id="RQ-101"]').click()`);
  await waitDom(`!!document.querySelector('.overlay.open .drawer')`);
  const drawer = await evaluate(`(() => {
    const root = document.querySelector('.overlay.open .drawer');
    const left = root.querySelector('.req-detail-left');
    const right = root.querySelector('.req-detail-right');
    return {
      grid: !!root.querySelector('.req-detail-grid'),
      left: !!left?.querySelector('#req-edit-title') && !!left?.querySelector('#req-desc-edit') && !!left?.querySelector('#req-comments'),
      right: !!right?.querySelector('#req-edit-status') && !!right?.querySelector('#req-edit-priority') && !!right?.querySelector('#req-edit-owner') && !!right?.querySelector('#req-edit-acceptance'),
      headerSave: !!root.querySelector('.drawer-head-actions [data-action="save-req-edit"]'),
      tabs: Array.from(root.querySelectorAll('.req-detail-tabs .tab')).map((el) => el.textContent.trim()),
      detailOpen: !root.querySelector('[data-pane="detail"]')?.hidden,
      relationsClosed: root.querySelector('[data-pane="relations"]')?.hidden === true,
      basicInfo: root.innerText.includes('基本信息'),
      progress: root.innerText.includes('交付进度'),
      comments: root.querySelectorAll('.comment-item').length
    };
  })()`);
  check('detail tabs are 详情/关联项/历史记录', JSON.stringify(drawer.tabs) === JSON.stringify(['详情', '关联项', '历史记录']) && drawer.detailOpen && drawer.relationsClosed, JSON.stringify(drawer.tabs));
  check('detail uses left/right layout', drawer.grid && drawer.left && drawer.right && drawer.headerSave, JSON.stringify(drawer));
  check('basic info and progress removed', !drawer.basicInfo && !drawer.progress);
  check('comment area seeded', drawer.comments === 2, String(drawer.comments));
  const footerState = await evaluate(`(() => { const root = document.querySelector('.overlay.open .drawer'); const foot = root.querySelector('.drawer-foot'); return { hasFoot: !!foot, close: !!foot?.querySelector('[data-action="close-overlay"]'), release: !!foot?.querySelector('[data-action="goto-releases"]'), headerClose: !!root.querySelector('.drawer-close') }; })()`);
  check('requirement drawer footer omits close and release actions', !footerState.hasFoot && !footerState.close && !footerState.release && footerState.headerClose, JSON.stringify(footerState));

  const relations = await evaluate(`(() => {
    const root = document.querySelector('.overlay.open .drawer');
    root.querySelector('[data-action="req-detail-tab"][data-tab="relations"]').click();
    const pane = root.querySelector('[data-pane="relations"]');
    return { detailHidden: root.querySelector('[data-pane="detail"]').hidden, relationsVisible: !pane.hidden, apps: pane.querySelectorAll('.req-relation-grid .relation-item').length, hasTask: pane.innerText.includes('需求分析') };
  })()`);
  check('relations tab shows apps and task', relations.detailHidden && relations.relationsVisible && relations.apps === 2 && relations.hasTask, JSON.stringify(relations));
  await sleep(300);
  await send('Page.captureScreenshot', { format: 'png' }).then((shot) => writeFileSync('d:/Code/AI/ai-devops/.tmp-e2e/requirement-relations.png', Buffer.from(shot.data, 'base64')));
  const historyView = await evaluate(`(() => {
    const root = document.querySelector('.overlay.open .drawer');
    root.querySelector('[data-action="req-detail-tab"][data-tab="history"]').click();
    const pane = root.querySelector('[data-pane="history"]');
    const first = pane.querySelector('.req-history-entry');
    return {
      panelVisible: !pane.hidden,
      detailHidden: root.querySelector('[data-pane="detail"]').hidden,
      timeline: !!pane.querySelector('.req-history-timeline'),
      count: pane.querySelectorAll('.req-history-entry').length,
      rails: pane.querySelectorAll('.req-history-rail').length,
      dots: pane.querySelectorAll('.req-history-dot').length,
      actor: first?.querySelector('.req-history-head b')?.textContent.trim(),
      time: first?.querySelector('.req-history-time')?.textContent.trim(),
      action: first?.querySelector('.req-history-action')?.textContent.trim(),
      text: pane.innerText
    };
  })()`);
  check('history tab renders a timeline with operator, time and changes', historyView.panelVisible && historyView.detailHidden && historyView.timeline && historyView.count === 3 && historyView.rails === 3 && historyView.dots === 3 && historyView.actor === '张明' && historyView.time === '10:18' && historyView.action === '更新需求' && historyView.text.includes('优先级') && historyView.text.includes('P1') && historyView.text.includes('P0'), JSON.stringify(historyView));
  await sleep(250);
  await send('Page.captureScreenshot', { format: 'png' }).then((shot) => writeFileSync('d:/Code/AI/ai-devops/.tmp-e2e/requirement-history.png', Buffer.from(shot.data, 'base64')));
  await evaluate(`document.querySelector('[data-action="req-detail-tab"][data-tab="detail"]').click()`);
  check('detail tab restores detail content', (await evaluate(`!document.querySelector('[data-pane="detail"]').hidden && !!document.querySelector('#req-edit-title') && !!document.querySelector('#req-comments')`)) === true);

  const fieldsBefore = await evaluate(`(() => ({ title: document.querySelector('#req-edit-title')?.value, status: document.querySelector('#req-edit-status')?.value, priority: document.querySelector('#req-edit-priority')?.value, owner: document.querySelector('#req-edit-owner')?.value, desc: document.querySelector('#req-desc-edit')?.value, acceptance: document.querySelector('#req-edit-acceptance')?.value }))()`);
  check('requirement fields are editable', fieldsBefore.title === '订单履约超时预警' && fieldsBefore.status === '测试' && fieldsBefore.priority === 'P0' && fieldsBefore.owner === '张明' && fieldsBefore.desc.includes('履约节点超时') && fieldsBefore.acceptance.length > 0, JSON.stringify(fieldsBefore));

  const editedDesc = '更新后的描述：支持超时预警阈值配置、站内通知与邮件通知。';
  const editedAcceptance = '更新后的验收：超时 5 分钟内触发预警；通知可达；配置变更可追溯。';
  await evaluate(`(() => {
    document.querySelector('#req-edit-title').value = '订单履约超时预警（已编辑）';
    document.querySelector('#req-edit-status').value = '开发';
    document.querySelector('#req-edit-priority').value = 'P1';
    document.querySelector('#req-edit-owner').value = '陈晨';
    document.querySelector('#req-desc-edit').value = ${JSON.stringify(editedDesc)};
    document.querySelector('#req-edit-acceptance').value = ${JSON.stringify(editedAcceptance)};
    document.querySelector('[data-action="save-req-edit"]').click();
    return true;
  })()`);
  await waitDom(`document.querySelector('.drawer-title')?.textContent.includes('已编辑')`);
  const fieldsAfter = await evaluate(`(() => ({ title: document.querySelector('#req-edit-title')?.value, status: document.querySelector('#req-edit-status')?.value, priority: document.querySelector('#req-edit-priority')?.value, owner: document.querySelector('#req-edit-owner')?.value, desc: document.querySelector('#req-desc-edit')?.value, acceptance: document.querySelector('#req-edit-acceptance')?.value }))()`);
  check('title, status, priority and owner save', fieldsAfter.title === '订单履约超时预警（已编辑）' && fieldsAfter.status === '开发' && fieldsAfter.priority === 'P1' && fieldsAfter.owner === '陈晨', JSON.stringify(fieldsAfter));
  check('description and acceptance save', fieldsAfter.desc === editedDesc && fieldsAfter.acceptance === editedAcceptance);
  check('edit save shows success', (await evaluate(`document.body.innerText.includes('需求已更新')`)) === true);
  const savedHistory = await evaluate(`(() => {
    const root = document.querySelector('.overlay.open .drawer');
    root.querySelector('[data-action="req-detail-tab"][data-tab="history"]').click();
    const pane = root.querySelector('[data-pane="history"]');
    const first = pane.querySelector('.req-history-entry');
    return { count: pane.querySelectorAll('.req-history-entry').length, actor: first?.querySelector('.req-history-head b')?.textContent.trim(), action: first?.querySelector('.req-history-action')?.textContent.trim(), text: pane.innerText };
  })()`);
  check('saving a requirement appends history', savedHistory.count === 4 && savedHistory.actor === '张明' && savedHistory.action === '更新需求' && savedHistory.text.includes('状态') && savedHistory.text.includes('测试') && savedHistory.text.includes('开发') && savedHistory.text.includes('自动任务'), JSON.stringify(savedHistory));
  await evaluate(`document.querySelector('[data-action="req-detail-tab"][data-tab="detail"]').click()`);

  await send('Page.captureScreenshot', { format: 'png' }).then((shot) => writeFileSync('d:/Code/AI/ai-devops/.tmp-e2e/requirement-filters.png', Buffer.from(shot.data, 'base64')));
  await evaluate(`document.querySelector('[data-action="close-overlay"]').click()`);
  await sleep(300);
  await evaluate(`document.querySelector('.req-table tbody tr[data-id="RQ-101"]').click()`);
  await waitDom(`!!document.querySelector('#req-edit-title')`);
  const fieldsReopened = await evaluate(`(() => ({ title: document.querySelector('#req-edit-title')?.value, status: document.querySelector('#req-edit-status')?.value, priority: document.querySelector('#req-edit-priority')?.value, owner: document.querySelector('#req-edit-owner')?.value, desc: document.querySelector('#req-desc-edit')?.value, acceptance: document.querySelector('#req-edit-acceptance')?.value }))()`);
  check('edits persist after reopening', fieldsReopened.title === fieldsAfter.title && fieldsReopened.status === fieldsAfter.status && fieldsReopened.priority === fieldsAfter.priority && fieldsReopened.owner === fieldsAfter.owner && fieldsReopened.desc === editedDesc && fieldsReopened.acceptance === editedAcceptance, JSON.stringify(fieldsReopened));

  const newComment = '追加评论：请在发布前确认华南仓的超时阈值。';
  await evaluate(`(() => { const el = document.querySelector('#req-comment-input'); el.value = ${JSON.stringify(newComment)}; document.querySelector('[data-action="add-req-comment"]').click(); return true; })()`);
  await waitDom(`document.querySelectorAll('.comment-item').length === 3 && document.querySelector('#req-comments')?.textContent.includes('华南仓')`);
  check('comment can be added', (await evaluate(`document.querySelector('#req-comment-count')?.textContent`)) === '3' && (await evaluate(`document.querySelector('#req-comments')?.textContent.includes('追加评论')`)) === true);
  check('comment does not discard edits', (await evaluate(`document.querySelector('#req-edit-title')?.value`)) === fieldsAfter.title && (await evaluate(`document.querySelector('#req-desc-edit')?.value`)) === editedDesc);
  await evaluate(`document.querySelector('[data-action="close-overlay"]').click()`);
  await sleep(300);
  await evaluate(`document.querySelector('.req-table tbody tr[data-id="RQ-101"]').click()`);
  await waitDom(`document.querySelectorAll('.comment-item').length === 3`);
  check('comment persists after reopening', (await evaluate(`document.querySelector('#req-comments')?.textContent.includes('追加评论')`)) === true);
  await evaluate(`document.querySelector('[data-action="close-overlay"]').click()`);
  await evaluate(`document.querySelector('[data-action="project-switch"]').click()`);
  await waitDom(`!!document.querySelector('.project-option[data-id="p-support"]')`);
  await evaluate(`document.querySelector('.project-option[data-id="p-support"]').click()`);
  await waitDom(`document.querySelector('.sidebar .project-meta b')?.textContent === '智能客服'`);
  await waitDom(`!!document.querySelector('.req-table tbody tr[data-id="RQ-107"]')`);
  await sleep(300);
  const hasDeferButton = await evaluate(`!!document.querySelector('[data-action="defer-req"][data-id="RQ-107"]')`);
  check('defer action available before deferral', hasDeferButton === true);
  await evaluate(`document.querySelector('[data-action="defer-req"][data-id="RQ-107"]').click()`);
  await waitDom(`!!document.querySelector('#defer-form')`);
  await evaluate(`(() => { const form = document.querySelector('#defer-form'); form.elements.target.value = 'backlog'; form.elements.reason.value = '依赖知识库索引改造'; form.requestSubmit(); return true; })()`);
  await waitDom(`document.querySelector('.req-table tbody tr[data-id="RQ-107"]')?.textContent.includes('已延期')`);
  const deferredState = await evaluate(`(() => { const row = document.querySelector('.req-table tbody tr[data-id="RQ-107"]'); return { status: row.querySelector('td:nth-child(3) .pill')?.textContent.trim(), tag: row.textContent.includes('已延期'), deferButton: !!row.querySelector('[data-action="defer-req"]') }; })()`);
  check('defer keeps five-stage status', deferredState.status === '设计' && deferredState.tag && !deferredState.deferButton, JSON.stringify(deferredState));
  await evaluate(`document.querySelector('.req-table tbody tr[data-id="RQ-107"]').click()`);
  await waitDom(`!!document.querySelector('.overlay.open .drawer')`);
  const deferHistory = await evaluate(`(() => { const root = document.querySelector('.overlay.open .drawer'); root.querySelector('[data-action="req-detail-tab"][data-tab="history"]').click(); return root.querySelector('[data-pane="history"]')?.innerText || ''; })()`);
  check('defer action appends history', deferHistory.includes('延期需求') && deferHistory.includes('Backlog') && deferHistory.includes('依赖知识库索引改造'), deferHistory.slice(0, 80));

  await evaluate(`document.querySelector('[data-action="close-overlay"]').click()`);
  await evaluate(`document.querySelector('[data-action="project-switch"]').click()`);
  await waitDom(`!!document.querySelector('.project-option[data-id="p-order"]')`);
  await evaluate(`document.querySelector('.project-option[data-id="p-order"]').click()`);
  await waitDom(`document.querySelector('.sidebar .project-meta b')?.textContent === '订单中心'`);
  await evaluate(`location.hash = '#/code'`);
  await waitDom(`document.querySelector('.page-title')?.textContent === '代码仓'`);
  check('code sidebar entry opens code repos page', (await evaluate(`(() => { const text = document.querySelector('.sidebar')?.innerText || ''; return text.includes('代码仓') && text.includes('知识库') && !text.includes('代码与文档'); })()`)) === true);
  const codeTabCount = await evaluate(`document.querySelectorAll('#main .tabs .tab').length`);
  check('code page is a pure repo list', codeTabCount === 0 && (await evaluate(`document.querySelectorAll('[data-action="open-repo"]').length`)) >= 4, String(codeTabCount));
  check('code page renders repos', (await evaluate(`document.querySelectorAll('#main .card').length`)) >= 4);
  await sleep(250);
  await send('Page.captureScreenshot', { format: 'png' }).then((shot) => writeFileSync('d:/Code/AI/ai-devops/.tmp-e2e/code-repos.png', Buffer.from(shot.data, 'base64')));

  await evaluate(`location.hash = '#/knowledge'`);
  await waitDom(`document.querySelector('.page-title')?.textContent === '知识库'`);
  check('knowledge sidebar item is active', (await evaluate(`document.querySelector('.sidebar .side-item.active')?.textContent.includes('知识库')`)) === true);
  check('knowledge page renders docs', (await evaluate(`(() => { const main = document.querySelector('#main'); return !!main && main.innerText.includes('订单履约状态机说明') && main.querySelectorAll('tbody tr').length >= 2; })()`)) === true);
  check('knowledge page has rebuild index action', (await evaluate(`!!document.querySelector('[data-action="rebuild-index"]')`)) === true);
  await sleep(250);
  await send('Page.captureScreenshot', { format: 'png' }).then((shot) => writeFileSync('d:/Code/AI/ai-devops/.tmp-e2e/knowledge-base.png', Buffer.from(shot.data, 'base64')));

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
