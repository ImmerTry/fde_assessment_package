# AI 使用说明

## 1. 使用的 AI 工具

| 工具                                      | 用途                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| **Codex** (OpenAI GPT-5 驱动的编码 Agent) | 主力开发工具：需求分析、方案设计、代码生成、测试编写、Bug 修复、文档撰写 |
| **Codex Skills 体系**                     | 通过内置 Skills 扩展能力，按场景自动调度                                 |
| **Playwright (MCP)**                      | 浏览器自动化，用于 E2E 测试编写和页面验证                                |

**调用的 Skills**：

| Skill                                        | 使用场景                                                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `shadcn`                                     | 管理 shadcn/ui 组件（Button、Badge、Card、Dialog、Select、Input、ContextMenu 等），确保组件 API 和样式一致性 |
| `frontend-design`                            | 看板整体布局设计、配色方案、响应式断点、动效策略                                                             |
| `browser`                                    | 开发过程中打开 localhost 验证页面渲染、交互行为                                                              |
| `superpowers:brainstorming`                  | 需求澄清阶段梳理核心业务规则（状态机流转逻辑、阻断条件）                                                     |
| `superpowers:writing-plans`                  | 多步骤任务拆分（状态机实现 → UI 组件 → API 路由 → 测试）                                                     |
| `superpowers:test-driven-development`        | 状态机单元测试先行，再实现 `validateTransition()`                                                            |
| `superpowers:systematic-debugging`           | Detail Panel 布局错误、StatusTabs 高度不一致等问题的定位                                                     |
| `superpowers:verification-before-completion` | 每次改动后跑 `npm run verify` 确认零回归                                                                     |

---

## 2. 使用场景

| 阶段     | 是否使用 AI | 说明                                                                                                                                                                                              |
| -------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 需求理解 | ✅          | AI 帮助解析"AI 辅助研发工作项流转与需求澄清系统"的题目含义，梳理出六个核心实体（工作项、状态、澄清问题、AI 分析、负责人、标签）和三条核心业务规则（状态机合法流转、高优先级澄清阻断、已完成锁定） |
| 任务拆解 | ✅          | AI 按"数据模型 → 状态机 → API → UI 组件 → 测试"的依赖顺序拆解为七个阶段，并识别出状态机是可并行开始的关键路径                                                                                     |
| 方案设计 | ✅          | AI 建议了 Next.js App Router 全栈方案、SQLite + Prisma 持久化、Zod 校验、统一 JSON 响应格式；状态流转规则从前端到 API 复用同一份 `validateTransition()` 函数                                      |
| 代码生成 | ✅          | 全部 TypeScript/React 组件、API 路由、Prisma Schema、种子数据、样式均由 AI 生成，人工负责审查方向和调整细节                                                                                       |
| 测试生成 | ✅          | AI 编写了 Vitest 状态机单元测试（3 个用例）、Playwright E2E 测试（12 个用例，覆盖看板、弹框、表单）、API 冒烟测试脚本                                                                             |
| Bug 修复 | ✅          | 多个 UI 一致性问题（工具栏高度不统一、图标尺寸不一致、Detail Panel 缺少 `flex-col`、READY 状态颜色偏绿）由 AI 定位并修复                                                                          |
| 文档编写 | ✅          | README、TEST-REPORT、API 设计说明、本 AI 使用说明均由 AI 根据代码实际内容生成                                                                                                                     |

---

## 3. 关键 Prompt / Skill 摘要

以下为开发过程中的关键交互模式摘录（非完整对话）：

### 项目初始化

```
创建一个 Next.js 16 项目，使用 TypeScript、TailwindCSS 4 和 shadcn/ui。
初始化 Prisma + SQLite，定义 WorkItem、ClarificationQuestion、AiAnalysis、
StatusHistory、Tag、Assignee 六个模型。
```

### 状态机实现

```
设计工作项状态机：
- 六个状态：DRAFT → ANALYZING → READY → IN_PROGRESS → TESTING → DONE
- 合法流转路径如上箭头所示
- DONE 状态锁定，不可再流转
- 存在未解决的 HIGH 严重程度澄清问题时，阻止进入交付后续状态
- 流转校验逻辑前后端复用
```

### UI 布局

```
使用 frontend-design skill 设计看板主界面：
- 左侧 header 带标题和指标卡片
- 中间状态 Tab 栏 + 搜索框 + 优先级过滤
- 下方六列看板（桌面端 6 列 wrap，移动端水平滑动）
- 顶部渐变背景 + motion 入场动效
- 指标卡片含呼吸光晕（highlight/danger 阈值触发）
```

### E2E 测试

