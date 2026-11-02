# 代码仓详情 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将代码仓外层改为纯仓库列表，新增仓库详情（代码 / 合并请求 / 配置）与独立 MR 详情页。

**Architecture:** 在现有静态原型中扩展仓库与 MR 数据，新增嵌套路由 `#/code/<repoId>` 和 `#/code/<repoId>/mrs/<number>`；仓库详情使用 GitHub 风格头部 + Tab，代码 Tab 采用文件树 + 代码查看器；MR 详情使用单栏页面展示说明、关联需求、流水线、代码评审评论与普通评论。

**Tech Stack:** 纯 HTML / CSS / JavaScript（IIFE、hash 路由、内存数据）；Node.js + Edge CDP 测试；Python `http.server`。

---

## File Structure

- Modify `prototype/app.js`：仓库详情数据、路由、仓库详情、MR 详情、配置保存、事件。
- Modify `prototype/styles.css`：仓库列表/详情、文件树、代码查看器、MR 详情、评论样式。
- Create `.tmp-e2e/repo-test.mjs`：仓库详情与 MR 详情的 E2E 测试。
- Modify `.tmp-e2e/req-test.mjs`：更新外层代码仓断言（无 Tab、纯列表）。
- Modify `prototype/README.md`：补充仓库详情与 MR 详情演示路径。
- Spec: `docs/superpowers/specs/2026-11-02-repo-detail-design.md`。

---

## Task 1: 数据模型与路由基础

**Files:**
- Modify: `prototype/app.js`

- [ ] **Step 1: 扩展仓库数据**

在 `REPOS` 每个对象上增加 `description` 与 `visibility`：

```js
  const REPOS = [
    { id: 'repo-order-api', name: 'order-api', projectId: 'p-order', path: 'platform/order-api', defaultBranch: 'main', lastCommit: 'a1f3c9e', lastMsg: 'feat: add fulfillment timeout alert', updated: '10:02', mrs: 2, docs: 4, lang: 'Go', description: '订单履约核心 API', visibility: '私有' },
    { id: 'repo-order-web', name: 'order-web', projectId: 'p-order', path: 'platform/order-web', defaultBranch: 'main', lastCommit: 'b7d2e11', lastMsg: 'feat: mobile dashboard layout', updated: '10:16', mrs: 1, docs: 3, lang: 'React', description: '订单履约运营前端', visibility: '公开' },
    { id: 'repo-order-worker', name: 'order-worker', projectId: 'p-order', path: 'platform/order-worker', defaultBranch: 'main', lastCommit: 'c9a4f02', lastMsg: 'fix: state machine transition', updated: '09:56', mrs: 1, docs: 2, lang: 'Go', description: '履约任务与状态机 Worker', visibility: '私有' },
    { id: 'repo-order-admin', name: 'order-admin', projectId: 'p-order', path: 'platform/order-admin', defaultBranch: 'main', lastCommit: 'f8a2c11', lastMsg: 'chore: perf tuning', updated: '10:20', mrs: 0, docs: 1, lang: 'React', description: '订单中心后台管理', visibility: '私有' },
    { id: 'repo-customer-portal', name: 'customer-portal', projectId: 'p-customer', path: 'platform/customer-portal', defaultBranch: 'main', lastCommit: 'd2e8a77', lastMsg: 'fix: health check timeout', updated: '09:18', mrs: 1, docs: 2, lang: 'React', description: '客户运营门户', visibility: '公开' },
    { id: 'repo-support-bot', name: 'support-bot', projectId: 'p-support', path: 'platform/support-bot', defaultBranch: 'main', lastCommit: 'e5f1b90', lastMsg: 'feat: kb search pipeline', updated: '09:30', mrs: 0, docs: 2, lang: 'Python', description: '客服知识库与问答机器人', visibility: '私有' }
  ];
```

- [ ] **Step 2: 增加仓库分支与演示文件生成**

在 `REPOS` 之后加入：

```js
  const REPO_BRANCHES = {
    'repo-order-api': ['main', 'feat/order-timeout', 'fix/export-timeout'],
    'repo-order-web': ['main', 'feat/mobile-dashboard'],
    'repo-order-worker': ['main', 'fix/state-machine'],
    'repo-order-admin': ['main'],
    'repo-customer-portal': ['main', 'fix/health-check'],
    'repo-support-bot': ['main', 'feat/kb-search']
  };

  function repoDomain(repo) {
    return {
      'repo-order-api': 'fulfillment',
      'repo-order-web': 'order',
      'repo-order-worker': 'order',
      'repo-order-admin': 'admin',
      'repo-customer-portal': 'customer',
      'repo-support-bot': 'support'
    }[repo.id] || 'app';
  }

  function buildRepoFiles(repo) {
    const domain = repoDomain(repo);
    const readme = `# ${repo.name}

${repo.description}

## 本地开发

1. 安装依赖
2. 配置本地环境变量
3. 启动服务并访问 /healthz

## 目录

- 业务代码位于 src / internal
- 部署配置见 Dockerfile`;
    if (repo.lang === 'Go') {
      const files = [
        { path: 'README.md', content: readme },
        { path: 'go.mod', content: `module platform/${repo.name}\n\ngo 1.23\n` },
        { path: 'cmd/server/main.go', content: `package main

import (
  "log"
  "net/http"
)

func main() {
  mux := http.NewServeMux()
  mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
  })
  log.Println("${repo.name} listening on :8080")
  log.Fatal(http.ListenAndServe(":8080", mux))
}` },
        { path: `internal/${domain}/service.go`, content: `package ${domain}

import "context"

type Service struct {
  repo Repository
}

