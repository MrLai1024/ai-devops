# AI DevOps 平台需求规格说明书（SRS）

> 版本：v0.1（评审稿）  
> 日期：2026-10-23  
> 状态：待评审  
> 配套设计：[AI DevOps 平台总体设计方案](2026-10-23-ai-devops-platform-design.md)  
> 需求编号：`FR-<域>-<序号>`、`NFR-<属性>-<序号>`、`IR-<接口>-<序号>`、`DR-<数据>-<序号>`  
> 优先级：M（必须）、S（应该）、C（可以）、W（本期不做）

---

## 0. 文档说明

### 0.1 目的

本文定义 AI DevOps 平台的产品需求、功能需求、非功能需求、数据与接口要求、验收标准及需求追踪关系，作为设计、开发、测试、验收和变更管理的基线。

### 0.2 读者

产品负责人、架构师、开发、测试、SRE、安全、运维、项目负责人与验收方。

### 0.3 范围

覆盖平台基座、AI Agent 全链路交付、生成应用运行平面、能力配置与 MCP、可观测与审计、以及支撑上述能力的非功能要求。平台自身单环境；test / prod 仅指生成应用的运行环境。

### 0.4 与设计文档的关系

- 本文回答“系统必须做什么、做到什么程度、如何验收”。
- 设计文档回答“如何实现、模块边界、数据流、部署拓扑”。
- 设计文档中的实现细节不作为需求；本文中的验收标准作为设计与测试的共同输入。
- 文中标记“待决策”的条目来自独立评审发现，尚未获得用户确认，不构成已冻结需求。

### 0.5 需求状态

| 状态 | 含义 |
|---|---|
| 已确认 | 来源于用户已明确的定位、环境模型与设计决策 |
| 待评审 | 需求已提出，等待用户确认范围或优先级 |
| 待决策 | 存在架构/成本取舍，必须先做决策再冻结 |
| 延后 | 本期不做，保留编号 |

---

## 1. 产品概述

### 1.1 产品定位

本平台是一套**以 AI Agent 为核心的全链路软件交付基座**，由 AI 驱动完成：

需求分析 → 方案设计 → 代码开发 → 自动化测试 → 制品构建 → 部署发布 → 应用运维。

平台同时支持对已生成应用进行**增量迭代需求开发**。平台自身是基座，所有 AI 生成应用统一通过平台域名体系对外访问；前端采用微前端架构，平台为主基座，各业务模块作为独立微应用接入。

核心差异化：区别于 Coze、Multica 等普通 AI 应用搭建平台，本平台绑定完整、标准化的软件工程交付流水线，不只生成应用，而是覆盖生成、交付与持续迭代。

### 1.2 产品目标

| 编号 | 目标 | 成功度量 |
|---|---|---|
| G-01 | 打通端到端 AI 交付链路 | 需求 → 分析 → 方案 → 编码 → MR → test 部署 → 审批 → prod 晋升可完整演示 |
| G-02 | 支持增量迭代 | 已上线应用可发起变更需求并完成影响分析、增量开发、回归与再发布 |
| G-03 | 统一接入 | 生成应用统一域名访问；前端微应用统一基座接入 |
| G-04 | 安全可控 | 虚拟账号、最小权限、沙箱隔离、prod 人工审批、全链路审计 |
| G-05 | 可运营 | 指标、日志、链路、LLM 观测、告警、Runbook 完整 |
| G-06 | 可收敛 | 平台单环境；不复制平台 test/prod；首期不接外部仓、不做强多租户 |
| G-07 | 按迭代批量交付 | 需求可归入项目迭代；迭代发布按应用生成发布项，支持部分失败、重试与逐项回滚 |

### 1.3 目标用户与角色

| 角色 | 职责 | 关键权限 |
|---|---|---|
| 平台管理员 | 平台配置、账号、能力策略、平台升级 | 全局管理、能力发布、配额、审计 |
| 平台运维 | 发布、容量、故障处理、备份恢复 | 平台运维、只读审计、维护模式 |
| 项目 Owner | 项目成败、成员与发布审批 | 项目管理、成员管理、prod 审批 |
| 项目 Maintainer | 需求、方案、MR、流水线 | 需求管理、MR 审批、test 发布 |
| 项目 Developer | 需求与代码交付 | 需求编辑、Agent 任务、MR 提交 |
| 项目 Viewer | 只读查看 | 项目、需求、任务、部署只读 |
| 审计员 | 合规审计 | 全局只读审计、导出 |
| AI Agent | 系统参与者 | 仅通过任务令牌调用白名单能力 |
| 外部系统 | Gitea、K8s、DeepSeek、OIDC 客户端 | 按接口契约 |

### 1.4 范围

**本期范围（M/S）**

- 虚拟账号、项目 RBAC、OIDC、任务令牌。
- 项目、应用、需求、验收标准、增量迭代。
- 需求迭代管理：迭代规划、需求关联、就绪检查、按迭代批次发布、部分失败处理、逐项回滚。
- Gitea 代码仓、MR、文档、RAG 索引。
- 需求分析、方案设计、测试生成、Coding、运维诊断五类 Agent。
- 任务状态机、沙箱、人工审批。
- 能力目录、`enable_rest` / `enable_mcp`、Schema、MCP Server、热加载。
- CI/CD、镜像签名、SBOM、test 自动部署、prod 审批晋升、回滚。
- test/prod 生成应用运行平面、统一域名、app-data 逻辑隔离、OIDC 接入。
- 可观测、审计、告警、Runbook。
- 4 个前端微应用 + 基座。

**不在本期范围（W）**

- 企业 SSO / LDAP / 统一身份。
- 强多租户、独立计费、独立网络、独立集群。
- GitHub / GitLab / Confluence / 飞书连接器。
- 任意外部 REST 服务注册为 MCP 工具。
- Agent 自动合并、自动发布 prod。
- 多地域、多活、跨云容灾。
- 生成应用自带数据库/缓存/网关。
- 平台自身 test/prod 双环境复制。
- 自定义流水线 DSL、多栈生成（MVP 单参考栈）。

### 1.5 术语

| 术语 | 含义 |
|---|---|
| 平台平面 | 平台自身所在的单套运行环境 |
| 生成应用运行平面 | 承载 AI 生成应用的 test/prod 两套独立 K8s 集群 |
| 前端微应用 | 平台 UI 的 4 个子应用 |
| 生成应用 | AI 生成并部署到 test/prod 的业务应用 |
| 能力 | 平台内置 API 的元数据描述，可以 REST 或 MCP 暴露 |
| 任务 | TaskSched 管理的一次 Agent 或流水线工作单元 |
| 流水线 | CICD 管理的构建、测试、部署、晋升编排 |
| 晋升 | 把 test 验证通过的镜像 digest 部署到 prod 的受控动作 |
| 增量迭代 | 对已生成应用发起变更需求并再次交付 |
| 沙箱 | 隔离执行 Agent 命令与测试的临时 Pod |
| 应用（App） | 项目下可独立部署、拥有 test/prod 环境与路由的交付单元 |
| 迭代 | 项目级的交付批次，包含一组需求、目标、起止时间与版本；本期不做故事点/燃尽图 |
| 发布批次 | 一次迭代发布的生产部署集合，按应用拆成发布项 |
| 发布项 | 某个应用在 prod 的一次具体部署，绑定 image_digest、commit、流水线与状态 |

---

## 2. 用例与业务流程

### 2.1 用例清单

| 用例 | 参与者 | 目标 | 关联需求 |
|---|---|---|---|
| UC-01 登录与账号管理 | 用户、平台管理员 | 安全登录、角色分配 | FR-AUTH-* |
| UC-02 创建项目 | 项目 Owner | 建立项目与默认资源 | FR-PROJ-* |
| UC-03 创建应用 | 项目 Owner/Maintainer | 建立应用与 test/prod 环境 | FR-PROJ-*、FR-RUNTIME-* |
| UC-04 录入需求 | Developer | 需求、验收标准、附件 | FR-REQ-* |
| UC-05 需求分析 | Developer、ReqAgent | 结构化分析、风险、待确认问题 | FR-AGENT-* |
| UC-06 方案设计 | Developer、PlanAgent | 方案、任务拆解、测试策略 | FR-AGENT-* |
| UC-07 编码与 MR | Developer、CodingAgent | 分支、提交、MR、测试 | FR-AGENT-*、FR-REPO-* |
| UC-08 流水线与 test 部署 | Maintainer、CICD | 构建、扫描、签名、test 部署 | FR-CICD-* |
| UC-09 prod 晋升 | Owner、审批人 | 审批、按 digest 发布、回滚 | FR-CICD-*、FR-RUNTIME-* |
| UC-10 增量迭代 | Developer、Agent | 影响分析、增量开发、回归 | FR-REQ-*、FR-AGENT-* |
| UC-11 能力配置 | 平台管理员 | 开关、Schema、MCP 测试 | FR-CAP-* |
| UC-12 运维诊断 | 运维、OpsAgent | 根因分析、处置建议 | FR-AGENT-*、FR-OBS-* |
| UC-13 观测与告警 | 运维、项目成员 | 大盘、告警、审计 | FR-OBS-* |
| UC-14 平台管理 | 平台管理员/运维 | 功能开关、维护、备份、升级 | FR-ADMIN-* |
| UC-15 迭代规划与管理 | Owner/Maintainer | 创建迭代、关联需求、检查就绪 | FR-ITER-* |
| UC-16 按迭代发布生产 | Owner/审批人/CICD | 批次发布、部分失败、重试/回滚 | FR-ITER-*、FR-CICD-* |

