# API 设计说明

## 1. API 设计目标

API 为前端看板提供完整的数据能力：工作项 CRUD、状态流转（含业务规则校验）、澄清问题生命周期管理、AI 辅助分析，以及负责人与标签的元数据管理。所有接口遵循统一的 JSON 响应格式，错误通过结构化 `error` 对象返回。

**统一响应格式**：

```json
{ "data": T }
{ "error": { "code": "...", "message": "...", "details?": ... } }
```

---

## 2. 资源或模块划分

系统划分为三个资源域和一个子资源：

| 资源域                        | 说明                                      |
| ----------------------------- | ----------------------------------------- |
| **WorkItem** (工作项)         | 核心实体，聚合澄清问题、AI 分析、状态历史 |
| **Assignee** (负责人)         | 独立元数据，被 WorkItem 引用              |
| **Tag** (标签)                | 独立元数据，WorkItem 以 JSON 数组存储引用 |
| **Clarification** (澄清问题)  | WorkItem 的子资源，级联删除               |
| **AI Analysis** (AI 分析)     | WorkItem 的子资源，级联删除               |
| **Status History** (状态历史) | WorkItem 的子资源，级联删除               |

---

## 3. API 列表

### 3.1 工作项

| 方法     | 路径                  | 输入                           | 输出             | 说明                                                               |
| -------- | --------------------- | ------------------------------ | ---------------- | ------------------------------------------------------------------ |
| `GET`    | `/api/work-items`     | `?q=&status=&priority=`        | `WorkItemDTO[]`  | 列表查询，支持关键词搜索（标题/描述/负责人/标签）及状态/优先级过滤 |
| `POST`   | `/api/work-items`     | `WorkItemCreateInput`          | `WorkItemDTO`    | 新建工作项，自动分配 ID，创建初始状态历史                          |
| `GET`    | `/api/work-items/:id` | `:id` (路径参数)               | `WorkItemDTO`    | 获取单个工作项详情（含关联数据）                                   |
| `PATCH`  | `/api/work-items/:id` | `Partial<WorkItemCreateInput>` | `WorkItemDTO`    | 编辑工作项字段（部分更新）                                         |
| `DELETE` | `/api/work-items/:id` | `:id` (路径参数)               | `{ id: string }` | 删除工作项，级联删除其澄清问题、AI 分析、状态历史                  |

**WorkItemCreateInput**：

| 字段                 | 类型                           | 必填 | 说明                    |
| -------------------- | ------------------------------ | ---- | ----------------------- |
| `title`              | `string`                       | ✅   | 标题，最少 2 字符       |
| `description`        | `string`                       | ✅   | 描述，最少 8 字符       |
| `type`               | `"story" \| "bug" \| "task"`   | ✅   | 工作项类型              |
| `priority`           | `"P0" \| "P1" \| "P2" \| "P3"` | ✅   | 优先级                  |
| `status`             | `WorkItemStatus`               | 否   | 初始状态，默认 `DRAFT`  |
| `assignee`           | `string`                       | ✅   | 负责人名称              |
| `tags`               | `string[]`                     | 否   | 标签列表，默认 `[]`     |
| `riskLevel`          | `"HIGH" \| "MEDIUM" \| "LOW"`  | 否   | 风险等级，默认 `MEDIUM` |
| `acceptanceCriteria` | `string[]`                     | 否   | 验收标准列表，默认 `[]` |

**WorkItemDTO** 响应结构：