func (s *Service) Check(ctx context.Context, id string) error {
  return s.repo.Validate(ctx, id)
}` },
        { path: `internal/${domain}/handler.go`, content: `package ${domain}

import "net/http"

func (s *Service) Handle(w http.ResponseWriter, r *http.Request) {
  w.Header().Set("Content-Type", "application/json")
  w.Write([]byte("{\"ok\":true}"))
}` },
        { path: 'configs/app.yaml', content: `app: ${repo.name}\nport: 8080\nlogLevel: info` },
        { path: 'Dockerfile', content: 'FROM golang:1.23 AS build\nWORKDIR /src\nCOPY . .\nRUN go build -o /out/app ./cmd/server\nFROM gcr.io/distroless/base\nCOPY --from=build /out/app /app\nENTRYPOINT ["/app"]' }
      ];
      if (repo.id === 'repo-order-api') {
        files.push({ path: 'internal/fulfillment/timeout.go', content: `package fulfillment

import (
  "context"
  "fmt"
)

func (s *Service) CheckTimeout(ctx context.Context) error {
  thresholds, err := s.cfg.TimeoutThresholds(ctx)
  if err != nil {
    return fmt.Errorf("load threshold: %w", err)
  }
  for _, order := range s.orders {
    if order.IsOverdue(thresholds) {
      s.notifier.Warn(ctx, order)
    }
  }
  return nil
}` });
      }
      if (repo.id === 'repo-order-worker') {
        files.push({ path: 'internal/order/state.go', content: `package order

type State string

const (
  StateCreated State = "CREATED"
  StatePaid State = "PAID"
  StatePicked State = "PICKED"
  StateShipped State = "SHIPPED"
)

func Next(state State, picked bool) State {
  if state == StatePaid && picked {
    return StateShipped
  }
  return state
}` });
      }
      return files;
    }
    if (repo.lang === 'React') {
      const page = repo.id === 'repo-order-admin' ? 'Orders' : 'Dashboard';
      return [
        { path: 'README.md', content: readme },
        { path: 'package.json', content: `{\n  "name": "${repo.name}",\n  "private": true,\n  "scripts": { "dev": "vite", "build": "vite build" },\n  "dependencies": { "react": "^19.0.0", "react-dom": "^19.0.0" }\n}` },
        { path: 'vite.config.ts', content: `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({ plugins: [react()] });` },
        { path: 'src/main.tsx', content: `import { createRoot } from 'react-dom/client';\nimport App from './App';\n\ncreateRoot(document.getElementById('root')!).render(<App />);` },
        { path: 'src/App.tsx', content: `import ${page} from './pages/${page}';\n\nexport default function App() {\n  return <${page} />;\n}` },
        { path: `src/pages/${page}.tsx`, content: `export default function ${page}() {\n  return (\n    <main>\n      <h1>${repo.name}</h1>\n      <p>${repo.description}</p>\n    </main>\n  );\n}` },
        { path: 'Dockerfile', content: 'FROM node:22 AS build\nWORKDIR /src\nCOPY . .\nRUN npm install && npm run build\nFROM nginx:alpine\nCOPY --from=build /src/dist /usr/share/nginx/html' }
      ];
    }
    if (repo.lang === 'Python') {
      return [
        { path: 'README.md', content: readme },
        { path: 'pyproject.toml', content: `[project]\nname = "${repo.name}"\nversion = "0.1.0"\nrequires-python = ">=3.12"` },
        { path: 'app/main.py', content: `from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get("/healthz")\ndef healthz():\n    return {"ok": True}` },
        { path: 'app/rag.py', content: `def retrieve(query: str) -> list[str]:\n    """Retrieve documents from Qdrant."""\n    return [query]` },
        { path: 'tests/test_rag.py', content: `from app.rag import retrieve\n\ndef test_retrieve():\n    assert retrieve("hello") == ["hello"]` },
        { path: 'Dockerfile', content: 'FROM python:3.12-slim\nWORKDIR /app\nCOPY . .\nRUN pip install -e .\nCMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]' }
      ];
    }
    return [{ path: 'README.md', content: readme }];
  }

  const REPO_FILES = Object.fromEntries(REPOS.map((repo) => [repo.id, buildRepoFiles(repo)]));
```

- [ ] **Step 3: 增加 MR 说明、关联需求与评论**

在 `MRS` 数组之后加入：

```js
  const MR_EXTRAS = {
    '!128': {
      description: '新增履约超时阈值读取与预警通知，补充超时判断单测。',
      requirementId: 'RQ-101',
      comments: [
        { id: 'MC-128-1', author: '陈晨', time: '10:12', kind: 'review', file: 'internal/fulfillment/timeout.go', line: 9, code: 'thresholds, err := s.cfg.TimeoutThresholds(ctx)', content: '这里需要判断 err 并返回带上下文的错误；建议补充 nil 判断。' },
        { id: 'MC-128-2', author: '张明', time: '10:15', kind: 'comment', content: '整体方案没问题，补齐错误处理后可以进入合并。' },
        { id: 'MC-128-3', author: 'Coding Agent', time: '10:17', kind: 'review', file: 'internal/fulfillment/timeout.go', line: 15, code: 'if order.IsOverdue(thresholds) {', content: '已补充阈值校验与错误上下文，并增加单测覆盖。' }
      ]
    },
    '!127': {
      description: '为履约看板增加移动端断点适配与移动指标卡。',
      requirementId: 'RQ-103',
      comments: [
        { id: 'MC-127-1', author: '李娜', time: '10:14', kind: 'review', file: 'src/pages/Dashboard.tsx', line: 16, code: 'const isMobile = useMediaQuery("(max-width: 640px)")', content: '移动端断点建议与设计规范保持一致。' }
      ]
    },
    '!126': {
      description: '修复已支付但未拣货订单被错误推进到已发货的问题。',
      requirementId: 'RQ-111',
      comments: [
        { id: 'MC-126-1', author: '张明', time: '09:58', kind: 'comment', content: '状态机分支已覆盖，合并后观察异常单。' }
      ]
    },
    '!129': {
      description: '延长健康检查超时时间，修复探针偶发失败。',
      requirementId: null,
      comments: [
        { id: 'MC-129-1', author: '李娜', time: '09:20', kind: 'comment', content: '测试环境验证通过，已批准。' }
      ]
    }
  };
  MRS.forEach((mr) => Object.assign(mr, MR_EXTRAS[mr.id] || { description: '', requirementId: null, comments: [] }));
```

