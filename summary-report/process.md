# 过程记录

## 1. 需求理解

题目要求实现一个"AI 辅助研发工作项流转与需求澄清系统"。核心场景是：研发团队产生工作项（Story / Bug / Task）后，需要经过需求澄清 → 排期 → 开发 → 测试 → 完成的标准化流程。在每个阶段，系统需要辅助澄清模糊点、识别风险、记录决策。

拆解出的核心对象：

| 对象                             | 说明                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| **工作项 (WorkItem)**            | 核心实体，承载标题、描述、类型、优先级、负责人、标签、风险等级、验收标准             |
| **状态流转 (Status Transition)** | 六阶段状态机：DRAFT → ANALYZING → READY → IN_PROGRESS → TESTING → DONE               |
| **澄清问题 (Clarification)**     | 挂载在工作项下的待确认问题，有严重程度（HIGH/MEDIUM/LOW）和解决状态（OPEN/RESOLVED） |
| **AI 分析 (AI Analysis)**        | 对工作项的结构化分析：摘要、建议验收标准、风险识别、建议澄清问题、任务拆解           |
| **负责人 (Assignee)**            | 可搜索、可新建的人员元数据                                                           |
| **标签 (Tag)**                   | 可增删的标签库，工作项以数组形式引用                                                 |

三条核心业务规则：

1. **状态机约束**：状态流转必须沿预定义路径，不可跳转（如 DRAFT → IN_PROGRESS 非法）
2. **澄清阻断**：存在未解决的 HIGH 严重程度澄清问题时，阻止进入 READY 及之后的交付状态
3. **完成锁定**：DONE 状态不可再流转

---

## 2. 任务拆解

按依赖关系拆为七个阶段，前三个阶段可部分并行：

| 阶段        | 任务                                                            | 产出                                      |
| ----------- | --------------------------------------------------------------- | ----------------------------------------- |
| 1. 数据模型 | Prisma Schema 设计（6 个模型 + 关系 + 索引）                    | `prisma/schema.prisma`                    |
| 2. 状态机   | 状态定义、流转矩阵、阻断校验、单元测试                          | `lib/state-machine.ts` + 5 个 Vitest 用例 |
| 3. 基础库   | 类型定义、校验器、序列化器、DB 工具、错误处理                   | `lib/*.ts` (12 个文件)                    |
| 4. API 路由 | 15 个 REST 端点（CRUD + 流转 + 澄清 + AI 分析 + 负责人 + 标签） | `app/api/*` (9 个文件)                    |
| 5. UI 组件  | shadcn 基础组件 + 业务组件（看板、详情面板、状态流、指标卡）    | `components/*` (23 个文件)                |
| 6. 种子数据 | 24 条中文研发场景                                               | `prisma/seed.ts`                          |
| 7. 测试     | Vitest 单元测试 + Playwright E2E (12 用例) + API 冒烟测试       | `tests/*` + `e2e/*`                       |

实际执行顺序：1 → 2+3（并行）→ 4 → 5 → 6 → 7。UI 和 API 之间有多次交叉迭代（如发现 API 缺少字段时回补）。

---

## 3. 技术方案

| 层级     | 选型                      | 理由                                            |
| -------- | ------------------------- | ----------------------------------------------- |
| 框架     | Next.js 16 App Router     | 页面 + API Route 全栈，无需额外后端             |
| 语言     | TypeScript (strict)       | 全量类型约束，减少运行时错误                    |
| 样式     | TailwindCSS 4 + shadcn/ui | 原子化 CSS + 高质量组件库，风格一致             |
| 动效     | Motion (Framer Motion)    | 卡片悬浮、指标呼吸、入场动画                    |
| 数据库   | SQLite + Prisma ORM       | 零配置本地持久化，Prisma 提供类型安全的查询 API |
| 校验     | Zod                       | Schema 定义即类型，复用在前端表单和后端 API     |
| 图标     | Lucide React              | 统一图标系统，tree-shakable                     |
| 单元测试 | Vitest                    | 与 Vite/Next.js 生态天然兼容                    |
| E2E 测试 | Playwright                | 浏览器自动化，支持 Chromium                     |
| AI Mock  | 规则型 Mock Service       | 关键词匹配 + 模式判断，预留真实 LLM 替换接口    |

**工程结构**：

```
app/           # Next.js App Router（页面 + API Route）
  api/         # 15 个 REST 端点
  page.tsx     # 唯一页面
components/
  ui/          # shadcn 基础组件（14 个）
  workspace/   # 业务组件（9 个）
lib/           # 共享逻辑（12 个文件）
prisma/        # Schema + 种子数据
tests/         # Vitest 单元测试（3 个文件）
e2e/           # Playwright E2E（6 个文件）
```

**关键设计决策**：

- **状态机前后端复用**：`lib/state-machine.ts` 中的 `validateTransition()` 在前端（ContextMenu 流转菜单、拖动判断）和后端（`PATCH /status`）复用同一份校验逻辑，避免行为不一致
- **API 返回完整 WorkItemDTO**：所有变更操作（创建、编辑、流转、澄清 CRUD、AI 分析）均返回更新后的完整 `WorkItemDTO`，前端通过 `upsertItem()` 就地更新，避免重新拉取列表
- **Mock AI 可替换**：`lib/ai-service.ts` 导出单一 `analyzeWorkItem()` 函数，替换真实 LLM 只需改这个文件，接口签名不变

---

## 4. API / 数据 / 状态设计

### 数据模型