| 字段                 | 类型                    | 说明                       |
| -------------------- | ----------------------- | -------------------------- |
| `id`                 | `string`                | 工作项 ID（如 `FDE-0001`） |
| `title`              | `string`                | 标题                       |
| `description`        | `string`                | 描述                       |
| `type`               | `WorkItemType`          | 类型                       |
| `priority`           | `Priority`              | 优先级                     |
| `status`             | `WorkItemStatus`        | 当前状态                   |
| `assignee`           | `string`                | 负责人                     |
| `tags`               | `string[]`              | 标签                       |
| `riskLevel`          | `RiskLevel`             | 风险等级                   |
| `acceptanceCriteria` | `string[]`              | 验收标准                   |
| `clarifications`     | `ClarificationDTO[]`    | 澄清问题列表               |
| `latestAiAnalysis`   | `AiAnalysisDTO \| null` | 最近一次 AI 分析           |
| `statusHistory`      | `StatusHistoryDTO[]`    | 状态流转历史               |
| `createdAt`          | `string` (ISO 8601)     | 创建时间                   |
| `updatedAt`          | `string` (ISO 8601)     | 更新时间                   |

### 3.2 状态流转

| 方法    | 路径                         | 输入              | 输出          | 说明                                 |
| ------- | ---------------------------- | ----------------- | ------------- | ------------------------------------ |
| `PATCH` | `/api/work-items/:id/status` | `TransitionInput` | `WorkItemDTO` | 执行状态流转，含合法性校验和阻断检查 |

**TransitionInput**：

| 字段           | 类型             | 必填 | 说明                       |
| -------------- | ---------------- | ---- | -------------------------- |
| `targetStatus` | `WorkItemStatus` | ✅   | 目标状态                   |
| `actor`        | `string`         | 否   | 操作人，默认 `"candidate"` |
| `reason`       | `string`         | 否   | 流转原因，最多 240 字符    |

### 3.3 澄清问题

| 方法     | 路径                                             | 输入                       | 输出          | 说明                                    |
| -------- | ------------------------------------------------ | -------------------------- | ------------- | --------------------------------------- |
| `POST`   | `/api/work-items/:id/clarifications`             | `ClarificationCreateInput` | `WorkItemDTO` | 为指定工作项新增澄清问题                |
| `PATCH`  | `/api/work-items/:id/clarifications/:questionId` | `ClarificationUpdateInput` | `WorkItemDTO` | 更新澄清问题（内容/严重程度/状态/回答） |
| `DELETE` | `/api/work-items/:id/clarifications/:questionId` | 路径参数                   | `WorkItemDTO` | 删除澄清问题                            |

**ClarificationCreateInput**：

| 字段       | 类型                          | 必填 | 说明                  |
| ---------- | ----------------------------- | ---- | --------------------- |
| `content`  | `string`                      | ✅   | 问题内容，最少 4 字符 |
| `severity` | `"HIGH" \| "MEDIUM" \| "LOW"` | 否   | 默认 `MEDIUM`         |
| `answer`   | `string`                      | 否   | 预设回答              |

**ClarificationUpdateInput**（全部可选）：

| 字段       | 类型                          | 说明           |
| ---------- | ----------------------------- | -------------- |
| `content`  | `string`                      | 更新问题内容   |
| `severity` | `"HIGH" \| "MEDIUM" \| "LOW"` | 调整严重程度   |
| `status`   | `"OPEN" \| "RESOLVED"`        | 标记解决状态   |
| `answer`   | `string \| null`              | 填写或清空回答 |

**ClarificationDTO**：

| 字段        | 类型                          | 说明     |
| ----------- | ----------------------------- | -------- |
| `id`        | `string`                      | 问题 ID  |
| `content`   | `string`                      | 问题内容 |
| `severity`  | `"HIGH" \| "MEDIUM" \| "LOW"` | 严重程度 |
| `status`    | `"OPEN" \| "RESOLVED"`        | 解决状态 |
| `answer`    | `string \| null`              | 回答内容 |
| `createdAt` | `string`                      | 创建时间 |
| `updatedAt` | `string`                      | 更新时间 |

### 3.4 AI 分析

