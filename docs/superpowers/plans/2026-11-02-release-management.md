# 发布管理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将需求管理下的「发布计划」Tab 改造为「发布管理」，支持按时间段和关联需求创建、查看当前迭代的发布排期。

**Architecture:** 在静态原型中新增按迭代归属的 `RELEASES` 数据与派生状态函数；将原门禁视图替换为发布表格；通过 modal 表单创建发布，通过抽屉查看详情；使用现有 CDP E2E 测试验证，不触碰批次发布执行流程。

**Tech Stack:** 纯 HTML / CSS / JavaScript（IIFE、hash 路由、内存数据）；Node.js + Edge CDP 测试；Python `http.server` 本地服务。

> 后续变更（2026-11-02）：需求与发布改为一对一关联。种子数据、发布创建表单过滤、需求侧关联与筛选以 [设计文档 v0.2](../specs/2026-11-02-release-management-design.md) 为准；本文档保留原始实现步骤。

---

## File Structure

- Modify `prototype/app.js`：发布数据、状态推导、列表视图、创建弹窗、详情抽屉、事件绑定。
- Modify `prototype/styles.css`：发布表格、表单需求清单、状态与时间样式。
- Modify `.tmp-e2e/req-test.mjs`：替换原发布计划测试，覆盖列表、创建、校验、详情。
- Modify `prototype/README.md`：更新演示路径与数据说明。
- No new runtime files；设计文档已位于 `docs/superpowers/specs/2026-11-02-release-management-design.md`。

---

## Task 1: 发布数据、状态推导与发布管理列表

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`
- Modify: `.tmp-e2e/req-test.mjs`

- [ ] **Step 1: 用发布管理断言替换旧的发布计划测试**

在 `.tmp-e2e/req-test.mjs` 中，将原有的以下测试块：

```js
  await evaluate(`document.querySelector('[data-action="req-tab"][data-tab="plan"]').click()`);
  await waitDom(`document.body.innerText.includes('发布就绪检查')`);
  const planText = await evaluate(`document.querySelector('#main')?.innerText || ''`);
  check('release plan still renders with deferred items', planText.includes('需求就绪 11/11') && planText.includes('延期需求 2'), planText.length + ' chars');
  await evaluate(`document.querySelector('[data-action="req-tab"][data-tab="list"]').click()`);
  await waitDom(`document.querySelectorAll('.req-table tbody tr[data-id]').length === 10`);
```

替换为：

```js
  await evaluate(`document.querySelector('[data-action="req-tab"][data-tab="plan"]').click()`);
  await waitDom(`!!document.querySelector('.release-manage') && document.querySelectorAll('.release-manage tbody tr[data-id]').length === 3`);
  const releaseTabLabel = await evaluate(`Array.from(document.querySelectorAll('.tabs .tab')).find((el) => el.dataset.tab === 'plan')?.textContent.trim()`);
  check('release tab renamed to release management', releaseTabLabel === '发布管理', String(releaseTabLabel));
  const releaseRows = await evaluate(`Array.from(document.querySelectorAll('.release-manage tbody tr[data-id]')).map((tr) => tr.innerText)`);
  check('release management seeds three releases', releaseRows.length === 3, String(releaseRows.length));
  const releaseState = await evaluate(`(() => { const rows = Array.from(document.querySelectorAll('.release-manage tbody tr[data-id]')); const byId = Object.fromEntries(rows.map((tr) => [tr.dataset.id, tr.innerText])); return { gray: byId['REL-101'] || '', formal: byId['REL-102'] || '', pre: byId['REL-103'] || '' }; })()`);
  check('release status derives from time window', releaseState.gray.includes('进行中') && releaseState.formal.includes('未开始') && releaseState.pre.includes('已结束') && releaseState.gray.includes('10-24 09:00') && releaseState.formal.includes('10-24 20:00'), JSON.stringify(releaseState).slice(0, 240));
  check('old release gate content removed', (await evaluate(`!document.body.innerText.includes('发布就绪检查')`)) === true);
  await evaluate(`document.querySelector('[data-action="req-tab"][data-tab="list"]').click()`);
  await waitDom(`document.querySelectorAll('.req-table tbody tr[data-id]').length === 10`);