### 2.2 端到端主流程

```mermaid
flowchart LR
    A[创建项目/应用] --> B[录入需求]
    B --> C[需求分析 Agent]
    C --> D{人工确认}
    D -->|通过| E[方案设计 Agent]
    D -->|退回| B
    E --> F{方案确认}
    F -->|通过| G[Coding Agent]
    F -->|退回| E
    G --> H[分支/提交/MR]
    H --> I[CICD 构建/测试/扫描/签名]
    I --> J[部署 test]
    J --> K[冒烟/E2E]
    K -->|失败| G
    K -->|通过| L{MR 评审}
    L -->|通过| M[发起 prod 晋升]
    M --> N{人工审批}
    N -->|通过| O[Argo CD 部署 prod]
    N -->|拒绝| M
    O --> P[观测/审计]
```

### 2.3 增量迭代流程

1. 在已上线应用下创建变更需求，关联当前版本、生产 commit、影响模块。
2. ReqAgent 做影响分析：受影响模块、兼容性风险、数据迁移、回归范围。
3. PlanAgent 产出增量方案：变更点、兼容策略、迁移脚本、测试与回滚方案。
4. CodingAgent 从生产 commit 拉分支，修改代码与测试，提交 MR。
5. 流水线执行定向测试 + 全量回归 + 安全扫描；test 部署验证。
6. 人工审批后按 digest 晋升 prod；优先金丝雀，异常自动回滚。
7. 更新版本与变更记录；审计关联需求、MR、流水线、部署。

### 2.4 能力配置与 MCP 流程

1. 平台管理员在 App3 选择能力，修改 `enable_rest` / `enable_mcp` 或 Schema。
2. CapManager 校验 Schema、破坏性变更、权限、风险。
3. 干跑测试：Schema 校验、权限检查、mock/沙箱调用。
4. 发布新版本；写 Outbox；投递 `capability.policy.changed`。
5. UniGateway 拉取快照、原子切换；健康检查；失败回滚。
6. 审计变更前后差异；通知受影响项目 Owner。

### 2.5 项目与应用开通

- 项目创建只创建项目级资源：项目记录、角色绑定、Gitea 组织/仓库、默认能力策略、项目路由。
- 应用创建后才按 `app + env` 幂等创建 namespace、Ingress/域名、app-data 绑定、配额与凭据。
- 项目开通与应用供给是两个 Saga；每步有超时、幂等键、补偿动作；禁止重复创建。

### 2.6 迭代规划与批次发布

1. Owner/Maintainer 创建迭代：名称、版本、目标、起止时间。
2. 将需求关联到迭代；需求状态与就绪度实时汇总。
3. 编码/测试完成后，需求进入 `READY_FOR_RELEASE`；未完成需求可显式延期到下一迭代或回 backlog。
4. 发起迭代发布：系统按应用生成发布项，绑定 test 验证通过的 `image_digest`、commit、`pipeline_run`。
5. 就绪门禁：所有未延期需求必须 READY；每个应用必须有绿色流水线与签名镜像；否则阻断。
6. 人工审批发布计划；高风险应用双人审批；发起人不得自批；digest 变化失效重审。
7. 按发布项顺序部署 prod；某项失败则停止后续，已部署项保留；迭代发布标记 `PARTIALLY_FAILED`。
8. 支持重试失败项（同 digest）或逐项回滚；新 digest 需重新审批。
9. 发布完成/关闭迭代；延期需求结转；发布记录不可变并审计。

---

## 3. 功能需求

### 3.1 账号、认证与权限

| ID | 需求 | 优先级 | 验收标准 |
|---|---|---|---|
| FR-AUTH-001 | 平台管理员可创建、禁用、删除虚拟账号；一人一号，用户名唯一 | M | 创建后可用；重复用户名被拒；禁用后无法登录 |
| FR-AUTH-002 | 用户名 + 密码登录；密码使用 Argon2id 存储；失败锁定与限流 | M | 连续失败达到阈值锁定；日志不含明文密码 |
| FR-AUTH-003 | 管理员、平台运维、prod 审批人强制 TOTP 或 WebAuthn MFA | M | 未完成 MFA 无法执行管理/审批动作；MFA 覆盖率 100% |
| FR-AUTH-004 | 短期 JWT（15 分钟）+ 旋转 refresh token；支持会话吊销 | M | 令牌过期后需刷新；吊销后旧令牌在 TTL 内被拒绝或按策略处理 |
| FR-AUTH-005 | 项目级 RBAC：Owner / Maintainer / Developer / Viewer / Auditor | M | 每个角色有明确权限矩阵；跨项目访问被拒绝 |
| FR-AUTH-006 | 服务身份与任务令牌：绑定 audience、project、task、agent 角色、能力白名单、TTL | M | 令牌不能跨项目/跨任务使用；过期/撤销后拒绝 |
| FR-AUTH-007 | 任务令牌不得进入 LLM 可见上下文或沙箱；由工具执行代理持有 | M | LLM 请求与沙箱环境变量中无任务令牌 |
| FR-AUTH-008 | Auth 作为 OIDC Provider，为每个生成应用注册独立 client | M | JWT 含 aud/azp/project_id；A 应用 token 调 B 返回 401 |
| FR-AUTH-009 | OIDC 使用 authorization code + PKCE；redirect_uri 精确白名单 | M | 非法 redirect_uri 被拒；PKCE 校验失败拒绝 |
| FR-AUTH-010 | 管理员重置密码需二次确认、通知用户、一次性重置码 | S | 重置后旧会话失效；用户收到通知 |
| FR-AUTH-011 | 登录、登出、密码重置、角色变更、敏感操作写审计 | M | 审计可按用户/时间/动作检索；不可篡改 |
| FR-AUTH-012 | 支持季度访问复核与离职/禁用账号自动回收权限 | S | 复核记录可导出；禁用账号 5 分钟内失去访问 |
| FR-AUTH-013 | 提供 break-glass 管理员账号，硬件密钥、全程告警、事后审计 | C | 使用触发告警；操作可追溯 |

### 3.2 项目与应用管理

| ID | 需求 | 优先级 | 验收标准 |
|---|---|---|---|
| FR-PROJ-001 | 创建项目：名称、描述、Owner、状态 | M | 创建成功；Owner 自动获得 Owner 角色 |
| FR-PROJ-002 | 项目开通 Saga：角色绑定、Gitea 组织/仓库、默认能力策略、项目路由 | M | 任一步失败项目置 provisioning_failed；重试幂等 |
| FR-PROJ-003 | 项目成员管理：邀请/移除、角色变更 | M | 变更即时生效或按令牌 TTL 生效；审计记录 |
| FR-PROJ-004 | 在项目下创建应用（App）：名称、Owner、仓库、描述 | M | 应用有唯一 ID；与项目、仓库、环境绑定 |
| FR-PROJ-005 | 应用生命周期：created / provisioning / active / suspended / deleting / deleted | M | 状态转换有审计；删除前需确认数据保留策略 |
| FR-PROJ-006 | 应用创建后按 app+env 幂等创建 namespace、域名、配额、数据绑定 | M | 重复创建不产生重复资源；失败可补偿 |
| FR-PROJ-007 | 应用暂停/恢复/归档/删除；数据按保留策略处理 | S | 暂停后不可发布；删除后资源清理可验证 |
| FR-PROJ-008 | 项目看板：需求、任务、流水线、部署状态聚合 | S | 数据延迟 ≤30 秒；可按应用/环境筛选 |
| FR-PROJ-009 | 项目/应用配额管理：并发任务、沙箱、存储、连接数 | S | 超配额时拒绝并提示；配额变更审计 |
| FR-PROJ-010 | 项目/应用搜索、筛选、归档 | C | 支持名称/状态/Owner 筛选 |

### 3.3 需求管理

| ID | 需求 | 优先级 | 验收标准 |
|---|---|---|---|
| FR-REQ-001 | 创建/编辑需求：标题、正文、验收标准、优先级、附件 | M | 保存成功；附件存 OSS；版本可追溯 |
| FR-REQ-002 | 需求状态流：draft / analyzing / analysis_ready / designing / design_ready / developing / testing / released / closed | M | 非法状态转换被拒绝；每次转换审计 |
| FR-REQ-003 | 需求关联任务、MR、流水线、部署、审计记录 | M | 任一环节可反查需求；链路完整 |
| FR-REQ-004 | 创建增量变更需求，关联应用、当前版本、生产 commit | M | 变更需求可追溯到基线版本；影响分析可触发 |
| FR-REQ-005 | 需求分析结果：目标、范围、验收标准、风险、待确认问题 | M | 结构化展示；人工可确认/退回 |
| FR-REQ-006 | 方案设计结果：技术方案、任务拆解、接口变更、测试策略、回滚方案 | M | 人工可确认/退回；与需求关联 |
| FR-REQ-007 | 评论、@提及、通知 | S | 被提及用户收到通知；评论审计 |
| FR-REQ-008 | 需求搜索、筛选、排序、分页 | S | p95 ≤800 ms；支持全文检索 |
| FR-REQ-009 | 验收标准 checklist 与验证结果回写 | M | 每项可标记通过/失败；失败阻断晋升 |
| FR-REQ-010 | 需求追踪矩阵：需求 → 任务 → MR → 流水线 → 部署 | S | 可导出 CSV/PDF |
| FR-REQ-011 | 需求模板与必填校验 | C | 模板可配置；缺少验收标准时提示 |

