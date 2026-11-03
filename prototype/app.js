/* =========================================================
   AI DevOps prototype — static data + hash router + UI logic
   No backend, no external dependencies.
   ========================================================= */
(() => {
  'use strict';

  /* ---------------- icons ---------------- */
  const ICONS = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
    bot: '<rect x="4" y="7" width="16" height="12" rx="3"/><path d="M12 3v4"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/><path d="M8 17h8"/>',
    code: '<path d="m8 8-4 4 4 4"/><path d="m16 8 4 4-4 4"/><path d="m14 4-4 16"/>',
    pipe: '<path d="M4 6h6v6H4z"/><path d="M14 12h6v6h-6z"/><path d="M10 9h4"/><path d="M17 12V9h-3"/>',
    rocket: '<path d="M14 5c3-2 5-2 5-2s0 2-2 5l-4 4-3-3 4-4Z"/><path d="m8 11-3 1-2 3 4-1"/><path d="m13 16 1 3 3 2-1-4"/><circle cx="15" cy="8" r="1"/>',
    server: '<rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/><path d="M7 7h.01M7 17h.01"/>',
    chart: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 3-4 3 2 4-6"/>',
    cap: '<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="M3 12l9 5 9-5"/><path d="M3 16l9 5 9-5"/>',
    admin: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.42 1.42-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2v-.08A1.7 1.7 0 0 0 12.4 18.4a1.7 1.7 0 0 0-1.88.34l-.06.06-1.42-1.42.06-.06A1.7 1.7 0 0 0 9.4 15a1.7 1.7 0 0 0-1.56-1.03H7.8v-2h.04A1.7 1.7 0 0 0 9.4 10.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.42-1.42.06.06A1.7 1.7 0 0 0 12.4 7.6 1.7 1.7 0 0 0 13.43 6.04V5.96h2v.08A1.7 1.7 0 0 0 16.46 7.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 1.42 1.42-.06.06A1.7 1.7 0 0 0 19.4 10.6a1.7 1.7 0 0 0 1.56 1.03H21v2h-.04A1.7 1.7 0 0 0 19.4 15Z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.42 1.42-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2v-.08A1.7 1.7 0 0 0 12.4 18.4a1.7 1.7 0 0 0-1.88.34l-.06.06-1.42-1.42.06-.06A1.7 1.7 0 0 0 9.4 15a1.7 1.7 0 0 0-1.56-1.03H7.8v-2h.04A1.7 1.7 0 0 0 9.4 10.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.42-1.42.06.06A1.7 1.7 0 0 0 12.4 7.6 1.7 1.7 0 0 0 13.43 6.04V5.96h2v.08A1.7 1.7 0 0 0 16.46 7.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 1.42 1.42-.06.06A1.7 1.7 0 0 0 19.4 10.6a1.7 1.7 0 0 0 1.56 1.03H21v2h-.04A1.7 1.7 0 0 0 19.4 15Z"/>',
    audit: '<path d="M9 4H6a2 2 0 0 0-2 2v14l3-2 3 2 3-2 3 2 3-2V6a2 2 0 0 0-2-2h-3"/><path d="M9 2h6v4H9z"/><path d="M9 11h6"/><path d="M9 15h4"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    alert: '<path d="M10.3 3.5 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    external: '<path d="M14 3h7v7"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    play: '<path d="m8 5 11 7-11 7V5Z"/>',
    rotate: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    filter: '<path d="M4 5h16"/><path d="M7 12h10"/><path d="M10 19h4"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    git: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8.5 6h7"/><path d="M7 8.2 10.8 16"/><path d="M17 8.2 13.2 16"/>',
    cube: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5"/><path d="M12 12v9"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    shield: '<path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
    brain: '<path d="M9.5 3A3.5 3.5 0 0 0 6 6.5c0 .3 0 .6.1.9A3.5 3.5 0 0 0 4.5 14a3.5 3.5 0 0 0 3 5.5c.5 0 1-.1 1.5-.4V3.4c-.5-.2-1-.4-1.5-.4Z"/><path d="M14.5 3A3.5 3.5 0 0 1 18 6.5c0 .3 0 .6-.1.9A3.5 3.5 0 0 1 19.5 14a3.5 3.5 0 0 1-3 5.5c-.5 0-1-.1-1.5-.4V3.4c.5-.2 1-.4 1.5-.4Z"/><path d="M9 8H7"/><path d="M15 8h2"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>',
    terminal: '<path d="m5 7 4 4-4 4"/><path d="M12 17h6"/>',
    arrowUp: '<path d="m6 15 6-6 6 6"/>',
    arrowDown: '<path d="m6 9 6 6 6-6"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'
  };

  const icon = (name, size = 18) =>
    `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.grid}</svg>`;

  /* ---------------- helpers ---------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const pct = (value) => Math.max(0, Math.min(100, Number(value) || 0));
  const nowTime = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const nowDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const dateAfter = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const uid = (prefix) => `${prefix}-${Date.now().toString(36).slice(-5)}`;

  function toneFor(status) {
    const s = String(status);
    if (['成功', '健康', '活跃', '发布', '已发布', '已完成', '已处理', '已启用', '低', 'SUCCEEDED', 'APPROVED', 'RELEASED', '待发布', '已批准', '进行中'].includes(s)) return 'success';
    if (['失败', '已取消', '已中止', '已回滚', '高', '严重', 'FAILED', 'ROLLED_BACK', 'PARTIALLY_ROLLED_BACK'].includes(s)) return 'danger';
    if (['待确认', '待审批', '排队中', '部分失败', '已延期', '测试', '中', '警告', 'PARTIALLY_FAILED', 'PENDING_APPROVAL', 'BLOCKED', '待修改'].includes(s)) return 'warning';
    if (['分析', '开发', '开发中', '方案中', '运行中', '发布中', 'RELEASING', 'DEPLOYING', 'PENDING', '待分析', '未开始'].includes(s)) return 'info';
    if (['设计', '规划中', '已暂停'].includes(s)) return 'purple';
    return 'neutral';
  }
  const STATUS_LABEL = {
    PENDING_APPROVAL: '待审批',
    APPROVED: '已审批',
    RELEASING: '发布中',
    SUCCEEDED: '成功',
    PARTIALLY_FAILED: '部分失败',
    FAILED: '失败',
    ROLLED_BACK: '已回滚',
    PARTIALLY_ROLLED_BACK: '部分回滚',
    PENDING: '待部署',
    DEPLOYING: '部署中',
    BLOCKED: '已阻断',
    RELEASED: '已发布'
  };
  const pill = (status, extra = '') => `<span class="pill ${toneFor(status)} ${extra}" title="${esc(status)}">${esc(STATUS_LABEL[status] || status)}</span>`;
  const rolePill = (role) => `<span class="role-pill role-${String(role).toLowerCase()}">${esc(role)}</span>`;
  const PROJECT_ROLES = ['Maintainer', 'Developer', 'Viewer', 'Auditor'];
  const priorityPill = (p) => `<span class="pill ${p === 'P0' ? 'danger' : p === 'P1' ? 'warning' : p === 'P2' ? 'info' : 'neutral'}">${esc(p)}</span>`;
  const riskPill = (risk) => `<span class="risk ${risk === '低' ? 'low' : risk === '中' ? 'medium' : 'high'}">${risk === '高' ? '●' : risk === '中' ? '●' : '●'} ${esc(risk)}风险</span>`;

  function progress(value, tone = '') {
    return `<div class="progress ${tone}"><div class="progress-bar" style="width:${pct(value)}%"></div></div>`;
  }
  function progressLabel(value, tone = '') {
    return `<div class="progress-label">${progress(value, tone)}<span>${pct(value)}%</span></div>`;
  }
  function emptyTable(message) {
    return `<div class="empty-table">${esc(message)}</div>`;
  }
  function avatar(name, color = '#2563eb', small = false) {
    return `<span class="${small ? 'avatar-sm' : 'avatar'}" style="background:linear-gradient(135deg,${color},#06b6d4)">${esc(name.slice(0, 1))}</span>`;
  }
  function pageHead(title, sub, actions = '') {
    return `<div class="page-head">
      <div><div class="page-title-row"><h1 class="page-title">${esc(title)}</h1></div><p class="page-sub">${sub}</p></div>
      <div class="page-actions">${actions}</div>
    </div>`;
  }
  function kpi(label, value, meta = '', opts = {}) {
    return `<div class="kpi ${opts.hero ? 'hero' : ''}">
      <div class="kpi-label">${esc(label)}</div>
      <div class="kpi-value">${value}</div>
      <div class="kpi-meta">${meta}</div>
      ${opts.icon ? `<div class="kpi-icon">${icon(opts.icon, 16)}</div>` : ''}
    </div>`;
  }
  function card(title, sub, body, actions = '', extraClass = '') {
    return `<section class="card ${extraClass}">
      <div class="card-head">
        <div><div class="card-title">${esc(title)}</div>${sub ? `<div class="card-sub">${esc(sub)}</div>` : ''}</div>
        <div class="card-actions">${actions}</div>
      </div>
      <div class="card-body">${body}</div>
    </section>`;
  }
  function barChart(values, labels, opts = {}) {
    const max = Math.max(...values, 1);
    return `<div class="bars">${values.map((value, index) => `
      <div class="bar-item">
        <div class="bar-track"><div class="bar ${opts.soft ? 'soft' : ''}" style="height:${Math.max(5, (value / max) * 100)}%" title="${esc(labels[index])}: ${value}"></div></div>
        <div class="bar-label">${esc(labels[index])}</div>
      </div>`).join('')}</div>`;
  }
  let chartSeq = 0;
  function lineChart(values, labels, color = '#2563eb') {
    const w = 640;
    const h = 190;
    const padX = 30;
    const padTop = 20;
    const padBottom = 28;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const span = Math.max(1, max - min);
    const points = values.map((value, index) => [
      padX + index * (w - padX * 2) / (values.length - 1),
      h - padBottom - ((value - min) / span) * (h - padTop - padBottom)
    ]);
    const line = points.map((point, index) => `${index ? 'L' : 'M'}${point[0].toFixed(1)},${point[1].toFixed(1)}`).join(' ');
    const area = `M${points[0][0]},${h - padBottom} L${points.map((point) => point.join(',')).join(' L')} L${points[points.length - 1][0]},${h - padBottom} Z`;
    const gid = `chart-g-${++chartSeq}`;
    return `<svg class="line-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="趋势图">
      <defs><linearGradient id="${gid}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".20"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      <path d="${area}" fill="url(#${gid})"></path>
      <path d="${line}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
      ${points.map((point) => `<circle cx="${point[0]}" cy="${point[1]}" r="3.5" fill="#fff" stroke="${color}" stroke-width="2"></circle>`).join('')}
      ${labels.map((label, index) => `<text x="${points[index][0]}" y="${h - 7}" text-anchor="middle" font-size="10" fill="#94a3b8">${esc(label)}</text>`).join('')}
    </svg>`;
  }

  /* ---------------- static data ---------------- */
  const PROJECTS = [
    {
      id: 'p-order', name: '订单中心', code: 'ORDER', owner: '张明', status: '活跃', iterationId: 'it-24', health: 98, color: '#2563eb', desc: '订单履约、异常单处理与履约看板', createdAt: '2026-03-12',
      members: [
        { userId: 'u-1', role: 'Owner', joinedAt: '2026-03-12' },
        { userId: 'u-2', role: 'Maintainer', joinedAt: '2026-04-02' },
        { userId: 'u-4', role: 'Developer', joinedAt: '2026-04-18' },
        { userId: 'u-7', role: 'Developer', joinedAt: '2026-07-08' },
        { userId: 'u-8', role: 'Developer', joinedAt: '2026-08-15' },
        { userId: 'u-9', role: 'Maintainer', joinedAt: '2026-09-01' },
        { userId: 'u-10', role: 'Viewer', joinedAt: '2026-06-10' }
      ]
    },
    {
      id: 'p-customer', name: '客户运营', code: 'CRM', owner: '李娜', status: '活跃', iterationId: 'it-23', health: 96, color: '#06b6d4', desc: '客户分层、标签运营与客户门户', createdAt: '2026-04-02',
      members: [
        { userId: 'u-2', role: 'Owner', joinedAt: '2026-04-02' },
        { userId: 'u-5', role: 'Auditor', joinedAt: '2026-04-15' }
      ]
    },
    {
      id: 'p-support', name: '智能客服', code: 'SUPPORT', owner: '王磊', status: '规划中', iterationId: 'it-25', health: 92, color: '#8b5cf6', desc: '客服知识库、智能问答与工单辅助', createdAt: '2026-09-18',
      members: [
        { userId: 'u-3', role: 'Owner', joinedAt: '2026-09-18' }
      ]
    }
  ];

  const ITERATIONS = [
    { id: 'it-24', name: 'v2.4 订单履约优化', version: 'v2.4', projectId: 'p-order', status: '发布中', start: '2026-10-08', end: '2026-10-24', owner: '张明', goal: '缩短订单履约链路，提升异常单处理效率' },
    { id: 'it-25', name: 'v2.5 客服知识库', version: 'v2.5', projectId: 'p-support', status: '规划中', start: '2026-10-20', end: '2026-11-07', owner: '王磊', goal: '构建客服知识库与多轮问答，降低人工工单量' },
    { id: 'it-23', name: 'v2.3 客户分层运营', version: 'v2.3', projectId: 'p-customer', status: '已发布', start: '2026-09-15', end: '2026-09-30', owner: '李娜', goal: '完成客户标签与分层看板，支撑精细化运营' }
  ];

  const REQUIREMENTS = [
    { id: 'RQ-101', title: '订单履约超时预警', projectId: 'p-order', iterationId: 'it-24', status: '测试', priority: 'P0', owner: '张明', apps: ['order-api', 'order-web'], updated: '10:18', ready: true, desc: '对履约节点超时进行实时预警，支持按仓库/承运商维度配置阈值。', acceptance: '超时 5 分钟内触发告警；支持站内通知与邮件；可在履约看板查看。', taskId: 'T-201' },
    { id: 'RQ-102', title: '异常单自动分派', projectId: 'p-order', iterationId: 'it-24', status: '测试', priority: 'P1', owner: '陈晨', apps: ['order-api'], updated: '10:05', ready: true, desc: '按异常类型、仓配能力和历史处理人自动分派异常单。', acceptance: '分派准确率 ≥90%；支持人工改派；分派记录可追溯。', taskId: 'T-202' },
    { id: 'RQ-103', title: '履约看板移动端适配', projectId: 'p-order', iterationId: 'it-24', status: '测试', priority: 'P2', owner: '张明', apps: ['order-web'], updated: '09:52', ready: true, desc: '让履约看板在移动端可查看核心指标与异常列表。', acceptance: '390px 宽度可用；核心指标完整；首屏 ≤2 秒。', taskId: 'T-204' },
    { id: 'RQ-104', title: '订单导出性能优化', projectId: 'p-order', iterationId: 'it-24', status: '设计', priority: 'P2', owner: '陈晨', apps: ['order-api'], updated: '09:40', ready: false, deferredTo: 'it-25', desc: '将大批量订单导出改为异步任务，避免接口超时。', acceptance: '100 万行导出 ≤5 分钟；支持断点续传。', taskId: null },
    { id: 'RQ-110', title: '订单风控规则配置', projectId: 'p-order', iterationId: 'it-24', status: '分析', priority: 'P1', owner: '张明', apps: ['order-api'], updated: '09:35', ready: false, deferredTo: 'it-25', desc: '提供风控规则的可视化配置与灰度发布。', acceptance: '规则可配置；变更审计；灰度可回滚。', taskId: null },
    { id: 'RQ-111', title: '履约节点配置化', projectId: 'p-order', iterationId: 'it-24', status: '测试', priority: 'P1', owner: '陈晨', apps: ['order-api'], updated: '09:28', ready: true, desc: '把履约节点从硬编码改为可配置，支持不同业务线差异。', acceptance: '节点可增删；变更即时生效；历史订单不受影响。', taskId: 'T-203' },
    { id: 'RQ-112', title: '订单状态机可视化', projectId: 'p-order', iterationId: 'it-24', status: '测试', priority: 'P2', owner: '张明', apps: ['order-web'], updated: '09:15', ready: true, desc: '以图形化方式展示订单状态与流转路径，辅助排障。', acceptance: '状态图可交互；异常流转高亮；支持按订单查询。', taskId: null },
    { id: 'RQ-113', title: '履约异常通知', projectId: 'p-order', iterationId: 'it-24', status: '测试', priority: 'P2', owner: '陈晨', apps: ['order-api'], updated: '09:02', ready: true, desc: '履约异常按严重度通知到对应负责人与群组。', acceptance: '通知可配置；去重；支持升级。', taskId: null },
    { id: 'RQ-116', title: '批量打印面单', projectId: 'p-order', iterationId: 'it-24', status: '发布', priority: 'P2', owner: '张明', apps: ['order-api'], updated: '08:58', ready: true, desc: '支持按波次批量打印面单，减少仓库重复操作。', acceptance: '单次支持 500 单；打印失败可重试；操作留痕。', taskId: null },
    { id: 'RQ-117', title: '履约 SLA 阈值配置', projectId: 'p-order', iterationId: 'it-24', status: '发布', priority: 'P2', owner: '李娜', apps: ['order-api'], updated: '08:52', ready: true, desc: '按业务线与仓库配置履约 SLA 阈值，并支持版本化。', acceptance: '阈值可配置；变更审计；历史版本可回滚。', taskId: null },
    { id: 'RQ-118', title: '搜索性能优化', projectId: 'p-order', iterationId: 'it-24', status: '发布', priority: 'P2', owner: '张明', apps: ['order-api'], updated: '08:46', ready: true, desc: '优化订单列表组合查询索引，降低高并发下的查询延迟。', acceptance: 'p95 ≤300ms；慢查询可观测；索引变更可回滚。', taskId: null },
    { id: 'RQ-119', title: '异常单处理看板', projectId: 'p-order', iterationId: 'it-24', status: '发布', priority: 'P2', owner: '李娜', apps: ['order-api'], updated: '08:40', ready: true, desc: '按异常类型与处理人聚合展示处理进度与积压。', acceptance: '支持筛选；数据实时刷新；可导出。', taskId: null },
    { id: 'RQ-120', title: '履约日报', projectId: 'p-order', iterationId: 'it-24', status: '发布', priority: 'P2', owner: '张明', apps: ['order-api'], updated: '08:34', ready: true, desc: '每日生成履约时效、异常与积压摘要并推送负责人。', acceptance: '每日 08:00 推送；支持订阅；失败可重试。', taskId: null },
    { id: 'RQ-105', title: '客户标签批量导入', projectId: 'p-customer', iterationId: 'it-23', status: '发布', priority: 'P1', owner: '李娜', apps: ['customer-portal'], updated: '昨天', ready: true, desc: '支持 CSV 批量导入客户标签并自动去重。', acceptance: '10 万行导入 ≤2 分钟；错误行可下载。', taskId: null },
    { id: 'RQ-106', title: '客户分层看板', projectId: 'p-customer', iterationId: 'it-23', status: '发布', priority: 'P2', owner: '李娜', apps: ['customer-portal'], updated: '昨天', ready: true, desc: '展示客户分层、活跃度与标签分布。', acceptance: '支持筛选；数据 T+1；可导出。', taskId: null },
    { id: 'RQ-107', title: '客服知识库检索', projectId: 'p-support', iterationId: 'it-25', status: '设计', priority: 'P1', owner: '王磊', apps: ['support-bot'], updated: '10:22', ready: false, desc: '基于向量检索的知识库问答，支持引用溯源。', acceptance: 'Top3 命中率 ≥85%；答案带引用；可反馈。', taskId: 'T-206' },
    { id: 'RQ-108', title: '智能问答多轮会话', projectId: 'p-support', iterationId: 'it-25', status: '分析', priority: 'P0', owner: '王磊', apps: ['support-bot'], updated: '10:10', ready: false, desc: '支持多轮追问与上下文记忆。', acceptance: '3 轮上下文保持；可转人工；会话可审计。', taskId: null },
    { id: 'RQ-109', title: '工单自动摘要', projectId: 'p-support', iterationId: 'it-25', status: '开发', priority: 'P2', owner: '王磊', apps: ['support-bot'], updated: '09:48', ready: false, desc: '自动生成工单摘要与处理建议。', acceptance: '摘要 ≤200 字；关键信息完整；可编辑。', taskId: null },
    { id: 'RQ-114', title: '客服意图识别优化', projectId: 'p-support', iterationId: 'it-25', status: '测试', priority: 'P1', owner: '王磊', apps: ['support-bot'], updated: '09:30', ready: true, desc: '优化意图分类模型，提升常见问题识别率。', acceptance: '意图准确率 ≥92%；badcase 可回流。', taskId: null },
    { id: 'RQ-115', title: '知识库文档同步', projectId: 'p-support', iterationId: 'it-25', status: '测试', priority: 'P2', owner: '王磊', apps: ['support-bot'], updated: '09:12', ready: true, desc: '支持飞书/本地 Markdown 文档增量同步到知识库。', acceptance: '同步延迟 ≤5 分钟；失败可重试；删除可传播。', taskId: null }
  ];

  const REQUIREMENT_COMMENTS = [
    { id: 'C-201', requirementId: 'RQ-101', author: '张明', time: '10:02', content: '已补充超时阈值配置范围，请确认是否需要按仓库区分。' },
    { id: 'C-202', requirementId: 'RQ-101', author: '陈晨', time: '10:12', content: '建议先覆盖华东仓与华南仓，后续扩展到全部仓库。' },
    { id: 'C-203', requirementId: 'RQ-102', author: '李娜', time: '09:45', content: '异常类型需要支持人工维护，避免自动分派误判。' }
  ];

  const REQUIREMENT_HISTORY = [
    {
      id: 'H-301', requirementId: 'RQ-101', actor: '张明', time: '10:18', action: '更新需求',
      changes: [{ label: '优先级', before: 'P1', after: 'P0' }, { label: '验收标准', updated: true }]
    },
    {
      id: 'H-302', requirementId: 'RQ-101', actor: '陈晨', time: '09:40', action: '更新需求',
      changes: [{ label: '状态', before: '设计', after: '测试' }, { label: '责任人', before: '陈晨', after: '张明' }]
    },
    {
      id: 'H-303', requirementId: 'RQ-101', actor: '张明', time: '09:12', action: '创建需求',
      changes: [{ label: '初始状态', after: '分析' }, { label: '优先级', after: 'P1' }, { label: '关联应用', after: 'order-api、order-web' }]
    },
    {
      id: 'H-304', requirementId: 'RQ-102', actor: '陈晨', time: '10:05', action: '更新需求',
      changes: [{ label: '状态', before: '开发', after: '测试' }]
    },
    {
      id: 'H-305', requirementId: 'RQ-102', actor: '陈晨', time: '09:30', action: '创建需求',
      changes: [{ label: '初始状态', after: '分析' }, { label: '优先级', after: 'P1' }, { label: '关联应用', after: 'order-api' }]
    },
    {
      id: 'H-306', requirementId: 'RQ-107', actor: '王磊', time: '10:22', action: '更新需求',
      changes: [{ label: '状态', before: '分析', after: '设计' }, { label: '责任人', before: '张明', after: '王磊' }]
    },
    {
      id: 'H-307', requirementId: 'RQ-107', actor: '王磊', time: '09:50', action: '创建需求',
      changes: [{ label: '初始状态', after: '分析' }, { label: '关联应用', after: 'support-bot' }]
    },
    {
      id: 'H-308', requirementId: 'RQ-104', actor: '陈晨', time: '09:40', action: '更新需求',
      changes: [{ label: '状态', before: '分析', after: '设计' }, { label: '优先级', before: 'P1', after: 'P2' }]
    }
  ];

  const TASKS = [
    {
      id: 'T-201', title: '需求分析 · 订单履约超时预警', agent: '需求分析', type: '需求分析', projectId: 'p-order', requirementId: 'RQ-101', status: '待确认', progress: 100, started: '10:02', duration: '3m 12s', tokens: '12.4k', steps: 8, updated: '10:05',
      summary: '已识别 3 个履约节点、2 个外部依赖，建议拆分为 4 个子任务。',
      tools: [
        { name: '读取需求与附件', status: '成功', meta: '3 个附件' },
        { name: '检索历史项目', status: '成功', meta: '命中 6 条' },
        { name: '调用需求分析图', status: '成功', meta: '12.4k tokens' },
        { name: '写回分析结果', status: '成功', meta: 'RQ-101' }
      ],
      logs: '[10:02:11] task leased by agent-worker-2\n[10:02:13] load requirement RQ-101\n[10:02:18] retrieve 6 related docs\n[10:03:42] analysis graph completed\n[10:05:02] write back analysis_ready\n[10:05:03] waiting for human confirmation',
      diff: null
    },
    {
      id: 'T-202', title: '方案设计 · 异常单自动分派', agent: '方案设计', type: '方案设计', projectId: 'p-order', requirementId: 'RQ-102', status: '运行中', progress: 68, started: '10:12', duration: '6m 40s', tokens: '18.7k', steps: 14, updated: '10:19',
      summary: '正在生成接口变更与任务拆解，已读取 2 个相关仓库。',
      tools: [
        { name: '读取仓库上下文', status: '成功', meta: 'order-api' },
        { name: '查询能力目录', status: '成功', meta: '3 个能力' },
        { name: '生成方案草稿', status: '运行中', meta: '68%' }
      ],
      logs: '[10:12:04] task leased by agent-worker-1\n[10:12:09] load RQ-102 and RQ-101 analysis\n[10:13:21] read repo order-api\n[10:16:40] capability lookup done\n[10:19:02] generating solution draft...',
      diff: null
    },
    {
      id: 'T-203', title: '需求开发 · 订单状态机可视化', agent: 'Coding', type: '需求开发', projectId: 'p-order', requirementId: 'RQ-111', status: '待审批', progress: 100, started: '09:40', duration: '18m 06s', tokens: '42.1k', steps: 36, updated: '09:58',
      summary: '已完成 4 个文件修改，单测 24/24 通过，等待人工审批 MR。',
      tools: [
        { name: '读取仓库', status: '成功', meta: 'order-web' },
        { name: '修改文件', status: '成功', meta: '4 个文件' },
        { name: '运行单测', status: '成功', meta: '24 passed' },
        { name: '创建 MR', status: '成功', meta: '!128' }
      ],
      logs: '[09:40:02] task leased by coding-worker-1\n[09:40:08] lease sandbox sb-9f2a\n[09:41:12] read 14 files from order-web\n[09:48:30] applied 4 file changes\n[09:55:20] run unit tests: 24 passed\n[09:58:04] opened MR !128\n[09:58:05] waiting for approval',
      diff: {
        files: 4, additions: 126, deletions: 38,
        lines: [
          { type: 'meta', text: 'diff --git a/src/order/state-machine.ts b/src/order/state-machine.ts' },
          { type: 'meta', text: '@@ -18,7 +18,9 @@ export class OrderStateMachine {' },
          { type: 'del', text: '  private transitions = {' },
          { type: 'add', text: '  private transitions = new Map<string, Transition[]>()' },
          { type: 'add', text: '  private visualizer?: StateVisualizer' },
          { type: 'meta', text: '@@ -42,6 +44,14 @@ export class OrderStateMachine {' },
          { type: 'add', text: '  attachVisualizer(visualizer: StateVisualizer) {' },
          { type: 'add', text: '    this.visualizer = visualizer' },
          { type: 'add', text: '    visualizer.render(this.snapshot())' },
          { type: 'add', text: '  }' },
          { type: 'meta', text: 'diff --git a/src/order/state-visualizer.tsx b/src/order/state-visualizer.tsx' },
          { type: 'add', text: 'export function StateVisualizer(props: Props) {' },
          { type: 'add', text: '  return <Graph nodes={props.nodes} edges={props.edges} />' },
          { type: 'add', text: '}' }
        ]
      }
    },
    {
      id: 'T-204', title: '测试生成 · 履约看板移动端', agent: '测试生成', type: '测试生成', projectId: 'p-order', requirementId: 'RQ-103', status: '成功', progress: 100, started: '09:20', duration: '2m 18s', tokens: '8.2k', steps: 9, updated: '09:22',
      summary: '生成 18 条用例，覆盖 6 个验收标准，沙箱执行全部通过。',
      tools: [
        { name: '读取验收标准', status: '成功', meta: '6 条' },
        { name: '生成测试用例', status: '成功', meta: '18 条' },
        { name: '沙箱执行', status: '成功', meta: '18 passed' }
      ],
      logs: '[09:20:01] task leased by agent-worker-3\n[09:20:06] load RQ-103 acceptance criteria\n[09:21:10] generated 18 test cases\n[09:22:01] sandbox run: 18 passed\n[09:22:02] report written to OSS',
      diff: null
    },
    {
      id: 'T-205', title: '运维诊断 · customer-portal 延迟升高', agent: '运维诊断', type: '运维诊断', projectId: 'p-customer', requirementId: null, status: '失败', progress: 100, started: '09:48', duration: '4m 02s', tokens: '6.9k', steps: 11, updated: '09:52',
      summary: '查询链路指标时权限不足，任务已失败。',
      tools: [
        { name: '查询 Prometheus', status: '失败', meta: '403 Forbidden' },
        { name: '查询 Loki', status: '未执行', meta: '—' },
        { name: '生成诊断结论', status: '未执行', meta: '—' }
      ],
      logs: '[09:48:02] task leased by agent-worker-2\n[09:48:10] query prometheus: customer-portal\n[09:48:11] ERROR 403 Forbidden: capability observability.query not granted\n[09:52:01] task failed after 11 steps',
      diff: null
    },
    {
      id: 'T-206', title: '需求分析 · 客服知识库检索', agent: '需求分析', type: '需求分析', projectId: 'p-support', requirementId: 'RQ-107', status: '排队中', progress: 0, started: '—', duration: '—', tokens: '0', steps: 0, updated: '10:22',
      summary: '等待 Agent worker 空闲。',
      tools: [],
      logs: '[10:22:01] task enqueued\n[10:22:01] waiting for available agent worker',
      diff: null
    },
    {
      id: 'T-207', title: '缺陷修复 · 订单导出超时', agent: 'Coding', type: '缺陷修复', projectId: 'p-order', requirementId: 'RQ-104', status: '运行中', progress: 42, started: '10:24', duration: '4m 12s', tokens: '21.6k', steps: 18, updated: '10:28',
      summary: '已定位导出任务未分片，正在改为按游标分批导出并补充超时重试。',
      tools: [
        { name: '检索导出链路', status: '成功', meta: '8 个文件' },
        { name: '读取任务配置', status: '成功', meta: 'export-worker' },
        { name: '运行单测', status: '运行中', meta: '12/18 passed' }
      ],
      logs: '[10:24:01] task leased by coding-worker-1\n[10:24:08] search export pipeline\n[10:25:16] read internal/export/worker.go\n[10:26:42] apply cursor batch patch\n[10:28:01] run unit tests: 12/18 passed',
      diff: null
    },
    {
      id: 'T-208', title: '需求开发 · 批量打印面单', agent: 'Coding', type: '需求开发', projectId: 'p-order', requirementId: 'RQ-116', status: '排队中', progress: 0, started: '—', duration: '—', tokens: '0', steps: 0, updated: '10:26',
      summary: '等待 Coding worker 与沙箱配额。',
      tools: [],
      logs: '[10:26:03] task enqueued\n[10:26:03] waiting for coding-worker',
      diff: null
    },
    {
      id: 'T-209', title: '缺陷修复 · 订单搜索慢查询', agent: 'Coding', type: '缺陷修复', projectId: 'p-order', requirementId: 'RQ-118', status: '失败', progress: 100, started: '09:30', duration: '7m 48s', tokens: '15.3k', steps: 22, updated: '09:38',
      summary: '索引变更未生效，SQL 仍走全表扫描，任务失败等待人工处理。',
      tools: [
        { name: '分析慢查询', status: '成功', meta: 'p95 1.8s' },
        { name: '生成索引变更', status: '成功', meta: '2 个迁移' },
        { name: '测试环境验证', status: '失败', meta: '仍为全表扫描' }
      ],
      logs: '[09:30:02] task leased by coding-worker-2\n[09:31:18] analyze slow query\n[09:34:02] generate index migration\n[09:37:40] test env validation failed\n[09:38:01] task failed after 22 steps',
      diff: null
    }
  ];

  const TASK_VIEWS = {
    'T-207': {
      files: [
        {
          path: 'internal/export/worker.go', status: 'M', additions: 38, deletions: 12,
          diff: [
            { type: 'meta', text: 'diff --git a/internal/export/worker.go b/internal/export/worker.go' },
            { type: 'meta', text: '@@ -86,9 +86,15 @@ func (w *Worker) Export(ctx context.Context, req ExportRequest) error {' },
            { type: 'del', text: '  orders, err := w.repo.ListByTimeRange(ctx, req.Start, req.End)' },
            { type: 'add', text: '  cursor := NewCursor(req.Start, 0)' },
            { type: 'add', text: '  for {' },
            { type: 'add', text: '    orders, next, err := w.repo.ListBatch(ctx, cursor, 500)' },
            { type: 'add', text: '    if err != nil { return fmt.Errorf("list batch: %w", err) }' },
            { type: 'add', text: '    if err := w.writeBatch(ctx, orders); err != nil { return err }' },
            { type: 'add', text: '    if next.Empty() { break }' },
            { type: 'add', text: '    cursor = next' },
            { type: 'add', text: '  }' }
          ]
        },
        {
          path: 'internal/export/cursor.go', status: 'A', additions: 64, deletions: 0,
          diff: [
            { type: 'meta', text: 'diff --git a/internal/export/cursor.go b/internal/export/cursor.go' },
            { type: 'meta', text: '@@ -0,0 +1,64 @@' },
            { type: 'add', text: 'package export' },
            { type: 'add', text: '' },
            { type: 'add', text: 'type Cursor struct { CreatedAt time.Time; ID int64 }' },
            { type: 'add', text: 'func (c Cursor) Empty() bool { return c.ID == 0 }' },
            { type: 'add', text: 'func NewCursor(at time.Time, id int64) Cursor { return Cursor{at, id} }' }
          ]
        },
        {
          path: 'internal/export/worker_test.go', status: 'M', additions: 26, deletions: 4,
          diff: [
            { type: 'meta', text: 'diff --git a/internal/export/worker_test.go b/internal/export/worker_test.go' },
            { type: 'meta', text: '@@ -120,4 +120,26 @@' },
            { type: 'add', text: 'func TestExportCursorBatches(t *testing.T) {' },
            { type: 'add', text: '  // 1200 rows in 3 batches, no duplicates' },
            { type: 'add', text: '}' }
          ]
        }
      ],
      events: [
        { type: 'system', time: '10:24:01', content: '任务启动 · 缺陷修复 · order-api' },
        { type: 'plan', time: '10:24:04', title: '执行计划', items: [
          { text: '定位导出超时根因', done: true, active: false },
          { text: '实现游标分批导出', done: false, active: true },
          { text: '补充超时重试与监控', done: false, active: false },
          { text: '运行单测与冒烟验证', done: false, active: false }
        ] },
        { type: 'thinking', time: '10:24:08', duration: '8s', content: '导出接口一次性加载全部订单，10 万行时内存和查询时间都会超限。需要改为按游标分批读取，并在批次之间做超时保护。' },
        { type: 'tool', time: '10:24:18', name: 'search_code', args: 'pattern="ExportOrders" path="internal/export"', status: '成功', duration: '1.2s', result: '命中 8 个文件；入口在 internal/export/worker.go。' },
        { type: 'tool', time: '10:24:36', name: 'read_file', args: 'internal/export/worker.go', status: '成功', duration: '0.4s', result: '读取 326 行；发现 ListByTimeRange 全量查询，无分页。' },
        { type: 'thinking', time: '10:25:02', duration: '12s', content: '采用 created_at + id 的复合游标，避免同一时间戳下的重复或漏导；批次大小 500，最大并发 2。' },
        { type: 'file', time: '10:26:42', path: 'internal/export/worker.go', additions: 38, deletions: 12 },
        { type: 'file', time: '10:26:50', path: 'internal/export/cursor.go', additions: 64, deletions: 0 },
        { type: 'tool', time: '10:27:12', name: 'apply_patch', args: 'internal/export/worker.go, cursor.go', status: '成功', duration: '0.8s', result: '2 个文件已更新。' },
        { type: 'tool', time: '10:28:01', name: 'run_tests', args: 'go test ./internal/export/...', status: '运行中', duration: '—', result: '12/18 passed，测试仍在运行…' }
      ]
    },
    'T-203': {
      files: [
        {
          path: 'src/order/state-machine.ts', status: 'M', additions: 28, deletions: 9,
          diff: [
            { type: 'meta', text: 'diff --git a/src/order/state-machine.ts b/src/order/state-machine.ts' },
            { type: 'meta', text: '@@ -18,7 +18,9 @@ export class OrderStateMachine {' },
            { type: 'del', text: '  private transitions = {' },
            { type: 'add', text: '  private transitions = new Map<string, Transition[]>()' },
            { type: 'add', text: '  private visualizer?: StateVisualizer' },
            { type: 'meta', text: '@@ -42,6 +44,14 @@ export class OrderStateMachine {' },
            { type: 'add', text: '  attachVisualizer(visualizer: StateVisualizer) {' },
            { type: 'add', text: '    this.visualizer = visualizer' },
            { type: 'add', text: '    visualizer.render(this.snapshot())' },
            { type: 'add', text: '  }' }
          ]
        },
        {
          path: 'src/order/state-visualizer.tsx', status: 'A', additions: 52, deletions: 0,
          diff: [
            { type: 'meta', text: 'diff --git a/src/order/state-visualizer.tsx b/src/order/state-visualizer.tsx' },
            { type: 'add', text: 'export function StateVisualizer(props: Props) {' },
            { type: 'add', text: '  return <Graph nodes={props.nodes} edges={props.edges} />' },
            { type: 'add', text: '}' }
          ]
        },
        {
          path: 'src/order/__tests__/state-machine.test.ts', status: 'M', additions: 46, deletions: 12,
          diff: [
            { type: 'meta', text: 'diff --git a/src/order/__tests__/state-machine.test.ts b/src/order/__tests__/state-machine.test.ts' },
            { type: 'add', text: 'it("renders the state graph", async () => {' },
            { type: 'add', text: '  render(<StateVisualizer nodes={nodes} edges={edges} />)' },
            { type: 'add', text: '})' }
          ]
        },
        {
          path: 'src/order/types.ts', status: 'M', additions: 8, deletions: 4,
          diff: [
            { type: 'meta', text: 'diff --git a/src/order/types.ts b/src/order/types.ts' },
            { type: 'add', text: 'export type StateGraph = { nodes: StateNode[]; edges: StateEdge[] }' }
          ]
        }
      ],
      events: [
        { type: 'system', time: '09:40:02', content: '任务启动 · 需求开发 · order-web' },
        { type: 'thinking', time: '09:40:10', duration: '14s', content: '先读取状态机实现与现有页面结构，确认可视化组件应挂载在订单详情的状态区，避免改动订单查询接口。' },
        { type: 'tool', time: '09:41:12', name: 'read_repo', args: 'repository="order-web" branch="main"', status: '成功', duration: '3.4s', result: '读取 14 个文件，定位 order/state-machine.ts 与订单详情页。' },
        { type: 'tool', time: '09:48:30', name: 'apply_patch', args: '4 files changed', status: '成功', duration: '1.1s', result: '已完成 4 个文件修改，新增状态图组件与关联类型。' },
        { type: 'file', time: '09:48:31', path: 'src/order/state-machine.ts', additions: 28, deletions: 9 },
        { type: 'file', time: '09:48:32', path: 'src/order/state-visualizer.tsx', additions: 52, deletions: 0 },
        { type: 'file', time: '09:48:33', path: 'src/order/__tests__/state-machine.test.ts', additions: 46, deletions: 12 },
        { type: 'tool', time: '09:55:20', name: 'run_tests', args: 'pnpm test state-machine', status: '成功', duration: '42s', result: '24 passed，0 failed。' },
        { type: 'tool', time: '09:58:04', name: 'create_mr', args: 'target="main"', status: '成功', duration: '0.6s', result: '已创建 MR !128，等待人工审批。' },
        { type: 'message', role: 'assistant', time: '09:58:05', content: '已完成订单状态机可视化改造：新增可交互状态图、异常流转高亮，并补充 24 条单测。MR !128 等待审批。' },
        { type: 'system', time: '09:58:06', content: '任务进入待审批状态，等待人工确认。' }
      ]
    },
    'T-209': {
      files: [
        {
          path: 'migrations/20261029_add_order_search_index.sql', status: 'A', additions: 18, deletions: 0,
          diff: [
            { type: 'meta', text: 'diff --git a/migrations/20261029_add_order_search_index.sql b/migrations/20261029_add_order_search_index.sql' },
            { type: 'add', text: 'CREATE INDEX CONCURRENTLY idx_orders_search' },
            { type: 'add', text: 'ON orders (status, created_at DESC, id DESC);' }
          ]
        }
      ],
      events: [
        { type: 'system', time: '09:30:02', content: '任务启动 · 缺陷修复 · order-api' },
        { type: 'thinking', time: '09:31:04', duration: '9s', content: '慢查询集中在订单列表的组合过滤与排序，需要确认现有索引是否覆盖 (status, created_at, id) 顺序。' },
        { type: 'tool', time: '09:31:18', name: 'analyze_slow_query', args: 'p95 > 1s window=30m', status: '成功', duration: '2.8s', result: 'p95 1.8s；EXPLAIN 显示 orders 全表扫描。' },
        { type: 'file', time: '09:34:02', path: 'migrations/20261029_add_order_search_index.sql', additions: 18, deletions: 0 },
        { type: 'tool', time: '09:37:40', name: 'test_env_validation', args: 'EXPLAIN ANALYZE', status: '失败', duration: '1.6s', result: '迁移在测试库未生效，执行计划仍为 Seq Scan。' },
        { type: 'message', role: 'assistant', time: '09:38:00', content: '索引迁移已生成，但测试环境未生效，任务失败。建议检查迁移执行权限与 CONCURRENTLY 事务限制后重试。' },
        { type: 'system', time: '09:38:01', content: '任务失败，等待人工处理或重试。' }
      ]
    }
  };

  const APPS = [
    {
      id: 'order-api', name: 'order-api', projectId: 'p-order', repo: 'platform/order-api',
      envs: {
        prod: { version: 'v2.4.0', status: '健康', pods: '3/3', cpu: 38, mem: 62, lastDeploy: '2026-10-24 10:08', digest: 'sha256:8f3a9c2e7b41', url: 'https://order-api.order.apps.ai-devops.local', namespace: 'app-order-prod' },
        test: { version: 'v2.4.0-rc3', status: '健康', pods: '2/2', cpu: 26, mem: 48, lastDeploy: '2026-10-24 09:12', digest: 'sha256:3c1d7f9a2b08', url: 'https://order-api.order.test.apps.ai-devops.local', namespace: 'app-order-test' }
      }
    },
    {
      id: 'order-web', name: 'order-web', projectId: 'p-order', repo: 'platform/order-web',
      envs: {
        prod: { version: 'v2.4.0', status: '健康', pods: '2/2', cpu: 22, mem: 41, lastDeploy: '2026-10-24 10:14', digest: 'sha256:2c9d71be0a55', url: 'https://order-web.order.apps.ai-devops.local', namespace: 'app-order-prod' },
        test: { version: 'v2.4.0-rc3', status: '健康', pods: '2/2', cpu: 18, mem: 36, lastDeploy: '2026-10-24 09:16', digest: 'sha256:7a2e5c9d1f30', url: 'https://order-web.order.test.apps.ai-devops.local', namespace: 'app-order-test' }
      }
    },
    {
      id: 'order-worker', name: 'order-worker', projectId: 'p-order', repo: 'platform/order-worker',
      envs: {
        prod: { version: 'v2.3.9', status: '健康', pods: '2/2', cpu: 44, mem: 58, lastDeploy: '2026-10-18 16:20', digest: 'sha256:5b8f0a2c7d19', url: 'https://order-worker.order.apps.ai-devops.local', namespace: 'app-order-prod' },
        test: { version: 'v2.4.0-rc2', status: '健康', pods: '1/1', cpu: 31, mem: 44, lastDeploy: '2026-10-24 09:20', digest: 'sha256:b4e2d7c0a918', url: 'https://order-worker.order.test.apps.ai-devops.local', namespace: 'app-order-test' }
      }
    },
    {
      id: 'order-admin', name: 'order-admin', projectId: 'p-order', repo: 'platform/order-admin',
      envs: {
        prod: { version: 'v2.3.5', status: '健康', pods: '2/2', cpu: 17, mem: 33, lastDeploy: '2026-10-12 11:05', digest: 'sha256:9e1c4b7a2f60', url: 'https://order-admin.order.apps.ai-devops.local', namespace: 'app-order-prod' },
        test: { version: 'v2.4.0-rc1', status: '健康', pods: '1/1', cpu: 12, mem: 29, lastDeploy: '2026-10-23 18:40', digest: 'sha256:1f7a3d9c5b22', url: 'https://order-admin.order.test.apps.ai-devops.local', namespace: 'app-order-test' }
      }
    },
    {
      id: 'customer-portal', name: 'customer-portal', projectId: 'p-customer', repo: 'platform/customer-portal',
      envs: {
        prod: { version: 'v2.3.1', status: '降级', pods: '2/3', cpu: 71, mem: 78, lastDeploy: '2026-10-23 18:40', digest: 'sha256:71be2c9d4f08', url: 'https://customer-portal.crm.apps.ai-devops.local', namespace: 'app-crm-prod' },
        test: { version: 'v2.3.2-rc1', status: '健康', pods: '1/1', cpu: 24, mem: 39, lastDeploy: '2026-10-23 17:10', digest: 'sha256:0d8e2a5f7c31', url: 'https://customer-portal.crm.test.apps.ai-devops.local', namespace: 'app-crm-test' }
      }
    },
    {
      id: 'support-bot', name: 'support-bot', projectId: 'p-support', repo: 'platform/support-bot',
      envs: {
        test: { version: 'v0.9.0', status: '健康', pods: '1/1', cpu: 18, mem: 35, lastDeploy: '2026-10-24 09:30', digest: 'sha256:9d02a1f3c9e6', url: 'https://support-bot.support.test.apps.ai-devops.local', namespace: 'app-support-test' }
      }
    }
  ];

  const PIPELINES = [
    {
      id: 'RUN-8821', projectId: 'p-order', appId: 'order-api', branch: 'feat/order-timeout', commit: 'a1f3c9e', status: '成功', duration: '6m 12s', triggeredBy: '张明', time: '10:02',
      stages: [
        { name: 'checkout', status: '成功', duration: '8s' }, { name: 'build', status: '成功', duration: '1m 42s' },
        { name: 'test', status: '成功', duration: '2m 08s' }, { name: 'scan', status: '成功', duration: '36s' },
        { name: 'image', status: '成功', duration: '1m 04s' }, { name: 'deploy test', status: '成功', duration: '28s' },
        { name: 'smoke', status: '成功', duration: '14s' }
      ],
      logs: '[10:02:01] pipeline RUN-8821 started\n[10:02:09] checkout a1f3c9e\n[10:03:51] build completed\n[10:05:59] unit tests: 126 passed\n[10:06:35] trivy scan: no critical\n[10:07:39] image pushed harbor/order-api:sha-a1f3c9e\n[10:08:07] deploy test succeeded\n[10:08:21] smoke test passed'
    },
    {
      id: 'RUN-8822', projectId: 'p-order', appId: 'order-web', branch: 'feat/mobile-dashboard', commit: 'b7d2e11', status: '运行中', duration: '3m 20s', triggeredBy: '张明', time: '10:16',
      stages: [
        { name: 'checkout', status: '成功', duration: '7s' }, { name: 'build', status: '成功', duration: '1m 18s' },
        { name: 'test', status: '成功', duration: '1m 44s' }, { name: 'scan', status: '运行中', duration: '—' },
        { name: 'image', status: '等待', duration: '—' }, { name: 'deploy test', status: '等待', duration: '—' },
        { name: 'smoke', status: '等待', duration: '—' }
      ],
      logs: '[10:16:01] pipeline RUN-8822 started\n[10:16:08] checkout b7d2e11\n[10:17:26] build completed\n[10:19:10] unit tests: 89 passed\n[10:19:14] trivy scan running...'
    },
    {
      id: 'RUN-8823', projectId: 'p-order', appId: 'order-worker', branch: 'feat/state-machine', commit: 'c9a4f02', status: '失败', duration: '4m 08s', triggeredBy: '陈晨', time: '09:56',
      stages: [
        { name: 'checkout', status: '成功', duration: '6s' }, { name: 'build', status: '成功', duration: '1m 12s' },
        { name: 'test', status: '成功', duration: '1m 36s' }, { name: 'scan', status: '成功', duration: '31s' },
        { name: 'image', status: '成功', duration: '52s' }, { name: 'deploy test', status: '成功', duration: '26s' },
        { name: 'smoke', status: '失败', duration: '30s' }
      ],
      logs: '[09:56:01] pipeline RUN-8823 started\n[09:56:07] checkout c9a4f02\n[09:57:19] build completed\n[09:58:55] unit tests: 64 passed\n[09:59:26] scan passed\n[10:00:18] image pushed harbor/order-worker:sha-c9a4f02\n[10:00:44] deploy test succeeded\n[10:01:14] smoke failed: /healthz timeout after 30s'
    },
    {
      id: 'RUN-8824', projectId: 'p-customer', appId: 'customer-portal', branch: 'fix/health-check', commit: 'd2e8a77', status: '成功', duration: '5m 44s', triggeredBy: '李娜', time: '09:18',
      stages: [
        { name: 'checkout', status: '成功', duration: '6s' }, { name: 'build', status: '成功', duration: '1m 38s' },
        { name: 'test', status: '成功', duration: '1m 52s' }, { name: 'scan', status: '成功', duration: '29s' },
        { name: 'image', status: '成功', duration: '58s' }, { name: 'deploy test', status: '成功', duration: '24s' },
        { name: 'smoke', status: '成功', duration: '17s' }
      ],
      logs: '[09:18:01] pipeline RUN-8824 started\n[09:18:07] checkout d2e8a77\n[09:19:45] build completed\n[09:21:37] tests passed\n[09:22:06] scan passed\n[09:23:04] image pushed\n[09:23:28] deploy test succeeded\n[09:23:45] smoke passed'
    },
    {
      id: 'RUN-8825', projectId: 'p-support', appId: 'support-bot', branch: 'feat/kb-search', commit: 'e5f1b90', status: '成功', duration: '4m 51s', triggeredBy: '王磊', time: '09:30',
      stages: [
        { name: 'checkout', status: '成功', duration: '5s' }, { name: 'build', status: '成功', duration: '1m 02s' },
        { name: 'test', status: '成功', duration: '1m 18s' }, { name: 'scan', status: '成功', duration: '27s' },
        { name: 'image', status: '成功', duration: '46s' }, { name: 'deploy test', status: '成功', duration: '22s' },
        { name: 'smoke', status: '成功', duration: '11s' }
      ],
      logs: '[09:30:01] pipeline RUN-8825 started\n[09:30:06] checkout e5f1b90\n[09:31:08] build completed\n[09:32:26] tests passed\n[09:33:53] image pushed\n[09:34:15] deploy test succeeded\n[09:34:26] smoke passed'
    },
    {
      id: 'RUN-8826', projectId: 'p-order', appId: 'order-admin', branch: 'chore/perf', commit: 'f8a2c11', status: '成功', duration: '3m 36s', triggeredBy: '张明', time: '10:20',
      stages: [
        { name: 'checkout', status: '成功', duration: '5s' }, { name: 'build', status: '成功', duration: '58s' },
        { name: 'test', status: '成功', duration: '1m 06s' }, { name: 'scan', status: '成功', duration: '24s' },
        { name: 'image', status: '成功', duration: '38s' }, { name: 'deploy test', status: '成功', duration: '16s' },
        { name: 'smoke', status: '成功', duration: '9s' }
      ],
      logs: '[10:20:01] pipeline RUN-8826 started\n[10:21:04] build completed\n[10:22:10] tests passed\n[10:23:37] deploy test succeeded\n[10:23:46] smoke passed'
    }
  ];

  const CAPABILITIES = [
    {
      id: 'CAP-001', name: '项目查询', tool: 'project.query', method: 'GET', path: '/v1/projects/{id}', owner: 'ReqMgmt', risk: '低', rest: true, mcp: true, calls: '12.4k', p95: '42ms', version: 'v1.3',
      description: '按项目 ID 查询项目、成员与当前迭代。', scopes: ['project:read'], rateLimit: '600/min',
      example: { id: 'p-order' },
      response: { ok: true, project: { id: 'p-order', name: '订单中心', owner: '张明' }, iteration: { id: 'it-24', version: 'v2.4' } },
      schema: {
        type: 'object', required: ['id'], properties: {
          id: { type: 'string', description: '项目 ID' }
        }
      }
    },
    {
      id: 'CAP-002', name: '需求创建', tool: 'requirement.create', method: 'POST', path: '/v1/requirements', owner: 'ReqMgmt', risk: '中', rest: true, mcp: true, calls: '3.1k', p95: '86ms', version: 'v1.5',
      description: '在指定项目下创建需求，写入验收标准并关联迭代。', scopes: ['requirement:write'], rateLimit: '120/min',
      example: { project_id: 'p-order', title: '订单履约超时预警', priority: 'P1', acceptance: '超时 5 分钟内告警' },
      response: { ok: true, requirement: { id: 'RQ-120', status: 'draft', project_id: 'p-order' } },
      schema: {
        type: 'object', required: ['project_id', 'title', 'priority'], properties: {
          project_id: { type: 'string' },
          title: { type: 'string', maxLength: 120 },
          priority: { type: 'string', enum: ['P0', 'P1', 'P2', 'P3'] },
          acceptance: { type: 'string' }
        }
      }
    },
    {
      id: 'CAP-003', name: '流水线触发', tool: 'pipeline.run', method: 'POST', path: '/v1/pipelines/{id}/runs', owner: 'CICD', risk: '高', rest: true, mcp: false, calls: '890', p95: '120ms', version: 'v1.2',
      description: '触发指定应用的构建与 test 部署流水线。', scopes: ['pipeline:write'], rateLimit: '30/min',
      example: { pipeline_id: 'order-api', branch: 'main' },
      response: { ok: true, run_id: 'RUN-8831', status: 'QUEUED' },
      schema: {
        type: 'object', required: ['pipeline_id', 'branch'], properties: {
          pipeline_id: { type: 'string' },
          branch: { type: 'string' }
        }
      }
    },
    {
      id: 'CAP-004', name: '发布晋升', tool: 'release.promote', method: 'POST', path: '/v1/releases/{id}/promote', owner: 'CICD', risk: '高', rest: true, mcp: false, calls: '210', p95: '150ms', version: 'v1.1',
      description: '按审批后的 release 计划晋升到 prod；仅人工发起。', scopes: ['release:promote'], rateLimit: '10/min',
      example: { release_id: 'rel-24', approver: '李娜' },
      response: { ok: true, release_id: 'rel-24', status: 'APPROVED' },
      schema: {
        type: 'object', required: ['release_id', 'approver'], properties: {
          release_id: { type: 'string' },
          approver: { type: 'string' }
        }
      }
    },
    {
      id: 'CAP-005', name: '观测查询', tool: 'observability.query', method: 'POST', path: '/v1/observability/query', owner: 'Observability', risk: '低', rest: true, mcp: true, calls: '8.7k', p95: '60ms', version: 'v1.4',
      description: '查询指标、日志与链路，用于 Agent 运维诊断。', scopes: ['observability:read'], rateLimit: '300/min',
      example: { project_id: 'p-order', query: 'order-api p95', range: '1h' },
      response: { ok: true, series: [{ metric: 'http_request_p95', value: 528, unit: 'ms' }] },
      schema: {
        type: 'object', required: ['project_id', 'query', 'range'], properties: {
          project_id: { type: 'string' },
          query: { type: 'string' },
          range: { type: 'string', enum: ['1h', '24h', '7d'] }
        }
      }
    },
    {
      id: 'CAP-006', name: 'MR 创建', tool: 'git.mr.create', method: 'POST', path: '/v1/repos/{id}/mrs', owner: 'DocRepo', risk: '中', rest: true, mcp: true, calls: '1.2k', p95: '95ms', version: 'v1.2',
      description: '在指定仓库创建合并请求，绑定需求与 Agent 任务。', scopes: ['repo:write'], rateLimit: '60/min',
      example: { repo_id: 'order-api', title: 'feat: timeout alert', source: 'feat/order-timeout', target: 'main' },
      response: { ok: true, mr: { id: '!129', status: 'open' } },
      schema: {
        type: 'object', required: ['repo_id', 'title', 'source', 'target'], properties: {
          repo_id: { type: 'string' }, title: { type: 'string' }, source: { type: 'string' }, target: { type: 'string' }
        }
      }
    },
    {
      id: 'CAP-007', name: '迭代查询', tool: 'iteration.query', method: 'GET', path: '/v1/iterations/{id}', owner: 'ReqMgmt', risk: '低', rest: true, mcp: true, calls: '2.4k', p95: '38ms', version: 'v1.1',
      description: '查询迭代、需求范围、就绪度与发布状态。', scopes: ['iteration:read'], rateLimit: '600/min',
      example: { id: 'it-24' },
      response: { ok: true, iteration: { id: 'it-24', version: 'v2.4', ready: 6, deferred: 2 } },
      schema: {
        type: 'object', required: ['id'], properties: { id: { type: 'string' } }
      }
    }
  ];

  const ALERTS = [
    { id: 'A-01', severity: '严重', title: 'order-api p95 延迟超过 500ms', source: 'Prometheus', time: '10:18', status: '未处理', projectId: 'p-order', desc: 'order-api p95 已持续 10 分钟高于 500ms，当前 528ms，错误率 1.6%。', runbook: ['确认入口 QPS 与错误率', '查看 order-api 下游依赖与数据库连接池', '检查最近一次发布是否引入慢查询', '必要时回滚到上一 digest'] },
    { id: 'A-02', severity: '警告', title: 'customer-portal Pod 重启 3 次', source: 'kube-state-metrics', time: '10:12', status: '未处理', projectId: 'p-customer', desc: 'customer-portal prod 命名空间 1 个 Pod 处于 CrashLoopBackOff，已重启 3 次。', runbook: ['查看 Pod 事件与上一次退出码', '检查启动探针与配置项', '对比最近一次部署的镜像 digest', '必要时回滚'] },
    { id: 'A-03', severity: '警告', title: 'LLM Gateway 错误率 6.2%', source: 'LangFuse', time: '09:58', status: '处理中', projectId: 'p-order', desc: 'DeepSeek 上游 5xx 升高，LLM Gateway 已触发重试与降级。', runbook: ['确认上游状态', '检查重试预算与队列 backlog', '必要时切换备用模型', '通知受影响项目'] },
    { id: 'A-04', severity: '提示', title: 'Gitea 磁盘使用率 78%', source: 'node-exporter', time: '09:30', status: '已处理', projectId: 'p-order', desc: 'Gitea 数据盘使用率 78%，已清理过期 LFS 对象，当前 71%。', runbook: ['检查仓库与 LFS 增长', '清理过期对象', '评估扩容'] }
  ];

  const USERS = [
    { id: 'u-1', name: '张明', username: 'zhangming', role: '项目 Owner', projects: ['订单中心'], mfa: '已启用', status: '活跃', lastLogin: '10:21', color: '#2563eb', email: 'zhangming@example.com' },
    { id: 'u-2', name: '李娜', username: 'lina', role: '项目 Owner', projects: ['订单中心', '客户运营'], mfa: '已启用', status: '活跃', lastLogin: '09:48', color: '#06b6d4', email: 'lina@example.com' },
    { id: 'u-3', name: '王磊', username: 'wanglei', role: '项目 Maintainer', projects: ['智能客服'], mfa: '已启用', status: '活跃', lastLogin: '10:05', color: '#8b5cf6', email: 'wanglei@example.com' },
    { id: 'u-4', name: '陈晨', username: 'chenchen', role: 'Developer', projects: ['订单中心'], mfa: '未启用', status: '活跃', lastLogin: '09:32', color: '#0ea5e9', email: 'chenchen@example.com' },
    { id: 'u-5', name: '赵敏', username: 'zhaomin', role: '审计员', projects: ['全部项目'], mfa: '已启用', status: '活跃', lastLogin: '08:55', color: '#14b8a6', email: 'zhaomin@example.com' },
    { id: 'u-6', name: '刘洋', username: 'liuyang', role: '平台管理员', projects: ['平台'], mfa: '已启用', status: '活跃', lastLogin: '10:10', color: '#f59e0b', email: 'liuyang@example.com' },
    { id: 'u-7', name: '孙悦', username: 'sunyue', role: 'Developer', projects: ['订单中心'], mfa: '已启用', status: '活跃', lastLogin: '09:20', color: '#f43f5e', email: 'sunyue@example.com' },
    { id: 'u-8', name: '周航', username: 'zhouhang', role: 'Developer', projects: ['订单中心'], mfa: '未启用', status: '活跃', lastLogin: '09:05', color: '#22c55e', email: 'zhouhang@example.com' },
    { id: 'u-9', name: '吴桐', username: 'wutong', role: '项目 Maintainer', projects: ['订单中心'], mfa: '已启用', status: '活跃', lastLogin: '08:42', color: '#a855f7', email: 'wutong@example.com' },
    { id: 'u-10', name: '郑洁', username: 'zhengjie', role: 'Developer', projects: ['订单中心'], mfa: '已启用', status: '活跃', lastLogin: '09:10', color: '#ec4899', email: 'zhengjie@example.com' }
  ];

  const AUDIT = [
    { id: 'AUD-1021', time: '10:21', actor: '张明', action: '审批发布', resource: 'rel-24', result: '成功', ip: '10.0.8.21', trace: 'tr-8f3a2c', detail: { before: { status: 'PENDING_APPROVAL' }, after: { status: 'APPROVED' } } },
    { id: 'AUD-1020', time: '10:18', actor: '系统', action: '告警触发', resource: 'A-01 order-api p95', result: '成功', ip: '—', trace: 'tr-71be4d', detail: { before: null, after: { severity: '严重', value: '528ms' } } },
    { id: 'AUD-1018', time: '10:08', actor: '系统', action: '部署应用', resource: 'order-api prod', result: '成功', ip: '—', trace: 'tr-5c2d8e', detail: { before: { digest: 'sha256:3c1d...' }, after: { digest: 'sha256:8f3a...' } } },
    { id: 'AUD-1015', time: '09:55', actor: '李娜', action: '关闭能力 MCP', resource: 'cap:pipeline.run', result: '成功', ip: '10.0.8.34', trace: 'tr-2a9f1c', detail: { before: { mcp: true }, after: { mcp: false } } },
    { id: 'AUD-1012', time: '09:40', actor: '王磊', action: '创建迭代', resource: 'it-25 v2.5', result: '成功', ip: '10.0.8.42', trace: 'tr-9d02a1', detail: { before: null, after: { iteration: 'v2.5', project: '智能客服' } } },
    { id: 'AUD-1009', time: '09:12', actor: '刘洋', action: '修改功能开关', resource: 'release.require_two_approvers', result: '成功', ip: '10.0.8.10', trace: 'tr-6f7b3a', detail: { before: { enabled: false }, after: { enabled: true } } },
    { id: 'AUD-1004', time: '08:50', actor: '赵敏', action: '导出审计日志', resource: 'audit/2026-10-24', result: '成功', ip: '10.0.8.55', trace: 'tr-3e8c4b', detail: { before: null, after: { rows: 128, format: 'CSV' } } }
  ];

  const FLAGS = [
    { id: 'flag-1', name: 'Agent 自动部署 test', key: 'agent.auto_test_deploy', desc: 'Coding Agent 通过测试后可自动部署到 test；prod 仍需人工审批。', enabled: true, owner: '平台运维', updated: '2026-10-20' },
    { id: 'flag-2', name: '能力 MCP 总开关', key: 'capability.mcp_enabled', desc: '关闭后所有 MCP 工具不可用，REST 不受影响。', enabled: true, owner: '平台管理员', updated: '2026-10-18' },
    { id: 'flag-4', name: 'prod 双人审批', key: 'release.require_two_approvers', desc: 'prod 晋升至少需要两名审批人。', enabled: true, owner: '平台运维', updated: '2026-10-24' },
    { id: 'flag-5', name: '外部 LLM 提供方', key: 'llm.external_provider', desc: '允许经 LLM Gateway 调用外部 DeepSeek；脱敏与审计始终开启。', enabled: true, owner: '平台管理员', updated: '2026-10-16' },
    { id: 'flag-6', name: '沙箱 gVisor', key: 'sandbox.gvisor', desc: '强制沙箱 Pod 使用 gVisor runtimeClass。', enabled: true, owner: '平台运维', updated: '2026-10-21' },
    { id: 'flag-7', name: '新导航入口', key: 'ui.new_navigation', desc: '启用工作台、应用中心、原始需求等新入口（占位）。', enabled: true, owner: '平台管理员', updated: '2026-10-24' }
  ];

  const ENVIRONMENTS = [
    { id: 'test', name: 'test 运行集群', badge: 'TEST', status: '健康', nodes: 6, cpu: 48, mem: 62, pods: '86/200', namespaces: 12, region: '同城可用区 A/B' },
    { id: 'prod', name: 'prod 运行集群', badge: 'PROD', status: '健康', nodes: 8, cpu: 41, mem: 55, pods: '64/240', namespaces: 8, region: '同城可用区 A/B/C' }
  ];

  const DATA_SERVICES = [
    { name: 'PostgreSQL · 平台元数据', version: '16.4', ha: '3 实例', usage: 54, status: '健康' },
    { name: 'PostgreSQL · app-data', version: '16.4', ha: '3 实例', usage: 61, status: '健康' },
    { name: 'Redis', version: '7.2', ha: 'Sentinel', usage: 43, status: '健康' },
    { name: 'MinIO', version: '2026.08', ha: '纠删码', usage: 38, status: '健康' },
    { name: 'Qdrant', version: '1.12', ha: '2 副本', usage: 29, status: '健康' },
    { name: 'Gitea', version: '1.22', ha: '单主 + 备份', usage: 78, status: '注意' },
    { name: 'Harbor', version: '2.11', ha: '≥2 副本', usage: 47, status: '健康' }
  ];

  const QUOTAS = [
    { projectId: 'p-order', name: '订单中心', cpu: 42, mem: 58, pods: 36, storage: 44 },
    { projectId: 'p-customer', name: '客户运营', cpu: 28, mem: 47, pods: 24, storage: 31 },
    { projectId: 'p-support', name: '智能客服', cpu: 36, mem: 52, pods: 22, storage: 25 }
  ];

  const CAP_AUDIT = [
    { time: '09:55', actor: '李娜', capability: 'pipeline.run', change: '关闭 MCP 暴露', version: 'v12', result: '成功' },
    { time: '09:42', actor: '刘洋', capability: 'requirement.create', change: '限流 120/min → 80/min', version: 'v11', result: '成功' },
    { time: '09:20', actor: '刘洋', capability: 'observability.query', change: '新增只读 scope', version: 'v10', result: '成功' },
    { time: '昨天', actor: '张明', capability: 'project.query', change: 'Schema 增加 members 字段', version: 'v9', result: '成功' }
  ];

  const REPOS = [
    { id: 'repo-order-api', name: 'order-api', projectId: 'p-order', path: 'platform/order-api', defaultBranch: 'main', lastCommit: 'a1f3c9e', lastMsg: 'feat: add fulfillment timeout alert', updated: '10:02', mrs: 2, docs: 4, lang: 'Go', description: '订单履约核心 API', visibility: '私有' },
    { id: 'repo-order-web', name: 'order-web', projectId: 'p-order', path: 'platform/order-web', defaultBranch: 'main', lastCommit: 'b7d2e11', lastMsg: 'feat: mobile dashboard layout', updated: '10:16', mrs: 1, docs: 3, lang: 'React', description: '订单履约运营前端', visibility: '公开' },
    { id: 'repo-order-worker', name: 'order-worker', projectId: 'p-order', path: 'platform/order-worker', defaultBranch: 'main', lastCommit: 'c9a4f02', lastMsg: 'fix: state machine transition', updated: '09:56', mrs: 1, docs: 2, lang: 'Go', description: '履约任务与状态机 Worker', visibility: '私有' },
    { id: 'repo-order-admin', name: 'order-admin', projectId: 'p-order', path: 'platform/order-admin', defaultBranch: 'main', lastCommit: 'f8a2c11', lastMsg: 'chore: perf tuning', updated: '10:20', mrs: 0, docs: 1, lang: 'React', description: '订单中心后台管理', visibility: '私有' },
    { id: 'repo-customer-portal', name: 'customer-portal', projectId: 'p-customer', path: 'platform/customer-portal', defaultBranch: 'main', lastCommit: 'd2e8a77', lastMsg: 'fix: health check timeout', updated: '09:18', mrs: 1, docs: 2, lang: 'React', description: '客户运营门户', visibility: '公开' },
    { id: 'repo-support-bot', name: 'support-bot', projectId: 'p-support', path: 'platform/support-bot', defaultBranch: 'main', lastCommit: 'e5f1b90', lastMsg: 'feat: kb search pipeline', updated: '09:30', mrs: 0, docs: 2, lang: 'Python', description: '客服知识库与问答机器人', visibility: '私有' }
  ];

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
  w.Write([]byte("ok"))
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

  const MRS = [
    {
      id: '!128', repoId: 'repo-order-api', projectId: 'p-order', title: 'feat: 订单履约超时预警', author: 'Coding Agent', source: 'feat/order-timeout', target: 'main', status: '待评审', updated: '10:18',
      checks: [{ name: 'build', status: '成功' }, { name: 'test', status: '成功' }, { name: 'scan', status: '成功' }, { name: 'review', status: '待处理' }],
      additions: 126, deletions: 38, files: 4,
      diff: [
        { type: 'meta', text: 'diff --git a/internal/fulfillment/timeout.go b/internal/fulfillment/timeout.go' },
        { type: 'meta', text: '@@ -24,6 +24,18 @@ func (s *Service) CheckTimeout(ctx context.Context) error {' },
        { type: 'add', text: '+  thresholds, err := s.cfg.TimeoutThresholds(ctx)' },
        { type: 'add', text: '+  if err != nil { return fmt.Errorf("load threshold: %w", err) }' },
        { type: 'add', text: '+  for _, order := range orders {' },
        { type: 'add', text: '+    if order.IsOverdue(thresholds) {' },
        { type: 'add', text: '+      s.notifier.Warn(ctx, order)' },
        { type: 'add', text: '+    }' },
        { type: 'add', text: '+  }' }
      ]
    },
    {
      id: '!127', repoId: 'repo-order-web', projectId: 'p-order', title: 'feat: 履约看板移动端适配', author: 'Coding Agent', source: 'feat/mobile-dashboard', target: 'main', status: '待评审', updated: '10:16',
      checks: [{ name: 'build', status: '成功' }, { name: 'test', status: '成功' }, { name: 'scan', status: '运行中' }, { name: 'review', status: '待处理' }],
      additions: 84, deletions: 21, files: 3,
      diff: [
        { type: 'meta', text: 'diff --git a/src/pages/Dashboard.tsx b/src/pages/Dashboard.tsx' },
        { type: 'meta', text: '@@ -12,6 +12,14 @@ export function Dashboard() {' },
        { type: 'add', text: '+  const isMobile = useMediaQuery("(max-width: 640px)")' },
        { type: 'add', text: '+  return isMobile ? <MobileDashboard /> : <DesktopDashboard />' }
      ]
    },
    {
      id: '!129', repoId: 'repo-customer-portal', projectId: 'p-customer', title: 'fix: health check timeout', author: 'Coding Agent', source: 'fix/health-check', target: 'main', status: '已批准', updated: '09:18',
      checks: [{ name: 'build', status: '成功' }, { name: 'test', status: '成功' }, { name: 'scan', status: '成功' }, { name: 'review', status: '成功' }],
      additions: 18, deletions: 9, files: 2,
      diff: [
        { type: 'meta', text: 'diff --git a/src/server/health.ts b/src/server/health.ts' },
        { type: 'del', text: '-  const timeout = 5000' },
        { type: 'add', text: '+  const timeout = 15000' }
      ]
    },
    {
      id: '!126', repoId: 'repo-order-worker', projectId: 'p-order', title: 'fix: state machine transition', author: 'Coding Agent', source: 'fix/state-machine', target: 'main', status: '已合并', updated: '09:56',
      checks: [{ name: 'build', status: '成功' }, { name: 'test', status: '成功' }, { name: 'scan', status: '成功' }, { name: 'review', status: '成功' }],
      additions: 42, deletions: 16, files: 3,
      diff: [
        { type: 'meta', text: 'diff --git a/internal/order/state.go b/internal/order/state.go' },
        { type: 'del', text: '-  if state == StatePaid { return StateShipped }' },
        { type: 'add', text: '+  if state == StatePaid && order.IsPicked { return StateShipped }' }
      ]
    }
  ];

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

  const METRICS = {
    '1h': { labels: ['09:30', '09:40', '09:50', '10:00', '10:10', '10:20', '10:30'], delivery: [3, 4, 2, 5, 4, 6, 3], agent: [95, 96, 94, 97, 96, 98, 97], tokens: [0.3, 0.4, 0.2, 0.5, 0.4, 0.6, 0.3], release: [1, 0, 1, 0, 1, 1, 0] },
    '24h': { labels: ['00', '04', '08', '12', '16', '20', '24'], delivery: [8, 12, 18, 22, 16, 25, 20], agent: [91, 93, 94, 95, 96, 96, 97], tokens: [1.1, 1.4, 2.0, 2.6, 1.9, 2.3, 2.1], release: [2, 3, 4, 3, 5, 4, 5] },
    '7d': { labels: ['10-18', '10-19', '10-20', '10-21', '10-22', '10-23', '10-24'], delivery: [12, 18, 15, 24, 21, 28, 26], agent: [92, 94, 93, 95, 96, 96, 97], tokens: [1.2, 1.5, 1.1, 1.8, 2.0, 1.7, 2.2], release: [3, 4, 2, 5, 4, 5, 5] }
  };

  const RELEASES = [
    { id: 'REL-101', name: 'v2.4 灰度发布', iterationId: 'it-24', projectId: 'p-order', startAt: '2026-10-24T09:00', endAt: '2026-10-24T12:00', requirementIds: ['RQ-101', 'RQ-102'], createdBy: '张明', createdAt: '2026-10-23 18:20' },
    { id: 'REL-102', name: 'v2.4 正式发布', iterationId: 'it-24', projectId: 'p-order', startAt: '2026-10-24T20:00', endAt: '2026-10-24T23:00', requirementIds: ['RQ-103', 'RQ-111'], createdBy: '张明', createdAt: '2026-10-24 09:10' },
    { id: 'REL-103', name: 'v2.4 预发布验证', iterationId: 'it-24', projectId: 'p-order', startAt: '2026-10-23T20:00', endAt: '2026-10-23T22:00', requirementIds: ['RQ-112', 'RQ-113'], createdBy: '陈晨', createdAt: '2026-10-23 15:30' }
  ];
  const DEMO_NOW = '2026-10-24T10:30';

  const NOTIFICATIONS = [
    { id: 'n-2', title: 'T-203 等待审批', desc: 'Coding Agent 已完成代码修改与单测', time: '22 分钟前', route: '#/agents', tone: 'info' },
    { id: 'n-3', title: 'order-api 延迟超过 SLO', desc: 'p95 528ms，持续 10 分钟', time: '1 小时前', route: '#/observability', tone: 'danger' },
    { id: 'n-4', title: '能力策略 v12 已生效', desc: 'pipeline.run 已关闭 MCP 暴露', time: '2 小时前', route: '#/capabilities', tone: 'success' }
  ];

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

  function releaseWindow(release) {
    return `${formatDateTime(release.startAt)} ~ ${formatDateTime(release.endAt)}`;
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

  /* ---------------- state ---------------- */
  const DEFAULT_NAV = [
    { id: 'workspace', label: '工作台', route: '#/workspace', visible: true },
    { id: 'projects', label: '项目空间', route: '#/projects', visible: true },
    { id: 'app-center', label: '应用中心', route: '#/app-center', visible: true },
    { id: 'raw-requirements', label: '原始需求', route: '#/raw-requirements', visible: true },
    { id: 'capabilities', label: '能力中心', route: '#/capabilities', visible: true }
  ];

  const state = {
    route: location.hash || '#/projects',
    projectId: 'p-order',
    iterationId: 'it-24',
    env: 'prod',
    timeRange: '7d',
    reqTab: 'list',
    reqPage: 1,
    reqIdFilter: '',
    reqTitleFilter: '',
    reqStatusFilter: 'all',
    reqPriorityFilter: 'all',
    reqOwnerFilter: 'all',
    reqAppFilter: 'all',
    reqReleaseFilter: 'all',
    reqUpdatedFilter: '',
    taskFilter: 'all',
    pipelineFilter: 'all',
    repoTab: 'code',
    repoFile: 'README.md',
    repoBranch: 'main',
    mrCommentSeq: 500,
    knowledgeTab: 'project',
    knowledgeSearch: '',
    knowledgeType: 'all',
    knowledgeReq: 'all',
    knowledgeSource: 'all',
    docSeq: 6,
    docBaseline: null,
    docHistory: [],
    docRedo: [],
    membersPage: 1,
    capSearch: '',
    capRisk: 'all',
    policyVersion: 12,
    mcpTool: 'CAP-002',
    adminPage: 'users',
    obsProject: 'all',
    auditSearch: '',
    navConfig: DEFAULT_NAV.map((item) => ({ ...item })),
    releaseSeq: 103,
    notificationsRead: false,
    pendingReqId: null,
    pendingTaskId: null,
    taskReturn: 'board',
    taskAutoScroll: true,
    pendingCapId: null,
    pendingAppId: null,
    toastSeq: 0,
    auditSeq: 1100,
    commentSeq: 203,
    historySeq: 308,
    reqSeq: 120,
    taskSeq: 210,
    pipelineSeq: 8830,
    userSeq: 11,
    projectSeq: 4,
    iterationSeq: 26
  };

  let taskTimers = [];
  function clearTaskTimers() {
    taskTimers.forEach((timer) => clearTimeout(timer));
    taskTimers = [];
  }

  /* ---------------- lookup helpers ---------------- */
  const projectById = (id) => PROJECTS.find((item) => item.id === id);
  const iterationById = (id) => ITERATIONS.find((item) => item.id === id);
  const appById = (id) => APPS.find((item) => item.id === id);
  const userById = (id) => USERS.find((item) => item.id === id);
  const taskById = (id) => TASKS.find((item) => item.id === id);
  const requirementById = (id) => REQUIREMENTS.find((item) => item.id === id);
  const capabilityById = (id) => CAPABILITIES.find((item) => item.id === id);
  const projectIterations = (projectId) => ITERATIONS.filter((item) => item.projectId === projectId);
  const projectRequirements = (projectId) => REQUIREMENTS.filter((item) => item.projectId === projectId);
  const iterationRequirements = (iterationId) => REQUIREMENTS.filter((item) => item.iterationId === iterationId);
  const projectTasks = (projectId) => TASKS.filter((item) => item.projectId === projectId);
  const repoById = (id) => REPOS.find((item) => item.id === id);
  const releaseById = (id) => RELEASES.find((item) => item.id === id);
  const iterationReleases = (iterationId) => RELEASES.filter((item) => item.iterationId === iterationId);
  const requirementRelease = (reqId) => RELEASES.find((release) => (release.requirementIds || []).includes(reqId)) || null;
  const projectApps = (projectId) => APPS.filter((item) => item.projectId === projectId);
  const projectPipelines = (projectId) => PIPELINES.filter((item) => item.projectId === projectId);
  const projectRepos = (projectId) => REPOS.filter((item) => item.projectId === projectId);
  const projectMrs = (projectId) => MRS.filter((item) => item.projectId === projectId);
  const projectDocs = (projectId) => DOCS.filter((item) => item.projectId === projectId);
  const docById = (id) => DOCS.find((item) => item.id === id);
  const docTypeOptions = ['需求规格', '方案设计', '测试方案', '运行手册', '其他'];
  const currentProject = () => projectById(state.projectId) || PROJECTS[0];
  const currentIteration = () => iterationById(state.iterationId) || projectIterations(state.projectId)[0] || ITERATIONS[0];

  function resetRequirementFilters() {
    state.reqPage = 1;
    state.reqIdFilter = '';
    state.reqTitleFilter = '';
    state.reqStatusFilter = 'all';
    state.reqPriorityFilter = 'all';
    state.reqOwnerFilter = 'all';
    state.reqAppFilter = 'all';
    state.reqReleaseFilter = 'all';
    state.reqUpdatedFilter = '';
  }

  function resetKnowledgeFilters() {
    state.knowledgeSearch = '';
    state.knowledgeType = 'all';
    state.knowledgeReq = 'all';
    state.knowledgeSource = 'all';
  }

  function iterationStats(iterationId) {
    const items = iterationRequirements(iterationId);
    return {
      total: items.length,
      ready: items.filter((item) => item.ready || item.status === '发布').length,
      deferred: items.filter((item) => item.deferredTo).length,
      blocked: items.filter((item) => !item.ready && !item.deferredTo && item.status !== '发布').length
    };
  }

  /* ---------------- routes ---------------- */
  const ROUTES = {
    '#/workspace': { module: 'workspace', page: 'placeholder', title: '工作台', placeholder: true },
    '#/projects': { module: 'projects', page: 'projects', sidebar: 'none', title: '项目空间' },
    '#/members': { module: 'projects', page: 'members', sidebar: 'project', title: '团队管理' },
    '#/requirements': { module: 'projects', page: 'requirements', sidebar: 'project', title: '需求管理' },
    '#/agents': { module: 'projects', page: 'agents', sidebar: 'project', title: 'Agent 任务' },
    '#/code': { module: 'projects', page: 'code', sidebar: 'project', title: '代码仓' },
    '#/knowledge': { module: 'projects', page: 'knowledge', sidebar: 'project', title: '知识库' },
    '#/pipelines': { module: 'projects', page: 'pipelines', sidebar: 'project', title: '流水线' },
    '#/runtime': { module: 'projects', page: 'runtime', sidebar: 'project', title: '应用运行' },
    '#/observability': { module: 'projects', page: 'observability', sidebar: 'project', title: '可观测' },
    '#/capabilities': { module: 'capabilities', page: 'capabilities', sidebar: 'capability', title: '能力目录' },
    '#/mcp-test': { module: 'capabilities', page: 'mcp', sidebar: 'capability', title: 'MCP 测试' },
    '#/capability-audit': { module: 'capabilities', page: 'capAudit', sidebar: 'capability', title: '策略与审计' },
    '#/admin/users': { module: 'admin', page: 'adminUsers', sidebar: 'admin', title: '用户与角色' },
    '#/admin/environments': { module: 'admin', page: 'adminEnvs', sidebar: 'admin', title: '环境与配额' },
    '#/admin/flags': { module: 'admin', page: 'adminFlags', sidebar: 'admin', title: '功能开关' },
    '#/admin/audit': { module: 'admin', page: 'adminAudit', sidebar: 'admin', title: '审计日志' },
    '#/admin/release': { module: 'admin', page: 'adminRelease', sidebar: 'admin', title: '平台发布' },
    '#/app-center': { module: 'app-center', page: 'placeholder', title: '应用中心', placeholder: true },
    '#/raw-requirements': { module: 'raw-requirements', page: 'placeholder', title: '原始需求', placeholder: true }
  };

  function moduleForRoute(route) {
    if (route.startsWith('#/workspace')) return 'workspace';
    if (route.startsWith('#/app-center')) return 'app-center';
    if (route.startsWith('#/raw-requirements')) return 'raw-requirements';
    if (route.startsWith('#/capabilities') || route.startsWith('#/mcp-test') || route.startsWith('#/capability-audit')) return 'capabilities';
    if (route.startsWith('#/admin')) return 'admin';
    return 'projects';
  }

  const taskIdFromRoute = () => {
    const match = state.route.match(/^#\/tasks\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  };

  function syncTaskProject() {
    const taskId = taskIdFromRoute();
    const task = taskId ? taskById(taskId) : null;
    if (!task) return null;
    state.projectId = task.projectId;
    state.iterationId = projectById(task.projectId)?.iterationId || state.iterationId;
    return task;
  }

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

  const docRouteInfo = () => {
    const match = state.route.match(/^#\/knowledge\/(?:(global)\/)?([^/?#]+)(\/edit)?\/?$/);
    if (!match) return null;
    let docId;
    try {
      docId = decodeURIComponent(match[2]);
    } catch (error) {
      return null;
    }
    return { scope: match[1] ? 'global' : 'project', docId, edit: !!match[3] };
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

  /* ---------------- shell rendering ---------------- */
  function renderTopbar() {
    const active = moduleForRoute(state.route);
    $('#topnav').innerHTML = state.navConfig
      .filter((item) => item.visible)
      .map((item) => `<button class="nav-item ${item.id === active ? 'active' : ''}" type="button" data-action="nav" data-route="${item.route}" ${item.id === active ? 'aria-current="page"' : ''}>${esc(item.label)}</button>`)
      .join('');
    $('#notif-badge').classList.toggle('hidden', state.notificationsRead);
  }

  function renderSidebar() {
    syncTaskProject();
    syncRepoProject();
    syncDocProject();
    const meta = taskIdFromRoute()
      ? ROUTES[state.taskReturn === 'agents' ? '#/agents' : '#/requirements']
      : (repoRouteInfo() ? ROUTES['#/code'] : (docRouteInfo() ? ROUTES['#/knowledge'] : (ROUTES[state.route] || ROUTES['#/projects'])));
    const sidebar = $('#sidebar');
    const shell = $('#shell');
    if (meta.placeholder || meta.sidebar === 'none' || (meta.sidebar === 'project' && !PROJECTS.length)) {
      sidebar.innerHTML = '';
      shell.classList.add('no-sidebar');
      return;
    }
    shell.classList.remove('no-sidebar');
    if (meta.sidebar === 'project') sidebar.innerHTML = projectSidebar(meta.page);
    else if (meta.sidebar === 'capability') sidebar.innerHTML = capabilitySidebar(meta.page);
    else if (meta.sidebar === 'admin') sidebar.innerHTML = adminSidebar(meta.page);
    else sidebar.innerHTML = '';
  }

  function projectSidebar(page) {
    const project = currentProject();
    const iteration = currentIteration();
    const requirementCount = iteration ? iterationRequirements(iteration.id).length : 0;
    const items = [
      { page: 'requirements', label: '需求管理', icon: 'layers', route: '#/requirements' },
      { page: 'code', label: '代码仓', icon: 'code', route: '#/code' },
      { page: 'knowledge', label: '知识库', icon: 'file', route: '#/knowledge' },
      { page: 'pipelines', label: '流水线', icon: 'pipe', route: '#/pipelines' },
      { page: 'observability', label: '可观测', icon: 'chart', route: '#/observability' },
      { page: 'members', label: '团队管理', icon: 'users', route: '#/members' }
    ];
    return `
      <button class="project-switch" type="button" data-action="project-switch">
        <span class="project-avatar" style="background:${project.color}1a;color:${project.color}">${esc(project.code.slice(0, 2))}</span>
        <span class="project-meta"><b>${esc(project.name)}</b><small>${esc(project.code)} · ${esc(project.owner)}</small></span>
        <span class="chev">▾</span>
      </button>
      <div class="side-label">项目空间</div>
      ${items.map((item) => `
        <button class="side-item ${item.page === page ? 'active' : ''}" type="button" data-action="nav" data-route="${item.route}">
          <span class="side-icon">${icon(item.icon, 15)}</span><span>${esc(item.label)}</span>
          ${item.page === 'requirements' && requirementCount ? `<span class="side-badge">${requirementCount}</span>` : ''}
        </button>`).join('')}
    `;
  }

  function capabilitySidebar(page) {
    const items = [
      { page: 'capabilities', label: '能力目录', icon: 'cap', route: '#/capabilities' },
      { page: 'mcp', label: 'MCP 测试', icon: 'play', route: '#/mcp-test' },
      { page: 'capAudit', label: '策略与审计', icon: 'audit', route: '#/capability-audit' }
    ];
    return `
      <div class="side-label" style="margin-top:2px;">能力中心</div>
      ${items.map((item) => `
        <button class="side-item ${item.page === page ? 'active' : ''}" type="button" data-action="nav" data-route="${item.route}">
          <span class="side-icon">${icon(item.icon, 15)}</span><span>${esc(item.label)}</span>
        </button>`).join('')}
      <div class="side-foot"><b>策略版本 v${state.policyVersion}</b>REST 与 MCP 双开关；变更 30 秒内生效，失败回退上一版本。</div>
    `;
  }

  function adminSidebar(page) {
    const items = [
      { page: 'adminUsers', label: '用户与角色', icon: 'users', route: '#/admin/users' },
      { page: 'adminEnvs', label: '环境与配额', icon: 'server', route: '#/admin/environments' },
      { page: 'adminFlags', label: '功能开关', icon: 'settings', route: '#/admin/flags' },
      { page: 'adminAudit', label: '审计日志', icon: 'audit', route: '#/admin/audit' },
      { page: 'adminRelease', label: '平台发布', icon: 'rocket', route: '#/admin/release' }
    ];
    return `
      <div class="side-label" style="margin-top:2px;">平台管理</div>
      ${items.map((item) => `
        <button class="side-item ${item.page === page ? 'active' : ''}" type="button" data-action="nav" data-route="${item.route}">
          <span class="side-icon">${icon(item.icon, 15)}</span><span>${esc(item.label)}</span>
        </button>`).join('')}
      <div class="side-foot"><b>平台单环境</b>平台自身不复制 test/prod；升级采用金丝雀 + 快速回滚。</div>
    `;
  }

  function renderMain(metaArg) {
    syncTaskProject();
    syncRepoProject();
    syncDocProject();
    const meta = metaArg || ROUTES[state.route] || ROUTES['#/projects'];
    const main = $('#main');
    const scroll = window.scrollY;
    const isTaskPage = !!taskIdFromRoute();
    const embeddedTask = isTaskPage && state.taskReturn !== 'agents';
    clearTaskTimers();
    main.innerHTML = renderPage(meta);
    main.classList.toggle('main-fill', isTaskPage ? embeddedTask : meta.page === 'requirements' && ['list', 'board'].includes(state.reqTab));
    main.classList.toggle('main-task', isTaskPage);
    main.classList.remove('page-in');
    void main.offsetWidth;
    main.classList.add('page-in');
    if (state.pendingReqId) {
      const id = state.pendingReqId;
      state.pendingReqId = null;
      openRequirementDrawer(id);
    } else if (state.pendingTaskId) {
      const id = state.pendingTaskId;
      state.pendingTaskId = null;
      openTaskDrawer(id);
    } else if (state.pendingCapId) {
      const id = state.pendingCapId;
      state.pendingCapId = null;
      openCapabilityDrawer(id);
    } else if (state.pendingAppId) {
      const id = state.pendingAppId;
      state.pendingAppId = null;
      openAppDrawer(id);
    }
    if (isTaskPage) initTaskDetailPage();
    if (scroll > 0) window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  function render() {
    renderTopbar();
    renderSidebar();
    renderMain();
    closeDropdowns();
  }

  function renderPage(meta) {
    if (!PROJECTS.length && meta.module === 'projects') return renderProjects();
    const repoInfo = repoRouteInfo();
    if (repoInfo) return repoInfo.mrNumber ? renderMrDetail(repoInfo.repoId, repoInfo.mrNumber) : renderRepoDetail(repoInfo.repoId);
    const taskId = taskIdFromRoute();
    if (taskId) return state.taskReturn === 'agents' ? renderTaskDetail(taskId) : renderRequirements(taskId);
    switch (meta.page) {
      case 'projects': return renderProjects();
      case 'members': return renderMembers();
      case 'requirements': return renderRequirements();
      case 'agents': return renderAgents();
      case 'code': return renderCode();
      case 'knowledge': return renderKnowledge();
      case 'pipelines': return renderPipelines();
      case 'runtime': return renderRuntime();
      case 'observability': return renderObservability();
      case 'capabilities': return renderCapabilities();
      case 'mcp': return renderMcpTest();
      case 'capAudit': return renderCapAudit();
      case 'adminUsers': return renderAdminUsers();
      case 'adminEnvs': return renderAdminEnvs();
      case 'adminFlags': return renderAdminFlags();
      case 'adminAudit': return renderAdminAudit();
      case 'adminRelease': return renderAdminRelease();
      case 'placeholder': return renderPlaceholder(meta);
      default: return renderProjects();
    }
  }

  /* ---------------- pages: projects ---------------- */
  function renderProjects() {
    const hasProjects = PROJECTS.length > 0;
    return `
      ${pageHead('项目空间', hasProjects ? `共 ${PROJECTS.length} 个项目，选择项目进入或创建新项目。` : '创建第一个项目，开始需求、Agent 与发布交付。', `<button class="btn btn-primary" type="button" data-action="new-project">${icon('plus', 14)} 新建项目</button>`)}
      ${hasProjects ? `<div class="project-grid">
        ${PROJECTS.map((item) => projectCard(item)).join('')}
        <button class="project-new-card" type="button" data-action="new-project">
          <span class="project-new-icon">${icon('plus', 20)}</span>
          <b>新建项目</b>
          <small>初始化项目空间、首个迭代与项目成员</small>
        </button>
      </div>` : `<div class="empty">
        <div class="empty-icon">${icon('grid', 30)}</div>
        <h2>还没有项目</h2>
        <p>创建第一个项目，初始化项目空间、首个迭代与项目成员。</p>
        <button class="btn btn-primary" type="button" data-action="new-project">${icon('plus', 14)} 新建项目</button>
      </div>`}
    `;
  }

  function projectCard(project) {
    const iteration = iterationById(project.iterationId);
    const stats = iteration ? iterationStats(iteration.id) : { total: 0, ready: 0, deferred: 0, blocked: 0 };
    const progressValue = stats.total ? Math.round((stats.ready / stats.total) * 100) : 0;
    return `<article class="card project-card" data-action="open-project" data-id="${project.id}">
      <div class="project-card-head">
        <span class="project-avatar" style="background:${project.color}1a;color:${project.color}">${esc(project.code.slice(0, 2))}</span>
        <div><b>${esc(project.name)}</b><small>${esc(project.code)} · ${esc(project.owner)}</small></div>
        <span style="margin-left:auto;">${pill(project.status)}</span>
      </div>
      <p class="project-card-desc">${esc(project.desc)}</p>
      <div class="progress-label"><span class="muted" style="font-size:10px;">${esc(iteration ? iteration.name : '暂无迭代')}</span><span style="font-size:10px;color:#8da0b5;">${stats.ready}/${stats.total}</span></div>
      <div style="margin-top:6px;">${progress(progressValue)}</div>
      <div class="project-card-stats">
        <span>健康度 <b>${project.health}%</b></span>
        <span>需求 <b>${stats.total}</b></span>
        <span>阻塞 <b>${stats.blocked}</b></span>
        <span style="margin-left:auto;color:#10b981;">●</span>
      </div>
      <div class="project-card-meta">
        <span>${icon('clock', 11)} 创建于 ${esc(project.createdAt || '—')}</span>
        <span>${icon('users', 11)} ${project.members.length} 名成员</span>
      </div>
      <div class="project-card-footer">
        <button class="project-card-open" type="button" data-action="open-project" data-id="${project.id}">进入项目 →</button>
        <button class="btn btn-ghost btn-xs project-card-release" type="button" data-action="release-project" data-id="${project.id}">${icon('trash', 12)} 释放项目</button>
      </div>
    </article>`;
  }

  /* ---------------- pages: members ---------------- */
  function renderMembers() {
    const project = currentProject();
    const members = project.members
      .map((member) => ({ ...member, user: userById(member.userId) }))
      .filter((member) => member.user);
    const managerCount = members.filter((member) => ['Owner', 'Maintainer'].includes(member.role)).length;
    const mfaMissing = members.filter((member) => member.user.mfa !== '已启用').length;
    const month = nowDate().slice(0, 7);
    const newThisMonth = members.filter((member) => String(member.joinedAt || '').startsWith(month)).length;
    const sortedMembers = [...members].sort((a, b) => {
      const ownerDelta = Number(b.role === 'Owner') - Number(a.role === 'Owner');
      if (ownerDelta) return ownerDelta;
      return String(b.joinedAt || '').localeCompare(String(a.joinedAt || ''));
    });
    const pageSize = 5;
    const totalPages = Math.max(1, Math.ceil(sortedMembers.length / pageSize));
    const currentPage = Math.min(Math.max(1, state.membersPage || 1), totalPages);
    state.membersPage = currentPage;
    const pageMembers = sortedMembers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const changes = AUDIT
      .filter((item) => item.detail?.projectId === project.id && ['添加项目成员', '调整成员角色', '移除项目成员'].includes(item.action))
      .slice(0, 6);
    return `
      ${pageHead('团队管理', `当前项目：${esc(project.name)} · ${members.length} 名成员 · 角色按项目隔离`, `
        <button class="btn btn-outline" type="button" data-action="toast" data-msg="成员权限以平台虚拟账号为准；所有变更写入审计">${icon('audit', 14)} 权限说明</button>
        <button class="btn btn-primary" type="button" data-action="add-member">${icon('plus', 14)} 添加成员</button>`)}
      <div class="kpi-grid">
        ${kpi('成员总数', String(members.length), '项目级 RBAC · 一人一号', { icon: 'users', hero: true })}
        ${kpi('管理角色', String(managerCount), 'Owner / Maintainer', { icon: 'admin' })}
        ${kpi('未启用 MFA', String(mfaMissing), mfaMissing ? '建议尽快启用' : '全部已启用', { icon: 'shield' })}
        ${kpi('本月加入', String(newThisMonth), '按加入时间统计', { icon: 'clock' })}
      </div>
      <section class="card">
        <div class="card-head"><div><div class="card-title">项目成员</div><div class="card-sub">成员加入后立即获得项目权限；Owner 不可被移除</div></div><div class="card-actions"><span class="tag">${icon('users', 11)} ${members.length} 名成员</span></div></div>
        <div class="card-body" style="padding-top:12px;">
          <div class="table-wrap member-table"><table>
            <thead><tr><th>成员</th><th>项目角色</th><th>平台角色</th><th>MFA</th><th>加入项目</th><th>操作</th></tr></thead>
            <tbody>${pageMembers.map((member) => {
              const user = member.user;
              const isOwner = member.role === 'Owner';
              return `<tr>
                <td><div class="cell-main">${avatar(user.name, user.color, true)}<div><b>${esc(user.name)}</b><small>@${esc(user.username)} · ${esc(user.email)}</small></div></div></td>
                <td>${isOwner
                  ? `<div class="flex" style="gap:6px;">${rolePill('Owner')}<span class="faint" style="font-size:10px;">项目负责人</span></div>`
                  : `<select class="select role-select" data-action="member-role" data-id="${user.id}" aria-label="调整 ${esc(user.name)} 的项目角色">${PROJECT_ROLES.map((role) => `<option value="${role}" ${role === member.role ? 'selected' : ''}>${role}</option>`).join('')}</select>`}</td>
                <td><span class="tag">${esc(user.role)}</span></td>
                <td>${pill(user.mfa === '已启用' ? '已启用' : '未启用')}</td>
                <td class="nowrap">${esc(member.joinedAt || '—')}</td>
                <td>${isOwner ? '<span class="muted">—</span>' : `<button class="btn btn-ghost btn-xs" type="button" data-action="remove-member" data-id="${user.id}">移除</button>`}</td>
              </tr>`;
            }).join('')}</tbody>
          </table></div>
          <div class="pagination">
            <span class="pagination-info">共 ${members.length} 名成员 · 第 ${currentPage} / ${totalPages} 页</span>
            <div class="pagination-controls">
              <button class="page-btn" type="button" data-action="members-page" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>上一页</button>
              ${Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => `<button class="page-btn ${page === currentPage ? 'active' : ''}" type="button" data-action="members-page" data-page="${page}">${page}</button>`).join('')}
              <button class="page-btn" type="button" data-action="members-page" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>下一页</button>
            </div>
          </div>
        </div>
      </section>
      <div class="grid grid-main" style="margin-top:16px;">
        ${card('角色权限说明', '项目级角色；平台管理员拥有跨项目权限', `<div class="table-wrap"><table class="role-matrix">
          <thead><tr><th>权限</th><th>Owner</th><th>Maintainer</th><th>Developer</th><th>Viewer</th><th>Auditor</th></tr></thead>
          <tbody>
            ${[['查看项目', '✓', '✓', '✓', '✓', '✓'], ['需求管理', '✓', '✓', '✓', '—', '—'], ['代码与流水线', '✓', '✓', '✓', '—', '—'], ['成员管理', '✓', '✓', '—', '—', '—'], ['发起发布', '✓', '✓', '—', '—', '—'], ['审批发布', '✓', '—', '—', '—', '—'], ['审计查看', '—', '—', '—', '—', '✓']].map((row) => `<tr>${row.map((cell, index) => index === 0 ? `<td>${esc(cell)}</td>` : `<td><span class="${cell === '✓' ? 'check' : 'dash'}">${cell}</span></td>`).join('')}</tr>`).join('')}
          </tbody>
        </table></div>`)}
        ${card('最近成员变更', '仅当前项目；完整记录见平台审计', `<div class="activity-list">${changes.length ? changes.map((item) => `<div class="activity-item">
          <span class="activity-icon">${icon('users', 12)}</span>
          <div class="activity-copy"><b>${esc(item.action)} · ${esc(item.detail?.member || '—')}</b><small>${esc(item.detail?.after?.role || item.detail?.before?.role || '—')} · ${esc(item.time)}</small></div>
        </div>`).join('') : '<div class="empty-table">暂无成员变更</div>'}</div>`, '<button class="card-link" type="button" data-action="nav" data-route="#/admin/audit">全部审计</button>')}
      </div>
      <p class="hint">Owner 唯一且不可移除；添加成员只能选择已有平台虚拟账号。角色变更与移除操作会写入审计，演示数据刷新后恢复。</p>
    `;
  }

  /* ---------------- pages: requirements ---------------- */
  function renderRequirements(taskId = null) {
    const iteration = currentIteration();
    const stats = iterationStats(iteration.id);
    const allReqs = iterationRequirements(iteration.id);
    const idQuery = state.reqIdFilter.trim().toLowerCase();
    const titleQuery = state.reqTitleFilter.trim().toLowerCase();
    const updatedQuery = state.reqUpdatedFilter.trim().toLowerCase();
    const reqs = allReqs.filter((item) => {
      const matchesId = !idQuery || item.id.toLowerCase().includes(idQuery);
      const matchesTitle = !titleQuery || item.title.toLowerCase().includes(titleQuery);
      const matchesStatus = state.reqStatusFilter === 'all' || item.status === state.reqStatusFilter;
      const matchesPriority = state.reqPriorityFilter === 'all' || item.priority === state.reqPriorityFilter;
      const matchesOwner = state.reqOwnerFilter === 'all' || item.owner === state.reqOwnerFilter;
      const matchesApp = state.reqAppFilter === 'all' || (item.apps || []).includes(state.reqAppFilter);
      const linkedRelease = requirementRelease(item.id);
      const matchesRelease = state.reqReleaseFilter === 'all' || (state.reqReleaseFilter === 'none' ? !linkedRelease : linkedRelease?.id === state.reqReleaseFilter);
      const matchesUpdated = !updatedQuery || String(item.updated).toLowerCase().includes(updatedQuery);
      return matchesId && matchesTitle && matchesStatus && matchesPriority && matchesOwner && matchesApp && matchesRelease && matchesUpdated;
    });
    const ownerOptions = [...new Set(allReqs.map((item) => item.owner))];
    const appOptions = [...new Set(allReqs.flatMap((item) => item.apps || []))];
    const releaseOptions = iterationReleases(iteration.id);
    const activeTab = taskId ? 'board' : state.reqTab;
    const tabs = [
      { id: 'list', label: '需求列表' },
      { id: 'board', label: '任务看板' },
      { id: 'plan', label: '发布管理' }
    ];
    return `
      <div class="req-page ${taskId || activeTab === 'list' || activeTab === 'board' ? 'req-page-fill' : ''}${taskId ? ' req-task-embedded' : ''}">
        <div class="tabs">
          ${tabs.map((tab) => `<button class="tab ${activeTab === tab.id ? 'active' : ''}" type="button" data-action="req-tab" data-tab="${tab.id}">${tab.label}${tab.id === 'list' ? `<span class="tab-count">${stats.total}</span>` : ''}</button>`).join('')}
        </div>
        ${taskId ? renderTaskDetail(taskId) : activeTab === 'list' ? requirementListView(reqs, ownerOptions, appOptions, releaseOptions) : activeTab === 'board' ? agentTaskBoardView() : releaseManagementView(iteration)}
      </div>
    `;
  }

  function requirementListView(reqs, owners, apps, releases) {
    const statusOptions = [['all', '全部'], ['分析', '分析'], ['设计', '设计'], ['开发', '开发'], ['测试', '测试'], ['发布', '发布']];
    const priorityOptions = [['all', '全部'], ['P0', 'P0'], ['P1', 'P1'], ['P2', 'P2'], ['P3', 'P3']];
    const pageSize = 10;
    const totalPages = Math.max(1, Math.ceil(reqs.length / pageSize));
    const currentPage = Math.min(Math.max(1, state.reqPage || 1), totalPages);
    state.reqPage = currentPage;
    const pageReqs = reqs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    return `<section class="card">
      <div class="card-body" style="padding-bottom:14px;">
        <div class="flex" style="flex-wrap:wrap;gap:10px;margin-bottom:10px;">
          <button class="btn btn-primary btn-sm" type="button" data-action="new-requirement">${icon('plus', 14)} 新建需求</button>
          <button class="card-link" style="margin-left:auto;" type="button" data-action="reset-req-filters">重置筛选</button>
        </div>
        <div class="table-wrap req-table-wrap">
          <table class="req-table">
            <colgroup><col style="width:96px"><col><col style="width:112px"><col style="width:106px"><col style="width:112px"><col style="width:140px"><col style="width:200px"><col style="width:96px"><col style="width:58px"></colgroup>
            <thead>
              <tr><th>需求编号</th><th>需求标题</th><th>状态</th><th>优先级</th><th>责任人</th><th>应用</th><th>发布</th><th>更新</th><th></th></tr>
              <tr class="req-filter-row">
                <th><input id="req-id-filter" class="input" type="search" value="${esc(state.reqIdFilter)}" placeholder="编号" autocomplete="off" aria-label="按需求编号筛选"></th>
                <th><input id="req-title-filter" class="input" type="search" value="${esc(state.reqTitleFilter)}" placeholder="输入标题查询" autocomplete="off" aria-label="按需求标题筛选"></th>
                <th><select id="req-status-filter" class="select" data-action="req-status-filter" aria-label="按状态筛选">${statusOptions.map(([value, label]) => `<option value="${value}" ${state.reqStatusFilter === value ? 'selected' : ''}>${label}</option>`).join('')}</select></th>
                <th><select id="req-priority-filter" class="select" data-action="req-priority-filter" aria-label="按优先级筛选">${priorityOptions.map(([value, label]) => `<option value="${value}" ${state.reqPriorityFilter === value ? 'selected' : ''}>${label}</option>`).join('')}</select></th>
                <th><select id="req-owner-filter" class="select" data-action="req-owner-filter" aria-label="按责任人筛选"><option value="all">全部</option>${owners.map((owner) => `<option value="${esc(owner)}" ${state.reqOwnerFilter === owner ? 'selected' : ''}>${esc(owner)}</option>`).join('')}</select></th>
                <th><select id="req-app-filter" class="select" data-action="req-app-filter" aria-label="按应用筛选"><option value="all">全部</option>${apps.map((app) => `<option value="${esc(app)}" ${state.reqAppFilter === app ? 'selected' : ''}>${esc(app)}</option>`).join('')}</select></th>
                <th><select id="req-release-filter" class="select" data-action="req-release-filter" aria-label="按发布筛选"><option value="all" ${state.reqReleaseFilter === 'all' ? 'selected' : ''}>全部</option><option value="none" ${state.reqReleaseFilter === 'none' ? 'selected' : ''}>未关联</option>${releases.map((release) => `<option value="${release.id}" ${state.reqReleaseFilter === release.id ? 'selected' : ''}>${esc(release.name)}</option>`).join('')}</select></th>
                <th><input id="req-updated-filter" class="input" type="search" value="${esc(state.reqUpdatedFilter)}" placeholder="更新时间" autocomplete="off" aria-label="按更新时间筛选"></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${pageReqs.length ? pageReqs.map((item) => {
                const linkedRelease = requirementRelease(item.id);
                const releaseDisplay = linkedRelease ? `${linkedRelease.name} (${releaseWindow(linkedRelease)})` : '未关联';
                return `<tr class="row-click" data-action="open-req" data-id="${item.id}" tabindex="0">
                <td><span class="cell-id">${esc(item.id)}</span></td>
                <td><div class="cell-main"><b>${esc(item.title)}</b>${item.deferredTo ? `<small>延期至 ${esc(item.deferredTo === 'backlog' ? 'Backlog' : iterationById(item.deferredTo)?.version || item.deferredTo)}</small>` : ''}</div></td>
                <td><div class="flex" style="gap:5px;flex-wrap:wrap;">${pill(item.status)}${item.deferredTo ? '<span class="tag">已延期</span>' : ''}</div></td>
                <td>${priorityPill(item.priority)}</td>
                <td><div class="cell-main"><span class="avatar-sm" style="background:#e0f2fe;color:#0369a1;">${esc(item.owner.slice(0, 1))}</span><span>${esc(item.owner)}</span></div></td>
                <td><div class="flex" style="gap:4px;flex-wrap:wrap;">${(item.apps || []).map((app) => `<span class="tag">${esc(app)}</span>`).join('') || '<span class="faint">—</span>'}</div></td>
                <td><div class="release-cell"><div class="release-select-wrap ${linkedRelease ? '' : 'unset'}"><span class="release-select-display" title="${esc(releaseDisplay)}">${esc(releaseDisplay)}</span><span class="release-select-chevron">▾</span><select class="req-release-select" data-action="req-release-select" data-id="${item.id}" aria-label="关联发布"><option value="" ${!linkedRelease ? 'selected' : ''}>未关联</option>${releases.map((release) => `<option value="${release.id}" ${linkedRelease?.id === release.id ? 'selected' : ''}>${esc(release.name)} (${esc(releaseWindow(release))})</option>`).join('')}</select></div></div></td>
                <td class="nowrap">${esc(item.updated)}</td>
                <td><div class="cell-actions">${!item.ready && !item.deferredTo ? `<button class="btn btn-ghost btn-xs" type="button" data-action="defer-req" data-id="${item.id}">延期</button>` : ''}<span class="muted">→</span></div></td>
              </tr>`;
              }).join('') : `<tr><td colspan="9">${emptyTable('当前筛选下没有需求')}</td></tr>`}
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <span class="pagination-info">共 ${reqs.length} 条需求 · 第 ${currentPage} / ${totalPages} 页</span>
          <div class="pagination-controls">
            <button class="page-btn" type="button" data-action="req-page" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>上一页</button>
            ${Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => `<button class="page-btn ${page === currentPage ? 'active' : ''}" type="button" data-action="req-page" data-page="${page}">${page}</button>`).join('')}
            <button class="page-btn" type="button" data-action="req-page" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>下一页</button>
          </div>
        </div>
      </div>
    </section>`;
  }

  function requirementBoardView(reqs) {
    const columns = [
      { status: '分析', tone: 'info' },
      { status: '设计', tone: 'purple' },
      { status: '开发', tone: 'info' },
      { status: '测试', tone: 'warning' },
      { status: '发布', tone: 'success' }
    ];
    return `<div class="kanban">${columns.map((column) => {
      const items = reqs.filter((item) => item.status === column.status);
      return `<div class="kanban-col">
        <div class="kanban-head"><span class="dot ${column.tone}"></span><b>${column.status}</b><span class="kanban-count">${items.length}</span></div>
        ${items.length ? items.map((item) => `<article class="kanban-card" data-action="open-req" data-id="${item.id}" tabindex="0" role="button">
          <b>${esc(item.title)}</b>
          <div class="kanban-card-meta">${priorityPill(item.priority)}<span class="faint" style="font-size:9.5px;">${esc(item.id)}</span>${item.deferredTo ? '<span class="tag">延期</span>' : ''}<span style="margin-left:auto;" class="avatar-sm">${esc(item.owner.slice(0, 1))}</span></div>
        </article>`).join('') : '<div class="kanban-empty">暂无需求</div>'}
      </div>`;
    }).join('')}</div>`;
  }

  function agentTaskBoardView() {
    const tasks = projectTasks(state.projectId);
    const columns = [
      { label: '排队中', statuses: ['排队中'], tone: 'neutral' },
      { label: '运行中', statuses: ['运行中'], tone: 'info' },
      { label: '待确认', statuses: ['待确认', '待审批', '待修改'], tone: 'warning' },
      { label: '已完成', statuses: ['成功'], tone: 'success' },
      { label: '失败', statuses: ['失败', '已取消', '已中止'], tone: 'danger' }
    ];
    return `<div class="task-board">
      <div class="task-board-head">
        <div><div class="section-title">Agent 任务</div><div class="section-sub">当前项目 · ${tasks.length} 个执行任务 · 按执行状态分组</div></div>
        <button class="btn btn-primary btn-sm" type="button" data-action="new-task">${icon('plus', 14)} 新建任务</button>
      </div>
      <div class="kanban task-kanban">
        ${columns.map((column) => {
          const items = tasks.filter((task) => column.statuses.includes(task.status));
          return `<div class="kanban-col task-col">
            <div class="kanban-head"><span class="dot ${column.tone}"></span><b>${column.label}</b><span class="kanban-count">${items.length}</span></div>
            ${items.length ? items.map((task) => taskBoardCard(task)).join('') : '<div class="kanban-empty">暂无任务</div>'}
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  const REQUIREMENT_STATUS_TASKS = {
    分析: { agent: '需求分析', type: '需求分析' },
    设计: { agent: '方案设计', type: '方案设计' },
    开发: { agent: 'Coding', type: '需求开发' },
    测试: { agent: '测试生成', type: '测试生成' },
    发布: { agent: '发布审批', type: '发布审批' }
  };

  function taskOwner(task) {
    const requirement = task.requirementId ? requirementById(task.requirementId) : null;
    if (requirement?.owner) return requirement.owner;
    if (task.owner) return task.owner;
    return projectById(task.projectId)?.owner || '—';
  }

  function createTaskFromRequirement(req, status) {
    const mapping = REQUIREMENT_STATUS_TASKS[status];
    if (!mapping) return null;
    const time = nowTime();
    const task = {
      id: `T-${++state.taskSeq}`,
      title: `${mapping.type} · ${req.title}`,
      agent: mapping.agent,
      type: mapping.type,
      projectId: req.projectId,
      requirementId: req.id,
      owner: req.owner,
      status: '排队中',
      progress: 0,
      started: '—',
      duration: '—',
      tokens: '0',
      steps: 0,
      updated: time,
      summary: `需求 ${req.id} 状态变更为「${status}」，系统自动创建${mapping.type}任务，等待 Agent worker。`,
      tools: [],
      logs: `[${time}] task created by requirement status change\n[${time}] requirement ${req.id} → ${status}\n[${time}] waiting for agent worker`,
      diff: null
    };
    TASKS.unshift(task);
    req.taskId = task.id;
    audit('自动创建 Agent 任务', task.id, '成功', { agent: mapping.agent, projectId: req.projectId, requirementId: req.id, trigger: `需求状态 → ${status}` });
    return task;
  }

  function taskBoardCard(task) {
    return `<article class="kanban-card task-card" data-action="open-task-page" data-id="${task.id}" data-from="board" tabindex="0" role="button">
      <div class="task-card-top"><span class="task-type">${icon('bot', 11)} ${esc(task.type || task.agent)}</span>${pill(task.status)}</div>
      <b>${esc(task.title)}</b>
      <div class="task-card-agent">${icon('bot', 11)} ${esc(task.agent)}${task.requirementId ? ` · ${esc(task.requirementId)}` : ''}</div>
      <div class="task-card-owner">${icon('users', 11)}<span>责任人 ${esc(taskOwner(task))}</span></div>
      <div class="task-card-foot"><span>${esc(task.updated)}</span><span>${task.steps} steps · ${esc(task.tokens)} tokens</span></div>
    </article>`;
  }

  function releaseManagementView(iteration) {
    const releases = sortedReleases(iteration.id);
    const rows = releases.map((release) => {
      const status = releaseStatus(release);
      return `<tr class="row-click" data-action="open-release" data-id="${release.id}" tabindex="0">
        <td><div class="cell-main"><b>${esc(release.name)}</b><small>${esc(release.id)}</small></div></td>
        <td class="nowrap"><span class="release-window">${esc(releaseWindow(release))}</span></td>
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

  /* ---------------- pages: agents ---------------- */
  function renderAgents() {
    const tasks = projectTasks(state.projectId).filter((item) => state.taskFilter === 'all' || item.status === state.taskFilter);
    const running = projectTasks(state.projectId).filter((item) => item.status === '运行中').length;
    const waiting = projectTasks(state.projectId).filter((item) => ['待确认', '待审批'].includes(item.status)).length;
    return `
      ${pageHead('Agent 任务', `项目：${esc(currentProject().name)} · Agent 半自动执行，关键节点人工审批`, `<button class="btn btn-primary" type="button" data-action="new-task">${icon('plus', 14)} 新建任务</button>`)}
      <div class="kpi-grid">
        ${kpi('运行中', String(running), '沙箱与 worker 正常', { icon: 'bot', hero: true })}
        ${kpi('待确认 / 待审批', String(waiting), '需要人工处理', { icon: 'clock' })}
        ${kpi('Agent 成功率', '96.2%', '<span class="kpi-delta up">↑ 1.4%</span> 近 7 天', { icon: 'chart' })}
        ${kpi('本周 Token', '84.2k', '成本 ¥126.40', { icon: 'cap' })}
      </div>
      <div class="chips" style="margin-bottom:12px;">
        ${[{ id: 'all', label: '全部' }, { id: '运行中', label: '运行中' }, { id: '待确认', label: '待确认' }, { id: '待审批', label: '待审批' }, { id: '成功', label: '成功' }, { id: '失败', label: '失败' }].map((item) => `<button class="chip ${state.taskFilter === item.id ? 'active' : ''}" type="button" data-action="task-filter" data-filter="${item.id}">${item.label}</button>`).join('')}
      </div>
      <section class="card">
        <div class="card-body" style="padding-top:12px;">
          <div class="table-wrap">
            <table>
              <thead><tr><th>任务</th><th>Agent</th><th>状态</th><th>进度</th><th>Token</th><th>耗时</th><th>更新</th><th></th></tr></thead>
              <tbody>
                ${tasks.length ? tasks.map((task) => `<tr class="row-click" data-action="open-task-page" data-id="${task.id}" data-from="agents" tabindex="0">
                  <td><div class="cell-main"><b>${esc(task.title)}</b><small>${esc(task.id)} · ${esc(projectById(task.projectId)?.name || '')}</small></div></td>
                  <td><span class="tag">${icon('bot', 11)} ${esc(task.agent)}</span></td>
                  <td>${pill(task.status)}</td>
                  <td style="min-width:120px;">${progressLabel(task.progress, task.status === '失败' ? 'danger' : task.status === '成功' ? 'soft' : task.status === '待确认' || task.status === '待审批' ? 'warn' : '')}</td>
                  <td>${esc(task.tokens)}</td>
                  <td>${esc(task.duration)}</td>
                  <td class="nowrap">${esc(task.updated)}</td>
                  <td><span class="muted">→</span></td>
                </tr>`).join('') : `<tr><td colspan="8">${emptyTable('当前筛选下没有任务')}</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  }

  /* ---------------- pages: task detail ---------------- */
  function ensureTaskView(task) {
    if (task._events) return task;
    const view = TASK_VIEWS[task.id] || buildDefaultTaskView(task);
    task._events = (view.events || []).map((event) => ({ ...event }));
    task._files = view.files || [];
    task._chat = [];
    task._visibleEvents = task.status === '运行中' ? Math.min(4, task._events.length) : task._events.length;
    return task;
  }

  function buildDefaultTaskView(task) {
    const events = [{
      type: 'system',
      time: task.started === '—' ? task.updated : task.started,
      content: `任务 ${task.id} 已创建 · ${task.type || task.agent}`
    }];
    if (task.status === '排队中') {
      events.push({ type: 'system', time: task.updated, content: '等待 Agent worker 与沙箱资源。' });
    } else {
      if (task.summary) events.push({ type: 'message', role: 'assistant', time: task.started, content: task.summary });
      (task.tools || []).forEach((tool) => {
        events.push({ type: 'tool', time: task.updated, name: tool.name, args: '', status: tool.status, duration: '—', result: tool.meta });
      });
      if (task.diff) {
        events.push({ type: 'file', time: task.updated, path: '代码变更', additions: task.diff.additions, deletions: task.diff.deletions });
      }
      events.push({ type: 'system', time: task.updated, content: `任务状态：${task.status}` });
    }
    return { files: [], events };
  }

  function taskType(task) {
    return task.type || task.agent;
  }

  function renderTaskDetail(taskId) {
    const task = taskById(taskId);
    if (!task) {
      return `<div class="task-page"><div class="task-page-head"><button class="task-back" type="button" data-action="back-task">← 返回任务看板</button></div><div class="empty"><h2>任务不存在</h2><p>该任务可能已被删除，或链接已失效。</p></div></div>`;
    }
    ensureTaskView(task);
    const project = projectById(task.projectId);
    const backLabel = state.taskReturn === 'agents' ? '返回 Agent 任务' : '返回任务看板';
    const reviewable = ['待确认', '待审批'].includes(task.status);
    const retryable = ['失败', '已取消', '已中止', '待修改'].includes(task.status);
    const canStop = ['运行中', '排队中'].includes(task.status);
    const visibleEvents = task._events.slice(0, task._visibleEvents);
    const headActions = [
      reviewable ? `<button class="btn btn-outline btn-sm" type="button" data-action="reject-task" data-id="${task.id}">要求修改</button>` : '',
      reviewable ? `<button class="btn btn-primary btn-sm" type="button" data-action="approve-task" data-id="${task.id}">${icon('check', 14)} 通过</button>` : '',
      retryable ? `<button class="btn btn-primary btn-sm" type="button" data-action="rerun-task-page" data-id="${task.id}">${icon('rotate', 14)} 重新执行</button>` : ''
    ].filter(Boolean).join('');
    return `<div class="task-page">
      <header class="task-page-head">
        <div class="task-head-main">
          <button class="task-back" type="button" data-action="back-task">← <span>${backLabel}</span></button>
          <div class="task-page-badges"><span class="task-type">${icon('bot', 12)} ${esc(taskType(task))}</span>${pill(task.status)}<span class="tag">${esc(task.agent)}</span>${task.requirementId ? `<span class="tag">${esc(task.requirementId)}</span>` : ''}</div>
          <h1 class="task-page-title">${esc(task.title)}</h1>
          <div class="task-page-meta">
            <span>${icon('grid', 12)} ${esc(project?.name || '—')}</span>
            <span>${icon('clock', 12)} ${esc(task.duration)}</span>
            <span>${task.steps} steps · ${esc(task.tokens)} tokens</span>
          </div>
        </div>
        <div class="task-head-actions">${headActions}</div>
      </header>
      <div class="task-page-body">
        ${task._files.length ? `<details class="task-files-panel" open>
          <summary><span class="task-files-title">${icon('folder', 14)} 工作区文件</span><span class="tag">${task._files.length} 个</span><span class="muted">${task._files.filter((file) => file.status).length} 个变更</span><span class="task-files-hint">点击文件查看 Diff</span></summary>
          <div class="task-file-tree">${renderTaskFileTree(task._files, task.id)}</div>
        </details>` : ''}
        <div class="task-stream" id="task-stream">
          <div id="task-agent-events">${visibleEvents.map((event) => renderTaskEvent(event, task)).join('')}</div>
          <div id="task-chat-events">${renderTaskChat(task)}</div>
          <div id="task-stream-end" class="task-stream-indicator">${taskStreamIndicator(task)}</div>
        </div>
        <button class="task-jump-latest" id="task-jump-latest" type="button" data-action="task-jump-latest" hidden>回到最新</button>
      </div>
      <div class="task-composer">
        <div class="task-composer-box">
          <textarea id="task-chat-input" class="textarea" rows="2" maxlength="2000" placeholder="向 Agent 追问，或补充执行要求…"></textarea>
          <div class="task-composer-actions">
            <span class="task-composer-hint">Enter 发送 · Shift + Enter 换行</span>
            ${canStop ? `<button class="btn btn-outline btn-sm task-stop-btn" type="button" data-action="interrupt-task-page" data-id="${task.id}">${icon('x', 13)} 中断任务</button>` : ''}
            <button class="btn btn-primary btn-sm" type="button" data-action="send-task-message">${icon('arrow', 13)} 发送</button>
          </div>
        </div>
      </div>
    </div>`;
  }

  function renderTaskFileTree(files, taskId) {
    const groups = {};
    files.forEach((file) => {
      const parts = String(file.path).split('/');
      const dir = parts.slice(0, -1).join('/') || '/';
      if (!groups[dir]) groups[dir] = [];
      groups[dir].push(file);
    });
    return Object.entries(groups).map(([dir, items]) => `<div class="task-file-group">
      <div class="task-file-dir">${icon('folder', 12)} ${esc(dir)}</div>
      ${items.map((file) => `<button class="task-file-row" type="button" data-action="task-file-diff" data-id="${taskId}" data-path="${esc(file.path)}">
        <span class="task-file-status status-${String(file.status).toLowerCase()}">${esc(file.status)}</span>
        <span class="task-file-name">${esc(file.path.split('/').pop())}</span>
        <span class="task-diff-stat"><i>+${file.additions || 0}</i><em>−${file.deletions || 0}</em></span>
      </button>`).join('')}
    </div>`).join('');
  }

  function renderTaskEvent(event, task) {
    if (event.type === 'system') {
      return `<div class="task-event task-event-system"><span class="task-event-time">${esc(event.time || '')}</span><span>${esc(event.content)}</span></div>`;
    }
    if (event.type === 'plan') {
      return `<div class="task-event task-plan"><div class="task-event-title">${icon('layers', 14)} ${esc(event.title || '执行计划')}</div><div class="task-plan-list">${(event.items || []).map((item) => `<div class="task-plan-item ${item.done ? 'done' : item.active ? 'active' : ''}"><span class="task-plan-dot">${item.done ? '✓' : item.active ? '•' : ''}</span><span>${esc(item.text)}</span></div>`).join('')}</div></div>`;
    }
    if (event.type === 'thinking') {
      return `<details class="task-event task-thinking" open><summary><span class="task-event-icon">${icon('brain', 14)}</span><b>思考过程</b><span class="task-event-meta">${esc(event.duration || '')}</span><span class="chev">▾</span></summary><div class="task-thinking-content">${esc(event.content)}</div></details>`;
    }
    if (event.type === 'tool') {
      return `<div class="task-event task-tool"><div class="task-event-head"><span class="task-event-icon">${icon('terminal', 14)}</span><b>${esc(event.name)}</b><span class="task-tool-status ${event.status === '失败' ? 'bad' : event.status === '运行中' ? 'run' : event.status === '未执行' ? 'idle' : 'ok'}">${esc(event.status)}</span><span class="task-event-meta">${esc(event.duration || '')}</span></div>${event.args ? `<div class="task-tool-args">${esc(event.args)}</div>` : ''}${event.result ? `<div class="task-tool-result">${esc(event.result)}</div>` : ''}</div>`;
    }
    if (event.type === 'file') {
      return `<div class="task-event task-file-event"><div class="task-event-head"><span class="task-event-icon">${icon('file', 14)}</span><b>文件变更</b><span class="task-file-path">${esc(event.path)}</span><span class="task-diff-stat"><i>+${event.additions || 0}</i><em>−${event.deletions || 0}</em></span><button class="card-link" type="button" data-action="task-file-diff" data-id="${task.id}" data-path="${esc(event.path)}">查看 Diff</button></div></div>`;
    }
    if (event.type === 'message') return renderTaskMessage(event, task);
    return '';
  }

  function renderTaskMessage(event, task) {
    const isUser = event.role === 'user';
    return `<div class="task-message ${isUser ? 'user' : ''}">
      ${isUser ? avatar('张明', '#2563eb', true) : `<span class="task-agent-avatar">${icon('bot', 14)}</span>`}
      <div class="task-message-body"><div class="task-message-name">${isUser ? '张明' : esc(task.agent)} <span>${esc(event.time || '')}</span></div><div class="task-message-bubble">${esc(event.content)}</div></div>
    </div>`;
  }

  function renderTaskChat(task, typing = false) {
    if (!task._chat.length && !typing) return '';
    return `${task._chat.length ? `<div class="task-chat-divider">对话</div>${task._chat.map((message) => renderTaskMessage(message, task)).join('')}` : ''}${typing ? '<div class="task-chat-typing"><span class="task-live-dot"></span> Agent 正在输入…</div>' : ''}`;
  }

  function taskStreamIndicator(task) {
    if (task.status === '运行中') return `<span class="task-live-dot"></span><span>Agent 正在执行${task._visibleEvents < task._events.length ? ` · 第 ${task._visibleEvents}/${task._events.length} 步` : ''}…</span>`;
    if (task.status === '排队中') return `<span class="task-live-dot queued"></span><span>等待 Agent worker…</span>`;
    if (task.status === '已中止') return `<span class="task-live-dot stopped"></span><span>任务已中止</span>`;
    if (task.status === '待确认' || task.status === '待审批') return `<span class="task-live-dot waiting"></span><span>等待人工确认</span>`;
    if (task.status === '成功') return `<span class="task-live-dot done"></span><span>任务已完成</span>`;
    if (task.status === '失败') return `<span class="task-live-dot failed"></span><span>任务执行失败</span>`;
    return '';
  }

  function updateTaskStreamIndicator(task) {
    const element = $('#task-stream-end');
    if (element) element.innerHTML = taskStreamIndicator(task);
  }

  function scrollTaskToLatest() {
    const stream = $('#task-stream');
    if (!stream) return;
    stream.scrollTop = stream.scrollHeight;
  }

  function appendTaskEventToDom(task, event) {
    const box = $('#task-agent-events');
    if (!box) return;
    box.insertAdjacentHTML('beforeend', renderTaskEvent(event, task));
    updateTaskStreamIndicator(task);
    if (state.taskAutoScroll) scrollTaskToLatest();
  }

  function startTaskStream(task) {
    if (task.status !== '运行中' || task._visibleEvents >= task._events.length) {
      updateTaskStreamIndicator(task);
      return;
    }
    const step = () => {
      if (taskIdFromRoute() !== task.id || task.status !== '运行中') return;
      if (task._visibleEvents < task._events.length) {
        const event = task._events[task._visibleEvents++];
        appendTaskEventToDom(task, event);
        const timer = setTimeout(step, 1100);
        taskTimers.push(timer);
      } else {
        updateTaskStreamIndicator(task);
      }
    };
    const timer = setTimeout(step, 900);
    taskTimers.push(timer);
  }

  function initTaskDetailPage() {
    const taskId = taskIdFromRoute();
    const task = taskId ? taskById(taskId) : null;
    if (!task) return;
    ensureTaskView(task);
    state.taskAutoScroll = true;
    const stream = $('#task-stream');
    if (stream) {
      stream.addEventListener('scroll', () => {
        const nearBottom = stream.scrollHeight - stream.scrollTop - stream.clientHeight < 90;
        state.taskAutoScroll = nearBottom;
        const jump = $('#task-jump-latest');
        if (jump) jump.hidden = nearBottom;
      });
      stream.scrollTop = stream.scrollHeight;
    }
    const input = $('#task-chat-input');
    if (input) {
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          sendTaskMessage();
        }
      });
    }
    startTaskStream(task);
  }

  function sendTaskMessage() {
    const taskId = taskIdFromRoute();
    const task = taskId ? taskById(taskId) : null;
    if (!task) return;
    ensureTaskView(task);
    const input = $('#task-chat-input');
    const content = input ? input.value.trim() : '';
    if (!content) {
      toast('请输入要发送的内容。', 'warning');
      if (input) input.focus();
      return;
    }
    task._chat.push({ type: 'message', role: 'user', time: nowTime(), content });
    if (input) {
      input.value = '';
      input.focus();
    }
    const chatBox = $('#task-chat-events');
    if (chatBox) chatBox.innerHTML = renderTaskChat(task, true);
    if (state.taskAutoScroll) scrollTaskToLatest();
    const timer = setTimeout(() => {
      if (taskIdFromRoute() !== task.id) return;
      task._chat.push({ type: 'message', role: 'assistant', time: nowTime(), content: taskReplyFor(task, content) });
      const box = $('#task-chat-events');
      if (box) box.innerHTML = renderTaskChat(task);
      if (state.taskAutoScroll) scrollTaskToLatest();
    }, 1000);
    taskTimers.push(timer);
  }

  function taskReplyFor(task, content) {
    if (/测试|验证/.test(content)) return `我会补充运行 ${task.requirementId || '当前任务'} 相关模块的单测与冒烟验证，并在结果出来后同步。`;
    if (/风险|问题/.test(content)) return '当前主要风险是变更影响面与测试覆盖。建议先在 test 环境观察指标，再决定是否进入发布。';
    if (/中断|停止/.test(content)) return '如需停止执行，请点击输入框旁的「中断任务」按钮；我会保留当前执行记录和会话上下文。';
    return `收到。我已把这条补充纳入「${task.title}」的执行上下文，会在下一步处理中体现。`;
  }

  function openTaskPage(id, from = 'board') {
    const task = taskById(id);
    if (!task) return;
    state.taskReturn = from === 'agents' ? 'agents' : 'board';
    if (state.taskReturn === 'board') state.reqTab = 'board';
    navigate(`#/tasks/${encodeURIComponent(task.id)}`);
  }

  function backFromTask() {
    clearTaskTimers();
    if (state.taskReturn === 'agents') {
      navigate('#/agents');
      return;
    }
    state.reqTab = 'board';
    navigate('#/requirements');
  }

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

  function openTaskFileDiff(taskId, path) {
    const task = taskById(taskId);
    if (!task) return;
    ensureTaskView(task);
    const file = (task._files || []).find((item) => item.path === path);
    if (!file) return;
    const diff = file.diff || [];
    openPanel({
      title: path,
      sub: `${file.status} · +${file.additions || 0} −${file.deletions || 0}`,
      body: diff.length ? `<div class="diff">${diff.map((line) => `<div class="diff-line ${line.type}"><span class="ln">${line.type === 'add' ? '+' : line.type === 'del' ? '−' : ' '}</span><span>${esc(line.text)}</span></div>`).join('')}</div>` : '<div class="empty-table">该文件暂无 Diff 详情。</div>',
      footer: `<button class="btn btn-primary" type="button" data-action="close-overlay">关闭</button>`,
      wide: true
    });
  }

  function interruptTaskPage(taskId) {
    const task = taskById(taskId);
    if (!task) return;
    ensureTaskView(task);
    clearTaskTimers();
    task.status = '已中止';
    task.updated = nowTime();
    task.progress = Math.min(task.progress || 0, 90);
    task._events.push({ type: 'system', time: nowTime(), content: '用户中断任务，后续执行已停止。' });
    task._visibleEvents = task._events.length;
    audit('中断 Agent 任务', task.id, '成功', { after: { status: '已中止' } });
    renderMain();
    toast('任务已中断，执行记录已保留。', 'warning', '任务已中止');
  }

  function rerunTaskPage(taskId) {
    const task = taskById(taskId);
    if (!task) return;
    ensureTaskView(task);
    clearTaskTimers();
    task.status = '运行中';
    task.progress = 10;
    task.updated = nowTime();
    task._events.push({ type: 'system', time: nowTime(), content: '用户重新执行任务，恢复 Agent worker。' });
    task._visibleEvents = task._events.length;
    audit('重新执行 Agent 任务', task.id, '成功', { after: { status: '运行中' } });
    renderMain();
    toast('任务已重新开始执行。', 'info', '重新执行中');
    setTimeout(() => {
      if (task.status !== '运行中') return;
      task._events.push({ type: 'thinking', time: nowTime(), duration: '4s', content: '继续沿上次中断的步骤执行，检查测试结果并收敛变更。' });
      task._events.push({ type: 'message', role: 'assistant', time: nowTime(), content: '重新执行完成，已恢复上下文并继续处理。' });
      task._visibleEvents = task._events.length;
      task.status = '待确认';
      task.progress = 100;
      task.updated = nowTime();
      if (taskIdFromRoute() === task.id) {
        renderMain();
        toast('重新执行完成，等待人工确认。', 'success', '重新执行完成');
      }
    }, 2000);
  }

  /* ---------------- pages: code ---------------- */
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
    const requirements = projectRequirements(state.projectId);
    const requirementIds = new Set(requirements.map((req) => req.id));
    const reqFilter = state.knowledgeReq === 'all' || state.knowledgeReq === 'none' || requirementIds.has(state.knowledgeReq)
      ? state.knowledgeReq
      : 'all';
    const totalDocs = projectDocs(state.projectId).length;
    const docs = projectDocs(state.projectId).filter((doc) =>
      (state.knowledgeType === 'all' || doc.type === state.knowledgeType) &&
      (reqFilter === 'all' || (reqFilter === 'none' ? !doc.requirementId : doc.requirementId === reqFilter)) &&
      docSearchMatches(doc));
    return `<section class="card"><div class="card-body" style="padding-top:14px;">
      <div class="doc-toolbar">
        <input id="doc-search" class="input doc-search" type="search" placeholder="搜索标题或正文" value="${esc(state.knowledgeSearch)}" aria-label="搜索文档">
        <select id="doc-type-filter" class="select" data-action="doc-type-filter" aria-label="按类型筛选">
          <option value="all" ${state.knowledgeType === 'all' ? 'selected' : ''}>全部类型</option>
          ${docTypeOptions.map((type) => `<option value="${type}" ${state.knowledgeType === type ? 'selected' : ''}>${type}</option>`).join('')}
        </select>
        <select id="doc-req-filter" class="select" data-action="doc-req-filter" aria-label="按需求筛选">
          <option value="all" ${reqFilter === 'all' ? 'selected' : ''}>全部需求</option>
          <option value="none" ${reqFilter === 'none' ? 'selected' : ''}>未关联</option>
          ${requirements.map((req) => `<option value="${req.id}" ${reqFilter === req.id ? 'selected' : ''}>${esc(req.id)} · ${esc(req.title)}</option>`).join('')}
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
          </tr>`).join('') : `<tr><td colspan="8">${emptyTable(totalDocs ? '当前筛选下没有文档' : '当前项目还没有文档')}</td></tr>`}
        </tbody>
      </table></div>
    </div></section>`;
  }

  function renderGlobalDocs() {
    const publishedDocs = DOCS.filter((doc) => doc.published);
    const sources = PROJECTS.filter((project) => publishedDocs.some((doc) => doc.projectId === project.id));
    const sourceIds = new Set(sources.map((project) => project.id));
    const sourceFilter = state.knowledgeSource === 'all' || sourceIds.has(state.knowledgeSource)
      ? state.knowledgeSource
      : 'all';
    const docs = publishedDocs
      .filter((doc) => state.knowledgeType === 'all' || doc.type === state.knowledgeType)
      .filter((doc) => sourceFilter === 'all' || doc.projectId === sourceFilter)
      .filter(docSearchMatches);
    return `<section class="card"><div class="card-body" style="padding-top:14px;">
      <div class="doc-toolbar">
        <input id="doc-search" class="input doc-search" type="search" placeholder="搜索平台总库" value="${esc(state.knowledgeSearch)}" aria-label="搜索平台总库">
        <select id="doc-type-filter" class="select" data-action="doc-type-filter" aria-label="按类型筛选">
          <option value="all" ${state.knowledgeType === 'all' ? 'selected' : ''}>全部类型</option>
          ${docTypeOptions.map((type) => `<option value="${type}" ${state.knowledgeType === type ? 'selected' : ''}>${type}</option>`).join('')}
        </select>
        <select id="doc-source-filter" class="select" data-action="doc-source-filter" aria-label="按来源项目筛选">
          <option value="all" ${sourceFilter === 'all' ? 'selected' : ''}>全部项目</option>
          ${sources.map((project) => `<option value="${project.id}" ${sourceFilter === project.id ? 'selected' : ''}>${esc(project.name)}</option>`).join('')}
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
          </tr>`).join('') : `<tr><td colspan="6">${emptyTable(publishedDocs.length ? '当前筛选下没有公开文档' : '平台总库还没有公开文档')}</td></tr>`}
        </tbody>
      </table></div>
    </div></section>`;
  }

  /* ---------------- pages: pipelines ---------------- */
  function renderPipelines() {
    const pipelines = projectPipelines(state.projectId).filter((item) => state.pipelineFilter === 'all' || item.status === state.pipelineFilter);
    const all = projectPipelines(state.projectId);
    const success = all.filter((item) => item.status === '成功').length;
    return `
      ${pageHead('流水线', `项目：${esc(currentProject().name)} · 构建、测试、扫描、签名与 test 部署`, `<button class="btn btn-primary" type="button" data-action="run-pipeline">${icon('play', 14)} 运行流水线</button>`)}
      <div class="kpi-grid">
        ${kpi('今日运行', String(all.length), '静态演示数据', { icon: 'pipe', hero: true })}
        ${kpi('成功率', `${all.length ? Math.round(success / all.length * 100) : 0}%`, `${success} 次成功`, { icon: 'check' })}
        ${kpi('平均时长', '5m 02s', '构建 + 测试 + 部署', { icon: 'clock' })}
        ${kpi('运行中', String(all.filter((item) => item.status === '运行中').length), '等待阶段推进', { icon: 'refresh' })}
      </div>
      <div class="chips" style="margin-bottom:12px;">
        ${[{ id: 'all', label: '全部' }, { id: '成功', label: '成功' }, { id: '运行中', label: '运行中' }, { id: '失败', label: '失败' }].map((item) => `<button class="chip ${state.pipelineFilter === item.id ? 'active' : ''}" type="button" data-action="pipeline-filter" data-filter="${item.id}">${item.label}</button>`).join('')}
      </div>
      <section class="card"><div class="card-body" style="padding-top:12px;">
        <div class="table-wrap"><table>
          <thead><tr><th>运行</th><th>应用</th><th>分支 / Commit</th><th>阶段</th><th>状态</th><th>时长</th><th>触发人</th><th></th></tr></thead>
          <tbody>
            ${pipelines.length ? pipelines.map((run) => `<tr class="row-click" data-action="open-run" data-id="${run.id}" tabindex="0">
              <td><div class="cell-main"><b>${esc(run.id)}</b><small>${esc(run.time)}</small></div></td>
              <td><span class="tag">${icon('cube', 11)} ${esc(appById(run.appId)?.name || run.appId)}</span></td>
              <td><div class="cell-main"><b style="font-family:var(--mono);font-size:10.5px;">${esc(run.branch)}</b><small>${esc(run.commit)}</small></div></td>
              <td><div class="flex" style="gap:3px;">${run.stages.map((stage) => `<span class="dot ${stage.status === '成功' ? 'success' : stage.status === '失败' ? 'danger' : stage.status === '运行中' ? 'info' : 'neutral'}" title="${esc(stage.name)}: ${esc(stage.status)}"></span>`).join('')}</div></td>
              <td>${pill(run.status)}</td>
              <td>${esc(run.duration)}</td>
              <td>${esc(run.triggeredBy)}</td>
              <td><span class="muted">→</span></td>
            </tr>`).join('') : `<tr><td colspan="8">${emptyTable('当前筛选下没有流水线运行')}</td></tr>`}
          </tbody>
        </table></div>
      </div></section>
    `;
  }

  /* ---------------- pages: runtime ---------------- */
  function renderRuntime() {
    const apps = projectApps(state.projectId);
    const visible = apps.filter((app) => !!app.envs[state.env]);
    const healthy = visible.filter((app) => app.envs[state.env].status === '健康').length;
    const podCount = visible.reduce((sum, app) => sum + parseInt(app.envs[state.env].pods.split('/')[0], 10), 0);
    return `
      ${pageHead('应用运行', `项目：${esc(currentProject().name)} · 统一域名与 test/prod 环境`, `
        <div class="segmented">
          <button class="${state.env === 'test' ? 'active' : ''}" type="button" data-action="env-switch" data-env="test">test</button>
          <button class="${state.env === 'prod' ? 'active' : ''}" type="button" data-action="env-switch" data-env="prod">prod</button>
        </div>
        <button class="btn btn-outline" type="button" data-action="toast" data-msg="已刷新应用状态（演示）">${icon('refresh', 14)} 刷新</button>`)}
      <div class="kpi-grid">
        ${kpi('应用数', String(visible.length), `${state.env} 环境`, { icon: 'cube', hero: true })}
        ${kpi('健康应用', `${healthy}/${visible.length}`, healthy === visible.length ? '全部健康' : '存在降级', { icon: 'check' })}
        ${kpi('运行 Pod', String(podCount), '按应用统计', { icon: 'server' })}
        ${kpi('今日部署', '3', '最近一次 10:14', { icon: 'rocket' })}
      </div>
      ${visible.length ? `<div class="grid grid-2">${visible.map((app) => appCard(app, app.envs[state.env])).join('')}</div>` : `<div class="empty"><div class="empty-icon">${icon('server', 30)}</div><h2>${state.env === 'prod' ? '当前项目还没有 prod 应用' : '当前项目还没有 test 应用'}</h2><p>切换到 ${state.env === 'prod' ? 'test' : 'prod'} 查看其他环境，或先创建应用。</p><button class="btn btn-primary" type="button" data-action="env-switch" data-env="${state.env === 'prod' ? 'test' : 'prod'}">切换到 ${state.env === 'prod' ? 'test' : 'prod'}</button></div>`}
    `;
  }

  function appCard(app, env) {
    const healthy = env.status === '健康';
    return `<section class="card">
      <div class="card-body" style="padding:16px;">
        <div class="flex" style="align-items:flex-start;">
          <div class="side-icon" style="width:36px;height:36px;border-radius:10px;background:#eff6ff;color:#2563eb;">${icon('server', 17)}</div>
          <div style="min-width:0;"><div class="card-title">${esc(app.name)}</div><div class="card-sub">${esc(env.namespace)} · ${esc(env.version)}</div></div>
          <span style="margin-left:auto;">${pill(env.status)}</span>
        </div>
        <div class="divider"></div>
        <div class="meta-grid">
          <div class="meta-item"><div class="meta-label">域名</div><div class="meta-value" style="font-size:10.5px;">${esc(env.url.replace('https://', ''))}</div></div>
          <div class="meta-item"><div class="meta-label">最近部署</div><div class="meta-value">${esc(env.lastDeploy)}</div></div>
        </div>
        <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div><div class="usage-head"><span>CPU</span><b>${env.cpu}%</b></div><div class="usage-bar"><span style="width:${env.cpu}%"></span></div></div>
          <div><div class="usage-head"><span>内存</span><b>${env.mem}%</b></div><div class="usage-bar ${env.mem > 70 ? 'warn' : ''}"><span style="width:${env.mem}%"></span></div></div>
        </div>
        <div class="flex" style="margin-top:12px;color:#8da0b5;font-size:10.5px;">
          <span>${icon('cube', 12)} Pods ${esc(env.pods)}</span>
          <span>${icon('clock', 12)} ${healthy ? '运行正常' : '需要关注'}</span>
          <span style="margin-left:auto;"><span class="dot ${healthy ? 'success' : 'warning'}"></span></span>
        </div>
        <div class="btn-row" style="margin-top:12px;">
          <button class="btn btn-outline btn-sm" type="button" data-action="open-app" data-id="${app.id}">详情</button>
          <button class="btn btn-ghost btn-sm" type="button" data-action="open-url" data-id="${app.id}">打开地址 ${icon('external', 12)}</button>
        </div>
      </div>
    </section>`;
  }

  /* ---------------- pages: observability ---------------- */
  function renderObservability() {
    const metrics = METRICS[state.timeRange] || METRICS['7d'];
    const alerts = ALERTS.filter((alert) => state.obsProject === 'all' || alert.projectId === state.obsProject);
    return `
      ${pageHead('可观测', `平台与项目视图 · 指标、日志、链路与 LLM 观测`, `
        <div class="segmented">${[{ id: '1h', label: '近 1 小时' }, { id: '24h', label: '24 小时' }, { id: '7d', label: '7 天' }].map((item) => `<button class="${state.timeRange === item.id ? 'active' : ''}" type="button" data-action="time-range" data-range="${item.id}">${item.label}</button>`).join('')}</div>
        <select class="select" style="width:auto;min-width:140px;" data-action="obs-project" aria-label="项目筛选">
          <option value="all" ${state.obsProject === 'all' ? 'selected' : ''}>全部项目</option>
          ${PROJECTS.map((project) => `<option value="${project.id}" ${state.obsProject === project.id ? 'selected' : ''}>${esc(project.name)}</option>`).join('')}
        </select>`)}
      <div class="kpi-grid">
        ${kpi('平台可用性', '99.96%', '<span class="kpi-delta up">SLO 99.5%</span> 本月', { icon: 'check', hero: true })}
        ${kpi('API p95', '218ms', '<span class="kpi-delta up">↓ 12ms</span> 较昨日', { icon: 'chart' })}
        ${kpi('Agent 成功率', '96.2%', '<span class="kpi-delta up">↑ 1.4%</span> 近 7 天', { icon: 'bot' })}
        ${kpi('本周发布', '5', '4 成功 · 1 部分失败', { icon: 'rocket' })}
      </div>
      <div class="grid grid-main" style="margin-bottom:16px;">
        ${card('交付趋势', `需求 / 任务 / 发布 · ${state.timeRange}`, barChart(metrics.delivery, metrics.labels), '<span class="chart-legend"><span><span class="legend-dot" style="background:#2563eb;"></span>交付</span></span>')}
        <section class="card">
          <div class="card-head"><div><div class="card-title">告警</div><div class="card-sub">按项目筛选 · 点击查看 Runbook</div></div><div class="card-actions"><span class="pill danger">${alerts.filter((item) => item.status !== '已处理').length} 未处理</span></div></div>
          <div class="card-body" style="padding-top:10px;">
            <div class="pending-list">
              ${alerts.length ? alerts.map((alert) => `<div class="pending-item" data-action="open-alert" data-id="${alert.id}" tabindex="0" role="button">
                <span class="pending-icon" style="background:${alert.severity === '严重' ? '#fee2e2' : alert.severity === '警告' ? '#fef3c7' : '#e0f2fe'};color:${alert.severity === '严重' ? '#b91c1c' : alert.severity === '警告' ? '#b45309' : '#0369a1'}">${icon('alert', 14)}</span>
                <span class="pending-copy"><b>${esc(alert.title)}</b><small>${esc(alert.source)} · ${esc(alert.time)} · ${esc(alert.status)}</small></span>
                ${pill(alert.severity)}
              </div>`).join('') : '<div class="empty-table">当前项目没有告警</div>'}
            </div>
          </div>
        </section>
      </div>
      <div class="grid grid-3">
        ${card('Agent 成功率', '近 7 天任务质量', lineChart(metrics.agent, metrics.labels, '#0ea5e9'), '<span class="card-link">SLO 95%</span>')}
        ${card('LLM Token 消耗', '单位：百万 token', barChart(metrics.tokens, metrics.labels, { soft: true }), '<span class="card-link">成本 ¥126.40</span>')}
        <section class="card">
          <div class="card-head"><div><div class="card-title">发布成功率</div><div class="card-sub">近 7 天发布</div></div></div>
          <div class="card-body">
            <div class="donut-wrap">
              <div class="donut"><div class="donut-value"><b>78%</b><small>成功</small></div></div>
              <div class="donut-legend">
                <span><i class="legend-dot" style="background:#2563eb;"></i>成功 78%</span>
                <span><i class="legend-dot" style="background:#f59e0b;"></i>部分失败 14%</span>
                <span><i class="legend-dot" style="background:#e2e8f0;"></i>失败 8%</span>
              </div>
            </div>
          </div>
        </section>
      </div>
      <section class="card" style="margin-top:16px;">
        <div class="card-head"><div><div class="card-title">LLM 观测</div><div class="card-sub">LangFuse · 按项目与提示词版本</div></div><div class="card-actions"><span class="policy-pill">${icon('cap', 12)} DeepSeek</span></div></div>
        <div class="card-body">
          <div class="grid grid-4">
            <div><div class="meta-label">总 Token</div><div style="font-size:20px;font-weight:800;color:#253b55;">84.2k</div><div class="faint" style="font-size:10px;">输入 52.1k · 输出 32.1k</div></div>
            <div><div class="meta-label">成本</div><div style="font-size:20px;font-weight:800;color:#253b55;">¥126.40</div><div class="faint" style="font-size:10px;">预算 ¥300</div></div>
            <div><div class="meta-label">首 Token 延迟</div><div style="font-size:20px;font-weight:800;color:#253b55;">1.8s</div><div class="faint" style="font-size:10px;">p95 2.4s</div></div>
            <div><div class="meta-label">错误率</div><div style="font-size:20px;font-weight:800;color:#047857;">0.8%</div><div class="faint" style="font-size:10px;">重试 12 次</div></div>
          </div>
        </div>
      </section>
    `;
  }

  /* ---------------- pages: capabilities ---------------- */
  function renderCapabilities() {
    const caps = CAPABILITIES.filter((cap) => {
      const matchesSearch = !state.capSearch || `${cap.name} ${cap.tool} ${cap.owner}`.toLowerCase().includes(state.capSearch.toLowerCase());
      const matchesRisk = state.capRisk === 'all' || cap.risk === state.capRisk;
      return matchesSearch && matchesRisk;
    });
    return `
      ${pageHead('能力目录', '仅纳管平台内置 API · REST 与 MCP 双开关 · 策略热加载', `<span class="policy-pill">${icon('cap', 12)} 策略版本 v${state.policyVersion}</span><button class="btn btn-outline" type="button" data-action="refresh-policy">${icon('refresh', 14)} 刷新策略</button>`)}
      <div class="kpi-grid">
        ${kpi('能力总数', String(CAPABILITIES.length), '全部为平台内置', { icon: 'cap', hero: true })}
        ${kpi('REST 暴露', String(CAPABILITIES.filter((cap) => cap.rest).length), '北向 REST', { icon: 'code' })}
        ${kpi('MCP 暴露', String(CAPABILITIES.filter((cap) => cap.mcp).length), '供 Agent 调用', { icon: 'bot' })}
        ${kpi('24h 调用', '29.4k', 'p95 均值 74ms', { icon: 'chart' })}
      </div>
      <section class="card">
        <div class="card-body" style="padding-bottom:12px;">
          <div class="flex" style="flex-wrap:wrap;margin-bottom:12px;">
            <input id="cap-search" class="input" style="max-width:280px;" value="${esc(state.capSearch)}" placeholder="搜索能力名称、工具名、所属服务..." data-action="cap-search" aria-label="搜索能力">
            <div class="chips" style="margin-left:auto;">
              ${[{ id: 'all', label: '全部风险' }, { id: '低', label: '低' }, { id: '中', label: '中' }, { id: '高', label: '高' }].map((item) => `<button class="chip ${state.capRisk === item.id ? 'active' : ''}" type="button" data-action="cap-risk" data-risk="${item.id}">${item.label}</button>`).join('')}
            </div>
          </div>
          <div class="table-wrap"><table>
            <thead><tr><th>能力</th><th>所属服务</th><th>风险</th><th>REST</th><th>MCP</th><th>24h 调用</th><th>p95</th><th>版本</th></tr></thead>
            <tbody>
              ${caps.map((cap) => `<tr class="row-click" data-action="open-cap" data-id="${cap.id}" tabindex="0">
                <td><div class="cap-name"><b>${esc(cap.name)}</b><small>${esc(cap.tool)} · ${esc(cap.method)} ${esc(cap.path)}</small></div></td>
                <td>${esc(cap.owner)}</td>
                <td>${riskPill(cap.risk)}</td>
                <td><label class="switch" title="REST 开关"><input type="checkbox" ${cap.rest ? 'checked' : ''} data-action="toggle-rest" data-id="${cap.id}"><span class="switch-track"><span class="switch-thumb"></span></span></label></td>
                <td><label class="switch" title="MCP 开关"><input type="checkbox" ${cap.mcp ? 'checked' : ''} data-action="toggle-mcp" data-id="${cap.id}"><span class="switch-track"><span class="switch-thumb"></span></span></label></td>
                <td>${esc(cap.calls)}</td>
                <td>${esc(cap.p95)}</td>
                <td><span class="tag">${esc(cap.version)}</span></td>
              </tr>`).join('')}
            </tbody>
          </table></div>
        </div>
      </section>
    `;
  }

  function renderMcpTest() {
    const mcpCaps = CAPABILITIES.filter((cap) => cap.mcp);
    const requested = capabilityById(state.mcpTool);
    const selected = requested && requested.mcp ? requested : mcpCaps[0];
    const example = selected ? JSON.stringify(selected.example, null, 2) : '{}';
    return `
      ${pageHead('MCP 测试', 'Schema 校验、权限检查与 dry-run 调用；不产生真实副作用', `<span class="policy-pill">${icon('cap', 12)} 策略版本 v${state.policyVersion}</span>`)}
      <div class="mcp-grid">
        <section class="card">
          <div class="card-head"><div><div class="card-title">测试请求</div><div class="card-sub">选择 MCP 工具并传入 JSON 参数</div></div></div>
          <div class="card-body">
            <form data-form="mcp-test" id="mcp-form">
              <div class="field">
                <label for="mcp-tool">MCP 工具</label>
                <select id="mcp-tool" name="tool" class="select" data-action="mcp-tool-change">
                  ${mcpCaps.map((cap) => `<option value="${cap.id}" ${selected && cap.id === selected.id ? 'selected' : ''}>${esc(cap.name)} · ${esc(cap.tool)}</option>`).join('')}
                </select>
              </div>
              <div class="field">
                <label for="mcp-args">参数（JSON）</label>
                <textarea id="mcp-args" name="args" class="textarea" style="min-height:190px;font-family:var(--mono);font-size:11px;">${esc(example)}</textarea>
                <div class="form-hint">工具：${esc(selected ? selected.tool : '—')} · Scope：${esc(selected ? selected.scopes.join(', ') : '—')} · 限流：${esc(selected ? selected.rateLimit : '—')}</div>
              </div>
              <div class="flex" style="margin-top:14px;">
                <span class="pill info no-dot">dry-run</span>
                <button class="btn btn-primary" type="submit" style="margin-left:auto;">${icon('play', 13)} 发送测试</button>
              </div>
            </form>
          </div>
        </section>
        <section class="card mcp-result">
          <div class="card-head"><div><div class="card-title">响应</div><div class="card-sub">网关内处理，包含 Schema 与权限校验</div></div><div class="card-actions"><span id="mcp-response-status" class="mcp-status idle">未请求</span></div></div>
          <div class="card-body" id="mcp-response">
            <div class="empty-table">选择工具并发送测试请求，响应会显示在这里。</div>
          </div>
        </section>
      </div>
      <div class="grid grid-2" style="margin-top:16px;">
        ${card('请求 Schema', '由 CapManager 维护', `<div class="schema-block"><div class="schema-block-head">${icon('code', 13)} JSON Schema</div><pre>${esc(selected ? JSON.stringify(selected.schema, null, 2) : '{}')}</pre></div>`)}
        ${card('安全提示', 'MCP 调用的边界', `<div class="gate-list">
          <div class="gate-item ok"><span class="gate-icon">${icon('check', 12)}</span><div><b>工具白名单</b><small>只允许已启用 MCP 的能力</small></div></div>
          <div class="gate-item ok"><span class="gate-icon">${icon('check', 12)}</span><div><b>任务令牌 scope</b><small>每次调用校验 project、task 与能力 scope</small></div></div>
          <div class="gate-item warn"><span class="gate-icon">${icon('alert', 12)}</span><div><b>高风险工具</b><small>prod 写、凭据、外部副作用类工具必须人工审批</small></div></div>
        </div>`)}
      </div>
    `;
  }

  function renderCapAudit() {
    return `
      ${pageHead('策略与审计', '能力变更、热加载与回滚记录', `<button class="btn btn-outline" type="button" data-action="toast" data-msg="已导出能力审计（演示）">${icon('external', 14)} 导出</button>`)}
      <div class="grid grid-main">
        <section class="card"><div class="card-body" style="padding-top:12px;">
          <div class="table-wrap"><table>
            <thead><tr><th>时间</th><th>操作人</th><th>能力</th><th>变更</th><th>策略版本</th><th>结果</th><th></th></tr></thead>
            <tbody>${CAP_AUDIT.map((item) => `<tr>
              <td class="nowrap">${esc(item.time)}</td><td>${esc(item.actor)}</td><td><span class="tag">${esc(item.capability)}</span></td><td>${esc(item.change)}</td><td>${esc(item.version)}</td><td>${pill(item.result)}</td>
              <td><button class="btn btn-ghost btn-xs" type="button" data-action="toast" data-msg="演示：将回滚到 ${esc(item.version)}">回滚</button></td>
            </tr>`).join('')}</tbody>
          </table></div>
        </div></section>
        ${card('热加载状态', 'UniGateway 策略快照', `<div class="gate-list">
          <div class="gate-item ok"><span class="gate-icon">${icon('check', 12)}</span><div><b>策略版本 v${state.policyVersion}</b><small>所有网关副本已收敛</small></div></div>
          <div class="gate-item ok"><span class="gate-icon">${icon('check', 12)}</span><div><b>last-known-good 可用</b><small>失败自动回退上一版本</small></div></div>
          <div class="gate-item ok"><span class="gate-icon">${icon('check', 12)}</span><div><b>变更审计</b><small>变更前后差异与影响范围可查</small></div></div>
        </div>`)}
      </div>
    `;
  }

  /* ---------------- pages: admin ---------------- */
  function renderAdminUsers() {
    return `
      ${pageHead('用户与角色', '平台自建虚拟账号，一人一号；项目级 RBAC', `<button class="btn btn-primary" type="button" data-action="new-user">${icon('plus', 14)} 新增用户</button>`)}
      <div class="kpi-grid">
        ${kpi('用户总数', String(USERS.length), '平台虚拟账号', { icon: 'users', hero: true })}
        ${kpi('平台管理员', String(USERS.filter((user) => user.role === '平台管理员').length), '强制 MFA', { icon: 'admin' })}
        ${kpi('项目数', String(PROJECTS.length), '项目级隔离', { icon: 'grid' })}
        ${kpi('审计事件', String(AUDIT.length + 121), '近 24 小时', { icon: 'audit' })}
      </div>
      <section class="card" style="margin-bottom:16px;"><div class="card-body" style="padding-top:12px;">
        <div class="table-wrap"><table>
          <thead><tr><th>用户</th><th>角色</th><th>项目</th><th>MFA</th><th>状态</th><th>最近登录</th><th>操作</th></tr></thead>
          <tbody>${USERS.map((user) => `<tr class="row-click" data-action="open-user" data-id="${user.id}" tabindex="0">
            <td><div class="cell-main">${avatar(user.name, user.color, true)}<div><b>${esc(user.name)}</b><small>@${esc(user.username)} · ${esc(user.email)}</small></div></div></td>
            <td><span class="tag">${esc(user.role)}</span></td>
            <td>${esc(user.projects.join('、'))}</td>
            <td>${pill(user.mfa === '已启用' ? '已启用' : '未启用')}</td>
            <td>${pill(user.status)}</td>
            <td class="nowrap">${esc(user.lastLogin)}</td>
            <td><button class="btn btn-ghost btn-xs" type="button" data-action="toggle-user" data-id="${user.id}">${user.status === '活跃' ? '禁用' : '启用'}</button></td>
          </tr>`).join('')}</tbody>
        </table></div>
      </div></section>
      ${card('角色权限矩阵', '项目级角色；平台管理员拥有跨项目权限', `<div class="table-wrap"><table class="role-matrix">
        <thead><tr><th>权限</th><th>Owner</th><th>Maintainer</th><th>Developer</th><th>Viewer</th><th>Auditor</th><th>平台管理员</th></tr></thead>
        <tbody>
          ${[['项目查看', '✓', '✓', '✓', '✓', '✓', '✓'], ['需求编辑', '✓', '✓', '✓', '—', '—', '✓'], ['迭代管理', '✓', '✓', '—', '—', '—', '✓'], ['发起发布', '✓', '✓', '—', '—', '—', '✓'], ['审批发布', '✓', '—', '—', '—', '—', '✓'], ['能力配置', '—', '—', '—', '—', '—', '✓'], ['用户管理', '—', '—', '—', '—', '—', '✓'], ['审计查看', '—', '—', '—', '—', '✓', '✓']].map((row) => `<tr>${row.map((cell, index) => index === 0 ? `<td>${esc(cell)}</td>` : `<td><span class="${cell === '✓' ? 'check' : 'dash'}">${cell}</span></td>`).join('')}</tr>`).join('')}
        </tbody>
      </table></div>`)}
    `;
  }

  function renderAdminEnvs() {
    return `
      ${pageHead('环境与配额', 'test / prod 独立运行集群；平台自身单环境', `<button class="btn btn-outline" type="button" data-action="toast" data-msg="已刷新环境状态（演示）">${icon('refresh', 14)} 刷新</button>`)}
      <div class="grid grid-2" style="margin-bottom:16px;">
        ${ENVIRONMENTS.map((env) => `<section class="card env-card">
          <div class="env-head"><span class="env-badge">${esc(env.badge)}</span><div><b>${esc(env.name)}</b><small>${esc(env.region)}</small></div><span style="margin-left:auto;">${pill(env.status)}</span></div>
          <div class="env-stats">
            <div class="env-stat"><div class="meta-label">节点</div><b>${env.nodes}</b></div>
            <div class="env-stat"><div class="meta-label">Pod</div><b>${esc(env.pods)}</b></div>
            <div class="env-stat"><div class="meta-label">命名空间</div><b>${env.namespaces}</b></div>
          </div>
          <div style="margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div><div class="usage-head"><span>CPU</span><b>${env.cpu}%</b></div><div class="usage-bar"><span style="width:${env.cpu}%"></span></div></div>
            <div><div class="usage-head"><span>内存</span><b>${env.mem}%</b></div><div class="usage-bar"><span style="width:${env.mem}%"></span></div></div>
          </div>
        </section>`).join('')}
      </div>
      <div class="grid grid-main">
        ${card('数据服务', '平台元数据与 app-data 分库', `<div class="table-wrap"><table>
          <thead><tr><th>服务</th><th>版本</th><th>HA</th><th>使用率</th><th>状态</th></tr></thead>
          <tbody>${DATA_SERVICES.map((service) => `<tr>
            <td><div class="cell-main"><b>${esc(service.name)}</b></div></td><td>${esc(service.version)}</td><td>${esc(service.ha)}</td>
            <td style="min-width:120px;"><div class="usage-head"><span>${service.usage}%</span></div><div class="usage-bar ${service.usage > 70 ? 'warn' : ''}"><span style="width:${service.usage}%"></span></div></td>
            <td>${pill(service.status)}</td>
          </tr>`).join('')}</tbody>
        </table></div>`)}
        ${card('项目配额', '按项目分配 CPU / 内存 / Pod / 存储', `<div class="table-wrap"><table>
          <thead><tr><th>项目</th><th>CPU</th><th>内存</th><th>Pod</th><th>存储</th><th></th></tr></thead>
          <tbody>${QUOTAS.map((quota) => `<tr>
            <td>${esc(quota.name)}</td>
            <td><div class="usage"><div class="usage-head"><span>${quota.cpu}%</span></div><div class="usage-bar"><span style="width:${quota.cpu}%"></span></div></div></td>
            <td><div class="usage"><div class="usage-head"><span>${quota.mem}%</span></div><div class="usage-bar"><span style="width:${quota.mem}%"></span></div></div></td>
            <td>${quota.pods}</td><td>${quota.storage}%</td>
            <td><button class="btn btn-ghost btn-xs" type="button" data-action="adjust-quota" data-id="${quota.projectId}">调整</button></td>
          </tr>`).join('')}</tbody>
        </table></div>`)}
      </div>
    `;
  }

  function renderAdminFlags() {
    return `
      ${pageHead('功能开关', '灰度与运行时开关；变更 30 秒内生效', `<button class="btn btn-outline" type="button" data-action="toast" data-msg="已刷新开关状态（演示）">${icon('refresh', 14)} 刷新</button>`)}
      <section class="card"><div class="card-body" style="padding-top:6px;">
        ${FLAGS.map((flag) => `<div class="flag-row">
          <div class="flag-copy"><b>${esc(flag.name)}</b><code>${esc(flag.key)}</code><small>${esc(flag.desc)}</small></div>
          <div class="flag-meta"><label class="switch"><input type="checkbox" ${flag.enabled ? 'checked' : ''} data-action="toggle-flag" data-id="${flag.id}"><span class="switch-track"><span class="switch-thumb"></span></span></label><span class="faint" style="font-size:9.5px;">${esc(flag.owner)} · ${esc(flag.updated)}</span></div>
        </div>`).join('')}
      </div></section>
    `;
  }

  function renderAdminAudit() {
    const rows = AUDIT.filter((item) => !state.auditSearch || `${item.actor} ${item.action} ${item.resource} ${item.id}`.toLowerCase().includes(state.auditSearch.toLowerCase()));
    return `
      ${pageHead('审计日志', '追加式审计、哈希链与 WORM 归档', `<button class="btn btn-outline" type="button" data-action="export-audit">${icon('external', 14)} 导出审计</button>`)}
      <section class="card"><div class="card-body" style="padding-bottom:12px;">
        <div class="flex" style="margin-bottom:12px;flex-wrap:wrap;">
          <input id="audit-search" class="input" style="max-width:300px;" value="${esc(state.auditSearch)}" placeholder="搜索操作人、动作、资源..." data-action="audit-search" aria-label="搜索审计">
          <span class="faint" style="margin-left:auto;font-size:10.5px;">仅 INSERT · 哈希链校验通过</span>
        </div>
        <div class="table-wrap"><table>
          <thead><tr><th>时间</th><th>操作人</th><th>动作</th><th>资源</th><th>结果</th><th>IP</th><th>Trace</th><th></th></tr></thead>
          <tbody>${rows.length ? rows.map((item) => `<tr class="row-click" data-action="open-audit" data-id="${item.id}" tabindex="0">
            <td class="nowrap">${esc(item.time)}</td><td>${esc(item.actor)}</td><td>${esc(item.action)}</td><td><span class="tag">${esc(item.resource)}</span></td><td>${pill(item.result)}</td><td>${esc(item.ip)}</td><td><span class="cell-id">${esc(item.trace)}</span></td><td><span class="muted">→</span></td>
          </tr>`).join('') : `<tr><td colspan="8">${emptyTable('没有匹配的审计事件')}</td></tr>`}</tbody>
        </table></div>
      </div></section>
    `;
  }

  function renderAdminRelease() {
    return `
      ${pageHead('平台发布', '平台单环境；金丝雀 + 快速回滚', `<button class="btn btn-outline" type="button" data-action="toast" data-msg="已打开平台发布记录（演示）">${icon('external', 14)} 发布记录</button><button class="btn btn-danger" type="button" data-action="platform-rollback">${icon('rotate', 14)} 回滚平台版本</button>`)}
      <div class="grid grid-main">
        <section class="card">
          <div class="card-body" style="padding:18px;">
            <div class="flex" style="align-items:flex-start;">
              <div class="side-icon" style="width:42px;height:42px;border-radius:12px;background:#eff6ff;color:#2563eb;">${icon('rocket', 20)}</div>
              <div><div class="card-title" style="font-size:16px;">平台版本 v1.8.2</div><div class="card-sub">2026-10-24 10:00 开始 · 负责人 刘洋</div></div>
              <span style="margin-left:auto;">${pill('金丝雀 10%')}</span>
            </div>
            <div class="stepper" style="margin-top:20px;">
              <div class="step done"><span class="step-dot">${icon('check', 12)}</span><span class="step-label">构建</span></div><span class="step-line"></span>
              <div class="step active"><span class="step-dot">2</span><span class="step-label">金丝雀 10%</span></div><span class="step-line"></span>
              <div class="step"><span class="step-dot">3</span><span class="step-label">观察 30 分钟</span></div><span class="step-line"></span>
              <div class="step"><span class="step-dot">4</span><span class="step-label">全量</span></div>
            </div>
            <div class="divider"></div>
            <div class="grid grid-3">
              <div><div class="meta-label">错误率</div><div style="font-size:20px;font-weight:800;color:#047857;">0.02%</div></div>
              <div><div class="meta-label">p95</div><div style="font-size:20px;font-weight:800;color:#253b55;">212ms</div></div>
              <div><div class="meta-label">自动回滚</div><div style="font-size:20px;font-weight:800;color:#253b55;">已启用</div></div>
            </div>
          </div>
        </section>
        ${card('平台发布策略', '单环境升级', `<div class="gate-list">
          <div class="gate-item ok"><span class="gate-icon">${icon('check', 12)}</span><div><b>金丝雀 10%</b><small>按内部项目 cohort 灰度</small></div></div>
          <div class="gate-item ok"><span class="gate-icon">${icon('check', 12)}</span><div><b>观察窗口 30 分钟</b><small>错误率、p95、任务成功率自动分析</small></div></div>
          <div class="gate-item ok"><span class="gate-icon">${icon('check', 12)}</span><div><b>自动回滚</b><small>指标超阈值自动回滚上一版本</small></div></div>
          <div class="gate-item warn"><span class="gate-icon">${icon('alert', 12)}</span><div><b>数据库兼容</b><small>N-1/N schema 兼容检查；迁移 pre-sync Job</small></div></div>
        </div>`)}
      </div>
      ${card('最近平台发布', '平台自身版本', `<div class="table-wrap"><table>
        <thead><tr><th>版本</th><th>时间</th><th>状态</th><th>负责人</th><th>说明</th></tr></thead>
        <tbody>
          <tr><td><b>v1.8.2</b></td><td>2026-10-24 10:00</td><td>${pill('金丝雀 10%')}</td><td>刘洋</td><td>导航入口配置、迭代发布改进</td></tr>
          <tr><td><b>v1.8.1</b></td><td>2026-10-18 15:20</td><td>${pill('成功')}</td><td>刘洋</td><td>MCP 热加载性能优化</td></tr>
          <tr><td><b>v1.8.0</b></td><td>2026-10-12 11:00</td><td>${pill('成功')}</td><td>刘洋</td><td>能力中心 2.0</td></tr>
        </tbody>
      </table></div>`)}
    `;
  }

  function renderPlaceholder(meta) {
    const label = meta.title || '该模块';
    return `<div class="empty">
      <div class="empty-badge">占位模块</div>
      <div class="empty-icon">${icon(meta.module === 'workspace' ? 'grid' : meta.module === 'app-center' ? 'cube' : 'file', 30)}</div>
      <h2>${esc(label)}模块建设中</h2>
      <p>该模块暂未开放。当前演示请进入项目空间，体验需求、迭代、Agent 与流水线。</p>
      <button class="btn btn-primary" type="button" data-action="nav" data-route="#/projects">进入项目空间</button>
    </div>`;
  }

  /* ---------------- overlays / toast ---------------- */
  function openPanel({ title, sub = '', body = '', footer = '', variant = 'drawer', wide = false, extraWide = false, headerActions = '' }) {
    const overlay = $('#overlay');
    overlay.innerHTML = `
      <div class="overlay-backdrop" data-action="close-overlay"></div>
      <aside class="drawer ${variant === 'modal' ? 'modal' : ''} ${wide ? 'wide' : ''} ${extraWide ? 'extra-wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="drawer-head"><div><div class="drawer-title">${title}</div>${sub ? `<div class="drawer-sub">${sub}</div>` : ''}</div><div class="drawer-head-actions">${headerActions}<button class="icon-btn drawer-close" type="button" data-action="close-overlay" aria-label="关闭">${icon('x', 16)}</button></div></div>
        <div class="drawer-body">${body}</div>
        ${footer ? `<div class="drawer-foot">${footer}</div>` : ''}
      </aside>`;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  }

  function closeOverlay() {
    const overlay = $('#overlay');
    overlay.classList.remove('open');
    overlay.innerHTML = '';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  }

  function toast(message, type = 'success', title = '') {
    const titles = { success: '操作成功', info: '提示', warning: '注意', error: '操作失败' };
    const id = ++state.toastSeq;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.id = `toast-${id}`;
    el.innerHTML = `<div class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '!' : 'i'}</div><div class="toast-copy"><b>${esc(title || titles[type] || '提示')}</b><small>${esc(message)}</small></div>`;
    $('#toasts').appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      el.style.transition = 'all .2s ease';
      setTimeout(() => el.remove(), 220);
    }, 3200);
  }

  function audit(action, resource, result = '成功', detail = {}) {
    AUDIT.unshift({
      id: `AUD-${++state.auditSeq}`,
      time: nowTime(),
      actor: '张明',
      action,
      resource,
      result,
      ip: '10.0.8.21',
      trace: `tr-${(state.auditSeq).toString(16)}`,
      detail
    });
  }

  function closeDropdowns() {
    $('#search-results')?.classList.remove('open');
    $('#notif-dropdown')?.classList.remove('open');
    $('#avatar-menu')?.classList.remove('open');
  }

  /* ---------------- topbar dropdown content ---------------- */
  function renderNotifications() {
    const unread = state.notificationsRead ? 0 : NOTIFICATIONS.length;
    $('#notif-badge').classList.toggle('hidden', state.notificationsRead);
    $('#notif-dropdown').innerHTML = `
      <div class="dropdown-head"><b>通知 ${unread ? `<span class="pill warning" style="margin-left:4px;">${unread}</span>` : ''}</b><button type="button" data-action="notif-read-all">全部已读</button></div>
      <div class="notif-list">
        ${NOTIFICATIONS.map((item) => `<button class="notif-item" type="button" data-action="notif-item" data-route="${item.route}">
          <span class="notif-dot" style="background:${item.tone === 'danger' ? '#ef4444' : item.tone === 'warning' ? '#f59e0b' : item.tone === 'success' ? '#10b981' : '#0ea5e9'}"></span>
          <span class="notif-copy"><b>${esc(item.title)}</b><small>${esc(item.desc)} · ${esc(item.time)}</small></span>
        </button>`).join('')}
      </div>`;
  }

  function renderAvatarMenu() {
    $('#avatar-menu').innerHTML = `
      <div class="avatar-head"><span class="avatar">张</span><div><b>张明</b><small>项目 Owner · 订单中心</small></div></div>
      <button class="menu-item" type="button" data-action="profile">${icon('users', 14)} 个人设置</button>
      <button class="menu-item" type="button" data-action="toast" data-msg="偏好设置为演示占位">${icon('settings', 14)} 偏好设置</button>
      <button class="menu-item" type="button" data-action="open-nav-config">${icon('admin', 14)} 平台设置</button>
      <button class="menu-item" type="button" data-action="nav" data-route="#/admin/audit">${icon('audit', 14)} 审计日志</button>
      <button class="menu-item danger" type="button" data-action="logout">${icon('external', 14)} 退出登录</button>`;
  }

  function renderSearchResults(query) {
    const box = $('#search-results');
    const q = String(query || '').trim().toLowerCase();
    if (!q) {
      box.innerHTML = `<div class="search-group-label">最近访问</div>
        ${[
          { type: 'project', id: 'p-order', title: '订单中心', sub: '项目空间 · ORDER', icon: 'grid', route: '#/requirements' },
          { type: 'requirement', id: 'RQ-101', title: '订单履约超时预警', sub: '需求 · v2.4', icon: 'layers', route: '#/requirements' },
          { type: 'task', id: 'T-203', title: 'Coding · 订单状态机可视化', sub: 'Agent 任务 · 待审批', icon: 'bot', route: '#/agents' },
          { type: 'capability', id: 'CAP-002', title: '需求创建', sub: '能力 · requirement.create', icon: 'cap', route: '#/capabilities' }
        ].map((item) => searchItem(item)).join('')}`;
      box.classList.add('open');
      return;
    }
    const results = [];
    PROJECTS.filter((item) => `${item.name} ${item.code} ${item.owner}`.toLowerCase().includes(q)).slice(0, 2).forEach((item) => results.push({ type: 'project', id: item.id, title: item.name, sub: `项目 · ${item.code} · ${item.owner}`, icon: 'grid', route: '#/requirements' }));
    REQUIREMENTS.filter((item) => `${item.id} ${item.title}`.toLowerCase().includes(q)).slice(0, 3).forEach((item) => results.push({ type: 'requirement', id: item.id, title: item.title, sub: `需求 · ${item.id} · ${item.status}`, icon: 'layers', route: '#/requirements' }));
    TASKS.filter((item) => `${item.id} ${item.title} ${item.agent}`.toLowerCase().includes(q)).slice(0, 2).forEach((item) => results.push({ type: 'task', id: item.id, title: item.title, sub: `Agent · ${item.status}`, icon: 'bot', route: '#/agents' }));
    CAPABILITIES.filter((item) => `${item.name} ${item.tool} ${item.owner}`.toLowerCase().includes(q)).slice(0, 2).forEach((item) => results.push({ type: 'capability', id: item.id, title: item.name, sub: `能力 · ${item.tool}`, icon: 'cap', route: '#/capabilities' }));
    APPS.filter((item) => item.name.toLowerCase().includes(q)).slice(0, 2).forEach((item) => results.push({ type: 'app', id: item.id, title: item.name, sub: `应用 · ${projectById(item.projectId)?.name || ''}`, icon: 'server', route: '#/runtime' }));
    box.innerHTML = results.length
      ? `<div class="search-group-label">搜索结果</div>${results.slice(0, 9).map((item) => searchItem(item)).join('')}`
      : `<div class="search-empty">没有找到与“${esc(query)}”相关的内容</div>`;
    box.classList.add('open');
  }

  function searchItem(item) {
    return `<button class="search-item" type="button" data-action="search-result" data-type="${item.type}" data-id="${item.id}" data-route="${item.route}">
      <span class="search-item-icon">${icon(item.icon, 14)}</span>
      <span class="search-item-copy"><b>${esc(item.title)}</b><small>${esc(item.sub)}</small></span>
    </button>`;
  }

  /* ---------------- drawer builders ---------------- */
  function requirementComments(reqId) {
    return REQUIREMENT_COMMENTS
      .filter((comment) => comment.requirementId === reqId)
      .slice()
      .sort((a, b) => String(b.time).localeCompare(String(a.time)));
  }

  function requirementHistory(reqId) {
    return REQUIREMENT_HISTORY.filter((entry) => entry.requirementId === reqId);
  }

  function addRequirementHistory(req, action, changes, actor = '张明') {
    const entry = { id: `H-${++state.historySeq}`, requirementId: req.id, actor, time: nowTime(), action, changes };
    REQUIREMENT_HISTORY.unshift(entry);
    return entry;
  }

  function requirementEditChanges(before, after) {
    const fields = [
      { key: 'title', label: '标题' },
      { key: 'status', label: '状态' },
      { key: 'priority', label: '优先级' },
      { key: 'owner', label: '责任人' },
      { key: 'desc', label: '需求描述', updatedOnly: true },
      { key: 'acceptance', label: '验收标准', updatedOnly: true }
    ];
    return fields
      .filter((field) => before[field.key] !== after[field.key])
      .map((field) => field.updatedOnly
        ? { label: field.label, updated: true }
        : { label: field.label, before: before[field.key], after: after[field.key] });
  }

  function historyText(value) {
    const text = String(value ?? '');
    return text.length > 60 ? `${text.slice(0, 60)}…` : text;
  }

  function renderRequirementHistory(reqId) {
    const history = requirementHistory(reqId);
    if (!history.length) return '<div class="empty-table">暂无变更记录</div>';
    return `<div class="req-history-timeline">${history.map((entry, index) => {
      const user = USERS.find((item) => item.name === entry.actor);
      return `<div class="req-history-entry ${index === 0 ? 'latest' : ''}">
        <div class="req-history-time">${esc(entry.time)}</div>
        <div class="req-history-rail"><span class="req-history-dot"></span></div>
        <div class="req-history-card">
          <div class="req-history-head">${avatar(entry.actor, user?.color || '#2563eb', true)}<b>${esc(entry.actor)}</b><span class="req-history-action">${esc(entry.action)}</span></div>
          <div class="req-history-changes">${(entry.changes || []).map((change) => {
            const value = change.updated
              ? '<span class="tag">已更新</span>'
              : change.before
                ? `<span class="req-history-before">${esc(historyText(change.before))}</span><span class="req-history-arrow">→</span><span class="req-history-after">${esc(historyText(change.after))}</span>`
                : `<span class="req-history-after">${esc(historyText(change.after))}</span>`;
            return `<div class="req-history-change"><span class="req-history-label">${esc(change.label)}</span>${value}</div>`;
          }).join('')}</div>
        </div>
      </div>`;
    }).join('')}</div>`;
  }

  function renderRequirementComments(reqId) {
    const comments = requirementComments(reqId);
    if (!comments.length) return '<div class="empty-table">暂无评论，来补充第一条说明。</div>';
    return comments.map((comment) => {
      const author = USERS.find((user) => user.name === comment.author);
      return `<div class="comment-item">
        ${avatar(comment.author, author?.color || '#2563eb', true)}
        <div class="comment-copy">
          <div class="comment-head"><b>${esc(comment.author)}</b><span>${esc(comment.time)}</span></div>
          <p>${esc(comment.content)}</p>
        </div>
      </div>`;
    }).join('');
  }

  function openRequirementDrawer(id) {
    const req = requirementById(id);
    if (!req) return;
    const task = taskById(req.taskId);
    const project = projectById(req.projectId);
    const comments = requirementComments(req.id);
    const appRelations = (req.apps || []).map((app) => appById(app)).filter(Boolean);
    const linkedRelease = requirementRelease(req.id);
    const releaseChoices = iterationReleases(req.iterationId);
    const ownerNames = [...new Set([
      ...(project?.members || []).map((member) => userById(member.userId)?.name).filter(Boolean),
      req.owner
    ])];
    const requirementStatuses = ['分析', '设计', '开发', '测试', '发布'];
    const priorities = ['P0', 'P1', 'P2', 'P3'];
    const body = `
      <div class="tabs req-detail-tabs">
        <button class="tab active" type="button" data-action="req-detail-tab" data-tab="detail">详情</button>
        <button class="tab" type="button" data-action="req-detail-tab" data-tab="relations">关联项</button>
        <button class="tab" type="button" data-action="req-detail-tab" data-tab="history">历史记录</button>
      </div>
      <div class="req-detail-pane" data-pane="detail">
        <div class="req-detail-grid">
          <div class="req-detail-left">
            <div class="drawer-section">
              <div class="field"><label for="req-edit-title">需求标题</label><input id="req-edit-title" class="input" value="${esc(req.title)}" maxlength="120" required></div>
              <div class="field"><label for="req-desc-edit">需求描述</label><textarea id="req-desc-edit" class="textarea req-desc-edit" rows="6" maxlength="1000" placeholder="补充需求背景、目标与范围">${esc(req.desc)}</textarea></div>
            </div>
            <div class="drawer-section">
              <div class="drawer-section-title">评论区 <span id="req-comment-count" class="comment-count">${comments.length}</span></div>
              <div id="req-comments" class="comment-list">${renderRequirementComments(req.id)}</div>
              <div class="comment-compose">
                <textarea id="req-comment-input" class="textarea" rows="3" maxlength="500" placeholder="补充说明、评审意见或交付备注"></textarea>
                <div class="flex" style="justify-content:flex-end;margin-top:8px;">
                  <button class="btn btn-outline btn-sm" type="button" data-action="add-req-comment" data-id="${req.id}">发表评论</button>
                </div>
              </div>
            </div>
          </div>
          <div class="req-detail-right">
            <div class="drawer-section">
              <div class="field"><label for="req-edit-status">状态</label><select id="req-edit-status" class="select">${requirementStatuses.map((status) => `<option value="${status}" ${req.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></div>
              <div class="field"><label for="req-edit-priority">优先级</label><select id="req-edit-priority" class="select">${priorities.map((priority) => `<option value="${priority}" ${req.priority === priority ? 'selected' : ''}>${priority}</option>`).join('')}</select></div>
              <div class="field"><label for="req-edit-owner">责任人</label><select id="req-edit-owner" class="select">${ownerNames.map((owner) => `<option value="${esc(owner)}" ${req.owner === owner ? 'selected' : ''}>${esc(owner)}</option>`).join('')}</select></div>
              <div class="field"><label for="req-edit-release">关联发布</label><select id="req-edit-release" class="select"><option value="">不关联</option>${releaseChoices.map((release) => `<option value="${release.id}" ${linkedRelease?.id === release.id ? 'selected' : ''}>${esc(release.name)}</option>`).join('')}</select></div>
              <div class="field"><label for="req-edit-acceptance">验收标准</label><textarea id="req-edit-acceptance" class="textarea" rows="6" maxlength="1000" required>${esc(req.acceptance)}</textarea></div>
            </div>
          </div>
        </div>
      </div>
      <div class="req-detail-pane" data-pane="relations" hidden>
        <div class="req-relation-grid">
          <div class="drawer-section">
            <div class="drawer-section-title">关联应用</div>
            <div class="relation-list">${appRelations.length ? appRelations.map((app) => `<button class="relation-item" type="button" data-action="open-app" data-id="${app.id}">
              <span class="relation-icon">${icon('cube', 15)}</span>
              <span class="relation-copy"><b>${esc(app.name)}</b><small>prod ${esc(app.envs.prod?.version || '—')} · test ${esc(app.envs.test?.version || '—')}</small></span>
              <span class="tag">${esc(app.envs.prod?.status || '仅 test')}</span>
            </button>`).join('') : '<div class="empty-table">暂无关联应用</div>'}</div>
          </div>
          <div class="drawer-section">
            <div class="drawer-section-title">关联任务</div>
            ${task ? `<button class="project-option" type="button" data-action="open-task-page" data-id="${task.id}" data-from="board"><span class="side-icon">${icon('bot', 15)}</span><span class="project-option-meta"><b>${esc(task.title)}</b><small>${esc(task.status)} · ${esc(task.agent)}</small></span><span style="margin-left:auto;">${pill(task.status)}</span></button>` : '<div class="empty-table">暂无关联任务</div>'}
          </div>
        </div>
        <div class="drawer-section">
          <div class="drawer-section-title">关联发布</div>
          ${linkedRelease ? `<div class="relation-item" style="cursor:default;">
            <span class="relation-icon">${icon('rocket', 15)}</span>
            <span class="relation-copy"><b>${esc(linkedRelease.name)}</b><small>${esc(releaseWindow(linkedRelease))} · ${esc(linkedRelease.id)}</small></span>
            <span style="margin-left:auto;">${pill(releaseStatus(linkedRelease))}</span>
          </div>` : '<div class="empty-table">暂无关联发布</div>'}
        </div>
        ${req.deferredTo ? `<div class="drawer-section"><div class="drawer-section-title">延期目标</div><div class="release-note"><b>已延期</b><br>目标：${esc(iterationById(req.deferredTo)?.name || 'backlog')}；不计入当前迭代发布。</div></div>` : ''}
      </div>
      <div class="req-detail-pane" data-pane="history" hidden>
        <div class="drawer-section">
          <div class="drawer-section-title">变更记录</div>
          ${renderRequirementHistory(req.id)}
        </div>
      </div>
    `;
    const footer = !req.ready && !req.deferredTo ? `<button class="btn btn-danger" type="button" data-action="defer-req" data-id="${req.id}">延期需求</button>` : '';
    const headerActions = `<button class="btn btn-primary btn-sm" type="button" data-action="save-req-edit" data-id="${req.id}">保存修改</button>`;
    openPanel({ title: `${req.id} · ${req.title}`, sub: '需求详情与关联信息', body, footer, extraWide: true, headerActions });
  }

  function saveRequirementEdit(id) {
    const req = requirementById(id);
    if (!req) return;
    const titleInput = $('#req-edit-title');
    const title = titleInput ? titleInput.value.trim() : '';
    const status = $('#req-edit-status')?.value || '';
    const priority = $('#req-edit-priority')?.value || '';
    const owner = $('#req-edit-owner')?.value || '';
    const descInput = $('#req-desc-edit');
    const desc = descInput ? descInput.value.trim() : '';
    const acceptanceInput = $('#req-edit-acceptance');
    const acceptance = acceptanceInput ? acceptanceInput.value.trim() : '';
    const releaseId = $('#req-edit-release')?.value || '';
    const currentRelease = requirementRelease(req.id);
    const beforeReleaseId = currentRelease?.id || '';
    const targetRelease = releaseId ? releaseById(releaseId) : null;
    if (releaseId && (!targetRelease || targetRelease.iterationId !== req.iterationId)) { toast('请选择当前迭代的发布。', 'warning'); return; }
    const releaseChanged = releaseId !== beforeReleaseId;
    if (!title) { toast('请填写需求标题。', 'warning'); if (titleInput) titleInput.focus(); return; }
    if (!['分析', '设计', '开发', '测试', '发布'].includes(status)) { toast('请选择有效的需求状态。', 'warning'); return; }
    if (!['P0', 'P1', 'P2', 'P3'].includes(priority)) { toast('请选择有效的优先级。', 'warning'); return; }
    if (!owner) { toast('请选择责任人。', 'warning'); return; }
    if (!desc) { toast('需求描述不能为空。', 'warning'); if (descInput) descInput.focus(); return; }
    if (!acceptance) { toast('验收标准不能为空。', 'warning'); if (acceptanceInput) acceptanceInput.focus(); return; }
    const before = { title: req.title, status: req.status, priority: req.priority, owner: req.owner, desc: req.desc, acceptance: req.acceptance };
    const after = { title, status, priority, owner, desc, acceptance };
    if (!releaseChanged && Object.keys(after).every((key) => after[key] === before[key])) {
      toast('没有需要保存的修改。', 'info');
      return;
    }
    const statusChanged = status !== before.status;
    Object.assign(req, after, {
      updated: nowTime(),
      ready: !req.deferredTo && ['测试', '发布'].includes(status)
    });
    if (releaseChanged) applyRequirementRelease(req, releaseId);
    const autoTask = statusChanged ? createTaskFromRequirement(req, status) : null;
    const changes = requirementEditChanges(before, after);
    if (releaseChanged) changes.push({ label: '关联发布', before: currentRelease?.name || '未关联', after: targetRelease?.name || '未关联' });
    if (autoTask) changes.push({ label: '自动任务', after: `${autoTask.id} · ${autoTask.type}` });
    addRequirementHistory(req, '更新需求', changes);
    audit('更新需求', req.id, '成功', { before: { ...before, release: beforeReleaseId }, after: { ...after, release: releaseId } });
    renderMain();
    openRequirementDrawer(req.id);
    toast(
      autoTask ? `${req.id} 已更新，已自动创建 ${autoTask.id}（${autoTask.type}）。` : `${req.id} 已更新。`,
      'success',
      '需求已更新'
    );
  }

  function switchRequirementDetailTab(tab) {
    const root = document.querySelector('.overlay.open .drawer');
    if (!root) return;
    root.querySelectorAll('[data-action="req-detail-tab"]').forEach((button) => {
      button.classList.toggle('active', button.dataset.tab === tab);
    });
    root.querySelectorAll('.req-detail-pane').forEach((pane) => {
      pane.hidden = pane.dataset.pane !== tab;
    });
  }

  function addRequirementComment(id) {
    const req = requirementById(id);
    if (!req) return;
    const input = $('#req-comment-input');
    const content = input ? input.value.trim() : '';
    if (!content) {
      toast('请输入评论内容。', 'warning');
      if (input) input.focus();
      return;
    }
    REQUIREMENT_COMMENTS.unshift({
      id: `C-${++state.commentSeq}`,
      requirementId: req.id,
      author: '张明',
      time: nowTime(),
      content
    });
    audit('添加需求评论', req.id, '成功', { after: { content } });
    const list = $('#req-comments');
    if (list) list.innerHTML = renderRequirementComments(req.id);
    const count = $('#req-comment-count');
    if (count) count.textContent = String(requirementComments(req.id).length);
    if (input) {
      input.value = '';
      input.focus();
    }
    toast('评论已发布。', 'success', '评论已添加');
  }

  function openDeferForm(id) {
    const req = requirementById(id);
    if (!req) return;
    const targetOptions = projectIterations(req.projectId).filter((item) => item.id !== req.iterationId).map((item) => `<option value="${item.id}">${esc(item.name)}</option>`).join('') + '<option value="backlog">回到 Backlog</option>';
    openPanel({
      title: '延期需求', sub: `${req.id} · ${req.title}`, variant: 'modal',
      body: `<form id="defer-form" data-form="defer-req">
        <input type="hidden" name="id" value="${req.id}">
        <div class="field"><label for="defer-target">延期到</label><select id="defer-target" name="target" class="select" required>${targetOptions}</select></div>
        <div class="field"><label for="defer-reason">延期原因</label><textarea id="defer-reason" name="reason" class="textarea" required placeholder="例如：依赖风控服务改造，延至下一迭代"></textarea><div class="form-hint">延期会写审计；需求不计入当前迭代发布。</div></div>
        <div class="btn-row" style="justify-content:flex-end;margin-top:18px;"><button class="btn btn-outline" type="button" data-action="close-overlay">取消</button><button class="btn btn-primary" type="submit">确认延期</button></div>
      </form>`
    });
  }

  function openTaskDrawer(id) {
    const task = taskById(id);
    if (!task) return;
    const timeline = [
      { label: '任务创建', done: true, active: false, note: `${task.started} · ${task.agent}` },
      { label: 'Agent 执行', done: task.status !== '排队中', active: task.status === '运行中', note: task.status === '排队中' ? '等待 worker' : 'LangGraph 工作流' },
      { label: '工具调用', done: ['待确认', '待审批', '成功', '失败'].includes(task.status), active: task.status === '运行中', note: `${task.steps} steps · ${task.tokens} tokens` },
      { label: '测试 / 校验', done: ['待审批', '成功', '失败'].includes(task.status), active: task.status === '待确认', note: task.status === '失败' ? '校验失败' : '单测与沙箱校验' },
      { label: '人工审批 / 完成', done: task.status === '成功', active: ['待确认', '待审批'].includes(task.status), note: task.status === '待确认' || task.status === '待审批' ? '等待审批' : task.status }
    ];
    const body = `
      <div class="drawer-section"><div class="flex" style="flex-wrap:wrap;">${pill(task.status)} <span class="tag">${icon('bot', 11)} ${esc(task.agent)}</span> <span class="tag">${esc(task.id)}</span></div>
        <p style="margin-top:10px;font-size:12.5px;line-height:1.7;color:#475569;">${esc(task.summary)}</p>
      </div>
      <div class="drawer-section"><div class="meta-grid">
        <div class="meta-item"><div class="meta-label">项目</div><div class="meta-value">${esc(projectById(task.projectId)?.name || '—')}</div></div>
        <div class="meta-item"><div class="meta-label">需求</div><div class="meta-value">${task.requirementId ? esc(task.requirementId) : '—'}</div></div>
        <div class="meta-item"><div class="meta-label">耗时</div><div class="meta-value">${esc(task.duration)}</div></div>
        <div class="meta-item"><div class="meta-label">Token / 步数</div><div class="meta-value">${esc(task.tokens)} · ${task.steps} steps</div></div>
      </div></div>
      <div class="drawer-section"><div class="progress-label"><span class="muted" style="font-size:11px;">任务进度</span><span>${task.progress}%</span></div><div style="margin-top:6px;">${progress(task.progress)}</div></div>
      <div class="drawer-section"><div class="drawer-section-title">执行时间线</div><div class="timeline">${timeline.map((item) => `<div class="timeline-item ${item.done ? 'done' : item.active ? 'active' : ''} ${task.status === '失败' && item.label === '测试 / 校验' ? 'failed' : ''}"><span class="timeline-dot"></span><div class="timeline-content"><b>${item.label}</b><small>${esc(item.note)}</small></div></div>`).join('')}</div></div>
      ${task.tools && task.tools.length ? `<div class="drawer-section"><div class="drawer-section-title">工具调用</div><div class="gate-list">${task.tools.map((tool) => `<div class="gate-item ${tool.status === '失败' ? 'bad' : tool.status === '运行中' ? 'warn' : 'ok'}"><span class="gate-icon">${icon(tool.status === '失败' ? 'alert' : tool.status === '运行中' ? 'refresh' : 'check', 12)}</span><div><b>${esc(tool.name)}</b><small>${esc(tool.meta)}</small></div></div>`).join('')}</div></div>` : ''}
      ${task.diff ? `<div class="drawer-section"><div class="drawer-section-title">代码 Diff · ${task.diff.files} 个文件 +${task.diff.additions} −${task.diff.deletions}</div><div class="diff">${task.diff.lines.map((line) => `<div class="diff-line ${line.type}"><span class="ln">${line.type === 'add' ? '+' : line.type === 'del' ? '−' : ' '}</span><span>${esc(line.text)}</span></div>`).join('')}</div></div>` : ''}
      <div class="drawer-section"><div class="drawer-section-title">日志</div><div class="log-block">${esc(task.logs || '暂无日志')}</div></div>
    `;
    let footer = `<button class="btn btn-outline" type="button" data-action="close-overlay">关闭</button>`;
    if (['待确认', '待审批'].includes(task.status)) footer += `<button class="btn btn-danger" type="button" data-action="reject-task" data-id="${task.id}">要求修改</button><button class="btn btn-primary" type="button" data-action="approve-task" data-id="${task.id}">${icon('check', 14)} 通过</button>`;
    else if (task.status === '运行中') footer += `<button class="btn btn-danger" type="button" data-action="cancel-task" data-id="${task.id}">中止任务</button>`;
    else if (task.status === '失败') footer += `<button class="btn btn-primary" type="button" data-action="retry-task" data-id="${task.id}">${icon('rotate', 14)} 重试</button>`;
    openPanel({ title: task.title, sub: `${task.id} · ${task.agent}`, body, footer, wide: true });
  }

  function openPipelineDrawer(id) {
    const run = PIPELINES.find((item) => item.id === id);
    if (!run) return;
    const body = `
      <div class="drawer-section"><div class="flex" style="flex-wrap:wrap;">${pill(run.status)}<span class="tag">${esc(run.id)}</span><span class="tag">${esc(appById(run.appId)?.name || run.appId)}</span></div>
        <div class="meta-grid" style="margin-top:12px;">
          <div class="meta-item"><div class="meta-label">分支</div><div class="meta-value">${esc(run.branch)}</div></div>
          <div class="meta-item"><div class="meta-label">Commit</div><div class="meta-value" style="font-family:var(--mono);font-size:10.5px;">${esc(run.commit)}</div></div>
          <div class="meta-item"><div class="meta-label">触发人</div><div class="meta-value">${esc(run.triggeredBy)}</div></div>
          <div class="meta-item"><div class="meta-label">耗时</div><div class="meta-value">${esc(run.duration)}</div></div>
        </div>
      </div>
      <div class="drawer-section"><div class="drawer-section-title">阶段</div><div class="timeline">${run.stages.map((stage) => `<div class="timeline-item ${stage.status === '成功' ? 'done' : stage.status === '失败' ? 'failed' : stage.status === '运行中' ? 'active' : ''}"><span class="timeline-dot"></span><div class="timeline-content"><b>${esc(stage.name)}</b><small>${esc(stage.status)} · ${esc(stage.duration)}</small></div></div>`).join('')}</div></div>
      <div class="drawer-section"><div class="drawer-section-title">日志</div><div class="log-block">${esc(run.logs)}</div></div>
      <div class="drawer-section"><div class="drawer-section-title">制品</div><div class="release-note">镜像 harbor/${esc(appById(run.appId)?.name || 'app')}:sha-${esc(run.commit)}<br>SBOM · cosign signature · test report</div></div>
    `;
    openPanel({ title: `流水线 ${run.id}`, sub: `${appById(run.appId)?.name || ''} · ${run.branch}`, body, footer: `<button class="btn btn-outline" type="button" data-action="close-overlay">关闭</button><button class="btn btn-primary" type="button" data-action="rerun-pipeline" data-id="${run.id}">${icon('rotate', 14)} 重跑</button>`, wide: true });
  }

  function openAppDrawer(id) {
    const app = appById(id);
    if (!app) return;
    const env = app.envs[state.env];
    if (!env) return;
    const total = parseInt(env.pods.split('/')[0], 10);
    const pods = Array.from({ length: total }).map((_, index) => ({
      name: `${app.name}-${['7d9f', '2k4m', '9x1p', '5b2c'][index % 4]}-${['a1', 'b2', 'c3', 'd4'][index % 4]}`,
      status: env.status === '健康' ? 'Running' : index === total - 1 ? 'CrashLoopBackOff' : 'Running',
      restarts: env.status === '健康' ? 0 : index === total - 1 ? 3 : 0,
      age: ['2h', '5h', '1d'][index % 3]
    }));
    const body = `
      <div class="drawer-section"><div class="flex" style="flex-wrap:wrap;">${pill(env.status)}<span class="tag">${esc(state.env)}</span><span class="tag">${esc(env.version)}</span></div>
        <div class="meta-grid" style="margin-top:12px;">
          <div class="meta-item"><div class="meta-label">命名空间</div><div class="meta-value">${esc(env.namespace)}</div></div>
          <div class="meta-item"><div class="meta-label">镜像 digest</div><div class="meta-value" style="font-family:var(--mono);font-size:10px;">${esc(env.digest)}</div></div>
          <div class="meta-item" style="grid-column:1/-1;"><div class="meta-label">统一域名</div><div class="meta-value" style="font-size:10.5px;">${esc(env.url)}</div></div>
          <div class="meta-item"><div class="meta-label">最近部署</div><div class="meta-value">${esc(env.lastDeploy)}</div></div>
          <div class="meta-item"><div class="meta-label">资源</div><div class="meta-value">CPU ${env.cpu}% · 内存 ${env.mem}%</div></div>
        </div>
      </div>
      <div class="drawer-section"><div class="drawer-section-title">Pods · ${env.pods}</div><div class="table-wrap"><table><thead><tr><th>Pod</th><th>状态</th><th>重启</th><th>Age</th></tr></thead><tbody>${pods.map((pod) => `<tr><td><span class="release-digest">${esc(pod.name)}</span></td><td>${pill(pod.status === 'Running' ? '健康' : '失败')}</td><td>${pod.restarts}</td><td>${esc(pod.age)}</td></tr>`).join('')}</tbody></table></div></div>
      <div class="drawer-section"><div class="drawer-section-title">最近部署</div><div class="table-wrap"><table><thead><tr><th>版本</th><th>Digest</th><th>状态</th><th>时间</th></tr></thead><tbody>
        <tr><td><b>${esc(env.version)}</b></td><td><span class="release-digest">${esc(env.digest)}</span></td><td>${pill('成功')}</td><td>${esc(env.lastDeploy)}</td></tr>
        <tr><td>v2.3.9</td><td><span class="release-digest">sha256:5b8f0a2c7d19</span></td><td>${pill('成功')}</td><td>2026-10-18 16:20</td></tr>
      </tbody></table></div></div>
    `;
    openPanel({ title: app.name, sub: `${currentProject().name} · ${state.env} · ${env.namespace}`, body, footer: `<button class="btn btn-outline" type="button" data-action="close-overlay">关闭</button><button class="btn btn-danger" type="button" data-action="app-rollback" data-id="${app.id}">${icon('rotate', 14)} 回滚</button>`, wide: true });
  }

  function openAlertDrawer(id) {
    const alert = ALERTS.find((item) => item.id === id);
    if (!alert) return;
    const body = `
      <div class="drawer-section"><div class="flex" style="flex-wrap:wrap;">${pill(alert.severity)}${pill(alert.status)}<span class="tag">${esc(alert.source)}</span><span class="tag">${esc(alert.time)}</span></div>
        <p style="margin-top:10px;font-size:12.5px;line-height:1.7;color:#475569;">${esc(alert.desc)}</p>
      </div>
      <div class="drawer-section"><div class="drawer-section-title">Runbook</div><div class="timeline">${alert.runbook.map((step, index) => `<div class="timeline-item ${alert.status === '已处理' ? 'done' : index === 0 ? 'active' : ''}"><span class="timeline-dot"></span><div class="timeline-content"><b>${esc(step)}</b><small>${index === 0 && alert.status !== '已处理' ? '建议先执行' : '按需执行'}</small></div></div>`).join('')}</div></div>
    `;
    openPanel({ title: alert.title, sub: `${alert.id} · ${projectById(alert.projectId)?.name || ''}`, body, footer: `<button class="btn btn-outline" type="button" data-action="close-overlay">关闭</button><button class="btn btn-outline" type="button" data-action="create-ops-task" data-id="${alert.id}">${icon('bot', 14)} 生成诊断任务</button><button class="btn btn-primary" type="button" data-action="resolve-alert" data-id="${alert.id}">${icon('check', 14)} 标记已处理</button>` });
  }

  function openCapabilityDrawer(id) {
    const cap = capabilityById(id);
    if (!cap) return;
    const body = `
      <div class="drawer-section"><div class="flex" style="flex-wrap:wrap;">${pill(cap.rest ? 'REST 已开' : 'REST 已关')}${pill(cap.mcp ? 'MCP 已开' : 'MCP 已关')}${riskPill(cap.risk)}<span class="tag">${esc(cap.version)}</span></div>
        <p style="margin-top:10px;font-size:12.5px;line-height:1.7;color:#475569;">${esc(cap.description)}</p>
      </div>
      <div class="drawer-section"><div class="meta-grid">
        <div class="meta-item"><div class="meta-label">工具名</div><div class="meta-value" style="font-family:var(--mono);font-size:10.5px;">${esc(cap.tool)}</div></div>
        <div class="meta-item"><div class="meta-label">所属服务</div><div class="meta-value">${esc(cap.owner)}</div></div>
        <div class="meta-item"><div class="meta-label">REST 契约</div><div class="meta-value" style="font-family:var(--mono);font-size:10.5px;">${esc(cap.method)} ${esc(cap.path)}</div></div>
        <div class="meta-item"><div class="meta-label">Scope</div><div class="meta-value">${esc(cap.scopes.join(', '))}</div></div>
        <div class="meta-item"><div class="meta-label">限流</div><div class="meta-value">${esc(cap.rateLimit)}</div></div>
        <div class="meta-item"><div class="meta-label">24h 调用</div><div class="meta-value">${esc(cap.calls)} · p95 ${esc(cap.p95)}</div></div>
      </div></div>
      <div class="drawer-section"><div class="drawer-section-title">请求 Schema</div><div class="schema-block"><div class="schema-block-head">${icon('code', 13)} JSON Schema · ${esc(cap.tool)}</div><pre>${esc(JSON.stringify(cap.schema, null, 2))}</pre></div></div>
      <div class="drawer-section"><div class="drawer-section-title">MCP 测试</div><div class="release-note">${cap.mcp ? '该能力已启用 MCP，可前往 MCP 测试页进行 dry-run。' : '该能力当前未启用 MCP；REST 契约不受影响。'}</div></div>
    `;
    const footer = `<button class="btn btn-outline" type="button" data-action="close-overlay">关闭</button><button class="btn btn-outline" type="button" data-action="copy-schema" data-id="${cap.id}">复制 Schema</button>${cap.mcp ? `<button class="btn btn-primary" type="button" data-action="goto-mcp-test" data-id="${cap.id}">${icon('play', 14)} MCP 测试</button>` : ''}`;
    openPanel({ title: cap.name, sub: `${cap.id} · ${cap.tool}`, body, footer, wide: true });
  }

  function openUserDrawer(id) {
    const user = USERS.find((item) => item.id === id);
    if (!user) return;
    const body = `
      <div class="drawer-section"><div class="flex">${avatar(user.name, user.color)}<div><div class="drawer-title" style="font-size:15px;">${esc(user.name)}</div><div class="drawer-sub">@${esc(user.username)} · ${esc(user.email)}</div></div><span style="margin-left:auto;">${pill(user.status)}</span></div></div>
      <div class="drawer-section"><div class="meta-grid">
        <div class="meta-item"><div class="meta-label">角色</div><div class="meta-value">${esc(user.role)}</div></div>
        <div class="meta-item"><div class="meta-label">项目</div><div class="meta-value">${esc(user.projects.join('、'))}</div></div>
        <div class="meta-item"><div class="meta-label">MFA</div><div class="meta-value">${esc(user.mfa)}</div></div>
        <div class="meta-item"><div class="meta-label">最近登录</div><div class="meta-value">${esc(user.lastLogin)}</div></div>
      </div></div>
      <div class="drawer-section"><div class="drawer-section-title">最近活动</div><div class="activity-list">
        <div class="activity-item"><span class="activity-icon">${icon('check', 12)}</span><div class="activity-copy"><b>审批了发布 v2.4</b><small>10:21 · 订单中心</small></div></div>
        <div class="activity-item"><span class="activity-icon">${icon('layers', 12)}</span><div class="activity-copy"><b>更新了需求 RQ-101</b><small>09:48 · 订单中心</small></div></div>
      </div></div>
    `;
    openPanel({ title: user.name, sub: `用户详情 · ${user.username}`, body, footer: `<button class="btn btn-outline" type="button" data-action="close-overlay">关闭</button><button class="btn btn-primary" type="button" data-action="toast" data-msg="角色编辑为演示占位">编辑角色</button>` });
  }

  function openAuditDrawer(id) {
    const item = AUDIT.find((auditItem) => auditItem.id === id);
    if (!item) return;
    openPanel({
      title: item.action, sub: `${item.id} · ${item.time} · ${item.actor}`,
      body: `<div class="drawer-section"><div class="meta-grid">
        <div class="meta-item"><div class="meta-label">资源</div><div class="meta-value">${esc(item.resource)}</div></div>
        <div class="meta-item"><div class="meta-label">结果</div><div class="meta-value">${pill(item.result)}</div></div>
        <div class="meta-item"><div class="meta-label">IP</div><div class="meta-value">${esc(item.ip)}</div></div>
        <div class="meta-item"><div class="meta-label">Trace</div><div class="meta-value" style="font-family:var(--mono);font-size:10.5px;">${esc(item.trace)}</div></div>
      </div></div><div class="drawer-section"><div class="drawer-section-title">变更前后</div><div class="json-block">${esc(JSON.stringify(item.detail, null, 2))}</div></div>`,
      footer: `<button class="btn btn-primary" type="button" data-action="close-overlay">关闭</button>`
    });
  }

  function openConfigDrawer() {
    const rows = state.navConfig.map((item, index) => `<div class="config-row">
      <span class="drag">⋮⋮</span>
      <span class="config-label">${esc(item.label)}</span>
      <label class="switch" title="显示/隐藏"><input type="checkbox" ${item.visible ? 'checked' : ''} data-action="toggle-nav" data-id="${item.id}"><span class="switch-track"><span class="switch-thumb"></span></span></label>
      <button class="config-order" type="button" data-action="move-nav" data-id="${item.id}" data-dir="-1" ${index === 0 ? 'disabled' : ''}>↑</button>
      <button class="config-order" type="button" data-action="move-nav" data-id="${item.id}" data-dir="1" ${index === state.navConfig.length - 1 ? 'disabled' : ''}>↓</button>
    </div>`).join('');
    openPanel({
      title: '平台设置', sub: '控制顶部导航的显隐与顺序；隐藏模块不会删除路由', variant: 'modal',
      body: `<div class="config-list">${rows}</div><p class="hint">当前演示包含 5 个入口，其中工作台、应用中心、原始需求为占位模块。</p>`,
      footer: `<button class="btn btn-outline" type="button" data-action="reset-nav">恢复默认</button><button class="btn btn-primary" type="button" data-action="save-nav">保存配置</button>`
    });
  }

  function openProjectSwitcher() {
    openPanel({
      title: '切换项目', sub: '选择要进入的项目空间', variant: 'modal',
      body: `<div class="project-list">${PROJECTS.map((project) => `<button class="project-option ${project.id === state.projectId ? 'active' : ''}" type="button" data-action="switch-project" data-id="${project.id}">
        <span class="project-option-avatar" style="background:${project.color}1a;color:${project.color}">${esc(project.code.slice(0, 2))}</span>
        <span class="project-option-meta"><b>${esc(project.name)}</b><small>${esc(project.code)} · ${esc(project.owner)} · ${esc(project.status)}</small></span>
        ${pill(project.status)}
      </button>`).join('')}</div>`,
      footer: `<button class="btn btn-outline" type="button" data-action="close-overlay">关闭</button>`
    });
  }

  function openProjectForm() {
    const ownerOptions = USERS
      .filter((user) => ['项目 Owner', '平台管理员'].includes(user.role))
      .map((user) => `<option value="${esc(user.name)}" ${user.name === '张明' ? 'selected' : ''}>${esc(user.name)} · ${esc(user.role)}</option>`)
      .join('');
    openPanel({
      title: '新建项目', sub: '创建项目空间、首个迭代与项目成员', variant: 'modal',
      body: `<form id="project-form" data-form="new-project">
        <div class="field-row">
          <div class="field"><label for="project-name">项目名称</label><input id="project-name" name="name" class="input" required maxlength="40" placeholder="例如：会员中心"></div>
          <div class="field"><label for="project-code">项目标识</label><input id="project-code" name="code" class="input" required maxlength="16" placeholder="例如：MEMBER" autocomplete="off" spellcheck="false"></div>
        </div>
        <div class="field"><label for="project-owner">负责人</label><select id="project-owner" name="owner" class="select" required>${ownerOptions}</select></div>
        <div class="field"><label for="project-desc">项目描述</label><textarea id="project-desc" name="desc" class="textarea" placeholder="描述项目目标与交付范围"></textarea></div>
        <div class="field"><label for="project-iteration">首个迭代</label><input id="project-iteration" name="iterationName" class="input" value="v1.0 首个迭代" required maxlength="40"></div>
        <div class="form-hint">项目标识用于仓库、镜像与域名命名，创建后不可修改。项目默认进入规划中，负责人自动加入项目成员。</div>
        <div class="btn-row" style="justify-content:flex-end;margin-top:18px;"><button class="btn btn-outline" type="button" data-action="close-overlay">取消</button><button class="btn btn-primary" type="submit">创建项目</button></div>
      </form>`
    });
  }

  function openRequirementForm() {
    const projectOptions = PROJECTS.map((project) => `<option value="${project.id}" ${project.id === state.projectId ? 'selected' : ''}>${esc(project.name)}</option>`).join('');
    const iterationOptions = ITERATIONS.map((iteration) => `<option value="${iteration.id}" ${iteration.id === state.iterationId ? 'selected' : ''}>${esc(iteration.name)} · ${esc(projectById(iteration.projectId)?.name || '')}</option>`).join('');
    openPanel({
      title: '新建需求', sub: '创建后会进入需求分析与人工确认', variant: 'modal',
      body: `<form id="req-form" data-form="new-requirement">
        <div class="field"><label for="req-title">需求标题</label><input id="req-title" name="title" class="input" required maxlength="120" placeholder="例如：订单履约超时预警"></div>
        <div class="field-row">
          <div class="field"><label for="req-project">项目</label><select id="req-project" name="projectId" class="select" required>${projectOptions}</select></div>
          <div class="field"><label for="req-iteration">迭代</label><select id="req-iteration" name="iterationId" class="select" required>${iterationOptions}</select></div>
        </div>
        <div class="field"><label for="req-priority">优先级</label><select id="req-priority" name="priority" class="select"><option>P0</option><option>P1</option><option selected>P2</option><option>P3</option></select></div>
        <div class="field"><label for="req-desc">需求描述</label><textarea id="req-desc" name="desc" class="textarea" placeholder="描述背景、目标与范围"></textarea></div>
        <div class="field"><label for="req-acceptance">验收标准</label><textarea id="req-acceptance" name="acceptance" class="textarea" placeholder="可验证的验收条件" required></textarea></div>
        <div class="btn-row" style="justify-content:flex-end;margin-top:18px;"><button class="btn btn-outline" type="button" data-action="close-overlay">取消</button><button class="btn btn-primary" type="submit">创建需求</button></div>
      </form>`
    });
  }

  function openMemberForm() {
    const project = currentProject();
    const memberIds = new Set(project.members.map((member) => member.userId));
    const eligible = USERS.filter((user) => user.status === '活跃' && user.role !== '平台管理员' && !memberIds.has(user.id));
    if (!eligible.length) {
      openPanel({
        title: '添加项目成员', sub: `${project.name} · 平台虚拟账号`, variant: 'modal',
        body: `<div class="empty-table">所有可用平台用户都已加入该项目。</div>`,
        footer: `<button class="btn btn-primary" type="button" data-action="close-overlay">关闭</button>`
      });
      return;
    }
    openPanel({
      title: '添加项目成员', sub: `${project.name} · 从平台虚拟账号中选择`, variant: 'modal',
      body: `<form id="member-form" data-form="add-member">
        <div class="field"><label for="member-user">平台用户</label><select id="member-user" name="userId" class="select" required>${eligible.map((user) => `<option value="${user.id}">${esc(user.name)} · ${esc(user.role)} · @${esc(user.username)}</option>`).join('')}</select></div>
        <div class="field"><label for="member-role">项目角色</label><select id="member-role" name="role" class="select" required>${PROJECT_ROLES.map((role) => `<option value="${role}" ${role === 'Developer' ? 'selected' : ''}>${role}</option>`).join('')}</select></div>
        <div class="form-hint">成员加入后立即获得项目权限；Owner 只能由项目负责人担任，不在添加时授予。</div>
        <div class="btn-row" style="justify-content:flex-end;margin-top:18px;"><button class="btn btn-outline" type="button" data-action="close-overlay">取消</button><button class="btn btn-primary" type="submit">添加成员</button></div>
      </form>`
    });
  }

  function openRemoveMember(userId) {
    const project = currentProject();
    const member = project.members.find((item) => item.userId === userId);
    const user = userById(userId);
    if (!member || !user || member.role === 'Owner') return;
    openPanel({
      title: '移除项目成员', sub: `${user.name} · ${project.name}`, variant: 'modal',
      body: `<div class="release-note"><b>移除后 ${esc(user.name)} 将失去 ${esc(project.name)} 的项目角色与访问权限。</b><br>历史审计记录会保留；该用户仍可被重新添加。确认继续？</div>`,
      footer: `<button class="btn btn-outline" type="button" data-action="close-overlay">取消</button><button class="btn btn-danger" type="button" data-action="confirm-remove-member" data-id="${user.id}">确认移除</button>`
    });
  }

  function openReleaseForm() {
    const iteration = currentIteration();
    const candidates = iterationRequirements(iteration.id).filter((req) => !req.deferredTo && !requirementRelease(req.id));
    const checklist = candidates.length
      ? candidates.map((req) => `<label class="release-req-option">
          <input type="checkbox" name="requirements" value="${req.id}">
          <span class="release-req-main"><b>${esc(req.id)}</b><span>${esc(req.title)}</span></span>
          <span class="release-req-meta">${pill(req.status)}<span>${esc(req.owner)}</span></span>
        </label>`).join('')
      : '<div class="empty-table">当前迭代没有未关联的未延期需求</div>';
    openPanel({
      title: '新建发布', sub: `${iteration.name} · 发布排期`, variant: 'modal',
      body: `<form id="release-form" data-form="new-release">
        <div class="field"><label for="release-name">发布名称</label><input id="release-name" name="name" class="input" maxlength="60" required placeholder="例如：v2.4 正式发布"></div>
        <div class="field-row">
          <div class="field"><label for="release-start">开始时间</label><input id="release-start" name="startAt" class="input" type="datetime-local" value="2026-10-24T20:00" required></div>
          <div class="field"><label for="release-end">结束时间</label><input id="release-end" name="endAt" class="input" type="datetime-local" value="2026-10-24T23:00" required></div>
        </div>
        <div class="field"><label>关联需求</label><div class="release-req-options">${checklist}</div><div class="form-hint">仅显示当前迭代未延期且未关联其他发布的需求；至少选择 1 个。</div></div>
        <div class="form-hint">发布状态按时间段自动推导；发布管理仅用于排期。</div>
        <div class="btn-row" style="justify-content:flex-end;margin-top:18px;"><button class="btn btn-outline" type="button" data-action="close-overlay">取消</button><button class="btn btn-primary" type="submit" ${candidates.length ? '' : 'disabled'}>创建发布</button></div>
      </form>`
    });
  }

  function openReleaseDrawer(id) {
    const release = releaseById(id);
    if (!release) return;
    const iteration = iterationById(release.iterationId);
    const reqs = (release.requirementIds || []).map((reqId) => requirementById(reqId)).filter(Boolean);
    const body = `<div class="drawer-section">
      <div class="meta-grid">
        <div class="meta-item"><div class="meta-label">状态</div><div class="meta-value">${pill(releaseStatus(release))}</div></div>
        <div class="meta-item"><div class="meta-label">时间段</div><div class="meta-value">${esc(releaseWindow(release))}</div></div>
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
    <p class="hint">发布管理仅用于排期。</p>`;
    openPanel({ title: release.name, sub: `${release.id} · ${iteration?.name || ''} · 发布排期`, body, extraWide: true });
  }

  function openTaskForm() {
    const projectOptions = PROJECTS.map((project) => `<option value="${project.id}" ${project.id === state.projectId ? 'selected' : ''}>${esc(project.name)}</option>`).join('');
    openPanel({
      title: '启动 Agent 任务', sub: '任务会进入队列，由 Agent worker 执行', variant: 'modal',
      body: `<form id="task-form" data-form="new-task">
        <div class="field-row">
          <div class="field"><label for="task-agent">Agent 类型</label><select id="task-agent" name="agent" class="select" required><option>需求分析</option><option>方案设计</option><option>测试生成</option><option>Coding</option><option>运维诊断</option></select></div>
          <div class="field"><label for="task-project">项目</label><select id="task-project" name="projectId" class="select" required>${projectOptions}</select></div>
        </div>
        <div class="field"><label for="task-prompt">任务说明</label><textarea id="task-prompt" name="prompt" class="textarea" required placeholder="描述要 Agent 完成的工作"></textarea></div>
        <div class="field"><label for="task-req">关联需求（可选）</label><select id="task-req" name="requirementId" class="select"><option value="">不关联</option>${REQUIREMENTS.map((req) => `<option value="${req.id}">${esc(req.id)} · ${esc(req.title)}</option>`).join('')}</select></div>
        <div class="form-hint">任务令牌会绑定 project、task、agent 角色与能力白名单；沙箱不持有 prod 凭据。</div>
        <div class="btn-row" style="justify-content:flex-end;margin-top:18px;"><button class="btn btn-outline" type="button" data-action="close-overlay">取消</button><button class="btn btn-primary" type="submit">创建任务</button></div>
      </form>`
    });
  }

  function openPipelineForm() {
    const apps = projectApps(state.projectId);
    openPanel({
      title: '运行流水线', sub: '构建、测试、扫描、签名并部署 test', variant: 'modal',
      body: `<form id="pipeline-form" data-form="run-pipeline">
        <div class="field"><label for="pipeline-app">应用</label><select id="pipeline-app" name="appId" class="select" required>${apps.map((app) => `<option value="${app.id}">${esc(app.name)}</option>`).join('')}</select></div>
        <div class="field"><label for="pipeline-branch">分支</label><input id="pipeline-branch" name="branch" class="input" required value="main" placeholder="例如：feat/order-timeout"></div>
        <div class="form-hint">流水线会在平台集群的专用构建节点池运行，默认拒绝出站；构建 Job 不持有 prod 部署凭据。</div>
        <div class="btn-row" style="justify-content:flex-end;margin-top:18px;"><button class="btn btn-outline" type="button" data-action="close-overlay">取消</button><button class="btn btn-primary" type="submit">开始运行</button></div>
      </form>`
    });
  }

  function openNewUserForm() {
    openPanel({
      title: '新增用户', sub: '平台自建虚拟账号 · 一人一号', variant: 'modal',
      body: `<form id="user-form" data-form="new-user">
        <div class="field-row"><div class="field"><label for="user-name">姓名</label><input id="user-name" name="name" class="input" required></div><div class="field"><label for="user-username">用户名</label><input id="user-username" name="username" class="input" required></div></div>
        <div class="field"><label for="user-role">角色</label><select id="user-role" name="role" class="select"><option>Developer</option><option>项目 Maintainer</option><option>项目 Owner</option><option>审计员</option><option>平台管理员</option></select></div>
        <div class="field"><label for="user-project">项目</label><select id="user-project" name="project" class="select">${PROJECTS.map((project) => `<option>${esc(project.name)}</option>`).join('')}<option>全部项目</option></select></div>
        <div class="form-hint">管理员、平台运维、prod 审批人强制 MFA。</div>
        <div class="btn-row" style="justify-content:flex-end;margin-top:18px;"><button class="btn btn-outline" type="button" data-action="close-overlay">取消</button><button class="btn btn-primary" type="submit">创建用户</button></div>
      </form>`
    });
  }

  function openQuotaForm(projectId) {
    const project = projectById(projectId);
    openPanel({
      title: '调整配额', sub: `${project?.name || ''} · 资源配额`, variant: 'modal',
      body: `<form id="quota-form" data-form="quota">
        <div class="field-row"><div class="field"><label>CPU 上限</label><input class="input" name="cpu" value="64 核"></div><div class="field"><label>内存上限</label><input class="input" name="mem" value="128 Gi"></div></div>
        <div class="field-row"><div class="field"><label>Pod 上限</label><input class="input" name="pods" value="60"></div><div class="field"><label>存储上限</label><input class="input" name="storage" value="500 Gi"></div></div>
        <div class="form-hint">配额变更会影响项目内所有应用与 Agent 任务，需平台管理员审批。</div>
        <div class="btn-row" style="justify-content:flex-end;margin-top:18px;"><button class="btn btn-outline" type="button" data-action="close-overlay">取消</button><button class="btn btn-primary" type="submit">保存配额</button></div>
      </form>`
    });
  }

  /* ---------------- events ---------------- */
  function bindEvents() {
    document.addEventListener('click', (event) => {
      if (event.target.closest('.switch')) return;
      const target = event.target.closest('[data-action]');
      if (target) {
        const action = target.dataset.action;
        const id = target.dataset.id;
        if (action === 'nav') {
          navigate(target.dataset.route);
          closeDropdowns();
          return;
        }
        if (action === 'close-overlay') { closeOverlay(); return; }
        if (action === 'open-nav-config') { closeDropdowns(); openConfigDrawer(); return; }
        if (action === 'save-nav') { closeOverlay(); toast('入口配置已保存（演示）。', 'success'); return; }
        if (action === 'reset-nav') { state.navConfig = DEFAULT_NAV.map((item) => ({ ...item })); renderTopbar(); openConfigDrawer(); toast('已恢复默认入口。', 'info'); return; }
        if (action === 'move-nav') { moveNav(id, Number(target.dataset.dir)); return; }
        if (action === 'notifications') { renderNotifications(); $('#notif-dropdown').classList.toggle('open'); $('#avatar-menu').classList.remove('open'); return; }
        if (action === 'avatar') { renderAvatarMenu(); $('#avatar-menu').classList.toggle('open'); $('#notif-dropdown').classList.remove('open'); return; }
        if (action === 'notif-read-all') { state.notificationsRead = true; renderNotifications(); renderTopbar(); toast('通知已全部标为已读。', 'info'); return; }
        if (action === 'notif-item') { state.notificationsRead = true; renderNotifications(); renderTopbar(); navigate(target.dataset.route); return; }
        if (action === 'search-result') { handleSearchResult(target.dataset.type, target.dataset.id, target.dataset.route); return; }
        if (action === 'toast') { toast(target.dataset.msg || '演示操作', 'info'); return; }
        if (action === 'profile') { openProfileDrawer(); return; }
        if (action === 'logout') { toast('演示环境：未执行退出登录。', 'info'); closeDropdowns(); return; }
        if (action === 'project-switch') { openProjectSwitcher(); return; }
        if (action === 'switch-project') { switchProject(id); return; }
        if (action === 'open-project') { openProject(id); return; }
        if (action === 'new-project') { openProjectForm(); return; }
        if (action === 'release-project') { openReleaseProject(id); return; }
        if (action === 'confirm-release-project') { confirmReleaseProject(id); return; }
        if (action === 'add-member') { openMemberForm(); return; }
        if (action === 'members-page') { state.membersPage = Number(target.dataset.page) || 1; renderMain(); return; }
        if (action === 'remove-member') { openRemoveMember(id); return; }
        if (action === 'confirm-remove-member') { confirmRemoveMember(id); return; }
        if (action === 'new-requirement') { openRequirementForm(); return; }
        if (action === 'new-task') { openTaskForm(); return; }
        if (action === 'new-release') { openReleaseForm(); return; }
        if (action === 'open-release') { openReleaseDrawer(id); return; }
        if (action === 'req-tab') { state.reqTab = target.dataset.tab; if (taskIdFromRoute()) { navigate('#/requirements'); return; } renderMain(); return; }
        if (action === 'req-page') { state.reqPage = Number(target.dataset.page) || 1; renderMain(); return; }
        if (action === 'reset-req-filters') { resetRequirementFilters(); renderMain(); return; }
        if (action === 'open-req') { openRequirementDrawer(id); return; }
        if (action === 'save-req-edit') { saveRequirementEdit(id); return; }
        if (action === 'add-req-comment') { addRequirementComment(id); return; }
        if (action === 'req-detail-tab') { switchRequirementDetailTab(target.dataset.tab); return; }
        if (action === 'defer-req') { openDeferForm(id); return; }
        if (action === 'task-filter') { state.taskFilter = target.dataset.filter; renderMain(); return; }
        if (action === 'open-repo') { openRepoPage(id); return; }
        if (action === 'repo-tab') { state.repoTab = target.dataset.tab; renderMain(); return; }
        if (action === 'repo-file') { state.repoFile = target.dataset.path; state.repoTab = 'code'; renderMain(); return; }
        if (action === 'open-mr-page') { openMrPage(target.dataset.repo, id); return; }
        if (action === 'back-repo-list') { navigate('#/code'); return; }
        if (action === 'back-repo-mrs') { state.repoTab = 'mrs'; const info = repoRouteInfo(); if (info) navigate(`#/code/${encodeURIComponent(info.repoId)}`); return; }
        if (action === 'add-mr-comment') { addMrComment(id); return; }
        if (action === 'open-task') { openTaskDrawer(id); return; }
        if (action === 'open-task-page') { openTaskPage(id, target.dataset.from || 'board'); return; }
        if (action === 'back-task') { backFromTask(); return; }
        if (action === 'interrupt-task-page') { interruptTaskPage(id); return; }
        if (action === 'rerun-task-page') { rerunTaskPage(id); return; }
        if (action === 'send-task-message') { sendTaskMessage(); return; }
        if (action === 'task-jump-latest') { state.taskAutoScroll = true; scrollTaskToLatest(); const jump = $('#task-jump-latest'); if (jump) jump.hidden = true; return; }
        if (action === 'task-file-diff') { openTaskFileDiff(id, target.dataset.path); return; }
        if (action === 'approve-task') { approveTask(id); return; }
        if (action === 'reject-task') { rejectTask(id); return; }
        if (action === 'cancel-task') { openCancelTask(id); return; }
        if (action === 'confirm-cancel-task') { confirmCancelTask(id); return; }
        if (action === 'retry-task') { retryTask(id); return; }
        if (action === 'approve-mr') { approveMr(id); return; }
        if (action === 'knowledge-tab') {
          state.knowledgeTab = target.dataset.tab;
          state.knowledgeSearch = '';
          state.knowledgeType = 'all';
          state.knowledgeReq = 'all';
          state.knowledgeSource = 'all';
          renderMain();
          return;
        }
        if (action === 'rebuild-index') { rebuildIndex(); return; }
        if (action === 'pipeline-filter') { state.pipelineFilter = target.dataset.filter; renderMain(); return; }
        if (action === 'open-run') { openPipelineDrawer(id); return; }
        if (action === 'rerun-pipeline') { rerunPipeline(id); return; }
        if (action === 'run-pipeline') { openPipelineForm(); return; }
        if (action === 'env-switch') { state.env = target.dataset.env; renderMain(); return; }
        if (action === 'open-app') { openAppDrawer(id); return; }
        if (action === 'open-url') { const app = appById(id); if (app) toast(app.envs[state.env]?.url || '演示地址', 'info', '统一域名'); return; }
        if (action === 'app-rollback') { toast('演示：已回滚到上一版本并写入审计。', 'success', '回滚完成'); closeOverlay(); return; }
        if (action === 'time-range') { state.timeRange = target.dataset.range; renderMain(); return; }
        if (action === 'open-alert') { openAlertDrawer(id); return; }
        if (action === 'resolve-alert') { resolveAlert(id); return; }
        if (action === 'create-ops-task') { createOpsTask(id); return; }
        if (action === 'refresh-policy') { state.policyVersion += 0; toast(`策略已是最新 v${state.policyVersion}。`, 'info'); return; }
        if (action === 'cap-risk') { state.capRisk = target.dataset.risk; renderMain(); return; }
        if (action === 'open-cap') { openCapabilityDrawer(id); return; }
        if (action === 'goto-mcp-test') { state.mcpTool = id; closeOverlay(); navigate('#/mcp-test'); return; }
        if (action === 'copy-schema') { copySchema(id); return; }
        if (action === 'new-user') { openNewUserForm(); return; }
        if (action === 'toggle-user') { toggleUser(id); return; }
        if (action === 'open-user') { openUserDrawer(id); return; }
        if (action === 'adjust-quota') { openQuotaForm(id); return; }
        if (action === 'export-audit') { toast('已导出审计日志（演示，CSV）。', 'success'); return; }
        if (action === 'open-audit') { openAuditDrawer(id); return; }
        if (action === 'platform-rollback') { toast('演示：平台版本回滚到 v1.8.1。', 'success', '平台回滚'); return; }
      }
    });

    document.addEventListener('change', (event) => {
      const target = event.target.closest('[data-action]');
      if (!target) return;
      const action = target.dataset.action;
      const id = target.dataset.id;
      if (action === 'iteration-switch') { state.iterationId = target.value; resetRequirementFilters(); renderMain(); return; }
      if (action === 'req-status-filter') { state.reqStatusFilter = target.value; state.reqPage = 1; renderMain(); return; }
      if (action === 'req-priority-filter') { state.reqPriorityFilter = target.value; state.reqPage = 1; renderMain(); return; }
      if (action === 'req-owner-filter') { state.reqOwnerFilter = target.value; state.reqPage = 1; renderMain(); return; }
      if (action === 'req-app-filter') { state.reqAppFilter = target.value; state.reqPage = 1; renderMain(); return; }
      if (action === 'req-release-filter') { state.reqReleaseFilter = target.value; state.reqPage = 1; renderMain(); return; }
      if (action === 'req-release-select') { setRequirementRelease(id, target.value); return; }
      if (action === 'doc-type-filter') { state.knowledgeType = target.value; renderMain(); return; }
      if (action === 'doc-req-filter') { state.knowledgeReq = target.value; renderMain(); return; }
      if (action === 'doc-source-filter') { state.knowledgeSource = target.value; renderMain(); return; }
      if (action === 'repo-branch') { state.repoBranch = target.value; renderMain(); toast(`已切换到分支 ${target.value}（演示）。`, 'info'); return; }
      if (action === 'member-role') { changeMemberRole(id, target.value); return; }
      if (action === 'mcp-tool-change') { state.mcpTool = target.value; const form = target.closest('form'); if (form) { const args = form.querySelector('#mcp-args'); const cap = capabilityById(state.mcpTool); if (args && cap) args.value = JSON.stringify(cap.example, null, 2); } renderMain(); return; }
      if (action === 'obs-project') { state.obsProject = target.value; renderMain(); return; }
      if (action === 'toggle-nav') { const item = state.navConfig.find((nav) => nav.id === id); if (item) item.visible = target.checked; renderTopbar(); openConfigDrawer(); return; }
      if (action === 'toggle-rest' || action === 'toggle-mcp') { toggleCapability(id, action === 'toggle-rest' ? 'rest' : 'mcp'); return; }
      if (action === 'toggle-flag') { const flag = FLAGS.find((item) => item.id === id); if (flag) { flag.enabled = target.checked; audit('修改功能开关', flag.key, '成功', { before: { enabled: !target.checked }, after: { enabled: target.checked } }); toast(`${flag.name} 已${target.checked ? '开启' : '关闭'}。`, 'info'); renderMain(); } return; }
    });

    document.addEventListener('input', (event) => {
      const id = event.target.id;
      if (id === 'global-search') { renderSearchResults(event.target.value); return; }
      if (id === 'project-code') {
        const pos = event.target.selectionStart;
        event.target.value = event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
        try { event.target.setSelectionRange(pos, pos); } catch (error) { /* noop */ }
        return;
      }
      if (id === 'req-id-filter') { state.reqIdFilter = event.target.value; state.reqPage = 1; rerenderPreserve('req-id-filter'); return; }
      if (id === 'req-title-filter') { state.reqTitleFilter = event.target.value; state.reqPage = 1; rerenderPreserve('req-title-filter'); return; }
      if (id === 'req-updated-filter') { state.reqUpdatedFilter = event.target.value; state.reqPage = 1; rerenderPreserve('req-updated-filter'); return; }
      if (id === 'doc-search') {
        state.knowledgeSearch = event.target.value;
        if (event.isComposing) return;
        rerenderPreserve('doc-search');
        return;
      }
      if (id === 'cap-search') { state.capSearch = event.target.value; rerenderPreserve('cap-search'); return; }
      if (id === 'audit-search') { state.auditSearch = event.target.value; rerenderPreserve('audit-search'); return; }
    });

    document.addEventListener('compositionend', (event) => {
      if (event.target.id !== 'doc-search') return;
      state.knowledgeSearch = event.target.value;
      rerenderPreserve('doc-search');
    });

    document.addEventListener('submit', (event) => {
      const form = event.target.closest('form[data-form]');
      if (!form) return;
      event.preventDefault();
      const type = form.dataset.form;
      if (type === 'new-project') submitProject(form);
      else if (type === 'add-member') submitMember(form);
      else if (type === 'new-requirement') submitRequirement(form);
      else if (type === 'defer-req') submitDefer(form);
      else if (type === 'new-task') submitTask(form);
      else if (type === 'new-release') submitRelease(form);
      else if (type === 'repo-settings') submitRepoSettings(form);
      else if (type === 'run-pipeline') submitPipeline(form);
      else if (type === 'mcp-test') submitMcpTest(form);
      else if (type === 'new-user') submitUser(form);
      else if (type === 'quota') { closeOverlay(); toast('配额已更新（演示）。', 'success'); audit('调整项目配额', form.querySelector('[name="cpu"]')?.value || 'quota', '成功'); renderMain(); }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if ($('#overlay').classList.contains('open')) { closeOverlay(); return; }
        closeDropdowns();
      }
      if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-action][tabindex="0"]')) {
        event.preventDefault();
        event.target.click();
      }
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('.search-wrap')) $('#search-results')?.classList.remove('open');
      if (!event.target.closest('.notif-wrap')) $('#notif-dropdown')?.classList.remove('open');
      if (!event.target.closest('.avatar-wrap')) $('#avatar-menu')?.classList.remove('open');
    });

    window.addEventListener('hashchange', () => {
      state.route = location.hash || '#/projects';
      render();
    });
  }

  function rerenderPreserve(id) {
    const el = document.getElementById(id);
    const start = el ? el.selectionStart : null;
    const end = el ? el.selectionEnd : null;
    renderMain();
    const next = document.getElementById(id);
    if (next) {
      next.focus();
      try { next.setSelectionRange(start, end); } catch (error) { /* noop */ }
    }
  }

  function moveNav(id, direction) {
    const index = state.navConfig.findIndex((item) => item.id === id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= state.navConfig.length) return;
    const [item] = state.navConfig.splice(index, 1);
    state.navConfig.splice(next, 0, item);
    renderTopbar();
    openConfigDrawer();
  }

  function handleSearchResult(type, id, route) {
    const input = $('#global-search');
    if (input) input.value = '';
    $('#search-results').classList.remove('open');
    if (type === 'project') {
      state.projectId = id;
      const project = projectById(id);
      state.iterationId = project?.iterationId || state.iterationId;
      navigate('#/requirements');
    } else if (type === 'requirement') {
      const req = requirementById(id);
      if (req) { state.projectId = req.projectId; state.iterationId = req.iterationId; state.pendingReqId = req.id; }
      navigate('#/requirements');
    } else if (type === 'task') {
      const task = taskById(id);
      if (task) openTaskPage(task.id, 'agents');
    } else if (type === 'capability') {
      state.pendingCapId = id;
      navigate('#/capabilities');
    } else if (type === 'app') {
      const app = appById(id);
      if (app) { state.projectId = app.projectId; state.pendingAppId = app.id; }
      navigate('#/runtime');
    } else {
      navigate(route || '#/projects');
    }
  }

  function switchProject(id) {
    const project = projectById(id);
    if (!project) return;
    state.projectId = id;
    state.iterationId = project.iterationId;
    state.reqTab = 'list';
    resetRequirementFilters();
    resetKnowledgeFilters();
    state.taskFilter = 'all';
    state.pipelineFilter = 'all';
    state.membersPage = 1;
    closeOverlay();
    const meta = ROUTES[state.route];
    toast(`已切换到 ${project.name}。`, 'info');
    if (meta && meta.sidebar === 'project') render();
    else navigate('#/projects');
  }

  function openProject(id) {
    const project = projectById(id);
    if (!project) return;
    state.projectId = id;
    state.iterationId = project.iterationId;
    state.reqTab = 'list';
    resetRequirementFilters();
    resetKnowledgeFilters();
    state.membersPage = 1;
    navigate('#/requirements');
  }

  function openReleaseProject(id) {
    const project = projectById(id);
    if (!project) return;
    const iterationCount = ITERATIONS.filter((item) => item.projectId === id).length;
    const requirementCount = REQUIREMENTS.filter((item) => item.projectId === id).length;
    const repoCount = REPOS.filter((item) => item.projectId === id).length;
    openPanel({
      title: '释放项目', sub: `${esc(project.name)} · ${esc(project.code)}`, variant: 'modal',
      body: `<div class="release-note"><b>释放后项目将被删除，且无法恢复。</b><br>将同时清理 ${iterationCount} 个迭代、${requirementCount} 条需求、${repoCount} 个代码仓，以及关联的 Agent 任务、应用、流水线与发布排期。</div>`,
      footer: `<button class="btn btn-outline" type="button" data-action="close-overlay">取消</button><button class="btn btn-danger" type="button" data-action="confirm-release-project" data-id="${project.id}">确认释放</button>`
    });
  }

  function removeProjectData(project) {
    const projectId = project.id;
    const requirementIds = new Set(REQUIREMENTS.filter((item) => item.projectId === projectId).map((item) => item.id));
    const appIds = new Set(APPS.filter((item) => item.projectId === projectId).map((item) => item.id));
    const repoIds = new Set(REPOS.filter((item) => item.projectId === projectId).map((item) => item.id));
    const iterationIds = new Set(ITERATIONS.filter((item) => item.projectId === projectId).map((item) => item.id));
    const purge = (list, predicate) => {
      for (let index = list.length - 1; index >= 0; index -= 1) {
        if (predicate(list[index])) list.splice(index, 1);
      }
    };
    purge(PROJECTS, (item) => item.id === projectId);
    purge(ITERATIONS, (item) => item.projectId === projectId);
    purge(REQUIREMENTS, (item) => item.projectId === projectId);
    REQUIREMENTS.forEach((item) => { if (iterationIds.has(item.deferredTo)) item.deferredTo = 'backlog'; });
    purge(REQUIREMENT_COMMENTS, (item) => requirementIds.has(item.requirementId));
    purge(REQUIREMENT_HISTORY, (item) => requirementIds.has(item.requirementId));
    purge(TASKS, (item) => item.projectId === projectId);
    purge(RELEASES, (item) => item.projectId === projectId);
    purge(APPS, (item) => item.projectId === projectId);
    purge(PIPELINES, (item) => item.projectId === projectId || appIds.has(item.appId));
    purge(ALERTS, (item) => item.projectId === projectId);
    purge(REPOS, (item) => item.projectId === projectId);
    repoIds.forEach((repoId) => {
      delete REPO_BRANCHES[repoId];
      delete REPO_FILES[repoId];
    });
    purge(DOCS, (item) => item.projectId === projectId);
    purge(MRS, (item) => item.projectId === projectId);
    purge(QUOTAS, (item) => item.projectId === projectId);
    USERS.forEach((user) => removeUserFromProjectList(user, project.name));
  }

  function confirmReleaseProject(id) {
    const project = projectById(id);
    if (!project) return;
    const { name, code } = project;
    const wasCurrent = state.projectId === id;
    removeProjectData(project);
    if (state.obsProject === id) state.obsProject = 'all';
    if (wasCurrent) {
      const next = PROJECTS[0];
      state.projectId = next ? next.id : null;
      state.iterationId = next ? next.iterationId : null;
      resetRequirementFilters();
      resetKnowledgeFilters();
      state.membersPage = 1;
    }
    closeOverlay();
    render();
    audit('释放项目', `project:${code}`, '成功', { before: { name, code } });
    toast(`项目 ${name} 已释放。`, 'success', '项目已释放');
  }

  function approveTask(id) {
    const task = taskById(id);
    if (!task) return;
    const before = task.status;
    clearTaskTimers();
    task.status = '成功';
    task.progress = 100;
    task.updated = nowTime();
    if (task._events) {
      task._events.push({ type: 'system', time: nowTime(), content: '人工确认通过，任务完成。' });
      task._visibleEvents = task._events.length;
    }
    closeOverlay();
    renderMain();
    toast(`${task.id} 已通过审批，MR 可进入合并流程。`, 'success', '任务已通过');
    audit('审批 Agent 任务', task.id, '成功', { before: { status: before }, after: { status: '成功' } });
  }

  function rejectTask(id) {
    const task = taskById(id);
    if (!task) return;
    const before = task.status;
    clearTaskTimers();
    task.status = '待修改';
    task.updated = nowTime();
    if (task._events) {
      task._events.push({ type: 'system', time: nowTime(), content: '人工要求修改，任务退回 Agent 继续处理。' });
      task._visibleEvents = task._events.length;
    }
    closeOverlay();
    renderMain();
    toast(`${task.id} 已退回修改。`, 'warning', '已退回');
    audit('退回 Agent 任务', task.id, '成功', { before: { status: before }, after: { status: '待修改' } });
  }

  function openCancelTask(id) {
    const task = taskById(id);
    if (!task) return;
    openPanel({
      title: '中止任务', sub: `${task.id} · ${task.title}`, variant: 'modal',
      body: `<div class="release-note"><b>中止会停止 Agent worker、销毁沙箱并撤销任务令牌。</b><br>该操作会写审计，是否继续？</div>`,
      footer: `<button class="btn btn-outline" type="button" data-action="close-overlay">取消</button><button class="btn btn-danger" type="button" data-action="confirm-cancel-task" data-id="${task.id}">确认中止</button>`
    });
  }

  function confirmCancelTask(id) {
    const task = taskById(id);
    if (!task) return;
    task.status = '已取消';
    task.updated = nowTime();
    closeOverlay();
    renderMain();
    toast('任务已中止，沙箱与令牌已清理。', 'warning', '任务已取消');
    audit('中止 Agent 任务', task.id, '成功', { after: { status: '已取消' } });
  }

  function retryTask(id) {
    const task = taskById(id);
    if (!task) return;
    task.status = '运行中';
    task.progress = 12;
    task.updated = nowTime();
    closeOverlay();
    renderMain();
    toast('任务已重新入队。', 'info', '重试中');
    setTimeout(() => {
      task.status = '成功';
      task.progress = 100;
      task.summary = '重试完成：权限已补充，诊断结论已生成。';
      task.updated = nowTime();
      if (state.route === '#/agents') renderMain();
    }, 1800);
  }

  function approveMr(id) {
    const mr = MRS.find((item) => item.id === id);
    if (!mr) return;
    mr.status = '已批准';
    const review = mr.checks.find((check) => check.name === 'review');
    if (review) review.status = '成功';
    closeOverlay();
    renderMain();
    toast(`${mr.id} 已批准，等待合并。`, 'success', 'MR 已批准');
    audit('批准合并请求', mr.id, '成功', { after: { status: '已批准' } });
  }

  function rebuildIndex() {
    toast('RAG 增量索引已触发，预计 2 分钟完成。', 'info', '索引中');
    toast('文档索引任务已提交（演示）。', 'info');
  }

  function rerunPipeline(id) {
    const source = PIPELINES.find((item) => item.id === id);
    if (!source) return;
    const run = {
      ...source,
      id: `RUN-${++state.pipelineSeq}`,
      status: '运行中',
      duration: '0m 0s',
      time: nowTime(),
      triggeredBy: '张明',
      stages: source.stages.map((stage, index) => ({ ...stage, status: index === 0 ? '成功' : index === 1 ? '运行中' : '等待', duration: index === 0 ? '6s' : '—' })),
      logs: `[${nowTime()}] pipeline ${'RUN-' + state.pipelineSeq} rerun from ${source.id}\n[${nowTime()}] checkout ${source.commit}\n[${nowTime()}] build running...`
    };
    PIPELINES.unshift(run);
    closeOverlay();
    navigate('#/pipelines');
    renderMain();
    toast('流水线已重跑。', 'info', '重跑中');
    audit('重跑流水线', run.id, '成功', { source: source.id });
    setTimeout(() => {
      run.status = '成功';
      run.duration = '4m 12s';
      run.stages = run.stages.map((stage) => ({ ...stage, status: '成功', duration: stage.duration === '—' ? '18s' : stage.duration }));
      if (state.route === '#/pipelines') renderMain();
    }, 2600);
  }

  function resolveAlert(id) {
    const alert = ALERTS.find((item) => item.id === id);
    if (!alert) return;
    alert.status = '已处理';
    closeOverlay();
    renderMain();
    toast(`${alert.id} 已标记为已处理。`, 'success');
    audit('处理告警', alert.id, '成功', { after: { status: '已处理' } });
  }

  function createOpsTask(alertId) {
    const alert = ALERTS.find((item) => item.id === alertId);
    if (!alert) return;
    const task = {
      id: `T-${++state.taskSeq}`,
      title: `运维诊断 · ${alert.title}`,
      agent: '运维诊断',
      type: '运维诊断',
      projectId: alert.projectId,
      requirementId: null,
      status: '排队中',
      progress: 0,
      started: '—',
      duration: '—',
      tokens: '0',
      steps: 0,
      updated: nowTime(),
      summary: `由告警 ${alert.id} 生成的诊断任务，等待 Agent worker。`,
      tools: [],
      logs: `[${nowTime()}] task created from alert ${alert.id}\n[${nowTime()}] waiting for agent worker`,
      diff: null
    };
    TASKS.unshift(task);
    closeOverlay();
    toast('诊断任务已创建并进入队列。', 'success', '已创建');
    audit('生成运维诊断任务', task.id, '成功', { alert: alert.id });
    state.projectId = alert.projectId;
    navigate('#/agents');
    renderMain();
  }

  function toggleCapability(id, field) {
    const cap = capabilityById(id);
    if (!cap) return;
    cap[field] = !cap[field];
    state.policyVersion += 1;
    audit(field === 'rest' ? '切换能力 REST' : '切换能力 MCP', `cap:${cap.tool}`, '成功', { before: { [field]: !cap[field] }, after: { [field]: cap[field] }, policyVersion: state.policyVersion });
    toast(`${cap.name} · ${field.toUpperCase()} 已${cap[field] ? '开启' : '关闭'}；策略版本 v${state.policyVersion}，30 秒内生效。`, cap[field] ? 'success' : 'warning');
    render();
  }

  function copySchema(id) {
    const cap = capabilityById(id);
    if (!cap) return;
    const text = JSON.stringify(cap.schema, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => toast('Schema 已复制。', 'success')).catch(() => toast('浏览器未授权剪贴板，请手动复制。', 'warning'));
    } else {
      toast('浏览器不支持剪贴板，请手动复制。', 'warning');
    }
  }

  function toggleUser(id) {
    const user = USERS.find((item) => item.id === id);
    if (!user) return;
    user.status = user.status === '活跃' ? '已禁用' : '活跃';
    audit(user.status === '活跃' ? '启用用户' : '禁用用户', `user:${user.username}`, '成功', { after: { status: user.status } });
    toast(`${user.name} 已${user.status === '活跃' ? '启用' : '禁用'}。`, 'info');
    renderMain();
  }

  function openProfileDrawer() {
    closeDropdowns();
    openPanel({
      title: '个人设置', sub: '平台虚拟账号 · 张明', variant: 'modal',
      body: `<div class="field-row"><div class="field"><label>姓名</label><input class="input" value="张明"></div><div class="field"><label>用户名</label><input class="input" value="zhangming" disabled></div></div>
        <div class="field"><label>邮箱</label><input class="input" value="zhangming@example.com"></div>
        <div class="field"><label>项目角色</label><input class="input" value="项目 Owner · 订单中心" disabled></div>
        <div class="form-hint">管理员、平台运维与 prod 审批人强制 MFA；当前账号 MFA 已启用。</div>
        <div class="btn-row" style="justify-content:flex-end;margin-top:18px;"><button class="btn btn-outline" type="button" data-action="close-overlay">取消</button><button class="btn btn-primary" type="button" data-action="toast" data-msg="个人设置已保存（演示）">保存</button></div>`
    });
  }

  /* ---------------- form submissions ---------------- */
  function addUserToProjectList(user, projectName) {
    if (!user || user.role === '平台管理员' || user.projects.includes('全部项目')) return;
    if (!user.projects.includes(projectName)) user.projects.push(projectName);
  }

  function removeUserFromProjectList(user, projectName) {
    if (!user || user.projects.includes('全部项目')) return;
    user.projects = user.projects.filter((name) => name !== projectName);
  }

  function submitProject(form) {
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const code = String(data.get('code') || '').trim().toUpperCase();
    const owner = String(data.get('owner') || '张明');
    const desc = String(data.get('desc') || '').trim();
    const iterationName = String(data.get('iterationName') || '').trim();
    if (!name) { toast('请填写项目名称。', 'warning'); return; }
    if (!/^[A-Z][A-Z0-9-]{1,15}$/.test(code)) { toast('项目标识需以字母开头，2–16 位大写字母、数字或连字符。', 'warning'); return; }
    if (PROJECTS.some((project) => project.code === code)) { toast(`项目标识 ${code} 已被占用，请更换。`, 'warning'); return; }

    const palette = ['#2563eb', '#06b6d4', '#8b5cf6', '#0ea5e9', '#14b8a6', '#f59e0b'];
    const color = palette[PROJECTS.length % palette.length];
    const projectId = `p-${++state.projectSeq}`;
    const iterationId = `it-${++state.iterationSeq}`;
    const versionMatch = iterationName.match(/v?\d+(?:\.\d+)*/i);
    const version = versionMatch ? `v${versionMatch[0].replace(/^v/i, '')}` : 'v1.0';
    const createdAt = nowDate();
    const ownerUser = USERS.find((user) => user.name === owner);
    const project = {
      id: projectId, name, code, owner, status: '规划中', iterationId, health: 100, color,
      desc: desc || '待补充项目描述。', createdAt,
      members: [{ userId: ownerUser?.id || 'u-1', role: 'Owner', joinedAt: createdAt }]
    };
    const iteration = {
      id: iterationId, name: iterationName || `v1.0 ${name}`, version, projectId,
      status: '规划中', start: createdAt, end: dateAfter(14), owner, goal: '完成项目首个迭代交付'
    };
    PROJECTS.unshift(project);
    ITERATIONS.unshift(iteration);
    addUserToProjectList(ownerUser, name);
    audit('创建项目', `project:${code}`, '成功', { after: { name, code, owner, iterationId } });

    state.projectId = projectId;
    state.iterationId = iterationId;
    state.reqTab = 'list';
    resetRequirementFilters();
    resetKnowledgeFilters();
    state.taskFilter = 'all';
    state.pipelineFilter = 'all';
    state.membersPage = 1;
    closeOverlay();
    if (location.hash === '#/projects') render();
    else location.hash = '#/projects';
    toast(`项目 ${name} 已创建，首个迭代 ${iteration.name} 已初始化。`, 'success', '项目已创建');
  }

  function submitMember(form) {
    const project = currentProject();
    const data = new FormData(form);
    const userId = String(data.get('userId') || '');
    const role = String(data.get('role') || '');
    const user = userById(userId);
    if (!user) { toast('请选择平台用户。', 'warning'); return; }
    if (!PROJECT_ROLES.includes(role)) { toast('请选择有效的项目角色。', 'warning'); return; }
    if (project.members.some((member) => member.userId === userId)) { toast(`${user.name} 已在项目中。`, 'warning'); return; }
    project.members.push({ userId, role, joinedAt: nowDate() });
    addUserToProjectList(user, project.name);
    state.membersPage = 1;
    audit('添加项目成员', `${project.id}/${userId}`, '成功', { projectId: project.id, project: project.name, member: user.name, after: { role } });
    closeOverlay();
    renderMain();
    toast(`${user.name} 已加入 ${project.name}，项目角色为 ${role}。`, 'success', '成员已添加');
  }

  function changeMemberRole(userId, role) {
    const project = currentProject();
    const member = project.members.find((item) => item.userId === userId);
    if (!member || member.role === 'Owner') return;
    if (!PROJECT_ROLES.includes(role) || member.role === role) return;
    const user = userById(userId);
    const before = member.role;
    member.role = role;
    audit('调整成员角色', `${project.id}/${userId}`, '成功', {
      projectId: project.id, project: project.name, member: user?.name || userId,
      before: { role: before }, after: { role }
    });
    renderMain();
    toast(`${user?.name || userId} 的项目角色已从 ${before} 调整为 ${role}。`, 'info', '角色已更新');
  }

  function confirmRemoveMember(userId) {
    const project = currentProject();
    const member = project.members.find((item) => item.userId === userId);
    const user = userById(userId);
    if (!member || !user || member.role === 'Owner') return;
    project.members = project.members.filter((item) => item.userId !== userId);
    removeUserFromProjectList(user, project.name);
    audit('移除项目成员', `${project.id}/${userId}`, '成功', {
      projectId: project.id, project: project.name, member: user.name, before: { role: member.role }
    });
    closeOverlay();
    renderMain();
    toast(`${user.name} 已从 ${project.name} 移除。`, 'success', '成员已移除');
  }

  function submitRequirement(form) {
    const data = new FormData(form);
    const title = String(data.get('title') || '').trim();
    const projectId = String(data.get('projectId') || '');
    const iterationId = String(data.get('iterationId') || '');
    const priority = String(data.get('priority') || 'P2');
    const desc = String(data.get('desc') || '').trim();
    const acceptance = String(data.get('acceptance') || '').trim();
    if (!title || !acceptance) { toast('请填写需求标题与验收标准。', 'warning'); return; }
    const iteration = iterationById(iterationId);
    if (!iteration || iteration.projectId !== projectId) { toast('迭代与项目不匹配，请重新选择。', 'error'); return; }
    const req = {
      id: `RQ-${++state.reqSeq}`, title, projectId, iterationId, status: '分析', priority,
      owner: '张明', apps: [], updated: nowTime(), ready: false, desc: desc || '待补充需求描述。', acceptance, taskId: null
    };
    REQUIREMENTS.unshift(req);
    addRequirementHistory(req, '创建需求', [
      { label: '初始状态', after: '分析' },
      { label: '优先级', after: priority },
      { label: '所属迭代', after: iteration.name }
    ]);
    audit('创建需求', req.id, '成功', { after: { title, iterationId, priority } });
    closeOverlay();
    state.projectId = projectId;
    state.iterationId = iterationId;
    state.reqTab = 'list';
    resetRequirementFilters();
    navigate('#/requirements');
    renderMain();
    toast(`${req.id} 已创建，等待需求分析。`, 'success', '需求已创建');
  }

  function submitDefer(form) {
    const data = new FormData(form);
    const id = String(data.get('id') || '');
    const target = String(data.get('target') || 'backlog');
    const reason = String(data.get('reason') || '').trim();
    const req = requirementById(id);
    if (!req) return;
    req.ready = false;
    req.deferredTo = target;
    req.updated = nowTime();
    addRequirementHistory(req, '延期需求', [
      { label: '延期目标', after: target === 'backlog' ? 'Backlog' : (iterationById(target)?.name || target) },
      ...(reason ? [{ label: '延期原因', after: reason }] : [])
    ]);
    audit('延期需求', req.id, '成功', { reason, target });
    closeOverlay();
    renderMain();
    toast(`${req.id} 已延期至 ${target === 'backlog' ? 'Backlog' : iterationById(target)?.name || target}。`, 'success', '需求已延期');
  }

  function applyRequirementRelease(req, releaseId) {
    const target = releaseId ? releaseById(releaseId) : null;
    RELEASES.forEach((release) => {
      release.requirementIds = (release.requirementIds || []).filter((id) => id !== req.id);
    });
    if (target) target.requirementIds.push(req.id);
    return target;
  }

  function setRequirementRelease(reqId, releaseId) {
    const req = requirementById(reqId);
    if (!req) return;
    const target = releaseId ? releaseById(releaseId) : null;
    if (releaseId && (!target || target.iterationId !== req.iterationId)) { toast('请选择当前迭代的发布。', 'warning'); renderMain(); return; }
    const before = requirementRelease(req.id)?.id || '';
    if (before === (target?.id || '')) return;
    applyRequirementRelease(req, releaseId);
    audit('更新需求发布关联', req.id, '成功', { before, after: target?.id || '' });
    renderMain();
    toast(target ? `${req.id} 已关联发布 ${target.name}。` : `${req.id} 已解除发布关联。`, 'success', '发布关联已更新');
  }

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
    if (requirementIds.some((id) => requirementRelease(id))) { toast('所选需求已关联其他发布，请刷新后重试。', 'warning'); return; }
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

  function submitTask(form) {
    const data = new FormData(form);
    const agent = String(data.get('agent') || '需求分析');
    const projectId = String(data.get('projectId') || state.projectId);
    const requirementId = String(data.get('requirementId') || '');
    const prompt = String(data.get('prompt') || '').trim();
    if (!prompt) { toast('请填写任务说明。', 'warning'); return; }
    const req = requirementId ? requirementById(requirementId) : null;
    const title = `${agent} · ${prompt.slice(0, 24)}${prompt.length > 24 ? '…' : ''}`;
    const task = {
      id: `T-${++state.taskSeq}`, title, agent, type: agent, projectId, requirementId: requirementId || null,
      status: '排队中', progress: 0, started: '—', duration: '—', tokens: '0', steps: 0, updated: nowTime(),
      summary: prompt, tools: [], logs: `[${nowTime()}] task created\n[${nowTime()}] waiting for agent worker`, diff: null
    };
    TASKS.unshift(task);
    audit('创建 Agent 任务', task.id, '成功', { agent, projectId });
    closeOverlay();
    state.projectId = projectId;
    state.taskFilter = 'all';
    navigate('#/agents');
    renderMain();
    toast(`${task.id} 已进入队列。`, 'success', '任务已创建');
    setTimeout(() => {
      task.status = '运行中';
      task.progress = 26;
      task.started = nowTime();
      task.duration = '0m 12s';
      task.updated = nowTime();
      task.logs += `\n[${nowTime()}] task leased by agent-worker\n[${nowTime()}] running ${agent} graph`;
      if (state.route === '#/agents') renderMain();
    }, 1600);
  }

  function submitPipeline(form) {
    const data = new FormData(form);
    const appId = String(data.get('appId') || '');
    const branch = String(data.get('branch') || 'main').trim();
    const app = appById(appId);
    if (!app) { toast('请选择应用。', 'warning'); return; }
    const run = {
      id: `RUN-${++state.pipelineSeq}`, projectId: app.projectId, appId, branch, commit: 'new',
      status: '运行中', duration: '0m 0s', triggeredBy: '张明', time: nowTime(),
      stages: [
        { name: 'checkout', status: '成功', duration: '6s' }, { name: 'build', status: '运行中', duration: '—' },
        { name: 'test', status: '等待', duration: '—' }, { name: 'scan', status: '等待', duration: '—' },
        { name: 'image', status: '等待', duration: '—' }, { name: 'deploy test', status: '等待', duration: '—' },
        { name: 'smoke', status: '等待', duration: '—' }
      ],
      logs: `[${nowTime()}] pipeline created\n[${nowTime()}] checkout ${branch}\n[${nowTime()}] build running...`
    };
    PIPELINES.unshift(run);
    audit('触发流水线', run.id, '成功', { app: app.name, branch });
    closeOverlay();
    state.projectId = app.projectId;
    state.pipelineFilter = 'all';
    navigate('#/pipelines');
    renderMain();
    toast(`${run.id} 已开始运行。`, 'info', '流水线运行中');
    setTimeout(() => {
      run.status = '成功';
      run.duration = '3m 18s';
      run.stages = run.stages.map((stage) => ({ ...stage, status: '成功', duration: stage.duration === '—' ? '22s' : stage.duration }));
      run.logs += `\n[${nowTime()}] build completed\n[${nowTime()}] tests passed\n[${nowTime()}] image signed\n[${nowTime()}] deploy test succeeded\n[${nowTime()}] smoke passed`;
      if (state.route === '#/pipelines') renderMain();
    }, 2600);
  }

  function submitMcpTest(form) {
    const data = new FormData(form);
    const cap = capabilityById(String(data.get('tool') || ''));
    const raw = String(data.get('args') || '').trim();
    const box = $('#mcp-response');
    const status = $('#mcp-response-status');
    if (!cap) { box.innerHTML = '<div class="empty-table">请选择 MCP 工具。</div>'; return; }
    if (!cap.mcp) {
      status.className = 'mcp-status error';
      status.textContent = 'MCP 已关闭';
      box.innerHTML = `<div class="gate-item bad"><span class="gate-icon">${icon('alert', 12)}</span><div><b>该能力未启用 MCP</b><small>${esc(cap.name)} 的 MCP 开关为关闭；REST 契约不受影响。</small></div></div>`;
      return;
    }
    let args;
    try { args = JSON.parse(raw); } catch (error) {
      status.className = 'mcp-status error';
      status.textContent = 'JSON 错误';
      box.innerHTML = `<div class="gate-item bad"><span class="gate-icon">${icon('alert', 12)}</span><div><b>参数不是合法 JSON</b><small>${esc(error.message)}</small></div></div>`;
      return;
    }
    status.className = 'mcp-status idle';
    status.innerHTML = `<span class="mcp-spinner"></span> 处理中`;
    box.innerHTML = '<div class="empty-table"><span class="mcp-spinner" style="display:inline-block;vertical-align:middle;margin-right:6px;"></span> 正在校验 Schema 与权限...</div>';
    setTimeout(() => {
      status.className = 'mcp-status';
      status.textContent = '200 OK';
      const response = {
        ok: true,
        tool: cap.tool,
        policy_version: `v${state.policyVersion}`,
        latency_ms: 86,
        dry_run: true,
        request: args,
        result: cap.response
      };
      box.innerHTML = `<div class="schema-block"><div class="schema-block-head">${icon('check', 13)} 响应 · ${esc(cap.tool)}</div><pre>${esc(JSON.stringify(response, null, 2))}</pre></div>`;
      audit('MCP 测试', `cap:${cap.tool}`, '成功', { dry_run: true, policyVersion: state.policyVersion });
      toast('MCP 测试通过（dry-run），未产生真实副作用。', 'success', '测试通过');
    }, 700);
  }

  function submitUser(form) {
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const username = String(data.get('username') || '').trim();
    const role = String(data.get('role') || 'Developer');
    const project = String(data.get('project') || '');
    if (!name || !username) { toast('请填写姓名与用户名。', 'warning'); return; }
    USERS.push({ id: `u-${++state.userSeq}`, name, username, role, projects: [project], mfa: role === '平台管理员' ? '已启用' : '未启用', status: '活跃', lastLogin: '—', color: '#2563eb', email: `${username}@example.com` });
    audit('创建用户', `user:${username}`, '成功', { role, project });
    closeOverlay();
    renderMain();
    toast(`用户 ${name} 已创建。`, 'success');
  }

  /* ---------------- router ---------------- */
  function navigate(route) {
    closeOverlay();
    closeDropdowns();
    if (location.hash === route) render();
    else location.hash = route;
  }

  function init() {
    if (!location.hash) location.hash = '#/projects';
    state.route = location.hash;
    bindEvents();
    renderTopbar();
    renderSidebar();
    renderMain();
    renderNotifications();
    renderAvatarMenu();
  }

  init();
})();
