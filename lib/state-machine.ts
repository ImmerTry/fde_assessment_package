import type {
    ClarificationDTO,
    ClarificationStatus,
    Priority,
    WorkItemStatus,
} from "@/lib/types"

export const STATUS_OPTIONS: Array<{
    value: WorkItemStatus
    label: string
    description: string
}> = [
    { value: "DRAFT", label: "草稿", description: "需求尚未进入正式分析" },
    { value: "ANALYZING", label: "待分析", description: "正在澄清范围和风险" },
    { value: "READY", label: "已准备", description: "可进入开发排期" },
    { value: "IN_PROGRESS", label: "开发中", description: "工程实现中" },
    { value: "TESTING", label: "测试中", description: "正在验证验收标准" },
    { value: "DONE", label: "已完成", description: "交付闭环完成" },
]

export const PRIORITY_OPTIONS: Array<{ value: Priority; label: string }> = [
    { value: "P0", label: "P0" },
    { value: "P1", label: "P1" },
    { value: "P2", label: "P2" },
    { value: "P3", label: "P3" },
]

export const CLARIFICATION_STATUS_LABEL: Record<ClarificationStatus, string> = {
    OPEN: "未解决",
    RESOLVED: "已解决",
}

export const STATUS_LABEL: Record<WorkItemStatus, string> = Object.fromEntries(
    STATUS_OPTIONS.map((item) => [item.value, item.label]),
) as Record<WorkItemStatus, string>

export const VALID_TRANSITIONS: Record<WorkItemStatus, WorkItemStatus[]> = {
    DRAFT: ["ANALYZING"],
    ANALYZING: ["DRAFT", "READY"],
    READY: ["ANALYZING", "IN_PROGRESS"],
    IN_PROGRESS: ["READY", "TESTING"],
    TESTING: ["IN_PROGRESS", "DONE"],
    DONE: [],
}

const BLOCKED_TARGETS = new Set<WorkItemStatus>([
    "READY",
    "IN_PROGRESS",
    "TESTING",
    "DONE",
])

export type TransitionResult =
    | { ok: true }
    | {
          ok: false
          code:
              | "INVALID_TRANSITION"
              | "BLOCKED_BY_CLARIFICATION"
              | "COMPLETE_LOCKED"
          message: string
          blockers?: ClarificationDTO[]
      }

export function getOpenHighClarifications(clarifications: ClarificationDTO[]) {
    return clarifications.filter(
        (item) => item.severity === "HIGH" && item.status === "OPEN",
    )
}

export function validateTransition(
    fromStatus: WorkItemStatus,
    toStatus: WorkItemStatus,
    clarifications: ClarificationDTO[],
): TransitionResult {
    if (fromStatus === "DONE") {
        return {
            ok: false,
            code: "COMPLETE_LOCKED",
            message: "已完成工作项默认锁定，不能再次流转。",
        }
    }

    if (!VALID_TRANSITIONS[fromStatus].includes(toStatus)) {
        return {
            ok: false,
            code: "INVALID_TRANSITION",
            message: `不能从${STATUS_LABEL[fromStatus]}直接流转到${STATUS_LABEL[toStatus]}。`,
        }
    }

    const blockers = getOpenHighClarifications(clarifications)
    if (BLOCKED_TARGETS.has(toStatus) && blockers.length > 0) {
        return {
            ok: false,
            code: "BLOCKED_BY_CLARIFICATION",
            message: "存在未解决的高优先级澄清问题，暂不能进入后续交付状态。",
            blockers,
        }
    }

    return { ok: true }
}

export function getNextStatusOptions(status: WorkItemStatus) {
    return VALID_TRANSITIONS[status]
}