### 3.4 文档与代码仓

| ID | 需求 | 优先级 | 验收标准 |
|---|---|---|---|
| FR-REPO-001 | 项目开通时创建 Gitea 组织与仓库；配置分支保护 | M | main 禁止直推；保护规则可验证 |
| FR-REPO-002 | DocRepo 绑定 Gitea 仓库，管理 MR 元数据 | M | MR 状态与 Gitea 同步；Webhook 验签 |
| FR-REPO-003 | CodingAgent 可创建分支、提交、发起 MR、回复评论 | M | 提交带 project/task/agent 元数据；MR 作者为机器人 |
| FR-REPO-004 | 人类审批 MR；Agent 不得自行合并 | M | 无人类批准时无法合并；审批审计 |
| FR-REPO-005 | 文档元数据存 PostgreSQL，正文存 OSS，支持版本 | M | 文档可检索；版本可回溯 |
| FR-REPO-006 | 文档/代码变更触发 RAG 增量索引 | M | 索引延迟 ≤5 分钟；失败可重试 |
| FR-REPO-007 | Agent 通过 scoped 能力读取仓库/文档 | M | 仅限授权项目；读取审计 |
| FR-REPO-008 | Webhook 幂等、失败重试、死信处理 | M | 重复 Webhook 不产生重复事件 |
| FR-REPO-009 | 仓库配额、归档、备份 | S | 超配额告警；备份可恢复 |
| FR-REPO-010 | 提交签名/分支保护策略可配置 | S | 未签名提交按策略拒绝 |

### 3.5 Agent 编排与任务

| ID | 需求 | 优先级 | 验收标准 |
|---|---|---|---|
| FR-AGENT-001 | 创建任务：类型、项目、应用、需求、优先级、输入 | M | 任务入队；返回 task_id |
| FR-AGENT-002 | 任务状态机：CREATED / QUEUED / LEASED / RUNNING / WAITING_APPROVAL / WAITING_RESOURCE / SUCCEEDED / FAILED / TIMED_OUT / CANCELLED / DLQ | M | 非法转换拒绝；状态变更审计 |
| FR-AGENT-003 | 任务可取消（任意活跃状态）、超时、重试、DLQ | M | 取消后沙箱清理、令牌撤销；重试幂等 |
| FR-AGENT-004 | TaskSched 是队列与租约唯一 owner；租约带 epoch/fencing token | M | 旧 epoch 写入被拒绝；无重复副作用 |
| FR-AGENT-005 | AgentOrchestrator 用 LangGraph 编排，检查点持久化 | M | 进程重启后可恢复；检查点可审计 |
| FR-AGENT-006 | 需求分析 Agent：结构化分析、风险、待确认问题 | M | 输出 Schema 校验通过；人工确认率可统计 |
| FR-AGENT-007 | 方案设计 Agent：方案、任务拆解、接口变更、测试策略 | M | 输出与需求关联；人工可退回 |
| FR-AGENT-008 | 测试生成 Agent：测试用例/代码、覆盖报告 | M | 测试可在沙箱执行；结果回写 |
| FR-AGENT-009 | Coding Agent：分支、编辑、测试、MR、有限轮次修复 | M | 最大轮次可配置；超限转人工 |
| FR-AGENT-010 | 运维诊断 Agent：只读指标/日志/链路，输出根因与建议 | M | 不执行 prod 写操作；建议可转任务 |
| FR-AGENT-011 | 人工卡点：需求确认、方案确认、MR 评审、prod 晋升 | M | 未通过审批不能进入下一阶段 |
| FR-AGENT-012 | 任务硬上限：步数、文件数、Token、时长、沙箱 TTL、并发 | M | 超限终止并告警；UI 展示限额 |
| FR-AGENT-013 | 全局/项目/工具/任务四级 kill switch | M | 触发后 ≤1 分钟停止调度/杀沙箱/撤令牌 |
| FR-AGENT-014 | Agent 输出与工具调用可追溯：计划、依据、diff、测试结果 | M | 任务时间线完整；可导出 |
| FR-AGENT-015 | Agent 评测：黄金任务集、回归、评分 | S | 提示词/模型变更必须跑回归；阈值可配置 |
| FR-AGENT-016 | 提示词版本管理、灰度与回滚 | S | 版本可追溯；回滚 ≤5 分钟 |
| FR-AGENT-017 | 多项目并发配额与公平调度 | S | 单项目不能占满全局队列；配额可审计 |
| FR-AGENT-018 | 增量迭代任务链：影响分析 → 增量方案 → 编码 → 回归 | M | 与基线版本/commit 关联；回归范围可验证 |

### 3.6 能力配置与 MCP

| ID | 需求 | 优先级 | 验收标准 |
|---|---|---|---|
| FR-CAP-001 | 能力目录：ID、名称、版本、owner、REST/MCP Schema、风险、scope | M | 能力可查询；Schema 校验通过 |
| FR-CAP-002 | `enable_rest` 与 `enable_mcp` 独立开关 | M | 关闭 REST 后北向返回 403/404；关闭 MCP 后 tools/list 不返回 |
| FR-CAP-003 | 仅纳管平台内置 API；不接第三方/不自动注册 | M | 非白名单能力无法注册或调用 |
| FR-CAP-004 | Schema 预览、示例、错误码、限流、风险等级 | M | App3 可查看；与实际调用一致 |
| FR-CAP-005 | MCP Server：initialize / tools/list / tools/call / 取消 | M | 工具按 token scope 过滤；调用有审计 |
| FR-CAP-006 | MCP 调用校验：Schema、授权、限流、超时、输出大小 | M | 非法入参被拒；超限被截断/拒绝 |
| FR-CAP-007 | 高风险工具（prod 写、凭据、外部副作用）强制审批 + 双人复核 | M | 未审批调用被拒；不可仅靠 dry-run 放行 |
| FR-CAP-008 | 策略热加载：版本化、原子切换、last-known-good、回滚 | M | 生效 ≤30 秒；失败自动回滚 |
| FR-CAP-009 | 策略版本绑定任务令牌；运行中不因热加载扩权 | M | 旧任务不能获得新权限；禁用/降权 fail-closed |
| FR-CAP-010 | 能力测试：Schema 校验、权限检查、mock/沙箱调用、dry-run | M | 测试无真实副作用；结果审计 |
| FR-CAP-011 | 能力变更审计：谁、何时、改什么、影响范围、回滚 | M | 可检索；可导出 |
| FR-CAP-012 | 能力版本弃用与兼容窗口 | S | 弃用前通知；旧版本在窗口内可用 |
| FR-CAP-013 | 每工具限流、配额、超时、最大输出 | S | 超限拒绝并返回可读错误 |

### 3.7 CI/CD 与发布

| ID | 需求 | 优先级 | 验收标准 |
|---|---|---|---|
| FR-CICD-001 | 流水线模板：checkout、build、单测、SAST、依赖扫描、镜像、SBOM、签名、push | M | 模板可复用；步骤可追溯 |
| FR-CICD-002 | 触发：MR、Webhook、手动、增量迭代 | M | 触发幂等；重复触发不产生并行冲突 |
| FR-CICD-003 | 构建隔离：专用节点池 + gVisor/Kata、无平台 SA、默认拒绝出站（D-02 待决策） | M | 构建 Job 无法读取平台凭据/prod 凭据 |
| FR-CICD-004 | 镜像按 digest 不可变；签名与 provenance 由独立签名服务签发 | M | 未签名/无 provenance 镜像被准入拒绝 |
| FR-CICD-005 | test 自动部署；冒烟/E2E；失败阻断晋升 | M | test 部署 ≤10 分钟；失败可回滚 |
| FR-CICD-006 | prod 晋升：Promotion 记录、审批、绑定 digest、发起人≠审批人（D-04 待决策） | M | digest 变化失效重审；高风险双人审批 |
| FR-CICD-007 | CICD 不持有 prod 部署凭据；Argo CD 是唯一 reconciler（D-05 待决策） | M | 非 Argo CD 路径无法部署 prod |
| FR-CICD-008 | 独立 deploy-config 仓；prod overlay 受保护 | M | Agent 不能写 prod overlay；变更审计 |
| FR-CICD-009 | 回滚：按上一 digest；金丝雀/蓝绿；自动/手动 | M | 回滚 ≤5 分钟；零停机 |
| FR-CICD-010 | 数据库迁移：pre-sync Job 单实例 + advisory lock；expand/contract | M | 应用启动只校验 schema 版本；兼容窗口 N-2 |
| FR-CICD-011 | 部署事件：pipeline.* / deployment.* / promotion.* | M | 事件可回放；消费者幂等 |
| FR-CICD-012 | 构建缓存按项目隔离；配额与清理 | S | 跨项目缓存不可读；超配额拒绝 |
| FR-CICD-013 | 流水线日志/制品保留与下载 | S | 保留期可配置；权限受控 |

