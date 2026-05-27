export type WorkItemType = "story" | "bug" | "task"
export type Priority = "P0" | "P1" | "P2" | "P3"
export type WorkItemStatus =
    | "DRAFT"
    | "ANALYZING"
    | "READY"
    | "IN_PROGRESS"
    | "TESTING"
    | "DONE"
export type RiskLevel = "HIGH" | "MEDIUM" | "LOW"
export type ClarificationSeverity = "HIGH" | "MEDIUM" | "LOW"
export type ClarificationStatus = "OPEN" | "RESOLVED"

export type StatusHistoryDTO = {
    id: string
    fromStatus: WorkItemStatus | null
    toStatus: WorkItemStatus
    actor: string
    reason: string | null
    createdAt: string
}

export type ClarificationDTO = {
    id: string
    content: string
    severity: ClarificationSeverity
    status: ClarificationStatus
    answer: string | null
    createdAt: string
    updatedAt: string
}

export type AiRisk = {
    title: string
    level: RiskLevel
    reason: string
}

export type AiAnalysisDTO = {
    id: string
    summary: string
    suggestedAcceptanceCriteria: string[]
    risks: AiRisk[]
    suggestedClarificationQuestions: string[]
    taskBreakdown: string[]
    createdAt: string
}

export type WorkItemDTO = {
    id: string
    title: string
    description: string
    type: WorkItemType
    priority: Priority
    status: WorkItemStatus
    assignee: string
    tags: string[]
    riskLevel: RiskLevel
    acceptanceCriteria: string[]
    clarifications: ClarificationDTO[]
    latestAiAnalysis: AiAnalysisDTO | null
    statusHistory: StatusHistoryDTO[]
    createdAt: string
    updatedAt: string
}

export type TagDTO = {
    id: string
    name: string
    createdAt: string
}

export type ApiErrorCode =
    | "NOT_FOUND"
    | "VALIDATION_ERROR"
    | "INVALID_TRANSITION"
    | "BLOCKED_BY_CLARIFICATION"
    | "COMPLETE_LOCKED"
    | "INTERNAL_ERROR"

export type ApiError = {
    code: ApiErrorCode
    message: string
    details?: unknown
}