| 方法   | 路径                              | 输入                       | 输出          | 说明                                      |
| ------ | --------------------------------- | -------------------------- | ------------- | ----------------------------------------- |
| `POST` | `/api/work-items/:id/ai-analysis` | 无（从工作项当前状态提取） | `WorkItemDTO` | 触发 AI 分析，结果写入 `latestAiAnalysis` |

**AiAnalysisDTO**：

| 字段                              | 类型       | 说明         |
| --------------------------------- | ---------- | ------------ |
| `id`                              | `string`   | 分析记录 ID  |
| `summary`                         | `string`   | 需求摘要     |
| `suggestedAcceptanceCriteria`     | `string[]` | 建议验收标准 |
| `risks`                           | `AiRisk[]` | 识别风险列表 |
| `suggestedClarificationQuestions` | `string[]` | 建议澄清问题 |
| `taskBreakdown`                   | `string[]` | 任务拆解建议 |
| `createdAt`                       | `string`   | 生成时间     |

**AiRisk**：

| 字段     | 类型                          | 说明     |
| -------- | ----------------------------- | -------- |
| `title`  | `string`                      | 风险标题 |
| `level`  | `"HIGH" \| "MEDIUM" \| "LOW"` | 风险等级 |
| `reason` | `string`                      | 风险说明 |

### 3.5 负责人

| 方法   | 路径             | 输入                                | 输出                                 | 说明                                   |
| ------ | ---------------- | ----------------------------------- | ------------------------------------ | -------------------------------------- |
| `GET`  | `/api/assignees` | `?q=` (可选搜索)                    | `{ name: string; avatar: string }[]` | 查询负责人列表，按名称排序，最多 20 条 |
| `POST` | `/api/assignees` | `{ name: string; avatar?: string }` | `{ name: string; avatar: string }`   | 新增负责人，重复名称返回已有记录       |

### 3.6 标签

| 方法     | 路径              | 输入                         | 输出               | 说明                                                                            |
| -------- | ----------------- | ---------------------------- | ------------------ | ------------------------------------------------------------------------------- |
| `GET`    | `/api/tags`       | 无                           | `TagDTO[]`         | 获取全部标签，按名称排序                                                        |
| `POST`   | `/api/tags`       | `{ name: string }`           | `TagDTO`           | 新增标签（upsert），名称仅允许字母/数字/下划线/短横线，自动转小写，最多 24 字符 |
| `DELETE` | `/api/tags/:name` | `:name` (路径参数，URL 编码) | `{ name: string }` | 删除标签                                                                        |

---

## 4. 状态流转错误设计

流转校验由 `lib/state-machine.ts` 中的 `validateTransition()` 统一处理，API 层和前端展示复用同一份规则。

**合法流转图**：

```
DRAFT → ANALYZING ⇄ READY ⇄ IN_PROGRESS ⇄ TESTING → DONE
```

**三种错误类型**：

| 错误码                     | HTTP 状态 | 触发条件                                                                   | 响应示例                                              |
| -------------------------- | --------- | -------------------------------------------------------------------------- | ----------------------------------------------------- |
| `COMPLETE_LOCKED`          | `409`     | 从 `DONE` 发起流转                                                         | `"已完成工作项默认锁定，不能再次流转。"`              |
| `INVALID_TRANSITION`       | `409`     | 跳转到不在合法目标列表中的状态                                             | `"不能从草稿直接流转到开发中。"`                      |
| `BLOCKED_BY_CLARIFICATION` | `409`     | 目标为 READY/IN_PROGRESS/TESTING/DONE 且存在未解决的 HIGH 严重程度澄清问题 | `"存在未解决的高优先级澄清问题..."` + `blockers` 列表 |

**阻断逻辑细节**：只有严重程度为 `HIGH` 且状态为 `OPEN` 的澄清问题才会触发阻断。`MEDIUM` 和 `LOW` 级别的澄清问题不会阻止流转，仅作为提示信息展示。

---

## 5. AI 分析结果设计