- [ ] **Step 4: 增加状态与路由解析**

在 `state` 中加入：

```js
    repoTab: 'code',
    repoFile: 'README.md',
    repoBranch: 'main',
    mrCommentSeq: 500,
```

在 lookup helpers 中加入：

```js
  const repoById = (id) => REPOS.find((item) => item.id === id);
```

在 `taskIdFromRoute` 附近加入：

```js
  const repoRouteInfo = () => {
    const match = state.route.match(/^#\/code\/([^/?#]+)(?:\/mrs\/([^/?#]+))?/);
    if (!match) return null;
    return { repoId: decodeURIComponent(match[1]), mrNumber: match[2] ? decodeURIComponent(match[2]) : null };
  };

  function syncRepoProject() {
    const info = repoRouteInfo();
    const repo = info ? repoById(info.repoId) : null;
    if (!repo) return null;
    state.projectId = repo.projectId;
    state.iterationId = projectById(repo.projectId)?.iterationId || state.iterationId;
    return repo;
  }
```

在 `renderSidebar()` 顶部调用 `syncRepoProject()`，并将 meta 选择改为：

```js
    const meta = taskIdFromRoute()
      ? ROUTES[state.taskReturn === 'agents' ? '#/agents' : '#/requirements']
      : (repoRouteInfo() ? ROUTES['#/code'] : (ROUTES[state.route] || ROUTES['#/projects']));
```

在 `renderMain()` 顶部调用 `syncRepoProject()`；在 `renderPage()` 中任务详情分支之前加入：

```js
    const repoInfo = repoRouteInfo();
    if (repoInfo) return repoInfo.mrNumber ? renderMrDetail(repoInfo.repoId, repoInfo.mrNumber) : renderRepoDetail(repoInfo.repoId);
```

- [ ] **Step 5: 增加页面跳转函数与事件**

在 `openTaskPage` 附近加入：

```js
  function openRepoPage(repoId) {
    const repo = repoById(repoId);
    if (!repo) return;
    state.repoTab = 'code';
    state.repoFile = 'README.md';
    state.repoBranch = repo.defaultBranch;
    navigate(`#/code/${encodeURIComponent(repo.id)}`);
  }

  function openMrPage(repoId, mrId) {
    state.repoTab = 'mrs';
    navigate(`#/code/${encodeURIComponent(repoId)}/mrs/${encodeURIComponent(mrId.replace(/^!/, ''))}`);
  }
```

在 click 事件委托中加入：

```js
        if (action === 'open-repo') { openRepoPage(id); return; }
        if (action === 'repo-tab') { state.repoTab = target.dataset.tab; renderMain(); return; }
        if (action === 'repo-file') { state.repoFile = target.dataset.path; state.repoTab = 'code'; renderMain(); return; }
        if (action === 'open-mr-page') { openMrPage(target.dataset.repo, id); return; }
        if (action === 'back-repo-list') { navigate('#/code'); return; }
        if (action === 'back-repo-mrs') { state.repoTab = 'mrs'; const info = repoRouteInfo(); if (info) navigate(`#/code/${encodeURIComponent(info.repoId)}`); return; }
        if (action === 'add-mr-comment') { addMrComment(id); return; }
```

在 change 事件委托中加入：

```js
      if (action === 'repo-branch') { state.repoBranch = target.value; renderMain(); toast(`已切换到分支 ${target.value}（演示）。`, 'info'); return; }
```

在 submit 事件委托中加入：

```js
      else if (type === 'repo-settings') submitRepoSettings(form);
```

- [ ] **Step 6: 运行语法检查**

Run:

```bash
cd "D:/Code/AI/ai-devops/prototype" && node --check app.js
```

Expected: no output (syntax OK).

---

## Task 2: 仓库列表、仓库详情与代码 Tab

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`
- Test: `.tmp-e2e/repo-test.mjs` (created in Task 5)

- [ ] **Step 1: 替换外层代码仓页面为纯列表**

将 `renderCode()`、`codeReposView()`、`codeMrsView()` 替换为：

