# AI 辅助研发工作项流转与需求澄清系统

在线地址：[https://ai-workflow.suxh.top](https://ai-workflow.suxh.top)

## 概述

前端方向。一个可运行的研发工作项看板，支持工作项 CRUD、六阶段状态流转、澄清问题生命周期管理和 AI 辅助分析。Next.js 16 全栈，SQLite + Prisma 持久化。

---

<p align="center" style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
  <img src="screenshot/screenshot_2026_5_27%2017-31-31.png" alt="工作项看板预览" width="640" />
  <img src="screenshot/screenshot_2026_5_27%2017-34-40.png" alt="工作项看板预览" width="640" />
</p>

## 功能清单

### 看板与工作项管理

- 六列看板：草稿 → 待分析 → 已准备 → 开发中 → 测试中 → 已完成
- 工作项 CRUD：新建、查看详情、编辑、删除
- 搜索：按关键词搜索标题、描述、负责人或标签
- 筛选：按状态 Tab 和优先级过滤
- 右上角状态指标：工作项总数、流转中、高危阻断，含 motion 呼吸动效

### 状态流转

- 按钮 / 右键菜单 / 拖拽三种方式流转
- 状态流转图：可视化完整状态路径
- 流转校验：非法跳转返回错误；高优先级未解决澄清问题阻断交付状态
- 状态历史：完整记录每次流转（操作人、时间、原因）

### 澄清问题

- 新增 / 回答 / 标记解决 / 重新打开 / 删除
- AI 建议澄清问题可一键添加（已添加自动置灰）

### AI 分析

- Mock AI Service 返回结构化分析：需求摘要、建议验收标准、风险点、建议澄清问题、任务拆解
- 替换真实 LLM 只需修改 `lib/ai-service.ts`

### 界面

- 响应式布局：桌面端 6 列看板，移动端水平滑动
- 暗色模式（ThemeToggle）
- 详情弹框：默认单列，最大化后左右双栏
- Motion 动效：卡片悬浮、指标呼吸光晕、入场动画

---

## 技术栈

<p align="center">
  <img src="public/claude-code.svg" alt="Claude Code" width="36" height="36" />&nbsp;&nbsp;
  <img src="public/codex.svg" alt="Codex" width="36" height="36" />&nbsp;&nbsp;
  <img src="public/model-context-protocol.svg" alt="model-context-protocol" width="36" height="36" />&nbsp;&nbsp;
  <img src="public/nextdotjs.svg" alt="Next.js" width="36" height="36" />&nbsp;&nbsp;
  <img src="public/typescript.svg" alt="TypeScript" width="36" height="36" />&nbsp;&nbsp;
  <img src="public/tailwind-css.svg" alt="TailwindCSS" width="36" height="36" />&nbsp;&nbsp;
  <img src="public/shadcn-ui.svg" alt="shadcn/ui" width="36" height="36" />&nbsp;&nbsp;
  <img src="public/motion.svg" alt="Motion" width="36" height="36" />&nbsp;&nbsp;
  <img src="public/sqlite.svg" alt="SQLite" width="36" height="36" />&nbsp;&nbsp;
  <img src="public/prisma.svg" alt="Prisma" width="36" height="36" />&nbsp;&nbsp;
  <img src="public/zod.svg" alt="Zod" width="36" height="36" />&nbsp;&nbsp;
  <img src="public/lucide.svg" alt="Lucide" width="36" height="36" />&nbsp;&nbsp;
  <img src="public/vitest.svg" alt="Vitest" width="36" height="36" />&nbsp;&nbsp;
  <img src="public/playwright.svg" alt="Playwright" width="36" height="36" />&nbsp;&nbsp;
  <img src="public/docker.svg" alt="Docker" width="36" height="36" />
</p>

| 层级     | 选型                      | 说明                  |
| -------- | ------------------------- | --------------------- |
| 框架     | Next.js 16 App Router     | 页面 + API Route 全栈 |
| 语言     | TypeScript (strict)       | 全量类型约束          |
| 样式     | TailwindCSS 4 + shadcn/ui | 响应式样式 + 无头UI   |
| 动效     | Motion (Framer Motion)    | 交互动画              |
| 数据库   | SQLite + Prisma ORM       | 持久化数据            |
| 校验     | Zod                       | 数据校验              |
| 图标     | Lucide React              | SVG图标库             |
| 单元测试 | Vitest                    | 状态机单元测试        |
| E2E 测试 | Playwright                | E2E 浏览器自动化测试  |

---

## 快速开始

```bash
npm install
npm run db:generate
npm run db:reset        # 重置 SQLite + 填充 24 条种子数据
npm run dev             # 启动开发服务器 → http://localhost:3000
```

### 可用命令

| 命令                      | 说明                                                          |
| ------------------------- | ------------------------------------------------------------- |
| `npm run dev`             | 启动 Next.js 开发服务器                                       |
| `npm run build`           | 生产构建                                                      |
| `npm run lint`            | ESLint 检查                                                   |
| `npm run test`            | Vitest 单元测试（8 个用例）                                   |
| `npm run test:e2e:auto`   | 全自动 E2E（重置DB → 启动服务 → 12 个浏览器测试 → HTML 报告） |
| `npm run test:e2e:ui`     | Playwright UI 调试模式                                        |
| `npm run test:e2e:report` | 查看 HTML 测试报告                                            |
| `npm run e2e:smoke`       | API 冒烟测试（CRUD → 流转 → 阻断 → AI 分析）                  |
| `npm run verify`          | 完整验证（lint + test + build + e2e）                         |
| `npm run db:reset`        | 重置数据库                                                    |
| `npm run db:push`         | 推送 schema 到数据库                                          |
| `npm run db:seed`         | 填充种子数据                                                  |

---

## Docker 部署

```bash
# 构建并启动
docker compose up -d --build

# 查看日志
docker compose logs -f

# 停止
docker compose down
```

容器启动时自动执行 `prisma db push` 创建表结构。SQLite 数据通过 Docker volume 持久化，重建容器不会丢失数据。

访问 `http://localhost:3000`。

### 镜像结构

| 阶段      | 说明                                                        |
| --------- | ----------------------------------------------------------- |
| `deps`    | 安装生产依赖                                                |
| `builder` | Prisma Client 生成 + Next.js standalone 构建                |
| `runner`  | Alpine + Node.js，复制构建产物，entrypoint 自动初始化数据库 |

---

## API 设计

统一返回格式：

```ts
{ data: T }
{ error: { code: string; message: string; details?: unknown } }
```

### 路由表

**工作项**

| 方法     | 路径                              | 说明                            |
| -------- | --------------------------------- | ------------------------------- |
| `GET`    | `/api/work-items`                 | 列表（`?q=&status=&priority=`） |
| `POST`   | `/api/work-items`                 | 新建                            |
| `GET`    | `/api/work-items/:id`             | 详情                            |
| `PATCH`  | `/api/work-items/:id`             | 编辑                            |
| `DELETE` | `/api/work-items/:id`             | 删除                            |
| `PATCH`  | `/api/work-items/:id/status`      | 状态流转                        |
| `POST`   | `/api/work-items/:id/ai-analysis` | 生成 AI 分析                    |

**澄清问题**

| 方法     | 路径                                             | 说明         |
| -------- | ------------------------------------------------ | ------------ |
| `POST`   | `/api/work-items/:id/clarifications`             | 新增澄清问题 |
| `PATCH`  | `/api/work-items/:id/clarifications/:questionId` | 更新澄清问题 |
| `DELETE` | `/api/work-items/:id/clarifications/:questionId` | 删除澄清问题 |

**负责人 & 标签**

| 方法     | 路径              | 说明                     |
| -------- | ----------------- | ------------------------ |
| `GET`    | `/api/assignees`  | 负责人列表（`?q=` 搜索） |
| `POST`   | `/api/assignees`  | 新增负责人               |
| `GET`    | `/api/tags`       | 标签列表                 |
| `POST`   | `/api/tags`       | 新增标签（upsert）       |
| `DELETE` | `/api/tags/:name` | 删除标签                 |

---

## 测试

### 单元测试 (Vitest) — 8 个用例

```bash
npm run test
```

- 状态机：合法流转、非法跳转、HIGH 阻断、HIGH 已解决放行、DONE 锁定
- 表单辅助：错误信息格式化、标签规范化去重

### API 冒烟测试 — 8 个 step

```bash
npm run e2e:smoke
```

完整业务闭环：列表读取 → 详情查询 → 标签 CRUD → 合法流转 → HIGH 阻断 → 解除阻断 → 继续流转 → AI 分析 → 创建编辑流转删除 → 404 验证。

### E2E 测试 (Playwright) — 12 个用例

```bash
npm run test:e2e:auto
```

全流程自动化：杀旧服务 → 重置数据库 → 启动 dev server → 浏览器测试 → HTML 报告。

| 测试文件                     | 覆盖                             |
| ---------------------------- | -------------------------------- |
| `e2e/board.spec.ts`          | 页面加载、Tab 切换、搜索、刷新   |
| `e2e/detail-dialog.spec.ts`  | 打开/关闭、内容显示、最大化/还原 |
| `e2e/work-item-form.spec.ts` | 新建、必填校验、创建并删除、关闭 |

---

## 核心设计

- **状态机** ([`lib/state-machine.ts`](lib/state-machine.ts))：前后端复用同一份 `validateTransition()`，非法流转/阻断校验逻辑一致
- **AI 服务** ([`lib/ai-service.ts`](lib/ai-service.ts))：规则型 Mock，替换真实 LLM 只需改一个文件，接口签名不变
- **API 返回策略**：所有变更操作返回完整 `WorkItemDTO`，前端 `upsertItem()` 就地更新，不重新拉取列表

---

## 项目文档

完整设计文档和过程记录见 [`summary-report/`](summary-report/)：

| 文档                                                              | 说明                                                    |
| ----------------------------------------------------------------- | ------------------------------------------------------- |
| [`api-design-proposal.md`](summary-report/api-design-proposal.md) | API 设计说明（15 个接口、输入/输出结构、错误码设计）    |
| [`ai-usage.md`](summary-report/ai-usage.md)                       | AI 使用说明（8 个 Skills、7 阶段参与、人工修正清单）    |
| [`process.md`](summary-report/process.md)                         | 过程记录（需求理解、任务拆解、技术方案、遇到的问题）    |
| [`test-plan.md`](summary-report/test-plan.md)                     | 测试说明（28 个用例覆盖矩阵、业务规则验证、未覆盖风险） |
| [`TEST-REPORT.md`](summary-report/TEST-REPORT.md)                 | 测试执行报告                                            |

---

## 本机环境

Node.js ===> v20.19.5

pnpm ===> v10.19.0

---

## 自我评价

### 完成情况

核心闭环已完整实现：启动后端 → 打开看板 → 展示工作项 → 查看详情 → 添加澄清问题 → 触发状态流转（含阻断提示） → AI 分析 → 展示结构化结果。题目要求的六阶段状态机、澄清问题阻断规则、非法流转提示、Mock AI 分析均通过了自动化测试验证。

### 加分项实现

拖拽看板、搜索筛选、表单校验、响应式布局、暗色模式、组件测试（Vitest）、E2E 测试（Playwright）、API 类型定义、错误边界、后台日志终端、可替换 AI Service 封装、完整后端服务（Prisma + SQLite）、Docker 部署均已实现。

### 技术取舍

Mock AI Service 而非真实 LLM 是时间约束下的务实选择。lib/ai-service.ts 的单一函数签名确保了替换成本极低：改一个文件、调用 OpenAI-compatible API 即可。未做登录认证和 WebSocket 协作：前者是外围功能，后者在单用户演示场景无必要。前端状态管理采用 useState 而非 React Query，因为变更操作返回完整 WorkItemDTO 使得 upsertItem() 模式比缓存失效更直接。

### 风险

Seed 数据仅 24 条，未验证百条以上的列表渲染性能和 API 响应时间。Playwright 未覆盖拖拽流转的原生浏览器事件（通过右键菜单和 API 层补偿覆盖了流转逻辑）。暗色模式未做 a11y 审计。

### 后续优化方向

- 接入真实 LLM（OpenAI-compatible）
- 登录认证和权限控制
- URL 同步筛选条件
- 负责人维度视图
- 增量列表更新（摒弃全量替换）
- 移动端原生拖拽体验优化