AI 分析由 `POST /api/work-items/:id/ai-analysis` 触发，调用 `lib/ai-service.ts` 中的 `analyzeWorkItem()` 函数。当前实现为规则型 Mock，根据工作项的标题关键词、验收标准数量、优先级等信息生成结构化建议，不依赖外部 LLM 调用。

Mock 服务的分析逻辑：

- **验收标准检查**：少于 2 条验收标准 → 生成 `HIGH` 级别"验收标准不足"风险
- **关键词识别**：标题/描述中出现权限、数据范围、接口、异常等关键词 → 生成 `MEDIUM` 级别"边界条件需要补充"风险
- **高优先级标记**：P0/P1 工作项 → 生成 `HIGH` 级别"高优先级交付风险"
- **默认兜底**：以上均不命中时 → 生成 `LOW` 级别"常规实现风险"

返回的 `AiAnalysisDTO` 会被持久化到 `AiAnalysis` 表，并通过 `latestAiAnalysis` 字段嵌入 `WorkItemDTO` 中返回。每次调用会新增一条分析记录，前端只展示最新一条。

---

## 6. 前后端协作说明

前端（`WorkItemConsole` 组件）通过 `requestData<T>()` 辅助函数调用所有 API，统一处理 JSON 序列化和错误格式化。

**协作流程**：

| 前端操作      | API 调用                                                       | 数据更新策略                                         |
| ------------- | -------------------------------------------------------------- | ---------------------------------------------------- |
| 页面加载      | `GET /api/work-items` + `GET /api/tags` + `GET /api/assignees` | 全量替换 `items` 状态                                |
| 搜索/筛选     | `GET /api/work-items?q=&priority=`                             | 服务端过滤 + 全量替换                                |
| 刷新          | 重新调用 `GET /api/work-items`                                 | 全量替换                                             |
| 新建/编辑     | `POST` 或 `PATCH /api/work-items`                              | 通过 `upsertItem()` 局部更新列表                     |
| 状态流转      | `PATCH /api/work-items/:id/status`                             | 流转成功后通过 `upsertItem()` 更新                   |
| 拖拽流转      | 同上（拖到目标列时自动调用）                                   | 同上                                                 |
| 澄清问题 CRUD | `POST/PATCH/DELETE /api/work-items/:id/clarifications/*`       | 全部返回完整 `WorkItemDTO`，通过 `upsertItem()` 更新 |
| AI 分析       | `POST /api/work-items/:id/ai-analysis`                         | 同上                                                 |

所有变更操作的返回值均为更新后的 `WorkItemDTO`，前端通过 `upsertItem()` 就地更新列表中的对应项，无需重新拉取全量数据。

**负责人和标签的协作**：

- 标签库：创建/编辑工作项时，前端展示全部标签供勾选；支持内联创建新标签（调用 `POST /api/tags`）；支持内联删除标签（调用 `DELETE /api/tags/:name`）
- 负责人：创建/编辑工作项时，前端提供带搜索的下拉选择器；支持内联创建新负责人（调用 `POST /api/assignees`）

---

## 7. 后续扩展

| 扩展方向         | 说明                                                                               |
| ---------------- | ---------------------------------------------------------------------------------- |
| 真实 LLM 接入    | 替换 `lib/ai-service.ts` 中的 Mock 为 OpenAI-compatible API 调用，保持接口签名不变 |
| 批量操作 API     | 支持批量修改状态、批量分配负责人等                                                 |
| 负责人维度查询   | `GET /api/work-items?assignee=` 按负责人过滤                                       |
| 工作项排序 API   | 支持 `?sort=createdAt&order=asc` 等排序参数                                        |
| 标签关联度查询   | 查询标签下关联的工作项数量，辅助清理无用标签                                       |
| Webhook/事件推送 | 状态变更时推送通知                                                                 |
| 分页支持         | 当前全量返回，数据量大时需加 `?page=&limit=`                                       |