### 3.8 生成应用运行平面

| ID | 需求 | 优先级 | 验收标准 |
|---|---|---|---|
| FR-RUNTIME-001 | test/prod 两套独立 K8s 集群，独立 etcd/网络/凭据 | M | 单环境故障不影响另一环境 |
| FR-RUNTIME-002 | 每应用每环境一个 namespace，配 ResourceQuota/LimitRange/NetworkPolicy/PDB | M | 超配额拒绝；跨 namespace 默认拒绝 |
| FR-RUNTIME-003 | 应用运行时契约：健康检查、指标、OTEL、结构化日志、优雅停机 | M | 模板应用通过契约检查 |
| FR-RUNTIME-004 | 统一域名：prod `<app>.<project>.apps.<domain>`；test 加 `.test` | M | 域名可解析；通配符 TLS 有效 |
| FR-RUNTIME-005 | Nginx/Ingress 按 Host 路由；RouteMgmt 是 Host→服务唯一事实源 | M | 路由变更审计；冲突被拒 |
| FR-RUNTIME-006 | 生成应用入口默认拒绝未认证访问；网关 ext_authz/JWT 校验（D-07 待决策；SDK 校验为基线） | M | 未认证请求 401/403；A 应用 token 调 B 401 |
| FR-RUNTIME-007 | app-data：每应用+环境独立 database/schema、Redis ACL、OSS 前缀、配额（D-01 待决策：是否 test/prod 分实例） | M | 跨应用数据不可读；连接数/存储超限拒绝 |
| FR-RUNTIME-008 | app-data 凭据短期/可轮换；不写死在镜像/代码 | M | 凭据不出现在日志/镜像；轮换有重叠 |
| FR-RUNTIME-009 | 应用可观测：指标/日志/链路/告警按 app+env 隔离 | M | 可按应用查看大盘；告警路由到 Owner |
| FR-RUNTIME-010 | 应用生命周期：创建/暂停/恢复/归档/删除；数据保留策略 | S | 删除后资源清理可验证 |
| FR-RUNTIME-011 | 公开访问需项目 Owner 申请与审批 | S | 未审批公开访问被拒 |
| FR-RUNTIME-012 | 运行面本地告警与 break-glass 回滚路径 | S | 平台故障时仍可告警/回滚 |

### 3.9 可观测与审计

| ID | 需求 | 优先级 | 验收标准 |
|---|---|---|---|
| FR-OBS-001 | 全链路 OTEL：trace_id 贯穿 Nginx、网关、gRPC、Agent、LLM | M | 采样可调；慢请求可追踪 |
| FR-OBS-002 | 指标：服务黄金信号、队列、沙箱、LLM、部署、业务 | M | 大盘可查；保留 90 天 |
| FR-OBS-003 | 日志：结构化、脱敏、按项目/任务/应用索引 | M | 检索 ≤1 分钟；保留 30 天热/180 天冷 |
| FR-OBS-004 | LLM 观测：模型、Token、延迟、成本、工具调用、评测 | M | LangFuse 可查；敏感项目仅元数据 |
| FR-OBS-005 | 告警：SLO 燃烧率、依赖、队列、沙箱、LLM、证书、安全 | M | 告警带 Runbook；去重/抑制/升级 |
| FR-OBS-006 | 审计：登录、权限、审批、能力、发布、凭据、敏感读 | M | 追加式、哈希链、WORM 归档、可检索 |
| FR-OBS-007 | 任务时间线：计划、工具调用、diff、测试、审批、部署 | M | 一屏可见；可导出 |
| FR-OBS-008 | Outbox/队列/DLQ 监控：lag、最老未 ack、深度 | M | 超阈值告警；可重放 |
| FR-OBS-009 | SLO/错误预算与季度复盘 | S | 预算消耗可见；复盘有改进项 |
| FR-OBS-010 | 成本/Token 大盘与预算告警 | S | 按项目/用户/任务统计 |
| FR-OBS-011 | 平台遥测 dead-man's switch | S | 采集停止时独立告警 |

### 3.10 前端微应用与统一接入

| ID | 需求 | 优先级 | 验收标准 |
|---|---|---|---|
| FR-UI-001 | qiankun 基座 + 4 个微应用：项目/需求、流水线、能力配置、可观测 | M | 独立构建/发布；基座可加载/降级 |
| FR-UI-002 | 统一导航、项目切换、登录态、权限感知 | M | 无权限入口隐藏；跨应用跳转一致 |
| FR-UI-003 | 项目/需求界面：需求、验收、评论、附件、任务关联 | M | 核心操作 ≤3 次点击 |
| FR-UI-004 | 流水线界面：运行状态、日志、制品、部署、回滚 | M | 实时刷新；失败可定位 |
| FR-UI-005 | 能力配置界面：开关、Schema、测试、变更影响 | M | 操作有确认；变更审计可见 |
| FR-UI-006 | 可观测界面：大盘、告警、任务时间线 | M | 支持按项目/应用/环境筛选 |
| FR-UI-007 | 审批界面：diff、测试证据、风险、回滚方案、通过/拒绝 | M | 审批人可独立判断；操作留痕 |
| FR-UI-008 | 错误/空/加载状态、可读错误码与处置建议 | S | 无死胡同；错误可复制 |
| FR-UI-009 | 无障碍 WCAG 2.1 AA、响应式、中文默认 | S | 无障碍审计通过 |
| FR-UI-010 | 新手引导、帮助文档、快捷键 | C | 新用户 15 分钟完成首个任务 |

### 3.11 平台管理

| ID | 需求 | 优先级 | 验收标准 |
|---|---|---|---|
| FR-ADMIN-001 | 功能开关：按项目/用户/环境灰度 | S | 变更即时生效；审计 |
| FR-ADMIN-002 | 维护模式：暂停任务、只读、公告 | S | 维护期间无新任务；恢复可重放 |
| FR-ADMIN-003 | 备份/恢复管理：全量、PITR、恢复演练 | M | 季度演练通过；RPO/RTO 达标 |
| FR-ADMIN-004 | 配置管理：能力、路由、配额、告警规则 | S | 变更版本化；可回滚 |
| FR-ADMIN-005 | 平台发布：GitOps/流水线、金丝雀、观察窗口、自动回滚 | M | 单环境升级可回滚；DB 兼容 |
| FR-ADMIN-006 | 服务目录与健康总览 | S | 每服务健康/版本/owner 可见 |
| FR-ADMIN-007 | 配额与容量管理 | S | 超限告警；扩容有记录 |
| FR-ADMIN-008 | break-glass 与全局 kill switch | M | 双人审批；使用告警；≤1 分钟生效 |

### 3.12 统一网关

| ID | 需求 | 优先级 | 验收标准 |
|---|---|---|---|
| FR-GW-001 | 唯一南北向业务入口，支持 REST/SSE/WebSocket；内部服务不直接暴露 | M | 外部只能经 Nginx → UniGateway 访问 |
| FR-GW-002 | JWT/JWKS 校验、吊销名单、用户/项目/角色上下文注入 | M | 无效/过期/吊销令牌拒绝 |
| FR-GW-003 | 按用户/项目/IP/能力限流；请求体/并发/超时限制 | M | 超限 429；不影响其他项目 |
| FR-GW-004 | REST↔gRPC 转换、路由、超时、熔断、统一错误模型 | M | 统一错误码；下游故障不级联 |
| FR-GW-005 | 幂等键、审计埋点、敏感字段脱敏、响应大小限制 | M | 重复请求幂等；审计完整 |
| FR-GW-006 | MCP Server 与能力策略热加载（与 FR-CAP 联动） | M | tools/list 按 scope 过滤；热加载 ≤30 秒 |
| FR-GW-007 | 生成应用入口的 Host 路由、灰度、证书由网关与 RouteMgmt 协同 | M | 路由冲突拒绝；灰度可回滚 |
| FR-GW-008 | 网关自身多副本、HPA、健康检查、优雅停机 | M | 单 Pod 故障无中断 |

### 3.13 路由管理

| ID | 需求 | 优先级 | 验收标准 |
|---|---|---|---|
| FR-ROUTE-001 | 前端微应用清单：入口、版本、兼容基座版本、路由前缀、权限 | M | 基座可加载/降级 |
| FR-ROUTE-002 | 生成应用 Host→服务映射；CICD 部署事件更新 | M | 冲突/失效路由被拒 |
| FR-ROUTE-003 | 路由版本化、灰度、回滚、审计 | M | 变更可追溯；回滚 ≤5 分钟 |
| FR-ROUTE-004 | 功能开关按项目/用户/环境 | S | 生效 ≤30 秒；审计 |