六个 Prisma 模型，SQLite 存储：

```
WorkItem (主表)
  ├── ClarificationQuestion (1:N, 级联删除)
  ├── AiAnalysis (1:N, 级联删除)
  └── StatusHistory (1:N, 级联删除)

Tag (独立元数据)
Assignee (独立元数据)
```

### API 设计

统一响应格式 `{ data: T }` / `{ error: { code, message, details? } }`，共 15 个接口（详见 [`api-design-proposal.md`](api-design-proposal.md)）。

### 状态设计

前端状态全部在 `WorkItemConsole` 组件中以 `useState` 管理，无全局状态库：

| 状态                                        | 用途                     |
| ------------------------------------------- | ------------------------ |
| `items: WorkItemDTO[]`                      | 工作项列表（唯一数据源） |
| `selectedId` + `detailOpen`                 | 当前选中 + 弹框开关      |
| `query` + `statusFilter` + `priorityFilter` | 搜索筛选条件             |
| `formMode` + `form`                         | 新建/编辑表单            |
| `busy`                                      | 按钮 loading 锁定        |
| `draggingId`                                | 拖拽中的工作项           |

数据流是单向的：API → `upsertItem()` → `setItems()` → 列表重渲染。不引入 React Query 或 SWR 等缓存层，保持简单。

---

## 5. AI 使用过程

全程使用 Codex（OpenAI GPT-5 编码 Agent）作为主力开发工具。详见 [`ai-usage.md`](ai-usage.md)。

核心使用模式：

- **生成型**：Prisma Schema、API 路由、UI 组件、测试用例的一次性生成
- **迭代型**：收到反馈后逐文件修改（工具栏高度、颜色调整、布局修复）
- **审查型**：写完代码后由 AI 做一致性检查、发现遗漏字段和不一致的模式

共调用 8 个 Codex Skills，覆盖从需求澄清到测试验证的完整开发流程。

---

## 6. 遇到的问题

| 问题                                 | 解决过程                                                                                                                                            |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Detail Panel 垂直排列失败**        | 容器 div 缺少 `flex-col`，默认为 `flex-row`。排查发现是生成时遗漏了 Tailwind class，手动补上                                                        |
| **工具栏元素高度不一致**             | StatusTabs 的 Tab 按钮是 `h-9`，但 Input/Select/Button 是 `h-8`。统一为 `h-9`，移除各处 `size="sm"` 和自定义高度                                    |
| **AnimatedNumber 从 0 动画到目标值** | 首次渲染时短暂显示 0 再跳变到实际值。根因是 `useSpring(0)` 从 0 开始。改为 `useMotionValue(value)` 直接显示当前值                                   |
| **READY 状态颜色与 DONE 区分度不够** | 原 teal 色与 emerald（DONE）视觉接近。改为 cyan，提高辨识度                                                                                         |
| **"添加到澄清问题"按钮缺少去重**     | 同一个 AI 建议问题可被重复添加。增加检查：已存在则置灰并显示"已添加"+ CheckCircle2 图标                                                             |
| **移动端看板列过窄**                 | 桌面端 fixed 6 列 grid 在手机上无法使用。改为 `overflow-x-auto` + `min-w-[280px]` + `lg:w-[calc(16.666%-0.75rem)]`，移动端横向滑动，桌面端保持 6 列 |
| **Playwright 全局初始化路径问题**    | Playwright 默认找不到 ESM 格式的 `globalSetup`。在 `playwright.config.ts` 中使用 `import.meta.url` 解析路径解决                                     |

---

## 7. 验证记录

| 验证方式                | 内容                                                                                                                 | 结果   |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- | ------ |
| `npm run test`          | 5 个 Vitest 状态机 + 表单辅助函数测试                                                                                | 全绿   |
| `npm run test:e2e:auto` | 12 个 Playwright 浏览器测试（看板/弹框/表单）                                                                        | 全绿   |
| `npm run e2e:smoke`     | API 冒烟测试（CRUD → 流转 → 阻断 → 解除阻断 → AI 分析 → 清理）                                                       | 全绿   |
| `npm run build`         | 生产构建                                                                                                             | 成功   |
| `npm run lint`          | ESLint                                                                                                               | 无报错 |
| 手动验证                | 浏览器打开 localhost:3000，逐个走通看板交互：搜索 → 点卡片 → 查看详情 → 流转状态 → 新建 → 编辑 → 删除 → 暗色模式切换 | 正常   |

---

## 8. 取舍说明

| 取舍                        | 原因                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **未接入真实 LLM**          | Mock 规则服务已覆盖分析流程的完整数据通路；真实 LLM 接入只需改 `lib/ai-service.ts` 一个文件，不影响其他模块         |
| **未做登录认证**            | 题目核心是工作项流转和 AI 辅助分析，认证是外围功能。当前所有操作以 "candidate" 身份执行，后续可加 NextAuth 或 Clerk |
| **未做分页**                | 种子数据仅 24 条，实际演示场景不太可能超百条。数据量大时加 `?page=&limit=` 即可                                     |
| **未做 URL 同步筛选条件**   | 当前筛选状态只在组件内，刷新会丢失。这个体验改进成本不高但非核心功能                                                |
| **DONE 状态不可退回**       | 题目描述中"DONE 后不可再流转"是明确规则，故意保持严格锁定。真实产品中可考虑加管理员强制退回                         |
| **未做 WebSocket 实时更新** | 单用户演示场景不需要。多用户协作时再加                                                                              |