```

- [ ] **Step 2: 运行测试，确认失败**

Run:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8787/
cd "D:/Code/AI/ai-devops" && node .tmp-e2e/req-test.mjs
```

Expected: `HTTP 200`; test fails/timeouts waiting for `.release-manage` because the old 发布计划 view is still rendered.

- [ ] **Step 3: 新增发布数据与状态辅助函数**

在 `prototype/app.js` 的 `RELEASE_HISTORY` 之后、`NOTIFICATIONS` 之前加入：

```js
  const RELEASES = [
    { id: 'REL-101', name: 'v2.4 灰度发布', iterationId: 'it-24', projectId: 'p-order', startAt: '2026-10-24T09:00', endAt: '2026-10-24T12:00', requirementIds: ['RQ-101', 'RQ-102'], createdBy: '张明', createdAt: '2026-10-23 18:20' },
    { id: 'REL-102', name: 'v2.4 正式发布', iterationId: 'it-24', projectId: 'p-order', startAt: '2026-10-24T20:00', endAt: '2026-10-24T23:00', requirementIds: ['RQ-101', 'RQ-102', 'RQ-103', 'RQ-111'], createdBy: '张明', createdAt: '2026-10-24 09:10' },
    { id: 'REL-103', name: 'v2.4 预发布验证', iterationId: 'it-24', projectId: 'p-order', startAt: '2026-10-23T20:00', endAt: '2026-10-23T22:00', requirementIds: ['RQ-103', 'RQ-112'], createdBy: '陈晨', createdAt: '2026-10-23 15:30' }
  ];
  const DEMO_NOW = '2026-10-24T10:30';
```

在 `state` 的 `release: freshRelease(),` 后加入：

```js
    releaseSeq: 103,
```

在 `freshRelease()` 之后加入：

```js
  const RELEASE_STATUS_RANK = { 进行中: 0, 未开始: 1, 已结束: 2 };

  function releaseStatus(release) {
    const now = new Date(DEMO_NOW).getTime();
    const start = new Date(release.startAt).getTime();
    const end = new Date(release.endAt).getTime();
    if (now < start) return '未开始';
    if (now > end) return '已结束';
    return '进行中';
  }

  function formatDateTime(value) {
    return String(value || '').replace('T', ' ');
  }

  function compactDateTime(value) {
    const [date, time] = String(value || '').split('T');
    return `${date.slice(5)} ${time || ''}`.trim();
  }

  function releaseWindow(release, compact = false) {
    const format = compact ? compactDateTime : formatDateTime;
    return `${format(release.startAt)} → ${format(release.endAt)}`;
  }

  function releaseRequirementSummary(release) {
    const ids = release.requirementIds || [];
    const preview = ids.slice(0, 2).map(esc).join('、');
    return `<span class="tag">${ids.length} 个</span><span class="release-req-ids">${preview}${ids.length > 2 ? ` +${ids.length - 2}` : ''}</span>`;
  }

  function sortedReleases(iterationId) {
    return RELEASES
      .filter((item) => item.iterationId === iterationId)
      .slice()
      .sort((a, b) => {
        const rank = (RELEASE_STATUS_RANK[releaseStatus(a)] ?? 9) - (RELEASE_STATUS_RANK[releaseStatus(b)] ?? 9);
        return rank || a.startAt.localeCompare(b.startAt);
      });
  }
```

在 lookup helpers（`projectTasks` 附近）加入：

```js
  const releaseById = (id) => RELEASES.find((item) => item.id === id);
  const iterationReleases = (iterationId) => RELEASES.filter((item) => item.iterationId === iterationId);
```

- [ ] **Step 4: 增加状态颜色映射**