```js
  function renderCode() {
    const project = currentProject();
    const repos = projectRepos(project.id);
    return `
      ${pageHead('代码仓', `项目：${esc(project.name)} · Gitea 唯一代码仓，点击仓库查看代码与合并请求`, `<button class="btn btn-outline" type="button" data-action="toast" data-msg="演示环境：将打开 Gitea">${icon('external', 14)} 打开 Gitea</button>`)}
      <div class="grid grid-2">${repos.map((repo) => `<section class="card repo-card" data-action="open-repo" data-id="${repo.id}" tabindex="0" role="button">
        <div class="card-body" style="padding:16px;">
          <div class="flex" style="align-items:flex-start;gap:10px;">
            <div class="side-icon" style="width:36px;height:36px;border-radius:10px;background:#eff6ff;color:#2563eb;">${icon('git', 18)}</div>
            <div style="min-width:0;"><div class="card-title">${esc(repo.name)} <span class="tag">${esc(repo.visibility)}</span></div><div class="card-sub">${esc(repo.path)} · ${esc(repo.lang)}</div></div>
            <span class="muted" style="margin-left:auto;">→</span>
          </div>
          <p class="repo-card-desc">${esc(repo.description)}</p>
          <div class="divider"></div>
          <div class="meta-grid" style="grid-template-columns:1fr 1fr;">
            <div class="meta-item"><div class="meta-label">默认分支</div><div class="meta-value">${esc(repo.defaultBranch)}</div></div>
            <div class="meta-item"><div class="meta-label">最近提交</div><div class="meta-value" style="font-family:var(--mono);font-size:10.5px;">${esc(repo.lastCommit)}</div></div>
            <div class="meta-item" style="grid-column:1/-1;"><div class="meta-label">提交说明</div><div class="meta-value">${esc(repo.lastMsg)}</div></div>
          </div>
          <div class="flex" style="margin-top:12px;color:#8da0b5;font-size:10.5px;">
            <span>${icon('file', 12)} ${repo.docs} 篇文档</span><span>${icon('layers', 12)} ${repo.mrs} 个 MR</span><span style="margin-left:auto;">更新 ${esc(repo.updated)}</span>
          </div>
          <div class="btn-row" style="margin-top:12px;">
            <button class="btn btn-outline btn-sm" type="button" data-action="toast" data-msg="已复制仓库地址">复制地址</button>
            <span class="card-link" style="margin-left:auto;">查看仓库 →</span>
          </div>
        </div>
      </section>`).join('') || `<div class="card"><div class="card-body">${emptyTable('当前项目还没有代码仓')}</div></div>`}</div>
    `;
  }
```

- [ ] **Step 2: 增加仓库详情与代码 Tab**

在 `renderCode` 之后加入：

```js
  function repoBranches(repo) {
    return REPO_BRANCHES[repo.id] || [repo.defaultBranch];
  }

  function repoFiles(repo) {
    return (REPO_FILES[repo.id] || []).slice().sort((a, b) => a.path.localeCompare(b.path));
  }

  function renderRepoFileTree(files, selected) {
    const groups = {};
    files.forEach((file) => {
      const dir = file.path.includes('/') ? file.path.split('/').slice(0, -1).join('/') : '/';
      if (!groups[dir]) groups[dir] = [];
      groups[dir].push(file);
    });
    return Object.entries(groups).map(([dir, items]) => `<div class="repo-tree-group">
      <div class="repo-tree-dir">${icon('folder', 12)} ${esc(dir)}</div>
      ${items.map((file) => `<button class="repo-tree-file ${file.path === selected ? 'active' : ''}" type="button" data-action="repo-file" data-path="${esc(file.path)}">${icon('file', 12)} ${esc(file.path.split('/').pop())}</button>`).join('')}
    </div>`).join('');
  }

  function renderRepoFileView(repo, file) {
    if (!file) return '<div class="empty-table">该仓库暂无演示文件</div>';
    const lines = String(file.content || '').split('\n');
    return `<div class="repo-file-head"><span>${icon('file', 13)} ${esc(file.path)}</span><span class="tag">${lines.length} 行</span><span class="tag">${esc(repo.lang)}</span></div>
      <div class="repo-code">${lines.map((line, index) => `<div class="repo-code-line"><span class="repo-ln">${index + 1}</span><span class="repo-code-text">${esc(line) || ' '}</span></div>`).join('')}</div>`;
  }

  function renderRepoCodeTab(repo) {
    const branches = repoBranches(repo);
    const branch = branches.includes(state.repoBranch) ? state.repoBranch : repo.defaultBranch;
    state.repoBranch = branch;
    const files = repoFiles(repo);
    const file = files.find((item) => item.path === state.repoFile) || files.find((item) => item.path === 'README.md') || files[0];
    if (file) state.repoFile = file.path;
    return `<div class="repo-code-toolbar">
      <select class="select repo-branch-select" data-action="repo-branch" aria-label="切换分支">${branches.map((item) => `<option value="${esc(item)}" ${item === branch ? 'selected' : ''}>${esc(item)}</option>`).join('')}</select>
      <div class="repo-commit"><span class="repo-commit-hash">${esc(repo.lastCommit)}</span><span>${esc(repo.lastMsg)}</span><span class="faint">${esc(repo.updated)} · Coding Agent</span></div>
    </div>
    <div class="repo-code-layout">
      <aside class="repo-file-tree"><div class="repo-tree-title">文件 · ${files.length}</div>${renderRepoFileTree(files, state.repoFile)}</aside>
      <section class="repo-file-view">${renderRepoFileView(repo, file)}</section>
    </div>`;
  }

  function renderRepoDetail(repoId) {
    const repo = repoById(repoId);
    if (!repo) return `<div class="empty"><div class="empty-icon">${icon('git', 30)}</div><h2>仓库不存在</h2><p>该仓库可能已被删除或链接已失效。</p><button class="btn btn-primary" type="button" data-action="back-repo-list">返回代码仓</button></div>`;
    const project = projectById(repo.projectId);
    const mrs = MRS.filter((mr) => mr.repoId === repo.id);
    const tab = ['code', 'mrs', 'settings'].includes(state.repoTab) ? state.repoTab : 'code';
    state.repoTab = tab;
    return `<div class="repo-detail">
      <button class="task-back" type="button" data-action="back-repo-list">← 返回代码仓</button>
      <div class="repo-header">
        <div class="repo-title-row"><span class="repo-owner">${esc(project?.name || '')} /</span><h1>${esc(repo.name)}</h1><span class="tag">${esc(repo.visibility)}</span></div>
        <p class="repo-desc">${esc(repo.description)}</p>
        <div class="repo-meta"><span>${icon('git', 12)} ${esc(repo.path)}</span><span>${icon('layers', 12)} 默认分支 ${esc(repo.defaultBranch)}</span><span>${icon('clock', 12)} 更新 ${esc(repo.updated)}</span><button class="btn btn-outline btn-sm" type="button" data-action="toast" data-msg="已复制克隆地址">复制克隆地址</button></div>
      </div>
      <div class="tabs repo-tabs">
        ${[{ id: 'code', label: '代码' }, { id: 'mrs', label: `合并请求 ${mrs.length}` }, { id: 'settings', label: '配置' }].map((item) => `<button class="tab ${tab === item.id ? 'active' : ''}" type="button" data-action="repo-tab" data-tab="${item.id}">${item.label}</button>`).join('')}
      </div>
      ${tab === 'code' ? renderRepoCodeTab(repo) : tab === 'mrs' ? renderRepoMrsTab(repo, mrs) : renderRepoSettingsTab(repo)}
    </div>`;
  }
```

