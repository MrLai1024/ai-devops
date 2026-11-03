# 知识库与平台总库 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把知识库升级为项目文档工作台：双 Tab、全页 Markdown 预览与编辑、可选关联需求、发布到平台总库。

**Architecture:** 继续使用单文件静态原型 `prototype/app.js`，新增文档路由与渲染函数；列表、预览、编辑共用 `DOCS` 内存数据。Markdown 渲染、编辑工具栏、发布状态都在前端完成，不引入依赖。

**Tech Stack:** 原生 HTML / CSS / JavaScript，hash 路由，Node + Edge CDP E2E。

---

## File Structure

- `prototype/app.js` — DOCS 数据、文档路由、列表/预览/编辑渲染、发布与表单逻辑
- `prototype/styles.css` — 知识库工具栏、文档阅读区、编辑器分栏样式
- `prototype/README.md` — 信息架构与演示路径
- `.tmp-e2e/doc-test.mjs` — 新增知识库 E2E 套件（端口 9395）

现有 `prototype/index.html` 不需要修改。

---

## Task 1: 数据模型、路由与知识库列表

**Files:**
- Modify: `prototype/app.js`（DOCS 数据、state、helpers、renderSidebar、renderMain、renderPage、renderKnowledge）
- Modify: `prototype/styles.css`
- Create: `.tmp-e2e/doc-test.mjs`

- [ ] **Step 1: 写失败的列表测试**

创建 `.tmp-e2e/doc-test.mjs`：