在 `toneFor` 的成功状态列表末尾加入 `'进行中'`：

```js
if (['成功', '健康', '活跃', '发布', '已发布', '已完成', '已处理', '已启用', '低', 'SUCCEEDED', 'APPROVED', 'RELEASED', '待发布', '已批准', '进行中'].includes(s)) return 'success';
```

在信息状态列表末尾加入 `'未开始'`：

```js
if (['分析', '开发', '开发中', '方案中', '运行中', '发布中', 'RELEASING', 'DEPLOYING', 'PENDING', '待分析', '未开始'].includes(s)) return 'info';
```

- [ ] **Step 5: 替换 Tab 标签与视图**

在 `renderRequirements()` 中，将 tabs 的：

```js
      { id: 'plan', label: '发布计划' }
```

改为：

```js
      { id: 'plan', label: '发布管理' }
```

将视图三元表达式中的：

```js
: activeTab === 'board' ? agentTaskBoardView() : requirementPlanView(iteration, stats)
```

改为：

```js
: activeTab === 'board' ? agentTaskBoardView() : releaseManagementView(iteration)
```

删除整个 `requirementPlanView` 函数，替换为：

```js
  function releaseManagementView(iteration) {
    const releases = sortedReleases(iteration.id);
    const rows = releases.map((release) => {
      const status = releaseStatus(release);
      return `<tr class="row-click" data-action="open-release" data-id="${release.id}" tabindex="0">
        <td><div class="cell-main"><b>${esc(release.name)}</b><small>${esc(release.id)}</small></div></td>
        <td class="nowrap"><span class="release-window">${esc(releaseWindow(release, true))}</span></td>
        <td>${pill(status)}</td>
        <td><div class="release-req-cell">${releaseRequirementSummary(release)}</div></td>
        <td>${esc(release.createdBy)}</td>
        <td><button class="btn btn-ghost btn-xs" type="button" data-action="open-release" data-id="${release.id}">查看</button></td>
      </tr>`;
    }).join('');
    return `<div class="release-manage">
      <div class="release-manage-head">
        <div><div class="section-title">发布管理</div><div class="section-sub">${esc(iteration.name)} · ${releases.length} 个发布 · 按时间段排期</div></div>
        <button class="btn btn-primary btn-sm" type="button" data-action="new-release">${icon('plus', 14)} 新建发布</button>
      </div>
      <section class="card">
        <div class="card-body" style="padding-top:12px;">
          <div class="table-wrap">
            <table>
              <thead><tr><th>发布名称</th><th>时间段</th><th>状态</th><th>关联需求</th><th>创建人</th><th>操作</th></tr></thead>
              <tbody>${rows || `<tr><td colspan="6">${emptyTable('当前迭代还没有发布，点击右上角新建发布')}</td></tr>`}</tbody>
            </table>
          </div>
        </div>
      </section>
    </div>`;
  }
```

- [ ] **Step 6: 增加发布列表样式**

在 `prototype/styles.css` 的 Agent task board 样式附近加入：

```css
.release-manage-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.release-window { font-size: 11px; color: #475569; }
.release-req-cell { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.release-req-ids { font-size: 10.5px; color: #8da0b5; }
```

- [ ] **Step 7: 运行测试，确认通过**

Run:

```bash
cd "D:/Code/AI/ai-devops" && node .tmp-e2e/req-test.mjs
```

Expected: `49/49 checks passed` and no console errors.

- [ ] **Step 8: 提交**

```bash
cd "D:/Code/AI/ai-devops"
git add docs/superpowers/plans/2026-11-02-release-management.md prototype/app.js prototype/styles.css .tmp-e2e/req-test.mjs
git commit -m "feat: add release management list" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Task 2: 新建发布弹窗、校验与创建

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`
- Modify: `.tmp-e2e/req-test.mjs`

- [ ] **Step 1: 追加新建发布测试**