### 3.14 Safety 功能控制

| ID | 需求 | 优先级 | 验收标准 |
|---|---|---|---|
| FR-SAFE-001 | 沙箱：gVisor、非 root、只读根、无 K8s Token、无 prod 凭据 | M | 逃逸测试通过；无法访问 prod |
| FR-SAFE-002 | 每任务全新工作卷；禁止跨任务/跨项目复用 | M | canary 文件不可见；销毁可验证 |
| FR-SAFE-003 | 沙箱节点 taint + Kyverno 强制 runtimeClassName | M | 普通 Pod 不能调度到沙箱节点 |
| FR-SAFE-004 | 沙箱 gRPC 绑定租约/任务令牌 + mTLS，仅 sidecar/localhost | M | 未授权调用被拒 |
| FR-SAFE-005 | 不可信输入隔离：需求/附件/代码/日志/RAG 视为数据 | M | 提示注入用例不触发越权工具 |
| FR-SAFE-006 | 规划与执行分离；写工具需任务级授权 | M | 未授权写操作被拒 |
| FR-SAFE-007 | 高风险工具强制审批 + 双人复核 | M | 未审批调用被拒 |
| FR-SAFE-008 | 任务硬上限与四级 kill switch | M | 超限终止；kill switch ≤1 分钟 |
| FR-SAFE-009 | 策略版本绑定；禁用/降权 fail-closed | M | 旧任务不能扩权；副本失联拒绝调用 |
| FR-SAFE-010 | test 环境按不可信处理：无 prod 数据、默认拒绝出站 | M | 网络策略验证；无 prod 凭据 |
| FR-SAFE-011 | 红队与 Safety 验收：逃逸、注入、越权、资源耗尽 | S | 上线前完成；高危问题清零 |

### 3.15 需求迭代与批次发布

| ID | 需求 | 优先级 | 验收标准 |
|---|---|---|---|
| FR-ITER-001 | 创建/编辑迭代：名称、版本、目标、起止时间、Owner、状态 | M | 版本在项目内唯一；状态转换审计 |
| FR-ITER-002 | 需求关联/移出迭代；一个需求同一时间只属于一个活跃迭代 | M | 移入/移出幂等；历史保留 |
| FR-ITER-003 | 迭代看板：需求状态、就绪度、阻塞项、应用分布 | M | 准实时；可按状态/应用筛选 |
| FR-ITER-004 | 需求就绪判定：分析/方案/编码/MR/test 验证完成 | M | 未就绪需求在发布前标红；不可静默发布 |
| FR-ITER-005 | 需求延期：选择目标迭代/回 backlog，填写原因 | M | 延期审计；目标迭代可见 |
| FR-ITER-006 | 迭代发布计划：按应用生成发布项，绑定 digest/commit/pipeline_run | M | 每个受影响应用有且仅有一个发布项 |
| FR-ITER-007 | 发布就绪门禁：所有未延期需求 READY；每个应用流水线绿、镜像签名、SBOM | M | 任一不满足则阻断；给出缺口 |
| FR-ITER-008 | 发布审批：批量审批发布计划；发起人≠审批人；高风险双人 | M | 审批绑定 digest 集合；变更失效 |
| FR-ITER-009 | 协调批次部署：按顺序执行；失败停止后续；已部署项保留 | M | 部分失败状态准确；无重复部署 |
| FR-ITER-010 | 失败项重试（同 digest）与逐项回滚；新 digest 重新审批 | M | 重试/回滚幂等；审计完整 |
| FR-ITER-011 | 迭代发布状态：PENDING_APPROVAL / APPROVED / RELEASING / SUCCEEDED / PARTIALLY_FAILED / FAILED / ROLLED_BACK / CANCELLED | M | 非法状态转换拒绝 |
| FR-ITER-012 | 发布记录/发布说明：需求列表、应用/版本/digest、结果、回滚 | M | 不可变；可导出 |
| FR-ITER-013 | 迭代关闭：已发布/部分失败/取消；延期需求结转 | M | 关闭后不可再改范围；审计 |
| FR-ITER-014 | 迭代权限：Owner/Maintainer 管理，Developer 只读/提议，Viewer 只读 | M | 越权拒绝；审计 |
| FR-ITER-015 | 迭代与发布通知：状态变更、审批、失败、回滚 | S | 通知到 Owner/审批人 |
| FR-ITER-016 | 迭代指标：需求数、按期率、发布成功率、Lead Time | S | 大盘可查 |
| FR-ITER-017 | 迭代模板/版本命名规则 | C | 可配置；校验唯一 |
| FR-ITER-018 | 多个迭代并行/跨应用依赖提示 | C | 冲突/依赖可见 |

---

## 4. 非功能需求

> 说明：涉及第 9 节 D-01..D-16 的条目为“待决策”项；决策前按推荐默认执行，不构成冻结需求。

### 4.1 可构建性

| ID | 需求 | 验收标准 |
|---|---|---|
| NFR-BUILD-001 | 单仓 + 统一工具链；一条命令拉起开发环境 | 新开发者 ≤30 分钟完成环境准备 |
| NFR-BUILD-002 | CI 可重复构建；依赖/工具链锁定 | 同 commit 产物 digest 一致；CI ≤10 分钟 |
| NFR-BUILD-003 | 服务模板、CI 模板、Helm 模板、迁移模板 | 新服务从模板到上线 ≤1 天 |
| NFR-BUILD-004 | 本地/预览环境支持 K8s、Harbor、Argo CD、Kyverno | 预览环境可跑 E2E/签名拒绝/回滚 |

### 4.2 可修改性

| ID | 需求 | 验收标准 |
|---|---|---|
| NFR-MOD-001 | database-per-service；禁止跨库查询 | 单服务可独立变更/发布 |
| NFR-MOD-002 | API/事件版本化；Buf breaking check | 破坏性变更 100% 被 CI 拦截 |
| NFR-MOD-003 | 功能开关与能力热加载 | 开关生效 ≤30 秒；无需重启 |
| NFR-MOD-004 | 插件接口：LLM/Embedding/通知/仓库连接器 | 新增 Provider 不改 Agent 核心 |
| NFR-MOD-005 | ADR 与变更评审 | 关键变更均有 ADR 与 reviewer |

### 4.3 可测试性

| ID | 需求 | 验收标准 |
|---|---|---|
| NFR-TEST-001 | 测试金字塔：单元/集成/契约/E2E/Agent 评测/混沌/性能/安全 | 各层有明确门禁 |
| NFR-TEST-002 | 契约测试与 Schema 兼容检查 | 破坏性契约变更 100% 拦截 |
| NFR-TEST-003 | Agent 黄金任务集与回归 | ≥50 条；提示词/模型变更必须回归 |
| NFR-TEST-004 | 关键路径覆盖率与场景门禁 | 核心服务单元 ≥70%；关键路径分支 ≥70% 且场景 100% 通过 |
| NFR-TEST-005 | E2E 可在预览环境执行 | 冒烟 ≤15 分钟；flaky <1% |
| NFR-TEST-006 | 测试替身：LLM 录制回放、Gitea fake、K8s fake | 测试不依赖真实外部服务 |

### 4.4 可重用性

| ID | 需求 | 验收标准 |
|---|---|---|
| NFR-REUSE-001 | 共享 Go 基础库、Python SDK、前端设计系统 | 新服务/Agent 复用率 ≥80% |
| NFR-REUSE-002 | 能力目录、提示词库、评测集、流水线模板 | 可被多项目引用；版本化 |
| NFR-REUSE-003 | 生成应用模板：健康、指标、日志、鉴权、配置 | 新应用从模板到 test ≤1 小时 |
| NFR-REUSE-004 | 共享 Helm/CI/迁移/SLO/告警模板 | 新服务无需复制粘贴 |

### 4.5 可供应性

| ID | 需求 | 验收标准 |
|---|---|---|
| NFR-SUPPLY-001 | Harbor 存镜像/SBOM/签名/扫描报告；digest 不可变 | prod 镜像 100% 可追溯 |
| NFR-SUPPLY-002 | 镜像签名 + SBOM + provenance；Kyverno 准入校验 | 未签名/无 provenance 100% 拒绝 |
| NFR-SUPPLY-003 | 依赖/许可证/密钥扫描；漏洞 SLA | Critical 24h、High 7d、Medium 30d |
| NFR-SUPPLY-004 | 构建身份与部署身份分离；签名密钥 KMS/HSM（D-02 待决策） | 构建 Job 无法获得 prod 部署凭据 |
| NFR-SUPPLY-005 | 支持离线/气隙信任根 | 离线环境可验证签名与 SBOM |

### 4.6 可部署性