```
使用 Playwright 编写端到端测试：
- 看板加载、Tab 切换、搜索、刷新
- 详情弹框打开/关闭、内容显示、最大化/还原
- 新建工作项、必填校验、创建后删除
全自动化脚本：杀旧服务 → 重置 DB → 启动 dev → 跑 12 个用例 → 生成报告
```

### 种子数据

```
生成 24 条中文研发场景的种子数据，状态平均分布。
每条包含：真实标题、详细描述、验收标准、澄清问题、AI 分析。
使用 @faker-js/faker 提供随机性，负责人从预设名单中随机分配。
```

---

## 4. AI 生成内容

以下内容完全或主要由 AI 生成：

| 内容              | 文件/目录                                              | 说明                                 |
| ----------------- | ------------------------------------------------------ | ------------------------------------ |
| Prisma Schema     | `prisma/schema.prisma`                                 | 6 个模型定义 + 索引 + 级联关系       |
| 种子数据          | `prisma/seed.ts`                                       | 24 条中文场景数据                    |
| 类型定义          | `lib/types.ts`                                         | 全部 DTO 和枚举类型                  |
| 状态机            | `lib/state-machine.ts`                                 | 流转规则、阻断逻辑、常量定义         |
| 校验器            | `lib/validators.ts`                                    | 5 个 Zod Schema                      |
| AI 服务           | `lib/ai-service.ts`                                    | Mock 规则引擎                        |
| 序列化/数据库工具 | `lib/serializers.ts`, `lib/db.ts`, `lib/work-items.ts` | ORM 查询封装和 DTO 转换              |
| API 路由          | `app/api/*` (9 个文件)                                 | 15 个 REST 端点                      |
| UI 组件           | `components/ui/*` (14 个)                              | shadcn 基础组件                      |
| 业务组件          | `components/workspace/*` (9 个)                        | 看板主控、详情面板、状态流、指标卡等 |
| 单元测试          | `tests/*` (3 个文件)                                   | Vitest 状态机测试                    |
| E2E 测试          | `e2e/*` (6 个文件)                                     | 12 个 Playwright 用例 + 辅助脚本     |
| 文档              | `README.md`, `TEST-REPORT.md`, `templates/*`           | 项目说明、测试报告、过程文档         |

---

## 5. 人工修正内容

| 修正项                   | 说明                                                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| 工具栏高度统一           | AI 初始生成时 Select/Input/Button 在工具栏中使用了 `h-8`，与 StatusTabs 的 Tab 按钮不一致；人工指出后统一为 `h-9` |
| Dialog 关闭按钮尺寸      | 关闭和最大化/最小化按钮初始尺寸偏大，手动调整为 `size-8` / `size-3.5`                                             |
| Detail Panel 布局        | 首次生成时容器缺少 `flex-col`，默认为 `flex-row` 导致垂直排列失效；人工发现并修复                                 |
| READY 状态颜色           | 初始为 teal，与 DONE 的 emerald 视觉区分度不足；改为 cyan                                                         |
| 移动端响应式             | 初始为固定 6 列 grid，移动端不友好；改为 `overflow-x-auto` 水平滑动 + `min-w-[280px]` 列宽下限                    |
| AnimatedNumber 动画      | 初始使用 `useSpring` 从 0 动画到目标值，导致首次渲染先显示 0 再跳变；改为 `useMotionValue(value)` 立即显示        |
| 种子数据质量             | 初始为随机英文 lorem ipsum，人工要求改为 24 条真实中文研发场景                                                    |
| "添加到澄清问题"按钮状态 | 初始无去重判断，同一问题可重复添加；改为已添加时置灰并显示"已添加"+ CheckCircle2 图标                             |

---

## 6. 效果评价

### AI 帮助明显的地方

- **全栈代码生成效率极高**：从 Schema 到 API 到 UI 到测试，一次性生成的结构基本可用，大幅缩短从零到可运行的周期
- **状态机设计**：AI 理解业务规则后给出的流转图和校验函数逻辑清晰，前后端复用策略很自然
- **shadcn/frontend-design Skills**：组件使用和布局设计风格一致，避免了手动翻文档查 API
- **E2E 测试**：12 个 Playwright 用例一次性跑通，自动化脚本开箱即用
- **迭代响应快**：指出一个 UI 问题，AI 能立刻定位到准确的文件和行号并给出修复

### 效果不好的地方

- **视觉细节需多轮调整**：初始生成的 UI 在间距、尺寸、颜色上往往需要 2-3 轮人工反馈才能达到一致（工具栏高度、图标尺寸、状态颜色等）
- **Mock AI 服务过于简单**：规则型 Mock 只能做模式匹配，无法真正理解需求语义；真实 LLM 接入后效果会显著提升
- **移动端适配不够主动**：初始版本未考虑移动端，需要人工明确指出后才加入响应式设计
- **部分动画实现有瑕疵**：`AnimatedNumber` 的初始状态需要人工发现并修正