在 Task 1 新增的发布列表测试之后、`await evaluate` 返回需求列表之前，加入以下测试块（它将覆盖表单字段、两条校验和创建成功）：

```js
  await evaluate(`document.querySelector('[data-action="req-tab"][data-tab="plan"]').click()`);
  await waitDom(`!!document.querySelector('.release-manage')`);
  await evaluate(`document.querySelector('[data-action="new-release"]').click()`);
  await waitDom(`!!document.querySelector('#release-form')`);
  const releaseFormInfo = await evaluate(`(() => ({
    hasName: !!document.querySelector('#release-name'),
    hasStart: !!document.querySelector('#release-start'),
    hasEnd: !!document.querySelector('#release-end'),
    optionCount: document.querySelectorAll('#release-form input[name="requirements"]').length,
    hasDeferred: Array.from(document.querySelectorAll('#release-form input[name="requirements"]')).some((el) => el.value === 'RQ-104' || el.value === 'RQ-110')
  }))()`);
  check('new release form has name, time range and requirement choices', releaseFormInfo.hasName && releaseFormInfo.hasStart && releaseFormInfo.hasEnd && releaseFormInfo.optionCount === 11 && !releaseFormInfo.hasDeferred, JSON.stringify(releaseFormInfo));
  await evaluate(`(() => { const form = document.querySelector('#release-form'); form.elements.name.value = 'v2.4 晚间发布'; form.elements.startAt.value = '2026-10-24T20:00'; form.elements.endAt.value = '2026-10-24T19:00'; form.requestSubmit(); return true; })()`);
  await waitDom(`document.body.innerText.includes('结束时间必须晚于开始时间')`);
  check('release rejects end before start', true);
  await evaluate(`(() => { const form = document.querySelector('#release-form'); form.elements.endAt.value = '2026-10-24T23:00'; form.requestSubmit(); return true; })()`);
  await waitDom(`document.body.innerText.includes('请至少选择一个')`);
  check('release requires at least one requirement', true);
  await evaluate(`(() => { const form = document.querySelector('#release-form'); form.querySelector('input[name="requirements"][value="RQ-101"]').click(); form.querySelector('input[name="requirements"][value="RQ-102"]').click(); form.requestSubmit(); return true; })()`);
  await waitDom(`document.querySelectorAll('.release-manage tbody tr[data-id]').length === 4`);
  const createdRelease = await evaluate(`(() => { const row = Array.from(document.querySelectorAll('.release-manage tbody tr[data-id]')).find((tr) => tr.innerText.includes('v2.4 晚间发布')); return row ? { id: row.dataset.id, text: row.innerText } : null; })()`);
  check('new release is added with derived status', !!createdRelease && createdRelease.id === 'REL-104' && createdRelease.text.includes('未开始') && createdRelease.text.includes('2 个'), JSON.stringify(createdRelease));
  await evaluate(`document.querySelector('[data-action="req-tab"][data-tab="list"]').click()`);
  await waitDom(`document.querySelectorAll('.req-table tbody tr[data-id]').length === 10`);
```

- [ ] **Step 2: 运行测试，确认失败**

Run:

```bash
cd "D:/Code/AI/ai-devops" && node .tmp-e2e/req-test.mjs
```

Expected: fails/timeouts waiting for `#release-form`, because the new-release action is not implemented yet.

- [ ] **Step 3: 增加新建发布弹窗**

在 `openTaskForm` 附近加入：