- [ ] **Step 3: 增加仓库 MR 列表与配置 Tab**

在 `renderRepoDetail` 之后加入：

```js
  function renderRepoMrsTab(repo, mrs) {
    return `<section class="card"><div class="card-body" style="padding-top:12px;">
      <div class="table-wrap"><table>
        <thead><tr><th>合并请求</th><th>作者</th><th>分支</th><th>检查</th><th>状态</th><th>更新</th></tr></thead>
        <tbody>${mrs.length ? mrs.map((mr) => `<tr class="row-click" data-action="open-mr-page" data-id="${mr.id}" data-repo="${repo.id}" tabindex="0">
          <td><div class="cell-main"><b>${esc(mr.title)}</b><small>${esc(mr.id)}</small></div></td>
          <td><span class="tag">${icon('bot', 11)} ${esc(mr.author)}</span></td>
          <td class="nowrap" style="font-size:10.5px;">${esc(mr.source)} → ${esc(mr.target)}</td>
          <td><div class="flex" style="gap:4px;">${mr.checks.map((check) => `<span class="pill ${toneFor(check.status)} no-dot">${esc(check.name)}</span>`).join('')}</div></td>
          <td>${pill(mr.status)}</td>
          <td class="nowrap">${esc(mr.updated)}</td>
        </tr>`).join('') : `<tr><td colspan="6">${emptyTable('当前仓库没有合并请求')}</td></tr>`}</tbody>
      </table></div>
    </div></section>`;
  }

  function renderRepoSettingsTab(repo) {
    return `<section class="card"><div class="card-body">
      <form data-form="repo-settings" class="repo-settings-form">
        <input type="hidden" name="repoId" value="${repo.id}">
        <div class="field"><label for="repo-setting-name">仓库名称</label><input id="repo-setting-name" name="name" class="input" value="${esc(repo.name)}" required maxlength="60"></div>
        <div class="field"><label for="repo-setting-desc">仓库描述</label><textarea id="repo-setting-desc" name="description" class="textarea" rows="3" maxlength="200">${esc(repo.description)}</textarea></div>
        <div class="field-row">
          <div class="field"><label for="repo-setting-branch">默认分支</label><select id="repo-setting-branch" name="defaultBranch" class="select">${repoBranches(repo).map((branch) => `<option value="${esc(branch)}" ${branch === repo.defaultBranch ? 'selected' : ''}>${esc(branch)}</option>`).join('')}</select></div>
          <div class="field"><label for="repo-setting-visibility">可见性</label><select id="repo-setting-visibility" name="visibility" class="select">${['私有', '公开'].map((item) => `<option value="${item}" ${item === repo.visibility ? 'selected' : ''}>${item}</option>`).join('')}</select></div>
        </div>
        <div class="form-hint">配置保存在浏览器内存；名称变更会同步更新仓库路径。</div>
        <div class="btn-row" style="justify-content:flex-end;margin-top:16px;"><button class="btn btn-primary" type="submit">保存配置</button></div>
      </form>
    </div></section>`;
  }
```

- [ ] **Step 4: 增加配置保存函数**

在 `submitRelease` 附近加入：

```js
  function submitRepoSettings(form) {
    const data = new FormData(form);
    const repo = repoById(String(data.get('repoId') || ''));
    if (!repo) return;
    const name = String(data.get('name') || '').trim();
    const description = String(data.get('description') || '').trim();
    const defaultBranch = String(data.get('defaultBranch') || '');
    const visibility = String(data.get('visibility') || '');
    if (!name) { toast('请填写仓库名称。', 'warning'); return; }
    if (!repoBranches(repo).includes(defaultBranch)) { toast('默认分支不合法。', 'warning'); return; }
    if (!['私有', '公开'].includes(visibility)) { toast('可见性不合法。', 'warning'); return; }
    const before = { name: repo.name, description: repo.description, defaultBranch: repo.defaultBranch, visibility: repo.visibility };
    repo.name = name;
    repo.path = `platform/${name}`;
    repo.description = description;
    repo.defaultBranch = defaultBranch;
    repo.visibility = visibility;
    state.repoBranch = defaultBranch;
    audit('更新代码仓配置', repo.id, '成功', { before, after: { name, description, defaultBranch, visibility } });
    renderMain();
    toast('代码仓配置已保存。', 'success', '配置已更新');
  }
```