| ID | 需求 | 验收标准 |
|---|---|---|
| NFR-DEPLOY-001 | GitOps/Helm/Kustomize；test 自动、prod 审批 | test ≤10 分钟；prod 晋升 ≤15 分钟 |
| NFR-DEPLOY-002 | prod 按 digest 部署；回滚 ≤5 分钟 | 零停机；回滚成功 |
| NFR-DEPLOY-003 | deploy-config 独立仓；prod overlay 保护 | Agent 不能改 prod 清单 |
| NFR-DEPLOY-004 | 数据库迁移 pre-sync Job；expand/contract | 应用启动不迁移；兼容 N-2 |
| NFR-DEPLOY-005 | 平台自身发布：金丝雀、观察窗口、自动回滚（D-11 待决策：preview 环境） | 单环境升级可回滚；DB 兼容 |
| NFR-DEPLOY-006 | 部署指标：频率、Lead Time、失败率、MTTR | 大盘可见；季度复盘 |

### 4.7 可靠性 / 可用性

| ID | 需求 | 验收标准 |
|---|---|---|
| NFR-REL-001 | 平台 API 月度可用性 ≥99.5% | SLO 达标；错误预算可见 |
| NFR-REL-002 | 生成应用按应用定义 SLO，默认 99.5% | 应用大盘可查；告警到 Owner |
| NFR-REL-003 | 无状态服务 ≥2 副本、PDB、反亲和、HPA | 单 Pod/节点故障无用户可见中断 |
| NFR-REL-004 | PostgreSQL 3 实例、Redis HA、MinIO 纠删码、Qdrant 副本 | 主备切换演练通过 |
| NFR-REL-005 | 备份与 PITR；季度恢复演练（D-08 待决策：Gitea/RPO） | 元数据/app-data RPO ≤15 分钟、RTO ≤2 小时 |
| NFR-REL-006 | 按数据类发布 RPO/RTO；SPOF 登记册（D-08 待决策） | 代码/镜像/向量等分级承诺；SPOF 有 owner/演练 |
| NFR-REL-007 | 故障边界：控制面故障不影响已部署应用；数据面故障明确降级 | 故障注入验证 |
| NFR-REL-008 | 运行面容忍窗口与 break-glass 回滚 | 平台故障时仍可告警/回滚 |

### 4.8 安全性 / 隐私

| ID | 需求 | 验收标准 |
|---|---|---|
| NFR-SEC-001 | 虚拟账号、Argon2id、MFA、RBAC、最小权限 | 跨项目访问 100% 拒绝；管理员 MFA 100% |
| NFR-SEC-002 | 服务身份：mTLS/签名令牌、audience、TTL、method-level 授权（mTLS 为 D-06 待决策；基线签名令牌 + NetworkPolicy） | 未认证/过期/重放请求被拒 |
| NFR-SEC-003 | 任务令牌不进 LLM/沙箱；工具调用按需换取 | LLM 请求/沙箱无令牌 |
| NFR-SEC-004 | KEK 外部 KMS/HSM/Vault；DEK 分项目；轮换与吊销（D-03 待决策） | KEK 不落 K8s Secret；轮换演练通过 |
| NFR-SEC-005 | 默认拒绝网络；出站白名单；Pod Security restricted | 网络扫描/越权测试通过 |
| NFR-SEC-006 | 生成应用 OIDC audience/client/redirect 白名单；cookie 隔离（D-07 待决策） | A token 调 B 401；未认证 401/403 |
| NFR-SEC-007 | 审计追加式、哈希链、WORM、KMS checkpoint | 篡改可检测；审计不可写时 fail-closed |
| NFR-SEC-008 | 供应链签名、SBOM、provenance、准入 | 未签名/无 provenance 100% 拒绝 |
| NFR-SEC-009 | 漏洞管理、渗透测试、红队 | 上线前完成；高危清零 |
| NFR-PRIV-001 | 数据分级；机密/秘密默认本地模型或禁止外发（D-10 待决策） | 出网策略可验证 |
| NFR-PRIV-002 | LLM 脱敏（密钥/PII/代码感知）；provider allowlist/DPA | 日志/提示词无明文密钥 |
| NFR-PRIV-003 | 缓存按项目隔离；Qdrant 项目隔离 | 跨项目检索/缓存命中 0 |
| NFR-PRIV-004 | 删除传播到 DB/Qdrant/LangFuse/日志/缓存/备份 | 删除 SLA 可验证 |
| NFR-PRIV-005 | 审计/日志/观测按项目租户隔离 | 非授权用户不可见 |

### 4.9 韧性

| ID | 需求 | 验收标准 |
|---|---|---|
| NFR-RES-001 | 超时、幂等重试、熔断、舱壁、限流 | 单依赖故障不级联 |
| NFR-RES-002 | 队列背压、MAXLEN、lag 监控、429/Retry-After | 队列不无限堆积；恢复后自动排空 |
| NFR-RES-003 | DLQ 深度告警、重放工具、保留期、归属人 | DLQ 可处理；无静默丢失 |
| NFR-RES-004 | 降级：LLM/Qdrant/Gitea/观测不可用 | 降级路径可演练 |
| NFR-RES-005 | 混沌实验：Pod/节点/依赖/DB 切换/网络分区 | 季度通过；无数据丢失 |
| NFR-RES-006 | 恢复排空顺序与重试预算 | 审计→Outbox→任务→Webhook；重试 ≤10% |

### 4.10 Safety

| ID | 需求 | 验收标准 |
|---|---|---|
| NFR-SAFE-001 | Agent 权限最小化、沙箱、prod 审批、爆炸半径限制 | Agent 无法访问 prod；审批 100% |
| NFR-SAFE-002 | 任务硬上限与四级 kill switch | 超限终止；≤1 分钟生效 |
| NFR-SAFE-003 | 不可信输入隔离、规划/执行分离、输出校验 | 注入用例不越权 |
| NFR-SAFE-004 | 高风险工具审批、策略版本绑定、fail-closed | 旧任务不扩权；禁用即拒绝 |
| NFR-SAFE-005 | 运行安全：PSP/PSA、gVisor、taint、Kyverno | 逃逸/越权测试通过 |
| NFR-SAFE-006 | 红队、hazard log、残余风险签核 | 上线前完成；高危清零 |

### 4.11 可服务性

| ID | 需求 | 验收标准 |
|---|---|---|
| NFR-SVC-001 | 指标/日志/链路/审计统一；trace_id 贯穿 | 覆盖 ≥95%；检索 ≤1 分钟 |
| NFR-SVC-002 | 每服务健康/就绪/启动探针；管理端口分离 | 故障可定位；不影响业务端口 |
| NFR-SVC-003 | 每告警有 Runbook、分级、升级、值班 | 100% 告警有 Runbook |
| NFR-SVC-004 | 任务时间线、审计检索、支持包导出 | 5 分钟内导出 |
| NFR-SVC-005 | 备份/恢复/故障演练与复盘 | MTTR ≤30 分钟；季度演练 |

### 4.12 性能

| ID | 需求 | 验收标准 |
|---|---|---|
| NFR-PERF-001 | 平台 CRUD p95 ≤300 ms；列表 p95 ≤800 ms | 2× 峰值压测达标 |
| NFR-PERF-002 | MCP 网关内开销 p95 ≤100 ms | 不含后端耗时；可观测 |
| NFR-PERF-003 | 任务排队 p95 ≤30 秒；沙箱启动 p95 ≤5 秒（预热） | 超限告警/限流 |
| NFR-PERF-004 | LLM 首 Token p95 ≤3 秒 | 超限降级/告警 |
| NFR-PERF-005 | 需求分析系统耗时 ≤5 分钟（不含人工确认） | 分段计时 |
| NFR-PERF-006 | test 部署 ≤10 分钟；prod 晋升 ≤15 分钟（不含审批等待） | 分段计时 |
| NFR-PERF-007 | 性能目标区分系统耗时与人工等待 | 度量字典明确 |

### 4.13 可伸缩性

| ID | 需求 | 验收标准 |
|---|---|---|
| NFR-SCALE-001 | 无状态服务 HPA；Agent/沙箱 KEDA/节点池扩容 | 10× 任务负载可线性扩容 |
| NFR-SCALE-002 | 每个 HPA 定义 maxReplicas；连接预算 | 不因线性外推打爆 PG |
| NFR-SCALE-003 | 队列/沙箱扩容触发先于 SLO 击穿 | p95 >20 秒或利用率 >60% 触发 |
| NFR-SCALE-004 | DB 读副本/分区/归档；Redis 拓扑明确 | 容量模型可验证 |
| NFR-SCALE-005 | 容量模型与扩容触发文档化 | 季度复核；压测证据 |

### 4.14 易用性

| ID | 需求 | 验收标准 |
|---|---|---|
| NFR-UX-001 | 新用户 15 分钟完成首个项目+需求+Agent 任务 | 首次任务完成率 ≥90% |
| NFR-UX-002 | Agent 透明：计划/依据/diff/测试/审批 | 用户可理解并干预 |
| NFR-UX-003 | 错误提示：人话+错误码+处置建议 | 无死胡同；可复制 |
| NFR-UX-004 | 无障碍 WCAG 2.1 AA、响应式、中文 | 审计通过 |
| NFR-UX-005 | 审批界面证据完整：diff/测试/风险/回滚 | 审批人可独立决策 |
| NFR-UX-006 | SUS ≥80，每 persona ≥5 人 | 有样本量与置信区间 |