```js
  function openReleaseForm() {
    const iteration = currentIteration();
    const candidates = iterationRequirements(iteration.id).filter((req) => !req.deferredTo);
    const checklist = candidates.length
      ? candidates.map((req) => `<label class="release-req-option">
          <input type="checkbox" name="requirements" value="${req.id}">
          <span class="release-req-main"><b>${esc(req.id)}</b><span>${esc(req.title)}</span></span>
          <span class="release-req-meta">${pill(req.status)}<span>${esc(req.owner)}</span></span>
        </label>`).join('')
      : '<div class="empty-table">当前迭代没有可关联的未延期需求</div>';
    openPanel({
      title: '新建发布', sub: `${iteration.name} · 发布排期`, variant: 'modal',
      body: `<form id="release-form" data-form="new-release">
        <div class="field"><label for="release-name">发布名称</label><input id="release-name" name="name" class="input" maxlength="60" required placeholder="例如：v2.4 正式发布"></div>
        <div class="field-row">
          <div class="field"><label for="release-start">开始时间</label><input id="release-start" name="startAt" class="input" type="datetime-local" value="2026-10-24T20:00" required></div>
          <div class="field"><label for="release-end">结束时间</label><input id="release-end" name="endAt" class="input" type="datetime-local" value="2026-10-24T23:00" required></div>
        </div>
        <div class="field"><label>关联需求</label><div class="release-req-options">${checklist}</div><div class="form-hint">仅显示当前迭代未延期需求；至少选择 1 个。</div></div>
        <div class="form-hint">发布状态按时间段自动推导。发布管理仅用于排期，实际发布执行请前往批次发布。</div>
        <div class="btn-row" style="justify-content:flex-end;margin-top:18px;"><button class="btn btn-outline" type="button" data-action="close-overlay">取消</button><button class="btn btn-primary" type="submit" ${candidates.length ? '' : 'disabled'}>创建发布</button></div>
      </form>`
    });
  }
```

- [ ] **Step 4: 增加提交处理与校验**

在 `submitTask` 附近加入：

```js
  function submitRelease(form) {
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const startAt = String(data.get('startAt') || '');
    const endAt = String(data.get('endAt') || '');
    const requirementIds = data.getAll('requirements').map(String);
    if (!name) { toast('请填写发布名称。', 'warning'); return; }
    if (!startAt || !endAt) { toast('请选择开始和结束时间。', 'warning'); return; }
    if (new Date(endAt).getTime() <= new Date(startAt).getTime()) { toast('结束时间必须晚于开始时间。', 'warning'); return; }
    const iteration = currentIteration();
    const allowed = new Set(iterationRequirements(iteration.id).filter((req) => !req.deferredTo).map((req) => req.id));
    if (!requirementIds.length || requirementIds.some((id) => !allowed.has(id))) { toast('请至少选择一个当前迭代的未延期需求。', 'warning'); return; }
    const release = {
      id: `REL-${++state.releaseSeq}`,
      name,
      iterationId: iteration.id,
      projectId: iteration.projectId,
      startAt,
      endAt,
      requirementIds,
      createdBy: '张明',
      createdAt: formatDateTime(DEMO_NOW)
    };
    RELEASES.push(release);
    audit('创建发布', release.id, '成功', { name, startAt, endAt, requirementIds });
    closeOverlay();
    state.reqTab = 'plan';
    renderMain();
    toast(`${release.name} 已创建，状态：${releaseStatus(release)}。`, 'success', '发布已创建');
  }
```

- [ ] **Step 5: 绑定新建与提交事件**

在 click 事件委托中，`new-task` 附近加入：

```js
        if (action === 'new-release') { openReleaseForm(); return; }
```

在 submit 事件委托中，`new-task` 分支后加入：

```js
      else if (type === 'new-release') submitRelease(form);
```

- [ ] **Step 6: 增加表单与需求清单样式**

在 `prototype/styles.css` 的发布列表样式后加入：

```css
.release-req-options { max-height: 260px; overflow: auto; display: flex; flex-direction: column; gap: 6px; padding: 8px; border: 1px solid var(--border); border-radius: 10px; background: #fbfdff; }
.release-req-option { display: flex; align-items: center; gap: 8px; padding: 7px 8px; border: 1px solid #eef2f7; border-radius: 8px; background: #fff; cursor: pointer; }
.release-req-option:hover { border-color: #bae6fd; }
.release-req-option input { margin: 0; accent-color: #0284c7; }
.release-req-main { flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px; }
.release-req-main b { font-family: var(--mono); font-size: 10px; color: #0369a1; }
.release-req-main span { font-size: 11px; color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.release-req-meta { display: flex; align-items: center; gap: 6px; flex: 0 0 auto; font-size: 10px; color: #8da0b5; }
```

