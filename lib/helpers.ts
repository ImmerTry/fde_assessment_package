import type {
    ClarificationSeverity,
    Priority,
    RiskLevel,
    WorkItemDTO,
} from "@/lib/types"
import { uniqueTags } from "@/lib/tags"

type WorkItemFormState = {
    title: string
    description: string
    type: "story" | "bug" | "task"
    priority: Priority
    status: "DRAFT" | "ANALYZING" | "READY" | "IN_PROGRESS" | "TESTING" | "DONE"
    assignee: string
    tags: string[]
    riskLevel: RiskLevel
    acceptanceCriteriaText: string
}

export function formFromItem(item: WorkItemDTO): WorkItemFormState {
    return {
        title: item.title,
        description: item.description,
        type: item.type,
        priority: item.priority,
        status: item.status,
        assignee: item.assignee,
        tags: uniqueTags(item.tags),
        riskLevel: item.riskLevel,
        acceptanceCriteriaText: item.acceptanceCriteria.join("\n"),
    }
}

export function dateText(value: string) {
    return new Intl.DateTimeFormat("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value))
}

export function priorityTone(priority: Priority) {
    if (priority === "P0" || priority === "P1") {
        return "destructive" as const
    }
    if (priority === "P2") {
        return "warning" as const
    }
    return "secondary" as const
}

export function severityTone(severity: ClarificationSeverity) {
    if (severity === "HIGH") {
        return "destructive" as const
    }
    if (severity === "MEDIUM") {
        return "warning" as const
    }
    return "secondary" as const
}

export function riskTone(risk: RiskLevel) {
    if (risk === "HIGH") {
        return "destructive" as const
    }
    if (risk === "MEDIUM") {
        return "warning" as const
    }
    return "success" as const
}

export function sortItems(items: WorkItemDTO[]) {
    return [...items].sort(
        (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
}