---

## 5. 数据需求

| ID | 需求 | 验收标准 |
|---|---|---|
| DR-001 | 数据所有权：每服务独立 database；禁止跨库查询 | 所有权矩阵与设计一致 |
| DR-002 | 平台元数据与 app-data 物理分库 | 故障域隔离可验证 |
| DR-003 | 审计日志追加式、哈希链、WORM、保留 180 天 | 篡改检测；导出可验证 |
| DR-004 | 备份：每日全量 + PITR；季度恢复演练 | RPO/RTO 按数据类达标 |
| DR-005 | 数据分级：公开/内部/机密/秘密；PII 最小化 | 分级标签覆盖核心数据 |
| DR-006 | 删除传播：DB/Qdrant/LangFuse/Loki/Redis/OSS/备份 | 删除 SLA 可验证 |
| DR-007 | 生成应用数据按应用+环境隔离；配额/连接限制/超时 | 跨应用访问 0；超限拒绝 |
| DR-008 | 事件 Schema Registry；事件带 aggregate_id/version | 兼容性 CI 通过；乱序拒绝 |
| DR-009 | Outbox 分区/清理/监控 | 最老未投递 ≤60 秒；表不无限增长 |
| DR-010 | 数据保留：日志 30 天热/180 天冷；链路 7 天；指标 90 天 | 到期自动清理；可审计 |
| DR-011 | 迭代数据：Iteration、IterationRequirement；归属 ReqMgmt；历史保留 | 需求移入/移出可追溯 |
| DR-012 | 发布数据：Release、ReleaseItem、ReleaseItemRequirement、ReleaseApproval；归属 CICD；发布记录不可变 | 可按迭代/应用/需求反查 |

---

## 6. 接口需求

| ID | 接口 | 需求 | 验收标准 |
|---|---|---|---|
| IR-API-001 | REST | 版本化、OpenAPI、统一错误模型、分页/幂等 | 契约测试通过；破坏性变更拦截 |
| IR-MCP-001 | MCP | Streamable HTTP + SSE；initialize/tools/list/tools/call/取消 | 工具按 scope 过滤；调用审计 |
| IR-OIDC-001 | OIDC | authorization code + PKCE、JWKS、userinfo、每应用 audience | 非法 redirect/audience 拒绝 |
| IR-GITEA-001 | Gitea | 仓库/分支/MR/Webhook；验签、幂等、重试 | 重复 Webhook 不重复处理 |
| IR-K8S-001 | K8s | namespace/Deployment/Ingress/Job；受限 SA、NetworkPolicy | 无 cluster-admin；跨 namespace 拒绝 |
| IR-LLM-001 | LLM | Provider 抽象、脱敏、限额、重试/降级、流式 | 无明文密钥；超限拒绝 |
| IR-OBS-001 | OTEL | traces/metrics/logs；W3C traceparent；采样 | 跨服务链路完整 |
| IR-EVENT-001 | 事件 | 信封含 event_id/type/version/aggregate_id/version/trace_id | 消费者幂等/排序 |
| IR-DB-001 | 数据库 | 每服务独立角色/迁移；PgBouncer | 无跨库权限 |
| IR-STORAGE-001 | 对象存储 | S3 兼容；预签名 URL；版本/生命周期/加密 | 公开读禁止；URL 过期 |
| IR-UI-001 | 微前端 | qiankun 清单、入口、版本、路由、权限 | 子应用独立发布/降级 |

---

## 7. 约束与假设

| 编号 | 约束/假设 |
|---|---|
| C-01 | 平台自身单环境；test/prod 只属于生成应用 |
| C-02 | 用户使用平台发放的虚拟账号，一人一号；不做企业 SSO/强多租户 |
| C-03 | 允许外部 DeepSeek，但必须经 LLM Gateway 脱敏、审计、限额 |
| C-04 | 能力仅平台内置；Gitea 唯一代码仓；文档平台自管 |
| C-05 | 8 个 Go 服务独立部署；服务间 gRPC + 事件 |
| C-06 | Agent 半自动；prod 晋升必须人工审批；沙箱无 prod 凭据 |
| C-07 | 生成应用复用平台 app-data，按应用+环境逻辑隔离 |
| C-08 | 私有云/自建 K8s + containerd；对象存储 S3 兼容（默认 MinIO） |
| C-09 | 规模未锁定；基线 100 用户/20 并发任务/30 沙箱；SLA 99.5% |
| C-10 | 6–8 人团队；MVP 3–5 个月；完整 hardening 4–6 个月 |
| C-11 | MVP 单参考栈（默认 Go + React）；多栈后续 |
| C-12 | MVP 不引入服务网格；mTLS 作为增强项 |

---

## 8. 验收与追踪

### 8.1 质量属性验收场景

| ID | 属性 | 场景 | 期望 | 关联需求 |
|---|---|---|---|---|
| QA-01 | 可靠性 | 杀一个 API Pod | 无用户可见中断 | NFR-REL-001/003 |
| QA-02 | 性能 | 2× 峰值压测 | p95 达标、错误率 <1% | NFR-PERF-001/002 |
| QA-03 | 安全 | 跨项目令牌访问 | 403 + 审计 | FR-AUTH-005/FR-OBS-006 |
| QA-04 | Safety | Coding Agent 尝试 prod 部署 | 被阻断，需人工审批 | FR-CICD-006/FR-SAFE-001 |
| QA-05 | 韧性 | LLM API 中断 30 分钟 | 任务排队、不丢状态、恢复继续 | NFR-RES-004 |
| QA-06 | 可部署性 | prod 回滚 | 5 分钟内恢复上一版本 | NFR-DEPLOY-002 |
| QA-07 | 可供应性 | 未签名/无 provenance 镜像部署 | 准入拒绝 | NFR-SUPPLY-002 |
| QA-08 | 可测试性 | 破坏性契约变更 | CI 失败 | NFR-TEST-002 |
| QA-09 | 可修改性 | 关闭某能力 MCP | 30 秒内 tools/list 不再返回 | FR-CAP-002/008 |
| QA-10 | 可伸缩性 | 10× 任务负载 | worker 扩容、队列不失控 | NFR-SCALE-001/003 |
| QA-11 | 易用性 | 新用户首次使用 | 15 分钟完成首个任务 | NFR-UX-001 |
| QA-12 | 可服务性 | 典型告警 | 按 Runbook 30 分钟恢复 | NFR-SVC-003/005 |
| QA-13 | 隐私 | 提示词含密钥 | 脱敏、不写日志 | NFR-PRIV-002 |
| QA-14 | 可构建性 | 新服务从模板创建 | 1 天内上线 | NFR-BUILD-003 |
| QA-15 | 可重用性 | 新应用从模板创建 | 1 小时内跑通 test | NFR-REUSE-003 |
| QA-16 | 故障域 | test 跑飞查询/磁盘写满 | prod SLO 不受影响（若采用隔离） | NFR-REL-007/DR-007 |
| QA-17 | 供应链 | 恶意 Dockerfile/依赖 | 无法读取平台/prod 凭据 | NFR-SUPPLY-004/FR-CICD-003 |
| QA-18 | 审批 | 审批后替换 digest | 晋升失效/被拒 | FR-CICD-006 |
| QA-19 | 生成应用鉴权 | A 应用 token 调 B；未认证访问 | 401/403 | FR-RUNTIME-006/FR-AUTH-008 |
| QA-20 | 身份治理 | 管理员未完成 MFA | 管理动作被拒 | FR-AUTH-003 |
| QA-21 | 审计 | 篡改审计记录 | 链校验发现并告警 | NFR-SEC-007 |
| QA-22 | 隐私 | 机密项目代码外发 | 默认阻止或本地模型 | NFR-PRIV-001 |
| QA-23 | 沙箱 | 上一任务 canary 文件 | 新任务不可见 | FR-SAFE-002 |
| QA-24 | Safety | 触发 kill switch | ≤1 分钟停止调度/杀沙箱 | FR-AGENT-013/FR-SAFE-008 |
| QA-25 | 故障边界 | 平台控制面/数据面故障 | 应用继续服务/明确降级 | NFR-REL-007/008 |
| QA-26 | 韧性 | 平台 Argo CD 不可用 | break-glass 回滚可用 | FR-RUNTIME-012/NFR-REL-008 |
| QA-27 | 一致性 | 事件乱序/重复/重放 | 幂等、拒绝旧版本 | DR-008/IR-EVENT-001 |
| QA-28 | 背压 | 队列积压 | 限流/429、恢复排空 | NFR-RES-002 |
| QA-29 | 可靠性 | Gitea 恢复 | 按 RPO/RTO 恢复；GitOps 可重建 | NFR-REL-006 |
| QA-30 | 平台发布 | 单环境金丝雀失败 | 自动回滚；DB 兼容 | NFR-DEPLOY-005 |
| QA-31 | 迭代管理 | 需求关联迭代 | 迭代看板显示；发布计划包含 | FR-ITER-002/006 |
| QA-32 | 发布门禁 | 存在未就绪需求 | 发布阻断；延期后放行 | FR-ITER-004/007 |
| QA-33 | 协调批次 | 两应用发布，第二失败 | 第一保留、后续停止、状态 PARTIALLY_FAILED | FR-ITER-009 |
| QA-34 | 审批绑定 | 审批后 digest 变化 | 审批失效/拒绝 | FR-ITER-008/010 |
| QA-35 | 回滚/重试 | 失败项重试/回滚 | 幂等；审计完整 | FR-ITER-010/012 |

