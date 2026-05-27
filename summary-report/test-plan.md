# 测试说明

## 1. 测试范围

测试覆盖三个层级：单元测试（状态机核心逻辑 + 辅助函数）、API 冒烟测试（完整业务闭环）、E2E 浏览器测试（用户交互路径）。

| 层级     | 框架       | 文件                          | 用例数    |
| -------- | ---------- | ----------------------------- | --------- |
| 单元测试 | Vitest     | `tests/state-machine.test.ts` | 5         |
| 单元测试 | Vitest     | `tests/form-helpers.test.ts`  | 3         |
| API 冒烟 | tsx 脚本   | `tests/e2e-smoke.ts`          | 8 个 step |
| E2E      | Playwright | `e2e/board.spec.ts`           | 4         |
| E2E      | Playwright | `e2e/detail-dialog.spec.ts`   | 4         |
| E2E      | Playwright | `e2e/work-item-form.spec.ts`  | 4         |
| **合计** |            |                               | **28**    |

---

## 2. 核心业务规则验证

| 规则                                     | 验证方式                                                                                    | 结果 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- | ---- |
| 状态机合法流转（如 DRAFT → ANALYZING）   | Vitest: `validateTransition("DRAFT", "ANALYZING", [])` 返回 `{ ok: true }`                  | ✅   |
| 状态机非法跳转（如 DRAFT → IN_PROGRESS） | Vitest: 返回 `{ ok: false, code: "INVALID_TRANSITION" }`                                    | ✅   |
| HIGH 未解决澄清阻断交付状态              | Vitest: ANALYZING → READY 时存在 HIGH+OPEN 澄清，返回 `BLOCKED_BY_CLARIFICATION` + blockers | ✅   |
| HIGH 已解决澄清不阻断                    | Vitest: 同样流转但澄清为 HIGH+RESOLVED，返回 `{ ok: true }`                                 | ✅   |
| DONE 状态锁定                            | Vitest: DONE → TESTING 返回 `{ ok: false, code: "COMPLETE_LOCKED" }`                        | ✅   |
| 表单错误信息格式化                       | Vitest: `formatApiErrorMessage()` 从 Zod issues 提取具体字段错误并拼接                      | ✅   |
| 标签规范化去重                           | Vitest: `normalizeTag()` 去空格转小写，`addTagToList()` 去重                                | ✅   |

---

## 3. 状态流转测试

### 单元测试覆盖

`tests/state-machine.test.ts` 中 5 个用例覆盖了状态机的全部三条核心规则：

| 用例                                                           | 覆盖规则                        |
| -------------------------------------------------------------- | ------------------------------- |
| `allows configured forward transition`                         | 合法流转（DRAFT → ANALYZING）   |
| `rejects illegal jump`                                         | 非法跳转（DRAFT → IN_PROGRESS） |
| `blocks delivery states when high clarification is unresolved` | HIGH 未解决阻断                 |
| `allows delivery states after high clarification is resolved`  | HIGH 已解决放行                 |
| `locks completed work items`                                   | DONE 锁定                       |

### API 冒烟测试覆盖

`tests/e2e-smoke.ts` 中的 `legal transition then blocked transition` 和 `resolve blocker and continue transition` 两个 step 覆盖了完整流转闭环：

1. WI-001 从 DRAFT → ANALYZING（合法，成功）
2. WI-001 从 ANALYZING → READY（存在 HIGH 阻断，返回 409 + `BLOCKED_BY_CLARIFICATION`）
3. 通过 PATCH `/clarifications/:questionId` 解决阻断
4. WI-001 再次 ANALYZING → READY（成功）
5. WI-001 从 READY → DONE（非法跳转，返回 409 + `INVALID_TRANSITION`）

### E2E 测试覆盖

Playwright 测试中间接覆盖了流转功能：新建工作项后默认为 DRAFT，在创建并删除的用例中通过右键菜单触发了状态选择 UI 的可见性验证。

---

## 4. 澄清问题测试

### API 冒烟测试覆盖

`tests/e2e-smoke.ts` 中的 `clarification create update reopen delete` step 覆盖了澄清问题的完整生命周期：

| 操作       | API                                                                | 验证点                                           |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------ |
| 创建       | `POST /work-items/WI-004/clarifications`                           | 返回 201，澄清问题出现在 `clarifications` 数组中 |
| 回答并解决 | `PATCH /clarifications/:questionId` { answer, status: "RESOLVED" } | 状态变为 RESOLVED                                |
| 重新打开   | `PATCH /clarifications/:questionId` { status: "OPEN" }             | 状态变为 OPEN                                    |
| 删除       | `DELETE /clarifications/:questionId`                               | 数组中不再包含该问题                             |

### E2E 测试覆盖

Playwright 的详情弹框测试验证了澄清问题区域在 UI 中的渲染（通过检查弹框中的"描述"等内容区域可见性间接覆盖）。

---

## 5. AI 能力测试

### API 冒烟测试覆盖

`tests/e2e-smoke.ts` 中的 `AI analysis generation` step：

| 验证点             | 断言                                         |
| ------------------ | -------------------------------------------- |
| AI 分析可正常生成  | `analyzed.data?.latestAiAnalysis` 不为 null  |
| 风险识别有输出     | `risks.length > 0`                           |
| 建议澄清问题有输出 | `suggestedClarificationQuestions.length > 0` |

Mock AI Service 的规则逻辑：

- 验收标准 < 2 条 → HIGH 级别"验收标准不足"风险
- 关键词匹配（权限/数据范围/接口/异常）→ MEDIUM 级别"边界条件需要补充"风险
- P0/P1 优先级 → HIGH 级别"高优先级交付风险"
- 兜底 → LOW 级别"常规实现风险"

由于 Mock 服务的确定性，未对具体风险内容做断言，只验证了输出结构的完整性。

---

## 6. 未覆盖风险

| 未覆盖内容                 | 原因                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| **并发流转**               | 单用户场景，不涉及两个用户同时对同一工作项发起流转的竞态条件                                     |
| **大量数据性能**           | 种子数据仅 24 条，未测试百条以上时的列表渲染和 API 响应时间                                      |
| **SQLite 并发写入**        | Prisma + SQLite 单文件模式下，高并发写入可能触发 `SQLITE_BUSY`，当前场景不会触发                 |
| **真实 LLM 调用超时/失败** | Mock 服务无网络依赖，真实 LLM 接入后需补充超时重试和降级逻辑的测试                               |
| **拖拽流转的边界情况**     | Playwright 拖拽模拟较复杂，当前通过 API 层和右键菜单覆盖了流转逻辑，未做原生拖拽事件的浏览器测试 |
| **暗色模式下的可访问性**   | 未用 axe 或 Lighthouse 做 a11y 审计                                                              |
| **移动端真实设备测试**     | Playwright 使用了桌面 Chromium viewport，未在 iOS Safari 或 Android Chrome 上实测                |