- [ ] **Step 5: 增加仓库样式**

在 `prototype/styles.css` 中增加（放在 release management 样式附近）：

```css
.repo-card { cursor: pointer; transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease; }
.repo-card:hover { transform: translateY(-1px); border-color: #bae6fd; box-shadow: 0 8px 22px rgba(15, 23, 42, .06); }
.repo-card-desc { min-height: 34px; margin-top: 10px; font-size: 11.5px; line-height: 1.6; color: #64748b; }
.repo-detail { max-width: 1180px; }
.repo-header { padding: 14px 16px; border: 1px solid var(--border); border-radius: 14px; background: #fff; }
.repo-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.repo-title-row h1 { margin: 0; font-size: 22px; letter-spacing: -.02em; color: #14263d; }
.repo-owner { font-size: 13px; color: #94a3b8; }
.repo-desc { margin: 8px 0 10px; font-size: 12px; line-height: 1.6; color: #64748b; }
.repo-meta { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; font-size: 10.5px; color: #8da0b5; }
.repo-meta span { display: inline-flex; align-items: center; gap: 4px; }
.repo-meta .btn { margin-left: auto; }
.repo-tabs { margin-top: 14px; margin-bottom: 14px; }
.repo-code-toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
.repo-branch-select { width: 170px; height: 30px; padding: 0 8px; font-size: 11px; }
.repo-commit { display: flex; align-items: center; gap: 8px; min-width: 0; font-size: 11px; color: #64748b; }
.repo-commit-hash { padding: 2px 6px; border-radius: 5px; background: #f1f5f9; font-family: var(--mono); font-size: 10px; color: #475569; }
.repo-code-layout { display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: 14px; align-items: stretch; }
.repo-file-tree { min-height: 460px; max-height: 620px; overflow: auto; padding: 10px; border: 1px solid var(--border); border-radius: 12px; background: #fff; }
.repo-tree-title { margin-bottom: 8px; font-size: 10px; font-weight: 800; letter-spacing: .06em; color: #8da0b5; text-transform: uppercase; }
.repo-tree-group { margin-bottom: 8px; }
.repo-tree-dir { display: flex; align-items: center; gap: 5px; padding: 4px 5px; font-family: var(--mono); font-size: 10px; color: #94a3b8; }
.repo-tree-file { display: flex; align-items: center; gap: 6px; width: 100%; padding: 6px 8px 6px 18px; border: 0; border-radius: 6px; background: transparent; font-family: var(--mono); font-size: 10.5px; color: #475569; text-align: left; cursor: pointer; }
.repo-tree-file:hover { background: #f8fcff; }
.repo-tree-file.active { background: #e0f2fe; color: #0369a1; font-weight: 700; }
.repo-file-view { min-width: 0; min-height: 460px; max-height: 620px; overflow: auto; border: 1px solid var(--border); border-radius: 12px; background: #fff; }
.repo-file-head { position: sticky; top: 0; z-index: 1; display: flex; align-items: center; gap: 8px; padding: 9px 12px; border-bottom: 1px solid #eef2f7; background: #fbfdff; font-family: var(--mono); font-size: 10.5px; color: #475569; }
.repo-file-head .tag:first-of-type { margin-left: auto; }
.repo-code { padding: 10px 0; font-family: var(--mono); font-size: 11px; line-height: 1.65; color: #334155; }
.repo-code-line { display: flex; min-width: max-content; padding-right: 16px; }
.repo-code-line:hover { background: #f8fcff; }
.repo-ln { width: 42px; flex: 0 0 auto; padding-right: 10px; text-align: right; color: #b0bdcb; user-select: none; }
.repo-code-text { white-space: pre; }
.repo-settings-form { max-width: 620px; }
@media (max-width: 900px) {
  .repo-code-layout { grid-template-columns: 1fr; }
  .repo-file-tree { min-height: 180px; max-height: 260px; }
  .repo-file-view { min-height: 320px; }
}
```

- [ ] **Step 6: 检查语法与页面**

Run:

```bash
cd "D:/Code/AI/ai-devops/prototype" && node --check app.js
```

Expected: no output. Open `#/code/repo-order-api` and verify header, tabs, file tree, README.

---