```js
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
  check('knowledge has project and global tabs', tabText.length === 2 && tabText[0].includes('本项目文档') && tabText[0].includes('3') && tabText[1].includes('平台总库') && tabText[1].includes('2'), tabText.join(' | '));

  const projectTitles = await evaluate(`Array.from(document.querySelectorAll('#main tbody tr[data-id]')).map((tr) => tr.querySelector('.cell-main b')?.textContent.trim())`);
  check('project tab lists current project docs', projectTitles.includes('订单履约状态机说明') && projectTitles.includes('履约超时预警阈值配置') && projectTitles.includes('订单履约超时预警 PRD') && !projectTitles.includes('客户分层运营 SOP'), projectTitles.join(' | '));
  check('project row shows requirement type and scope', (await evaluate(`(() => { const row = document.querySelector('#main tbody tr[data-id="doc-5"]'); return !!row && row.innerText.includes('RQ-101') && row.innerText.includes('需求规格') && row.innerText.includes('平台总库'); })()`)) === true);

  await evaluate(`(() => { const input = document.querySelector('#doc-search'); input.value = '状态机'; input.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  await waitDom(`document.querySelectorAll('#main tbody tr[data-id]').length === 1 && document.querySelector('#main tbody tr[data-id]')?.dataset.id === 'doc-1'`);
  check('doc search filters title and content', true);

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
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd "d:/Code/AI/ai-devops" && node .tmp-e2e/doc-test.mjs`
Expected: FAIL / timeout，页面没有 `.knowledge-page .tab`。

- [ ] **Step 3: 替换 DOCS 数据**

把 `prototype/app.js` 中现有的 `const DOCS = [...]` 整块替换为：

```js
  const DOCS = [
    {
      id: 'doc-1', projectId: 'p-order', requirementId: 'RQ-112', title: '订单履约状态机说明', type: '方案设计',
      owner: '张明', status: '已索引', createdAt: '2026-10-10', updated: '10:12', updatedBy: '张明',
      published: false, publishedAt: null, publishedBy: null,
      content: '# 订单履约状态机说明\n\n本文描述订单从创建到签收的状态流转、异常分支与补偿策略。\n\n## 状态\n- CREATED\n- PAID\n- PICKED\n- SHIPPED\n- DELIVERED\n- CANCELLED\n\n## 异常\n履约超时、承运商异常、仓库缺货统一进入 EXCEPTION 状态，由自动分派任务处理。\n\n```text\nCREATED -> PAID -> PICKED -> SHIPPED -> DELIVERED\n```\n\n| 状态 | 触发条件 | 后续动作 |\n| --- | --- | --- |\n| PAID | 支付成功 | 生成拣货任务 |\n| EXCEPTION | 超时或异常 | 自动分派 |'
    },
    {
      id: 'doc-2', projectId: 'p-order', requirementId: 'RQ-101', title: '履约超时预警阈值配置', type: '运行手册',
      owner: '陈晨', status: '已索引', createdAt: '2026-10-12', updated: '09:48', updatedBy: '陈晨',
      published: false, publishedAt: null, publishedBy: null,
      content: '# 履约超时预警阈值配置\n\n1. 在订单中心 > 履约配置中新增阈值。\n2. 支持按仓库、承运商、业务线维度覆盖。\n3. 阈值变更即时生效，保留 30 天历史。\n\n> 默认阈值：履约节点超过 30 分钟未推进即触发预警。'
    },
    {
      id: 'doc-3', projectId: 'p-customer', requirementId: null, title: '客户分层运营 SOP', type: '方案设计',
      owner: '李娜', status: '已索引', createdAt: '2026-09-20', updated: '昨天', updatedBy: '李娜',
      published: false, publishedAt: null, publishedBy: null,
      content: '# 客户分层运营 SOP\n\n按活跃度、客单价、复购率将客户分为 S/A/B/C 四层，每层配置不同的触达策略。\n\n## 分层规则\n- S：近 30 天活跃且客单价 Top 10%\n- A：近 90 天活跃且复购 ≥2 次\n- B：有交易但活跃度一般\n- C：长期未活跃'
    },
    {
      id: 'doc-4', projectId: 'p-support', requirementId: 'RQ-107', title: '客服知识库接入说明', type: '方案设计',
      owner: '王磊', status: '索引中', createdAt: '2026-10-21', updated: '10:22', updatedBy: '王磊',
      published: true, publishedAt: '2026-10-23 16:20', publishedBy: '王磊',
      content: '# 客服知识库接入说明\n\n知识库文档经 Embedding 服务写入 Qdrant，问答 Agent 通过 RAG 检索并返回引用。\n\n## 接入步骤\n1. 文档同步到知识库\n2. 触发增量索引\n3. Agent 检索并返回引用\n\n```json\n{"collection":"support-kb","topK":3}\n```'
    },
    {
      id: 'doc-5', projectId: 'p-order', requirementId: 'RQ-101', title: '订单履约超时预警 PRD', type: '需求规格',
      owner: '张明', status: '已索引', createdAt: '2026-10-09', updated: '10:20', updatedBy: '张明',
      published: true, publishedAt: '2026-10-24 09:00', publishedBy: '张明',
      content: '# 订单履约超时预警 PRD\n\n## 背景\n履约节点超时导致客诉上升，需要实时预警。\n\n## 目标\n- 超时 5 分钟内触发告警\n- 支持按仓库/承运商配置阈值\n- 支持站内通知与邮件\n\n## 验收标准\n1. 告警及时率达到 99%\n2. 阈值变更可追溯\n3. 履约看板可查看预警记录'
    },
    {
      id: 'doc-6', projectId: 'p-customer', requirementId: 'RQ-106', title: '客户分层看板测试方案', type: '测试方案',
      owner: '李娜', status: '已索引', createdAt: '2026-10-02', updated: '09:30', updatedBy: '李娜',
      published: false, publishedAt: null, publishedBy: null,
      content: '# 客户分层看板测试方案\n\n## 测试范围\n- 分层看板数据准确性\n- 筛选与导出\n\n## 用例\n| 场景 | 预期 |\n| --- | --- |\n| 按层筛选 | 仅展示对应客户 |\n| 导出 CSV | 字段完整 |'
    }
  ];
```

- [ ] **Step 4: 增加 helpers、state 与路由同步**

在 `projectDocs` 附近增加（`projectRequirements` 已存在，不要重复声明）：

```js
  const docById = (id) => DOCS.find((item) => item.id === id);
  const docTypeOptions = ['需求规格', '方案设计', '测试方案', '运行手册', '其他'];
```

在 `state` 中增加：

```js
    knowledgeTab: 'project',
    knowledgeSearch: '',
    knowledgeType: 'all',
    knowledgeReq: 'all',
    knowledgeSource: 'all',
    docSeq: 6,
    docBaseline: null,
    docHistory: [],
    docRedo: [],
```

在 `repoRouteInfo` 后增加：

```js
  const docRouteInfo = () => {
    const match = state.route.match(/^#\/knowledge\/(?:(global)\/)?([^/?#]+)(\/edit)?\/?$/);
    if (!match) return null;
    return { scope: match[1] ? 'global' : 'project', docId: decodeURIComponent(match[2]), edit: !!match[3] };
  };

  function syncDocProject() {
    const info = docRouteInfo();
    if (!info || info.scope === 'global') return null;
    const doc = docById(info.docId);
    if (!doc) return null;
    state.projectId = doc.projectId;
    state.iterationId = projectById(doc.projectId)?.iterationId || state.iterationId;
    return doc;
  }
```

在 `renderSidebar()` 开头增加 `syncDocProject();`，并把 meta 计算改为：

```js
    const meta = taskIdFromRoute()
      ? ROUTES[state.taskReturn === 'agents' ? '#/agents' : '#/requirements']
      : (repoRouteInfo() ? ROUTES['#/code'] : (docRouteInfo() ? ROUTES['#/knowledge'] : (ROUTES[state.route] || ROUTES['#/projects'])));
```

在 `renderMain()` 开头增加 `syncDocProject();`。

- [ ] **Step 5: 替换知识库列表渲染**

把 `renderKnowledge()` 和 `codeDocsView()` 两个函数整体替换为：

```js
  function renderKnowledge() {
    const project = currentProject();
    const projectCount = projectDocs(project.id).length;
    const globalCount = DOCS.filter((doc) => doc.published).length;
    return `<div class="knowledge-page">
      ${pageHead('知识库', `项目：${esc(project.name)} · 需求规格、方案设计与交付文档`, `<button class="btn btn-primary" type="button" data-action="new-doc">${icon('plus', 14)} 新建文档</button>`)}
      <div class="tabs">
        <button class="tab ${state.knowledgeTab === 'project' ? 'active' : ''}" type="button" data-action="knowledge-tab" data-tab="project">本项目文档 <span class="tab-count">${projectCount}</span></button>
        <button class="tab ${state.knowledgeTab === 'global' ? 'active' : ''}" type="button" data-action="knowledge-tab" data-tab="global">平台总库 <span class="tab-count">${globalCount}</span></button>
      </div>
      ${state.knowledgeTab === 'global' ? renderGlobalDocs() : renderProjectDocs()}
    </div>`;
  }

  function docReqCell(doc) {
    const req = doc.requirementId ? requirementById(doc.requirementId) : null;
    return req ? `<div class="cell-main"><b>${esc(req.id)}</b><small>${esc(req.title)}</small></div>` : '<span class="muted">未关联</span>';
  }

  function docSearchMatches(doc) {
    const query = state.knowledgeSearch.trim().toLowerCase();
    return !query || `${doc.title}\n${doc.content}`.toLowerCase().includes(query);
  }

  function renderProjectDocs() {
    const docs = projectDocs(state.projectId).filter((doc) =>
      (state.knowledgeType === 'all' || doc.type === state.knowledgeType) &&
      (state.knowledgeReq === 'all' || (state.knowledgeReq === 'none' ? !doc.requirementId : doc.requirementId === state.knowledgeReq)) &&
      docSearchMatches(doc));
    const requirements = projectRequirements(state.projectId);
    return `<section class="card"><div class="card-body" style="padding-top:14px;">
      <div class="doc-toolbar">
        <input id="doc-search" class="input doc-search" type="search" placeholder="搜索标题或正文" value="${esc(state.knowledgeSearch)}" aria-label="搜索文档">
        <select id="doc-type-filter" class="select" data-action="doc-type-filter" aria-label="按类型筛选">
          <option value="all" ${state.knowledgeType === 'all' ? 'selected' : ''}>全部类型</option>
          ${docTypeOptions.map((type) => `<option value="${type}" ${state.knowledgeType === type ? 'selected' : ''}>${type}</option>`).join('')}
        </select>
        <select id="doc-req-filter" class="select" data-action="doc-req-filter" aria-label="按需求筛选">
          <option value="all" ${state.knowledgeReq === 'all' ? 'selected' : ''}>全部需求</option>
          <option value="none" ${state.knowledgeReq === 'none' ? 'selected' : ''}>未关联</option>
          ${requirements.map((req) => `<option value="${req.id}" ${state.knowledgeReq === req.id ? 'selected' : ''}>${esc(req.id)} · ${esc(req.title)}</option>`).join('')}
        </select>
        <button class="btn btn-outline btn-sm" type="button" data-action="rebuild-index">${icon('refresh', 13)} 重建索引</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>文档</th><th>类型</th><th>关联需求</th><th>Owner</th><th>检索范围</th><th>RAG 状态</th><th>更新</th><th></th></tr></thead>
        <tbody>
          ${docs.length ? docs.map((doc) => `<tr class="row-click" data-action="open-doc-page" data-id="${doc.id}" data-scope="project" tabindex="0">
            <td><div class="cell-main"><b>${esc(doc.title)}</b><small>${esc(doc.id)}</small></div></td>
            <td>${esc(doc.type)}</td>
            <td>${docReqCell(doc)}</td>
            <td>${esc(doc.owner)}</td>
            <td>${doc.published ? '<span class="tag">平台总库</span>' : '<span class="tag">仅本项目</span>'}</td>
            <td>${pill(doc.status)}</td>
            <td class="nowrap">${esc(doc.updated)}</td>
            <td><span class="muted">→</span></td>
          </tr>`).join('') : `<tr><td colspan="8">${emptyTable('当前筛选下没有文档')}</td></tr>`}
        </tbody>
      </table></div>
    </div></section>`;
  }

  function renderGlobalDocs() {
    const sources = PROJECTS.filter((project) => DOCS.some((doc) => doc.published && doc.projectId === project.id));
    const docs = DOCS.filter((doc) => doc.published)
      .filter((doc) => state.knowledgeType === 'all' || doc.type === state.knowledgeType)
      .filter((doc) => state.knowledgeSource === 'all' || doc.projectId === state.knowledgeSource)
      .filter(docSearchMatches);
    return `<section class="card"><div class="card-body" style="padding-top:14px;">
      <div class="doc-toolbar">
        <input id="doc-search" class="input doc-search" type="search" placeholder="搜索平台总库" value="${esc(state.knowledgeSearch)}" aria-label="搜索平台总库">
        <select id="doc-type-filter" class="select" data-action="doc-type-filter" aria-label="按类型筛选">
          <option value="all" ${state.knowledgeType === 'all' ? 'selected' : ''}>全部类型</option>
          ${docTypeOptions.map((type) => `<option value="${type}" ${state.knowledgeType === type ? 'selected' : ''}>${type}</option>`).join('')}
        </select>
        <select id="doc-source-filter" class="select" data-action="doc-source-filter" aria-label="按来源项目筛选">
          <option value="all" ${state.knowledgeSource === 'all' ? 'selected' : ''}>全部项目</option>
          ${sources.map((project) => `<option value="${project.id}" ${state.knowledgeSource === project.id ? 'selected' : ''}>${esc(project.name)}</option>`).join('')}
        </select>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>文档</th><th>类型</th><th>来源项目</th><th>Owner</th><th>更新</th><th></th></tr></thead>
        <tbody>
          ${docs.length ? docs.map((doc) => `<tr class="row-click" data-action="open-doc-page" data-id="${doc.id}" data-scope="global" tabindex="0">
            <td><div class="cell-main"><b>${esc(doc.title)}</b><small>${esc(doc.id)}</small></div></td>
            <td>${esc(doc.type)}</td>
            <td>${esc(projectById(doc.projectId)?.name || '—')}</td>
            <td>${esc(doc.owner)}</td>
            <td class="nowrap">${esc(doc.updated)}</td>
            <td><span class="muted">→</span></td>
          </tr>`).join('') : `<tr><td colspan="6">${emptyTable('平台总库还没有公开文档')}</td></tr>`}
        </tbody>
      </table></div>
    </div></section>`;
  }
```

- [ ] **Step 6: 接入 Tab、筛选与输入事件**

先删除旧抽屉路径：删除 `openDocDrawer(id)` 函数，以及 click 事件中的 `if (action === 'open-doc') { openDocDrawer(id); return; }` 分支；确认 `openDocDrawer` 与 `open-doc` 已无引用。

在 click 事件处理中增加：

```js
        if (action === 'knowledge-tab') {
          state.knowledgeTab = target.dataset.tab;
          state.knowledgeSearch = '';
          state.knowledgeType = 'all';
          state.knowledgeReq = 'all';
          state.knowledgeSource = 'all';
          renderMain();
          return;
        }
```

在 change 事件处理中增加：

```js
      if (action === 'doc-type-filter') { state.knowledgeType = target.value; renderMain(); return; }
      if (action === 'doc-req-filter') { state.knowledgeReq = target.value; renderMain(); return; }
      if (action === 'doc-source-filter') { state.knowledgeSource = target.value; renderMain(); return; }
```

在 input 事件处理中增加：

```js
      if (id === 'doc-search') { state.knowledgeSearch = event.target.value; rerenderPreserve('doc-search'); return; }
```

- [ ] **Step 7: 增加列表样式**

在 `prototype/styles.css` 的表格/工具栏区域追加：

```css
.knowledge-page { min-width: 0; }
.doc-toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.doc-toolbar .doc-search { width: 220px; }
.doc-toolbar .select { width: auto; min-width: 128px; }
.doc-toolbar .btn { margin-left: auto; }
```

- [ ] **Step 8: 运行知识库测试**

Run: `cd "d:/Code/AI/ai-devops" && node .tmp-e2e/doc-test.mjs`
Expected: `9/9 checks passed`.

- [ ] **Step 9: 运行需求回归**

Run: `cd "d:/Code/AI/ai-devops" && node .tmp-e2e/req-test.mjs`
Expected: `73/73 checks passed`（知识库既有断言仍成立）。

- [ ] **Step 10: 提交**

```bash
cd "d:/Code/AI/ai-devops"
git add prototype/app.js prototype/styles.css .tmp-e2e/doc-test.mjs
git commit -m "feat: add knowledge base tabs and document list" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Task 2: Markdown 渲染与文档预览页

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`
- Modify: `.tmp-e2e/doc-test.mjs`

- [ ] **Step 1: 追加失败的预览测试**

在 `.tmp-e2e/doc-test.mjs` 的 `check('no console errors', ...)` 之前插入：

```js
  await evaluate(`document.querySelector('[data-action="knowledge-tab"][data-tab="project"]').click()`);
  await waitDom(`document.querySelectorAll('#main tbody tr[data-id]').length === 3`);
  await evaluate(`document.querySelector('#main tbody tr[data-id="doc-1"]').click()`);
  await waitDom(`location.hash === '#/knowledge/doc-1' && !!document.querySelector('.doc-page')`);
  check('doc row opens preview page', (await evaluate(`document.querySelector('.doc-title')?.textContent.trim() === '订单履约状态机说明'`)) === true);
  check('preview renders markdown', (await evaluate(`(() => { const content = document.querySelector('.doc-content'); return !!content && !!content.querySelector('h1') && !!content.querySelector('ul') && !!content.querySelector('pre code') && !!content.querySelector('table'); })()`)) === true);
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
  await waitDom(`location.hash === '#/knowledge'`);
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd "d:/Code/AI/ai-devops" && node .tmp-e2e/doc-test.mjs`
Expected: 首个预览断言失败或超时。

- [ ] **Step 3: 增加 Markdown 渲染与预览函数**

在 helper 区域（`dateAfter` 之后）增加：

```js
  function renderInlineMarkdown(text) {
    const codeSpans = [];
    let html = esc(text).replace(/`([^`]+)`/g, (match, code) => {
      codeSpans.push(code);
      return `\u0000${codeSpans.length - 1}\u0000`;
    });
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
    html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    return html.replace(/\u0000(\d+)\u0000/g, (match, index) => `<code>${codeSpans[Number(index)]}</code>`);
  }

  const isMarkdownBlockStart = (line) => /^(#{1,6})\s+/.test(line) || /^```/.test(line) || /^>\s?/.test(line) || /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line) || /^---+$/.test(line.trim()) || /^\|/.test(line.trim());

  function renderMarkdown(source) {
    const lines = String(source || '').replace(/\r\n/g, '\n').split('\n');
    const html = [];
    let index = 0;
    while (index < lines.length) {
      const line = lines[index];
      if (!line.trim()) { index += 1; continue; }
      if (/^```/.test(line)) {
        const code = [];
        index += 1;
        while (index < lines.length && !/^```/.test(lines[index])) { code.push(lines[index]); index += 1; }
        index += 1;
        html.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`);
        continue;
      }
      const heading = line.match(/^(#{1,6})\s+(.*)$/);
      if (heading) {
        html.push(`<h${heading[1].length}>${renderInlineMarkdown(heading[2])}</h${heading[1].length}>`);
        index += 1;
        continue;
      }
      if (/^---+$/.test(line.trim())) { html.push('<hr>'); index += 1; continue; }
      if (/^>\s?/.test(line)) {
        const quote = [];
        while (index < lines.length && /^>\s?/.test(lines[index])) { quote.push(lines[index].replace(/^>\s?/, '')); index += 1; }
        html.push(`<blockquote>${quote.map((item) => renderInlineMarkdown(item)).join('<br>')}</blockquote>`);
        continue;
      }
      if (/^[-*]\s+/.test(line)) {
        const items = [];
        while (index < lines.length && /^[-*]\s+/.test(lines[index])) { items.push(lines[index].replace(/^[-*]\s+/, '')); index += 1; }
        html.push(`<ul>${items.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join('')}</ul>`);
        continue;
      }
      if (/^\d+\.\s+/.test(line)) {
        const items = [];
        while (index < lines.length && /^\d+\.\s+/.test(lines[index])) { items.push(lines[index].replace(/^\d+\.\s+/, '')); index += 1; }
        html.push(`<ol>${items.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join('')}</ol>`);
        continue;
      }
      if (line.includes('|') && index + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[index + 1])) {
        const parseRow = (row) => row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
        const headers = parseRow(line);
        index += 2;
        const rows = [];
        while (index < lines.length && lines[index].includes('|')) { rows.push(parseRow(lines[index])); index += 1; }
        html.push(`<div class="doc-table-wrap"><table><thead><tr>${headers.map((cell) => `<th>${renderInlineMarkdown(cell)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${renderInlineMarkdown(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
        continue;
      }
      const paragraph = [line];
      index += 1;
      while (index < lines.length && lines[index].trim() && !isMarkdownBlockStart(lines[index])) { paragraph.push(lines[index]); index += 1; }
      html.push(`<p>${renderInlineMarkdown(paragraph.join(' '))}</p>`);
    }
    return html.join('');
  }
```

- [ ] **Step 4: 增加预览路由与渲染**

在 `renderPage()` 的 repo 判断后增加：

```js
    const docInfo = docRouteInfo();
    if (docInfo) return renderDocRoute(docInfo);
```

在 `renderKnowledge` 附近增加：

```js
  function renderDocRoute(info) {
    const doc = docById(info.docId);
    if (!doc) return renderDocNotFound();
    if (info.scope === 'global' && !doc.published) return renderDocNotFound();
    if (info.edit && (info.scope === 'global' || doc.projectId !== state.projectId)) return renderDocNotFound();
    if (info.scope === 'project' && doc.projectId !== state.projectId) return renderDocNotFound();
    return info.edit ? renderDocEditor(doc, info) : renderDocPreview(doc, info);
  }

  function renderDocNotFound() {
    return `<div class="empty">
      <div class="empty-icon">${icon('file', 30)}</div>
      <h2>文档不存在或无权访问</h2>
      <p>该文档可能已取消发布，或不属于当前项目。</p>
      <button class="btn btn-primary" type="button" data-action="back-to-knowledge" data-tab="project">返回知识库</button>
    </div>`;
  }

  function renderDocPreview(doc, info) {
    const project = projectById(doc.projectId);
    const req = doc.requirementId ? requirementById(doc.requirementId) : null;
    const own = doc.projectId === state.projectId;
    const isGlobal = info.scope === 'global';
    return `<div class="doc-page">
      <button class="doc-back" type="button" data-action="back-to-knowledge" data-tab="${isGlobal ? 'global' : 'project'}">← 返回知识库</button>
      <div class="doc-header">
        <div class="doc-title-row"><span class="tag">${esc(doc.type)}</span>${pill(doc.status)}<span class="tag">${doc.published ? '平台总库' : '仅本项目'}</span>${own ? '' : '<span class="tag">只读</span>'}</div>
        <h1 class="doc-title">${esc(doc.title)}</h1>
        <div class="doc-meta"><span>${esc(doc.id)}</span><span>${esc(doc.owner)}</span><span>更新 ${esc(doc.updated)}</span>${isGlobal ? `<span>来源：${esc(project?.name || '—')}</span>` : ''}</div>
      </div>
      ${own ? `<div class="doc-actions">
        <button class="btn btn-primary" type="button" data-action="edit-doc" data-id="${doc.id}">${icon('file', 14)} 编辑</button>
        <button class="btn btn-outline" type="button" data-action="toggle-doc-publish" data-id="${doc.id}">${doc.published ? '取消发布' : '同步到平台总库'}</button>
      </div>` : ''}
      <div class="doc-layout">
        <section class="card doc-main"><article class="doc-content">${renderMarkdown(doc.content) || '<p class="muted">暂无正文</p>'}</article></section>
        <aside class="card doc-meta-card">
          <div class="drawer-section-title">文档信息</div>
          <div class="meta-grid">
            <div class="meta-item"><div class="meta-label">文档类型</div><div class="meta-value">${esc(doc.type)}</div></div>
            <div class="meta-item"><div class="meta-label">负责人</div><div class="meta-value">${esc(doc.owner)}</div></div>
            <div class="meta-item"><div class="meta-label">创建时间</div><div class="meta-value">${esc(doc.createdAt || '—')}</div></div>
            <div class="meta-item"><div class="meta-label">更新时间</div><div class="meta-value">${esc(doc.updated)}</div></div>
            <div class="meta-item"><div class="meta-label">RAG 状态</div><div class="meta-value">${pill(doc.status)}</div></div>
            <div class="meta-item"><div class="meta-label">检索范围</div><div class="meta-value">${doc.published ? '平台总库' : '仅本项目'}</div></div>
          </div>
          <div class="divider"></div>
          <div class="meta-item"><div class="meta-label">关联需求</div><div class="meta-value">${req ? (own ? `<button class="card-link" type="button" data-action="open-req" data-id="${req.id}">${esc(req.id)} · ${esc(req.title)}</button>` : `${esc(req.id)} · ${esc(req.title)}`) : '未关联'}</div></div>
          ${doc.published ? `<div class="form-hint" style="margin-top:10px;">已同步至平台总库：${esc(doc.publishedBy || '—')} · ${esc(doc.publishedAt || '—')}</div>` : ''}
        </aside>
      </div>
    </div>`;
  }
```

- [ ] **Step 5: 接入预览操作**

在 click 事件处理中增加：

```js
        if (action === 'open-doc-page') { navigate(target.dataset.scope === 'global' ? `#/knowledge/global/${id}` : `#/knowledge/${id}`); return; }
        if (action === 'back-to-knowledge') { state.knowledgeTab = target.dataset.tab || 'project'; navigate('#/knowledge'); return; }
        if (action === 'edit-doc') { navigate(`#/knowledge/${id}/edit`); return; }
```

`toggle-doc-publish` 在 Task 5 接入。

- [ ] **Step 6: 增加预览样式**

在 `prototype/styles.css` 追加：

```css
.doc-back { align-self: flex-start; padding: 0; border: 0; background: none; color: #64748b; font-family: inherit; font-size: 11px; cursor: pointer; }
.doc-back:hover { color: #0369a1; }
.doc-page { display: flex; flex-direction: column; gap: 14px; }
.doc-header { display: flex; flex-direction: column; gap: 8px; }
.doc-title-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.doc-title { font-size: 26px; font-weight: 800; letter-spacing: -.03em; color: #14263d; line-height: 1.2; }
.doc-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; font-size: 11px; color: #94a3b8; }
.doc-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.doc-layout { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 16px; align-items: start; }
.doc-main { padding: 26px 30px; }
.doc-main .doc-content { max-width: 860px; }
.doc-meta-card { padding: 18px; }
.doc-meta-card .meta-grid { grid-template-columns: 1fr 1fr; }
.doc-content { font-size: 13px; line-height: 1.85; color: #334155; overflow-wrap: anywhere; }
.doc-content h1, .doc-content h2, .doc-content h3, .doc-content h4 { color: #14263d; letter-spacing: -.02em; line-height: 1.35; margin: 1.2em 0 .55em; }
.doc-content h1 { font-size: 22px; margin-top: 0; }
.doc-content h2 { font-size: 18px; }
.doc-content h3 { font-size: 15px; }
.doc-content p { margin: .65em 0; }
.doc-content ul, .doc-content ol { margin: .65em 0; padding-left: 1.5em; }
.doc-content li { margin: .25em 0; }
.doc-content blockquote { margin: .9em 0; padding: 8px 13px; border-left: 3px solid #7dd3fc; background: #f8fcff; color: #475569; }
.doc-content code { padding: 1px 5px; border-radius: 5px; background: #eef4f8; color: #0f5b8a; font-family: var(--mono); font-size: 11px; }
.doc-content pre { margin: .9em 0; padding: 12px 14px; border: 1px solid #e2edf5; border-radius: 9px; background: #f8fbfd; overflow: auto; }
.doc-content pre code { padding: 0; background: none; font-size: 11px; line-height: 1.6; }
.doc-content a { color: #0284c7; text-decoration: underline; text-underline-offset: 2px; }
.doc-content hr { margin: 1.2em 0; border: 0; border-top: 1px solid #e2e8f0; }
.doc-content table { width: 100%; border-collapse: collapse; margin: .9em 0; font-size: 12px; }
.doc-content th, .doc-content td { padding: 7px 9px; border: 1px solid #e6eef5; text-align: left; }
.doc-content th { background: #f6fafd; color: #334155; }
.doc-table-wrap { overflow-x: auto; }
@media (max-width: 1000px) {
  .doc-layout { grid-template-columns: 1fr; }
}
```

- [ ] **Step 7: 运行测试**

Run: `cd "d:/Code/AI/ai-devops" && node .tmp-e2e/doc-test.mjs`
Expected: 17/17 checks passed。

- [ ] **Step 8: 提交**

```bash
cd "d:/Code/AI/ai-devops"
git add prototype/app.js prototype/styles.css .tmp-e2e/doc-test.mjs
git commit -m "feat: add knowledge document preview" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Task 3: 文档编辑页与 Markdown 工具栏

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`
- Modify: `.tmp-e2e/doc-test.mjs`

- [ ] **Step 1: 追加失败的编辑测试**

在 `.tmp-e2e/doc-test.mjs` 的 `check('no console errors', ...)` 之前插入：

```js
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
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd "d:/Code/AI/ai-devops" && node .tmp-e2e/doc-test.mjs`
Expected: 编辑路由超时或 `#doc-edit-form` 不存在。

- [ ] **Step 3: 增加编辑页渲染**

在 `renderDocPreview` 后增加：

```js
  function renderDocEditor(doc, info) {
    const reqs = projectRequirements(doc.projectId);
    state.docBaseline = { title: doc.title, type: doc.type, requirementId: doc.requirementId || '', content: doc.content };
    state.docHistory = [{ value: doc.content, start: 0, end: 0 }];
    state.docRedo = [];
    const toolbar = [
      ['h1', 'H1'], ['h2', 'H2'], ['bold', 'B'], ['italic', 'I'], ['strike', 'S'],
      ['ul', '• 列表'], ['ol', '1. 列表'], ['quote', '引用'], ['inline-code', '`代码`'],
      ['code', '代码块'], ['link', '链接'], ['table', '表格'], ['hr', '分割线'], ['undo', '撤销'], ['redo', '重做']
    ];
    return `<div class="doc-page">
      <button class="doc-back" type="button" data-action="back-doc-preview" data-id="${doc.id}">← 返回预览</button>
      ${pageHead('编辑文档', `${doc.id} · ${esc(projectById(doc.projectId)?.name || '')}`, `<button class="btn btn-outline" type="button" data-action="cancel-doc-edit" data-id="${doc.id}">取消</button><button class="btn btn-primary" type="submit" form="doc-edit-form">保存</button>`)}
      <form id="doc-edit-form" data-form="save-doc" data-id="${doc.id}">
        <div class="card doc-edit-meta">
          <div class="field-row">
            <div class="field"><label for="doc-title">文档标题</label><input id="doc-title" name="title" class="input" required maxlength="80" value="${esc(doc.title)}"></div>
            <div class="field"><label for="doc-type">文档类型</label><select id="doc-type" name="type" class="select">${docTypeOptions.map((type) => `<option ${doc.type === type ? 'selected' : ''}>${type}</option>`).join('')}</select></div>
          </div>
          <div class="field"><label for="doc-requirement">关联需求（可选）</label><select id="doc-requirement" name="requirementId" class="select"><option value="">不关联</option>${reqs.map((req) => `<option value="${req.id}" ${doc.requirementId === req.id ? 'selected' : ''}>${esc(req.id)} · ${esc(req.title)}</option>`).join('')}</select></div>
        </div>
        <div class="card doc-toolbar doc-format-toolbar">${toolbar.map(([format, label]) => `<button class="doc-tool-btn" type="button" data-action="doc-format" data-format="${format}" title="${label}">${label}</button>`).join('')}</div>
        <div class="doc-split">
          <div class="card doc-pane"><div class="doc-pane-head">Markdown</div><textarea id="doc-content-input" name="content" class="doc-source" spellcheck="false">${esc(doc.content)}</textarea></div>
          <div class="card doc-pane"><div class="doc-pane-head">实时预览</div><div id="doc-preview" class="doc-content doc-preview">${renderMarkdown(doc.content)}</div></div>
        </div>
        <div class="doc-edit-foot"><span id="doc-word-count">字数 ${doc.content.replace(/\s/g, '').length}</span><span class="muted">保存后会重新索引；已发布文档会同步更新平台总库。</span></div>
      </form>
    </div>`;
  }
```

在 `renderDocRoute` 中已经调用 `renderDocEditor`，无需改动。

- [ ] **Step 4: 增加工具栏、预览同步与历史**

在 helper 函数附近增加：

```js
  function applyDocFormat(format) {
    const input = $('#doc-content-input');
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selected = input.value.slice(start, end);
    const insert = (before, after = '', placeholder = '') => {
      const text = selected || placeholder;
      input.setRangeText(`${before}${text}${after}`, start, end, 'end');
      input.focus();
      input.setSelectionRange(start + before.length, start + before.length + text.length);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const prefixes = { h1: '# ', h2: '## ', ul: '- ', ol: '1. ', quote: '> ' };
    if (prefixes[format]) { insert(prefixes[format], '', '内容'); return; }
    if (format === 'bold') { insert('**', '**', '加粗文本'); return; }
    if (format === 'italic') { insert('*', '*', '斜体文本'); return; }
    if (format === 'strike') { insert('~~', '~~', '删除线'); return; }
    if (format === 'inline-code') { insert('`', '`', '代码'); return; }
    if (format === 'code') { insert('```\n', '\n```', '代码'); return; }
    if (format === 'link') { insert('[', '](https://)', '链接文本'); return; }
    if (format === 'table') { insert('| 列 1 | 列 2 |\n| --- | --- |\n| 内容 | 内容 |', ''); return; }
    if (format === 'hr') { insert('\n---\n', ''); return; }
    if (format === 'undo') { undoDocEdit(); return; }
    if (format === 'redo') { redoDocEdit(); return; }
  }

  function pushDocHistory(value, start, end) {
    const last = state.docHistory[state.docHistory.length - 1];
    if (last && last.value === value) return;
    state.docHistory.push({ value, start, end });
    if (state.docHistory.length > 100) state.docHistory.shift();
    state.docRedo = [];
  }

  function applyDocEditorValue(snapshot) {
    const input = $('#doc-content-input');
    if (!input) return;
    input.value = snapshot.value;
    input.focus();
    input.setSelectionRange(snapshot.start, snapshot.end);
    const preview = $('#doc-preview');
    if (preview) preview.innerHTML = renderMarkdown(snapshot.value);
    const count = $('#doc-word-count');
    if (count) count.textContent = `字数 ${snapshot.value.replace(/\s/g, '').length}`;
  }

  function undoDocEdit() {
    if (state.docHistory.length <= 1) return;
    state.docRedo.push(state.docHistory.pop());
    applyDocEditorValue(state.docHistory[state.docHistory.length - 1]);
  }

  function redoDocEdit() {
    const next = state.docRedo.pop();
    if (!next) return;
    state.docHistory.push(next);
    applyDocEditorValue(next);
  }
```

- [ ] **Step 5: 增加保存、取消与输入事件**

在 `submitMcpTest` 函数之前增加：

```js
  function submitDocEdit(form) {
    const doc = docById(form.dataset.id);
    if (!doc) return;
    const data = new FormData(form);
    const title = String(data.get('title') || '').trim();
    const type = String(data.get('type') || '');
    const requirementId = String(data.get('requirementId') || '');
    const content = String(data.get('content') || '');
    if (!title) { toast('请填写文档标题。', 'warning'); return; }
    if (requirementId && !REQUIREMENTS.some((item) => item.id === requirementId && item.projectId === doc.projectId)) { toast('关联需求不属于当前项目。', 'warning'); return; }
    doc.title = title;
    doc.type = docTypeOptions.includes(type) ? type : doc.type;
    doc.requirementId = requirementId || null;
    doc.content = content;
    doc.updated = nowTime();
    doc.updatedBy = '张明';
    doc.status = '索引中';
    audit('更新文档', doc.id, '成功', { after: { title: doc.title, type: doc.type, requirementId: doc.requirementId } });
    navigate(`#/knowledge/${doc.id}`);
    toast('文档已保存，正在重新索引。', 'success', '文档已保存');
    setTimeout(() => {
      const target = docById(doc.id);
      if (!target) return;
      target.status = '已索引';
      if (state.route === `#/knowledge/${doc.id}`) renderMain();
    }, 1200);
  }

  function cancelDocEdit(id) {
    const form = $('#doc-edit-form');
    const doc = docById(id);
    if (!form || !doc) { navigate(`#/knowledge/${id}`); return; }
    const data = new FormData(form);
    const baseline = state.docBaseline || {};
    const changed = String(data.get('title') || '') !== (baseline.title || '') ||
      String(data.get('type') || '') !== (baseline.type || '') ||
      String(data.get('requirementId') || '') !== (baseline.requirementId || '') ||
      String(data.get('content') || '') !== (baseline.content || '');
    if (!changed) { navigate(`#/knowledge/${id}`); return; }
    openPanel({
      title: '放弃修改？', sub: `${doc.id} · 未保存的修改将丢失`, variant: 'modal',
      body: '<div class="release-note"><b>当前文档有未保存的修改。</b><br>放弃后内容会恢复到最近一次保存的版本。</div>',
      footer: `<button class="btn btn-outline" type="button" data-action="close-overlay">继续编辑</button><button class="btn btn-danger" type="button" data-action="confirm-doc-discard" data-id="${doc.id}">放弃修改</button>`
    });
  }
```

在 click 事件中增加：

```js
        if (action === 'doc-format') { applyDocFormat(target.dataset.format); return; }
        if (action === 'cancel-doc-edit') { cancelDocEdit(id); return; }
        if (action === 'back-doc-preview') { navigate(`#/knowledge/${id}`); return; }
        if (action === 'confirm-doc-discard') { navigate(`#/knowledge/${id}`); return; }
```

在 input 事件中增加：

```js
      if (id === 'doc-content-input') {
        const value = event.target.value;
        const preview = $('#doc-preview');
        if (preview) preview.innerHTML = renderMarkdown(value);
        const count = $('#doc-word-count');
        if (count) count.textContent = `字数 ${value.replace(/\s/g, '').length}`;
        pushDocHistory(value, event.target.selectionStart, event.target.selectionEnd);
        return;
      }
```

在 submit 事件中增加：

```js
      else if (type === 'save-doc') submitDocEdit(form);
```

- [ ] **Step 6: 增加编辑页样式**

在 `prototype/styles.css` 追加：

```css
.doc-edit-meta { padding: 16px; margin-bottom: 12px; }
.doc-edit-meta .field-row { display: grid; grid-template-columns: minmax(0, 2fr) minmax(140px, 1fr); gap: 12px; }
.doc-format-toolbar { padding: 7px 9px; margin-bottom: 12px; position: sticky; top: 60px; z-index: 4; }
.doc-tool-btn { padding: 5px 8px; border: 1px solid #e2eaf2; border-radius: 7px; background: #fff; color: #475569; font-family: inherit; font-size: 10.5px; font-weight: 650; cursor: pointer; }
.doc-tool-btn:hover { border-color: #bae6fd; background: #f8fcff; color: #0369a1; }
.doc-split { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px; }
.doc-pane { display: flex; flex-direction: column; overflow: hidden; }
.doc-pane-head { padding: 8px 12px; border-bottom: 1px solid #eef4f8; background: #fbfdff; color: #8da0b5; font-size: 10px; font-weight: 700; letter-spacing: .04em; }
.doc-source { width: 100%; min-height: 520px; padding: 14px 16px; border: 0; outline: none; resize: vertical; background: #fff; color: #334155; font-family: var(--mono); font-size: 12px; line-height: 1.75; }
.doc-preview { min-height: 520px; max-height: 70vh; overflow: auto; padding: 16px 18px; }
.doc-edit-foot { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 10px; font-size: 10.5px; color: #94a3b8; }
@media (max-width: 1000px) {
  .doc-split { grid-template-columns: 1fr; }
  .doc-source, .doc-preview { min-height: 320px; }
}
```

- [ ] **Step 7: 运行测试**

Run: `cd "d:/Code/AI/ai-devops" && node .tmp-e2e/doc-test.mjs`
Expected: 26/26 checks passed。

- [ ] **Step 8: 提交**

```bash
cd "d:/Code/AI/ai-devops"
git add prototype/app.js prototype/styles.css .tmp-e2e/doc-test.mjs
git commit -m "feat: add markdown document editor" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Task 4: 新建文档

**Files:**
- Modify: `prototype/app.js`
- Modify: `.tmp-e2e/doc-test.mjs`

- [ ] **Step 1: 追加失败的创建测试**

在 `.tmp-e2e/doc-test.mjs` 的 `check('no console errors', ...)` 之前插入：

```js
  await evaluate(`location.hash = '#/knowledge'`);
  await waitDom(`!!document.querySelector('.knowledge-page')`);
  await evaluate(`document.querySelector('[data-action="knowledge-tab"][data-tab="project"]').click()`);
  await waitDom(`document.querySelectorAll('#main tbody tr[data-id]').length === 3`);
  await evaluate(`document.querySelector('[data-action="new-doc"]').click()`);
  await waitDom(`!!document.querySelector('#doc-form')`);
  await evaluate(`(() => { const form = document.querySelector('#doc-form'); form.elements.title.value = '支付回滚方案'; form.elements.type.value = '方案设计'; form.elements.requirementId.value = 'RQ-102'; form.elements.content.value = '# 支付回滚方案\\n\\n回滚策略与补偿流程。'; form.requestSubmit(); return true; })()`);
  await waitDom(`location.hash === '#/knowledge/doc-7/edit' && !!document.querySelector('#doc-edit-form')`);
  check('new doc opens editor with requirement', (await evaluate(`document.querySelector('#doc-title')?.value === '支付回滚方案' && document.querySelector('#doc-requirement')?.value === 'RQ-102' && document.querySelector('#doc-content-input')?.value.includes('回滚策略')`)) === true);
  await evaluate(`document.querySelector('#doc-edit-form').requestSubmit()`);
  await waitDom(`location.hash === '#/knowledge/doc-7' && !!document.querySelector('.doc-page')`);
  await evaluate(`document.querySelector('[data-action="back-to-knowledge"]').click()`);
  await waitDom(`document.querySelectorAll('#main tbody tr[data-id]').length === 4`);
  check('new doc appears in project list', (await evaluate(`(() => { const row = document.querySelector('#main tbody tr[data-id="doc-7"]'); return !!row && row.innerText.includes('支付回滚方案') && row.innerText.includes('RQ-102'); })()`)) === true);

  await evaluate(`document.querySelector('[data-action="new-doc"]').click()`);
  await waitDom(`!!document.querySelector('#doc-form')`);
  await evaluate(`(() => { const form = document.querySelector('#doc-form'); form.elements.title.value = '项目交付规范'; form.elements.type.value = '其他'; form.elements.requirementId.value = ''; form.requestSubmit(); return true; })()`);
  await waitDom(`location.hash === '#/knowledge/doc-8/edit' && !!document.querySelector('#doc-edit-form')`);
  check('new doc can skip requirement', (await evaluate(`document.querySelector('#doc-requirement')?.value === ''`)) === true);
  await evaluate(`document.querySelector('#doc-edit-form').requestSubmit()`);
  await waitDom(`location.hash === '#/knowledge/doc-8'`);
  await evaluate(`document.querySelector('[data-action="back-to-knowledge"]').click()`);
  await waitDom(`document.querySelectorAll('#main tbody tr[data-id]').length === 5`);
  check('project-level doc shows unlinked requirement', (await evaluate(`document.querySelector('#main tbody tr[data-id="doc-8"]')?.innerText.includes('未关联')`)) === true);
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd "d:/Code/AI/ai-devops" && node .tmp-e2e/doc-test.mjs`
Expected: 新建弹窗不存在，超时。

- [ ] **Step 3: 增加新建文档表单与提交**

在 `openDocForm` 应放置的位置（`openTaskForm` 之前）增加：

```js
  function openDocForm() {
    const reqs = projectRequirements(state.projectId);
    openPanel({
      title: '新建文档', sub: `${currentProject().name} · 项目知识库`, variant: 'modal',
      body: `<form id="doc-form" data-form="create-doc">
        <div class="field-row">
          <div class="field"><label for="new-doc-title">文档标题</label><input id="new-doc-title" name="title" class="input" required maxlength="80" placeholder="例如：支付回滚方案"></div>
          <div class="field"><label for="new-doc-type">文档类型</label><select id="new-doc-type" name="type" class="select">${docTypeOptions.map((type) => `<option ${type === '需求规格' ? 'selected' : ''}>${type}</option>`).join('')}</select></div>
        </div>
        <div class="field"><label for="new-doc-requirement">关联需求（可选）</label><select id="new-doc-requirement" name="requirementId" class="select"><option value="">不关联</option>${reqs.map((req) => `<option value="${req.id}">${esc(req.id)} · ${esc(req.title)}</option>`).join('')}</select></div>
        <div class="field"><label for="new-doc-content">初始内容（可选）</label><textarea id="new-doc-content" name="content" class="textarea" rows="4" placeholder="留空时自动生成一级标题"></textarea></div>
        <div class="form-hint">文档默认仅本项目可检索；创建后可在预览页同步到平台总库。</div>
        <div class="btn-row" style="justify-content:flex-end;margin-top:18px;"><button class="btn btn-outline" type="button" data-action="close-overlay">取消</button><button class="btn btn-primary" type="submit">创建并编辑</button></div>
      </form>`
    });
  }

  function submitDocCreate(form) {
    const data = new FormData(form);
    const title = String(data.get('title') || '').trim();
    const type = String(data.get('type') || '需求规格');
    const requirementId = String(data.get('requirementId') || '');
    const content = String(data.get('content') || '');
    if (!title) { toast('请填写文档标题。', 'warning'); return; }
    if (requirementId && !REQUIREMENTS.some((item) => item.id === requirementId && item.projectId === state.projectId)) { toast('关联需求不属于当前项目。', 'warning'); return; }
    const doc = {
      id: `doc-${++state.docSeq}`,
      projectId: state.projectId,
      requirementId: requirementId || null,
      title,
      type: docTypeOptions.includes(type) ? type : '需求规格',
      owner: '张明',
      status: '索引中',
      createdAt: nowDate(),
      updated: nowTime(),
      updatedBy: '张明',
      published: false,
      publishedAt: null,
      publishedBy: null,
      content: content.trim() ? content : `# ${title}\n\n`
    };
    DOCS.unshift(doc);
    audit('创建文档', doc.id, '成功', { after: { title: doc.title, type: doc.type, requirementId: doc.requirementId } });
    closeOverlay();
    navigate(`#/knowledge/${doc.id}/edit`);
    toast('文档已创建，正在索引。', 'success', '文档已创建');
    setTimeout(() => {
      doc.status = '已索引';
      if (state.route === `#/knowledge/${doc.id}/edit` || state.route === `#/knowledge/${doc.id}`) renderMain();
    }, 1200);
  }
```

在 click 事件中增加：

```js
        if (action === 'new-doc') { openDocForm(); return; }
```

在 submit 事件中增加：

```js
      else if (type === 'create-doc') submitDocCreate(form);
```

- [ ] **Step 4: 运行测试**

Run: `cd "d:/Code/AI/ai-devops" && node .tmp-e2e/doc-test.mjs`
Expected: 30/30 checks passed。

- [ ] **Step 5: 提交**

```bash
cd "d:/Code/AI/ai-devops"
git add prototype/app.js .tmp-e2e/doc-test.mjs
git commit -m "feat: add knowledge document creation" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Task 5: 发布到平台总库

**Files:**
- Modify: `prototype/app.js`
- Modify: `.tmp-e2e/doc-test.mjs`

- [ ] **Step 1: 追加失败的发布测试**

在 `.tmp-e2e/doc-test.mjs` 的 `check('no console errors', ...)` 之前插入：

```js
  await evaluate(`location.hash = '#/knowledge'`);
  await waitDom(`!!document.querySelector('.knowledge-page')`);
  await evaluate(`document.querySelector('[data-action="knowledge-tab"][data-tab="project"]').click()`);
  await waitDom(`document.querySelector('#main tbody tr[data-id="doc-2"]')`);
  await evaluate(`document.querySelector('#main tbody tr[data-id="doc-2"]').click()`);
  await waitDom(`!!document.querySelector('[data-action="toggle-doc-publish"]')`);
  await evaluate(`document.querySelector('[data-action="toggle-doc-publish"]').click()`);
  await waitDom(`document.querySelector('.doc-title-row')?.innerText.includes('平台总库')`);
  check('publish updates preview scope', true);
  await evaluate(`document.querySelector('[data-action="back-to-knowledge"]').click()`);
  await waitDom(`document.querySelectorAll('#main tbody tr[data-id]').length === 5`);
  await evaluate(`document.querySelector('[data-action="knowledge-tab"][data-tab="global"]').click()`);
  await waitDom(`document.querySelector('#main tbody tr[data-id="doc-2"]')`);
  check('published doc appears in global tab', (await evaluate(`document.querySelector('#main tbody tr[data-id="doc-2"]')?.innerText.includes('订单中心')`)) === true);

  await evaluate(`document.querySelector('#main tbody tr[data-id="doc-2"]').click()`);
  await waitDom(`location.hash === '#/knowledge/global/doc-2' && !!document.querySelector('.doc-page')`);
  await evaluate(`document.querySelector('[data-action="toggle-doc-publish"]').click()`);
  await waitDom(`location.hash === '#/knowledge' && document.querySelectorAll('#main tbody tr[data-id]').length === 2`);
  check('unpublish returns to global list', true);
  check('unpublished doc leaves global tab', (await evaluate(`!document.querySelector('#main tbody tr[data-id="doc-2"]')`)) === true);

  await evaluate(`location.hash = '#/knowledge/global/doc-4'`);
  await waitDom(`location.hash === '#/knowledge/global/doc-4' && !!document.querySelector('.doc-page')`);
  check('cross-project doc stays read-only', (await evaluate(`!document.querySelector('[data-action="edit-doc"]') && !document.querySelector('[data-action="toggle-doc-publish"]') && document.querySelector('.doc-page').innerText.includes('只读')`)) === true);

  await evaluate(`location.hash = '#/knowledge'`);
  await waitDom(`!!document.querySelector('.knowledge-page')`);
  await evaluate(`document.querySelector('[data-action="knowledge-tab"][data-tab="global"]').click()`);
  await waitDom(`document.querySelector('#main tbody tr[data-id="doc-5"]')`);
  await evaluate(`document.querySelector('#main tbody tr[data-id="doc-5"]').click()`);
  await waitDom(`location.hash === '#/knowledge/global/doc-5' && !!document.querySelector('[data-action="edit-doc"]')`);
  await evaluate(`document.querySelector('[data-action="edit-doc"]').click()`);
  await waitDom(`location.hash === '#/knowledge/doc-5/edit' && !!document.querySelector('#doc-edit-form')`);
  check('own published doc can be edited from global view', true);

  await evaluate(`location.hash = '#/knowledge/doc-3'`);
  await waitDom(`location.hash === '#/knowledge/doc-3' && document.querySelector('.doc-title')?.textContent.includes('客户分层运营 SOP')`);
  check('project doc route syncs project context', (await evaluate(`document.querySelector('.sidebar .project-meta b')?.textContent === '客户运营'`)) === true);
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd "d:/Code/AI/ai-devops" && node .tmp-e2e/doc-test.mjs`
Expected: 发布按钮无响应或超时。

- [ ] **Step 3: 增加发布逻辑**

在 `submitDocEdit` 后增加：

```js
  function toggleDocPublish(id) {
    const doc = docById(id);
    if (!doc) return;
    if (doc.projectId !== state.projectId) { toast('只能发布当前项目的文档。', 'warning'); return; }
    const wasGlobalView = docRouteInfo()?.scope === 'global';
    if (doc.published) {
      doc.published = false;
      doc.publishedAt = null;
      doc.publishedBy = null;
      audit('取消发布文档', doc.id, '成功', { after: { published: false } });
      toast('文档已从平台总库移除。', 'info', '已取消发布');
      if (wasGlobalView) {
        state.knowledgeTab = 'global';
        navigate('#/knowledge');
      } else {
        renderMain();
      }
    } else {
      doc.published = true;
      doc.publishedAt = `${nowDate()} ${nowTime()}`;
      doc.publishedBy = '张明';
      audit('发布文档到平台总库', doc.id, '成功', { after: { published: true } });
      toast('文档已同步到平台总库，其他项目可检索。', 'success', '已发布');
      renderMain();
    }
  }
```

在 click 事件中增加：

```js
        if (action === 'toggle-doc-publish') { toggleDocPublish(id); return; }
```

- [ ] **Step 4: 运行测试**

Run: `cd "d:/Code/AI/ai-devops" && node .tmp-e2e/doc-test.mjs`
Expected: 37/37 checks passed。

- [ ] **Step 5: 提交**

```bash
cd "d:/Code/AI/ai-devops"
git add prototype/app.js .tmp-e2e/doc-test.mjs
git commit -m "feat: publish knowledge documents to platform library" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Task 6: README 与全量回归

**Files:**
- Modify: `prototype/README.md`

- [ ] **Step 1: 更新 README 信息架构**

在 `**能力中心**` 之前新增知识库小节：

```markdown
**知识库**

项目知识库承载需求规格（PRD）、方案设计、测试方案、运行手册等开发文档；默认仅当前项目检索，可同步到平台总库供其他项目检索。

- 知识库页面包含「本项目文档 / 平台总库」两个 Tab。
- 文档详情为独立预览页，支持 Markdown 编辑、实时预览与发布/取消发布。
- 文档可关联当前项目需求，也可作为项目级文档。
```

- [ ] **Step 2: 更新演示路径**

把「代码仓与知识库」一条拆分为两条，并在其后顺延编号：

```markdown
6. **代码仓**：项目空间 → 代码仓 → 点击仓库进入详情，查看文件树、README、分支与最新提交；合并请求 → 点击 MR 进入详情，查看变更说明、关联需求、流水线结果与代码评审评论，可批准 MR；配置 → 修改仓库名称、描述、默认分支与可见性。
7. **知识库**：项目空间 → 知识库 → 在本项目文档中搜索、按类型/需求筛选；点击文档进入预览页；编辑文档并使用 Markdown 工具栏与实时预览；发布文档后切换到平台总库查看；从平台总库打开其他项目文档为只读。
```

原来的第 7 条「能力配置」顺延为第 8 条，第 8-12 条依次改为第 9-13 条。

- [ ] **Step 3: 更新数据说明**

把现有「6 个代码仓（含分支、演示文件与 MR 评论）、4 篇知识库文档」这一条改为：

```markdown
- 6 个代码仓（含分支、演示文件与 MR 评论）、6 篇知识库文档（含 2 篇已同步平台总库；支持新建、编辑、发布与取消发布）
```

- [ ] **Step 4: 运行全部 E2E**

Run:

```bash
cd "d:/Code/AI/ai-devops"
node .tmp-e2e/repo-test.mjs
node .tmp-e2e/req-test.mjs
node .tmp-e2e/task-test.mjs
node .tmp-e2e/cdp-test.mjs
node .tmp-e2e/project-test.mjs
node .tmp-e2e/doc-test.mjs
```

Expected:

```text
19/19 checks passed
73/73 checks passed
29/29 checks passed
32/32 checks passed
23/23 checks passed
37/37 checks passed
```

- [ ] **Step 5: 提交**

```bash
cd "d:/Code/AI/ai-devops"
git add prototype/README.md
git commit -m "docs: document knowledge base workflow" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**

- 双 Tab、项目/总库列表、搜索与筛选：Task 1
- 文档数据字段、可选关联需求、发布标记：Task 1、Task 4
- 全页预览、Markdown 渲染、只读跨项目：Task 2
- 编辑页、工具栏、实时预览、保存/取消/历史：Task 3
- 新建文档：Task 4
- 发布/取消发布、总库同步：Task 5
- README 与回归：Task 6
- 直接访问路由同步项目：Task 1 的 `syncDocProject`，Task 5 的跨项目只读验证
- 旧抽屉移除：Task 1 替换 `open-doc` 相关渲染；执行时确认 `openDocDrawer` 与 `open-doc` action 已无引用并删除

**Placeholder scan:** 无 TBD / TODO；所有代码步骤均包含完整实现。

**Type consistency:** 字段统一为 `requirementId`、`published`、`publishedAt`、`publishedBy`、`docHistory`、`docRedo`、`docBaseline`；表单名统一为 `title`、`type`、`requirementId`、`content`；路由统一为 `#/knowledge/<docId>`、`#/knowledge/<docId>/edit`、`#/knowledge/global/<docId>`。