- [ ] **Step 7: 运行测试，确认通过**

Run:

```bash
cd "D:/Code/AI/ai-devops" && node .tmp-e2e/req-test.mjs
```

Expected: `53/53 checks passed` and no console errors.

- [ ] **Step 8: 提交**

```bash
cd "D:/Code/AI/ai-devops"
git add prototype/app.js prototype/styles.css .tmp-e2e/req-test.mjs
git commit -m "feat: create release schedules" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Task 3: 发布详情抽屉

**Files:**
- Modify: `prototype/app.js`
- Modify: `.tmp-e2e/req-test.mjs`

- [ ] **Step 1: 追加发布详情测试**

在 Task 2 的创建测试之后、返回需求列表的点击之前加入：

```js
  await evaluate(`document.querySelector('[data-action="req-tab"][data-tab="plan"]').click()`);
  await waitDom(`!!document.querySelector('.release-manage')`);
  await evaluate(`document.querySelector('.release-manage tbody tr[data-id="REL-104"]').click()`);
  await waitDom(`!!document.querySelector('.overlay.open .drawer')`);
  const releaseDetail = await evaluate(`(() => { const root = document.querySelector('.overlay.open .drawer'); return { title: root.querySelector('.drawer-title')?.textContent || '', text: root.innerText }; })()`);
  check('release detail shows window and requirements', releaseDetail.title.includes('v2.4 晚间发布') && releaseDetail.text.includes('2026-10-24 20:00') && releaseDetail.text.includes('2026-10-24 23:00') && releaseDetail.text.includes('RQ-101') && releaseDetail.text.includes('RQ-102') && releaseDetail.text.includes('批次发布'), JSON.stringify(releaseDetail).slice(0, 240));
  await evaluate(`document.querySelector('[data-action="close-overlay"]').click()`);
```

- [ ] **Step 2: 运行测试，确认失败**

Run:

```bash
cd "D:/Code/AI/ai-devops" && node .tmp-e2e/req-test.mjs
```

Expected: fails/timeouts waiting for `.overlay.open .drawer`, because clicking the release row is not wired yet.

- [ ] **Step 3: 增加发布详情抽屉**

在 `openReleaseForm` 附近加入：

```js
  function openReleaseDrawer(id) {
    const release = releaseById(id);
    if (!release) return;
    const iteration = iterationById(release.iterationId);
    const reqs = (release.requirementIds || []).map((reqId) => requirementById(reqId)).filter(Boolean);
    const body = `<div class="drawer-section">
      <div class="meta-grid">
        <div class="meta-item"><div class="meta-label">状态</div><div class="meta-value">${pill(releaseStatus(release))}</div></div>
        <div class="meta-item"><div class="meta-label">时间段</div><div class="meta-value">${esc(formatDateTime(release.startAt))} → ${esc(formatDateTime(release.endAt))}</div></div>
        <div class="meta-item"><div class="meta-label">创建人</div><div class="meta-value">${esc(release.createdBy)}</div></div>
        <div class="meta-item"><div class="meta-label">创建时间</div><div class="meta-value">${esc(release.createdAt)}</div></div>
      </div>
    </div>
    <div class="drawer-section">
      <div class="drawer-section-title">关联需求 · ${reqs.length} 个</div>
      <div class="table-wrap"><table>
        <thead><tr><th>需求编号</th><th>需求标题</th><th>状态</th><th>优先级</th><th>责任人</th></tr></thead>
        <tbody>${reqs.length ? reqs.map((req) => `<tr>
          <td><span class="cell-id">${esc(req.id)}</span></td>
          <td><div class="cell-main"><b>${esc(req.title)}</b></div></td>
          <td><div class="flex" style="gap:4px;flex-wrap:wrap;">${pill(req.status)}${req.deferredTo ? '<span class="tag">已延期</span>' : ''}</div></td>
          <td>${priorityPill(req.priority)}</td>
          <td>${esc(req.owner)}</td>
        </tr>`).join('') : '<tr><td colspan="5">暂无关联需求</td></tr>'}</tbody>
      </table></div>
    </div>
    <p class="hint">发布管理仅用于排期，实际发布执行请在「批次发布」中完成。</p>`;
    openPanel({ title: release.name, sub: `${release.id} · ${iteration?.name || ''} · 发布排期`, body, extraWide: true });
  }