## Task 3: MR 详情页、评论与审批

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`

- [ ] **Step 1: 增加 MR 详情渲染**

在 `renderRepoDetail` 附近加入：

```js
  function renderMrComment(comment) {
    const user = USERS.find((item) => item.name === comment.author);
    const review = comment.kind === 'review';
    return `<div class="mr-comment">
      ${avatar(comment.author, user?.color || '#2563eb', true)}
      <div class="mr-comment-body">
        <div class="mr-comment-head"><b>${esc(comment.author)}</b><span>${esc(comment.time)}</span>${review ? '<span class="tag">代码评审</span>' : ''}</div>
        ${review ? `<div class="mr-review-meta">${icon('file', 12)} ${esc(comment.file)}:${comment.line}</div><pre class="mr-review-code">${esc(comment.code || '')}</pre>` : ''}
        <p class="mr-comment-content">${esc(comment.content)}</p>
      </div>
    </div>`;
  }

  function renderMrDetail(repoId, mrNumber) {
    const repo = repoById(repoId);
    const mr = MRS.find((item) => item.id === `!${mrNumber}` && item.repoId === repoId);
    if (!repo || !mr) return `<div class="empty"><div class="empty-icon">${icon('layers', 30)}</div><h2>合并请求不存在</h2><p>该 MR 可能已被删除或不属于当前仓库。</p><button class="btn btn-primary" type="button" data-action="back-repo-list">返回代码仓</button></div>`;
    const requirement = mr.requirementId ? requirementById(mr.requirementId) : null;
    const reviewable = ['待评审', '待审批'].includes(mr.status);
    return `<div class="mr-detail">
      <button class="task-back" type="button" data-action="back-repo-mrs">← 返回合并请求</button>
      <div class="mr-head">
        <div class="mr-title-row"><h1>${esc(mr.title)}</h1>${pill(mr.status)}<span class="tag">${esc(mr.id)}</span></div>
        <div class="mr-meta"><span>${icon('git', 12)} ${esc(repo.name)}</span><span>${icon('users', 12)} ${esc(mr.author)}</span><span>${icon('clock', 12)} 更新 ${esc(mr.updated)}</span><span>${esc(mr.source)} → ${esc(mr.target)}</span><span>${mr.files} 个文件 <i style="color:#047857;font-style:normal;">+${mr.additions}</i> <i style="color:#b91c1c;font-style:normal;">−${mr.deletions}</i></span></div>
        ${reviewable ? `<div class="mr-actions"><button class="btn btn-primary" type="button" data-action="approve-mr" data-id="${mr.id}">${icon('check', 14)} 批准 MR</button></div>` : ''}
      </div>
      <section class="card"><div class="card-head"><div><div class="card-title">变更说明</div><div class="card-sub">${esc(mr.id)} · ${esc(mr.source)} → ${esc(mr.target)}</div></div></div><div class="card-body"><p class="mr-description">${esc(mr.description)}</p></div></section>
      <section class="card"><div class="card-head"><div><div class="card-title">关联需求</div><div class="card-sub">需求单与变更的交付关系</div></div></div><div class="card-body">
        ${requirement ? `<button class="relation-item" type="button" data-action="open-req" data-id="${requirement.id}"><span class="relation-icon">${icon('layers', 15)}</span><span class="relation-copy"><b>${esc(requirement.id)} · ${esc(requirement.title)}</b><small>${esc(requirement.status)} · ${esc(requirement.owner)}</small></span><span class="tag" style="margin-left:auto;">查看需求</span></button>` : '<div class="empty-table">未关联需求</div>'}
      </div></section>
      <section class="card"><div class="card-head"><div><div class="card-title">流水线结果</div><div class="card-sub">构建、测试、扫描与评审检查</div></div></div><div class="card-body"><div class="gate-list">${mr.checks.map((check) => `<div class="gate-item ${check.status === '成功' ? 'ok' : check.status === '运行中' ? 'warn' : 'bad'}"><span class="gate-icon">${icon(check.status === '成功' ? 'check' : check.status === '运行中' ? 'refresh' : 'clock', 12)}</span><div><b>${esc(check.name)}</b><small>${esc(check.status)}</small></div></div>`).join('')}</div></div></section>
      <section class="card" id="mr-conversation"><div class="card-head"><div><div class="card-title">讨论区</div><div class="card-sub">${mr.comments.length} 条评论 · 包含代码评审</div></div></div><div class="card-body">
        <div class="mr-comment-list">${mr.comments.map((comment) => renderMrComment(comment)).join('') || '<div class="empty-table">暂无评论</div>'}</div>
        <div class="mr-comment-compose"><textarea id="mr-comment-input" class="textarea" rows="3" maxlength="1000" placeholder="补充说明或评审意见…"></textarea><div class="flex" style="justify-content:flex-end;margin-top:8px;"><button class="btn btn-primary btn-sm" type="button" data-action="add-mr-comment" data-id="${mr.id}">发表评论</button></div></div>
      </div></section>
    </div>`;
  }