### 8.2 质量属性覆盖矩阵

| 属性 | 功能需求 | 非功能需求 | 验收 |
|---|---|---|---|
| 可构建性 | FR-ADMIN-005 | NFR-BUILD-001..004 | QA-14 |
| 可修改性 | FR-CAP-008/009 | NFR-MOD-001..005 | QA-09 |
| 可测试性 | FR-AGENT-015 | NFR-TEST-001..006 | QA-08 |
| 可重用性 | FR-ADMIN-006 | NFR-REUSE-001..004 | QA-15 |
| 可供应性 | FR-CICD-004 | NFR-SUPPLY-001..005 | QA-07/17 |
| 可部署性 | FR-CICD-005..010 | NFR-DEPLOY-001..006 | QA-06/18/30 |
| 可靠性/可用性 | FR-RUNTIME-009 | NFR-REL-001..008 | QA-01/16/25/29 |
| 安全性/隐私 | FR-AUTH-001..013 | NFR-SEC-001..009/NFR-PRIV-001..005 | QA-03/13/17/19/20/21/22 |
| 韧性 | FR-AGENT-003/004 | NFR-RES-001..006 | QA-05/26/27/28 |
| Safety | FR-SAFE-001..011 | NFR-SAFE-001..006 | QA-04/23/24 |
| 可服务性 | FR-OBS-001..011 | NFR-SVC-001..005 | QA-12 |
| 性能 | FR-AGENT-012 | NFR-PERF-001..007 | QA-02 |
| 可伸缩性 | FR-AGENT-017 | NFR-SCALE-001..005 | QA-10 |
| 易用性 | FR-UI-001..010 | NFR-UX-001..006 | QA-11 |
| 需求迭代/批次发布 | FR-ITER-001..018 | NFR-DEPLOY-002/006、NFR-REL-007 | QA-31..35 |

---

## 9. 风险、开放问题与待决策

| ID | 问题 | 影响 | 推荐默认 | 状态 |
|---|---|---|---|---|
| D-01 | test/prod 共用一套 app-data 是否满足隔离要求 | test 跑飞可能影响 prod；与“单环境故障只影响该环境”冲突 | 保留共享，但强制独立 database/role/配额/statement_timeout；prod 关键应用独立实例 | 待决策 |
| D-02 | 构建平面是否独立于平台服务 | 恶意代码/依赖可能读取平台凭据 | 平台集群内专用构建节点池 + gVisor + 无平台 SA + 出站白名单；条件允许时独立集群 | 已按推荐默认写入设计，待确认 |
| D-03 | KEK 是否允许 K8s Secret | 集群被攻破即全部凭据失守 | 强制外部 KMS/HSM/Vault；K8s Secret 仅本地开发 | 已按推荐默认写入设计，待确认 |
| D-04 | prod 晋升审批 owner | CICD/TaskSched 双 owner 可能导致绕过 | CICD Promotion 唯一 owner；发起人≠审批人；绑定 digest | 已按推荐默认写入设计，待确认 |
| D-05 | Argo CD 是否为 prod 唯一 reconciler | CICD 直连可能绕过审批 | 是；独立 deploy-config 仓；CICD 不持有 prod 凭据 | 已按推荐默认写入设计，待确认 |
| D-06 | 服务间是否强制 mTLS | 内部 gRPC 仅靠 NetworkPolicy 较弱 | 控制面强制 mTLS/签名令牌；数据面 signed token + NetworkPolicy | 待决策 |
| D-07 | 生成应用入口是否网关级鉴权 | 仅 SDK 校验，未认证路由可能直达 | 网关 ext_authz/JWT + 每应用 audience；SDK 第二层 | 待决策 |
| D-08 | Gitea 单实例 RPO 24h 是否可接受 | 与平台 RPO 15 分钟冲突 | 跨 AZ 主备或 5–15 分钟增量备份；GitOps 清单镜像到 OCI | 待决策 |
| D-09 | MVP 是否接受 25 个部署单元/6–8 人 | 3–5 个月风险高 | 保持逻辑边界，Phase 合并部署/裁剪非核心微应用；先 1–2 个试点应用 | 待决策 |
| D-10 | 机密项目是否允许外部 LLM | 代码/日志外发风险 | 机密/秘密默认本地模型或禁止外发；普通项目脱敏后外发 | 待决策 |
| D-11 | 平台自身发布是否需要独立 preview 环境 | 单环境升级风险 | 预览 namespace/kind 集群 + 金丝雀 + 自动回滚 | 待决策 |
| D-12 | Qdrant 是否每项目独立 collection | 共享 collection 仅靠 payload 过滤 | 优先每项目 collection；至少 tenant 索引 + 服务层强制过滤 | 待决策 |
| D-13 | 迭代是否引入故事点/燃尽图 | 增加过程管理复杂度 | 本期不做；迭代=发布批次，保留 start/end/goal | 待决策 |
| D-14 | 迭代发布审批粒度 | 批量审批 vs 逐应用审批 | 批量审批 + 高风险应用双人；digest 绑定 | 待决策 |
| D-15 | 发布项并行/串行 | 串行安全但慢 | 默认串行；独立应用可配置并行组 | 待决策 |
| D-16 | 一个需求是否可跨多个活跃迭代 | 影响范围与报表 | 同一时间仅一个活跃迭代；历史保留 | 待决策 |

---

## 10. 附录

### 10.1 事件目录（摘要）

| 事件 | 生产者 | 消费者 | 用途 |
|---|---|---|---|
| project.created / provisioning_failed | ReqMgmt | Auth, DocRepo, CapManager, RouteMgmt | 项目开通 |
| app.created / app.provisioned / app.deleted | ReqMgmt/CICD | RouteMgmt, Auth, CICD | 应用生命周期 |
| requirement.created / approved / changed | ReqMgmt | TaskSched, AgentOrch | 分析/方案/增量 |
| repo.created / mr.opened / mr.merged | DocRepo | CICD, TaskSched, ReqMgmt | 代码与流水线 |
| doc.updated | DocRepo | Embedding | RAG 增量索引 |
| capability.policy.changed | CapManager | UniGateway | 热加载 |
| task.created / succeeded / failed / cancelled | TaskSched | ReqMgmt, CICD, 通知 | 任务状态 |
| pipeline.started / succeeded / failed | CICD | TaskSched, ReqMgmt, RouteMgmt | 流水线状态 |
| deployment.succeeded / failed / rolled_back | CICD | RouteMgmt, ReqMgmt, 告警 | 部署状态 |
| promotion.requested / approved / rejected | CICD | TaskSched, 通知, 审计 | 晋升审批 |
| llm.call.completed | LLM Gateway | Auth 审计, LangFuse | LLM 观测 |
| audit.event | 所有服务 | Auth | 审计落库 |
| iteration.created / updated / closed | ReqMgmt | CICD, 通知 | 迭代生命周期 |
| requirement.assigned_to_iteration / deferred | ReqMgmt | TaskSched, CICD, 通知 | 需求范围变更 |
| iteration.release_requested | ReqMgmt | CICD | 发起批次发布 |
| release.started / item_succeeded / item_failed / succeeded / partially_failed / rolled_back | CICD | ReqMgmt, RouteMgmt, 通知 | 批次发布状态 |

### 10.2 需求索引

- 账号与权限：FR-AUTH-001..013
- 项目与应用：FR-PROJ-001..010
- 需求管理：FR-REQ-001..011
- 文档与代码仓：FR-REPO-001..010
- Agent：FR-AGENT-001..018
- 能力与 MCP：FR-CAP-001..013
- CI/CD：FR-CICD-001..013
- 运行平面：FR-RUNTIME-001..012
- 可观测与审计：FR-OBS-001..011
- 前端：FR-UI-001..010
- 平台管理：FR-ADMIN-001..008
- 统一网关：FR-GW-001..008
- 路由管理：FR-ROUTE-001..004
- Safety：FR-SAFE-001..011
- 需求迭代与批次发布：FR-ITER-001..018
- 非功能：NFR-BUILD/MOD/TEST/REUSE/SUPPLY/DEPLOY/REL/SEC/PRIV/RES/SAFE/SVC/PERF/SCALE/UX
- 数据：DR-001..010
- 接口：IR-API/MCP/OIDC/GITEA/K8S/LLM/OBS/EVENT/DB/STORAGE/UI

### 10.3 参考

1. [AI DevOps 平台总体设计方案](2026-10-23-ai-devops-platform-design.md)
2. 平台定位与差异化（用户 2026-10-23 确认）
3. 平台环境模型（平台单环境；test/prod 属于生成应用）
4. 独立评审发现（2026-10-23，16 项，含 8 项高优先级）

---

**文档结束。**