```

- [ ] **Step 4: 绑定查看事件**

在 click 事件委托中，`new-release` 分支后加入：

```js
        if (action === 'open-release') { openReleaseDrawer(id); return; }
```

- [ ] **Step 5: 运行测试，确认通过**

Run:

```bash
cd "D:/Code/AI/ai-devops" && node .tmp-e2e/req-test.mjs
```

Expected: `54/54 checks passed` and no console errors.

- [ ] **Step 6: 提交**

```bash
cd "D:/Code/AI/ai-devops"
git add prototype/app.js .tmp-e2e/req-test.mjs
git commit -m "feat: add release detail drawer" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Task 4: 文档更新与全量回归

**Files:**
- Modify: `prototype/README.md`

- [ ] **Step 1: 更新 README 演示路径**

在「重点演示路径」第 4 项之后加入：

```markdown
5. **发布管理**：需求管理 → 发布管理 → 查看当前迭代的发布列表；新建发布，填写名称、开始/结束时间并选择未延期需求；状态按时间段自动显示未开始 / 进行中 / 已结束；点击查看关联需求。
```

将原第 5 至 11 项顺序改为 6 至 12。

- [ ] **Step 2: 更新 README 数据说明**

将数据说明中的：

```markdown
- 9 个初始 Agent 任务（含运行中执行流、文件树与聊天记录；需求状态变更时自动追加任务）
```

改为：

```markdown
- 9 个初始 Agent 任务（含运行中执行流、文件树与聊天记录；需求状态变更时自动追加任务）
- 3 条当前迭代发布排期（进行中 / 未开始 / 已结束）
```

- [ ] **Step 3: 运行全量回归**

Run:

```bash
cd "D:/Code/AI/ai-devops"
node .tmp-e2e/req-test.mjs
node .tmp-e2e/task-test.mjs
node .tmp-e2e/cdp-test.mjs
```

Expected: `54/54`, `29/29`, `29/29` checks passed; no console errors.

- [ ] **Step 4: 提交**

```bash
cd "D:/Code/AI/ai-devops"
git add prototype/README.md .tmp-e2e/*.png
git commit -m "docs: document release management" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

## Spec Coverage Check

- Tab 更名与替换旧门禁：Task 1。
- 发布实体、按迭代归属、三态推导、排序：Task 1。
- 表格列、状态色、新建入口、空状态：Task 1。
- 新建弹窗、名称/时间段/关联需求、校验、审计：Task 2。
- 详情抽屉、关联需求、批次发布提示：Task 3。
- 演示数据、README、全量回归：Task 1 / Task 4。
- 非目标（不联动批次发布、不编辑删除、不校验重叠）：未实现，符合设计。

## Self-Review

- 占位符：无 TBD/TODO，所有步骤包含可执行代码。
- 一致性：`RELEASES`、`releaseStatus`、`releaseWindow`、`openReleaseForm`、`submitRelease`、`openReleaseDrawer`、`data-form="new-release"`、`data-action="new-release/open-release"` 在任务间保持一致。
- 测试数量：Task 1 后 49，Task 2 后 53，Task 3 后 54；与新增/删除的断言数一致。
- 类型与命名：发布编号 `REL-104`、状态文案、时间格式 `YYYY-MM-DDTHH:mm` 与测试断言一致。