```

- [ ] **Step 2: 增加评论提交函数**

在 `submitRepoSettings` 附近加入：

```js
  function addMrComment(id) {
    const mr = MRS.find((item) => item.id === id);
    if (!mr) return;
    const input = document.querySelector('#mr-comment-input');
    const content = input ? input.value.trim() : '';
    if (!content) { toast('请输入评论内容。', 'warning'); if (input) input.focus(); return; }
    mr.comments.push({ id: `MC-${++state.mrCommentSeq}`, author: '张明', time: nowTime(), kind: 'comment', content });
    audit('评论合并请求', mr.id, '成功', { after: { content } });
    renderMain();
    toast('评论已发布。', 'success', '评论已添加');
    setTimeout(() => { const box = document.querySelector('#mr-conversation'); if (box) box.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 0);
  }
```

- [ ] **Step 3: 移除旧 MR 抽屉**

删除 `openMrDrawer` 函数及 click 绑定 `if (action === 'open-mr') ...`。保留 `approveMr`，其 `closeOverlay` 在页面场景下为空操作，随后重新渲染当前 MR 详情。

- [ ] **Step 4: 增加 MR 详情样式**

在 `prototype/styles.css` 中增加：

```css
.mr-detail { max-width: 1040px; }
.mr-head { padding: 14px 16px; border: 1px solid var(--border); border-radius: 14px; background: #fff; }
.mr-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.mr-title-row h1 { margin: 0; font-size: 20px; line-height: 1.4; color: #14263d; }
.mr-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 8px; font-size: 10.5px; color: #8da0b5; }
.mr-meta span { display: inline-flex; align-items: center; gap: 4px; }
.mr-actions { display: flex; justify-content: flex-end; margin-top: 10px; }
.mr-detail .card { margin-top: 14px; }
.mr-description { margin: 0; font-size: 12.5px; line-height: 1.75; color: #475569; white-space: pre-wrap; }
.mr-comment-list { display: flex; flex-direction: column; gap: 14px; }
.mr-comment { display: flex; align-items: flex-start; gap: 9px; }
.mr-comment-body { flex: 1; min-width: 0; }
.mr-comment-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 10.5px; color: #94a3b8; }
.mr-comment-head b { font-size: 12px; color: #334155; }
.mr-review-meta { display: flex; align-items: center; gap: 5px; margin-top: 5px; font-family: var(--mono); font-size: 10px; color: #64748b; }
.mr-review-code { margin: 5px 0 0; padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fbfd; font-family: var(--mono); font-size: 10.5px; line-height: 1.6; color: #334155; white-space: pre-wrap; overflow-wrap: anywhere; }
.mr-comment-content { margin-top: 6px; font-size: 12px; line-height: 1.7; color: #475569; white-space: pre-wrap; }
.mr-comment-compose { margin-top: 16px; padding-top: 14px; border-top: 1px solid #eef2f7; }
```

- [ ] **Step 5: 检查语法**

Run:

```bash
cd "D:/Code/AI/ai-devops/prototype" && node --check app.js
```

Expected: no output.

---

## Task 4: 测试与文档

**Files:**
- Create: `.tmp-e2e/repo-test.mjs`
- Modify: `.tmp-e2e/req-test.mjs`
- Modify: `prototype/README.md`

- [ ] **Step 1: 更新 req-test 外层代码仓断言**

将现在的：

```js
  const codeTabs = await evaluate(`Array.from(document.querySelectorAll('.tabs .tab')).map((el) => el.textContent.trim())`);
  check('code page keeps repos and merge requests tabs', JSON.stringify(codeTabs) === JSON.stringify(['代码仓库', '合并请求']), codeTabs.join(','));
  check('code page renders repos', (await evaluate(`document.querySelectorAll('#main .card').length`)) >= 4);
```

替换为：

```js
  const codeTabCount = await evaluate(`document.querySelectorAll('#main .tabs .tab').length`);
  check('code page is a pure repo list', codeTabCount === 0 && (await evaluate(`document.querySelectorAll('[data-action="open-repo"]').length`)) >= 4, String(codeTabCount));
  check('code page renders repos', (await evaluate(`document.querySelectorAll('#main .card').length`)) >= 4);
```

- [ ] **Step 2: 新增 repo-test**

创建 `.tmp-e2e/repo-test.mjs`，复用 req-test 的 CDP 启动与等待方式，验证：

```js
// 1. 打开 #/code，等 .repo-card；侧栏代码仓 active；无 .tabs .tab
// 2. 点击 order-api 卡片，等 .repo-detail；hash = #/code/repo-order-api
// 3. 三个 Tab：代码 / 合并请求 1 / 配置
// 4. 代码 Tab：.repo-branch-select、.repo-commit、.repo-tree-file 数量 > 5、默认 README 内容
// 5. 点击 go.mod 对应 .repo-tree-file，等 .repo-file-head 包含 go.mod
// 6. 切换 branch select 到 feat/order-timeout（dispatch change），等 select value
// 7. 点击合并请求 Tab，等 !128 行；点击行，等 hash 包含 /mrs/128、.mr-detail
// 8. 校验 MR 标题、变更说明、关联需求 RQ-101、流水线四项、代码评审评论包含 timeout.go 和代码片段
// 9. 输入评论并发表，等待讨论区包含新评论
// 10. 点击批准 MR，等待状态变为 已批准
// 11. 点击返回合并请求，等 .repo-detail 的合并请求 Tab；确认 !128 状态已批准
// 12. 点击配置 Tab，修改名称/描述/默认分支/可见性，提交；等 .repo-title-row 包含新名称
// 13. 点击返回代码仓，确认列表卡片包含新名称和描述
// 14. 无 console errors
```

测试文件要包含完整 CDP 客户端代码（启动 Edge、waitFor、evaluate、截图可选），断言使用 `check(name, condition, detail)`。

- [ ] **Step 3: 运行测试**

Run:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8787/
cd "D:/Code/AI/ai-devops" && node .tmp-e2e/repo-test.mjs
cd "D:/Code/AI/ai-devops" && node .tmp-e2e/req-test.mjs
```

Expected: repo-test all PASS; req-test all PASS.

- [ ] **Step 4: 更新 README**

在重点演示路径的「代码仓与知识库」项中补充：

```markdown
6. **代码仓与知识库**：项目空间 → 代码仓 → 点击仓库进入详情，查看代码文件树、README、分支与最新提交；合并请求 → 点击 MR 进入详情，查看说明、关联需求、流水线结果与代码评审评论，可批准 MR；配置 → 修改仓库名称、描述、默认分支与可见性。知识库 → 查看文档列表、RAG 索引状态并重建索引。
```

数据说明补充：

```markdown
- 6 个代码仓（含分支、演示文件与 MR 评论）、4 篇知识库文档
```

- [ ] **Step 5: 全量回归**

Run:

```bash
cd "D:/Code/AI/ai-devops"
node .tmp-e2e/req-test.mjs
node .tmp-e2e/task-test.mjs
node .tmp-e2e/cdp-test.mjs
node .tmp-e2e/repo-test.mjs
```

Expected: all suites pass; no console errors.

---

## Self-Review

- 路由与仓库列表：Task 1、Task 2。
- 仓库详情头部与三个 Tab：Task 2。
- 代码文件树、代码查看、分支与提交栏：Task 2。
- 仓库级 MR 列表与 MR 详情：Task 3。
- 关联需求、流水线、代码评审评论、普通评论、批准 MR：Task 3。
- 配置保存：Task 2。
- 测试与文档：Task 4。
- 非目标：未实现手工新建 MR、独立 Diff Tab、归档/删除、新增代码评审评论。
