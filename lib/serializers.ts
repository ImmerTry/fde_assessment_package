import type {
    AiAnalysis,
    ClarificationQuestion,
    StatusHistory,
    WorkItem,
} from "@prisma/client"
import type {
    AiAnalysisDTO,
    AiRisk,
    ClarificationDTO,
    StatusHistoryDTO,
    WorkItemDTO,
} from "@/lib/types"
import { parseStringList } from "@/lib/utils"

type WorkItemWithRelations = WorkItem & {
    clarifications: ClarificationQuestion[]
    aiAnalyses: AiAnalysis[]
    statusHistory: StatusHistory[]
}

function parseRisks(value: string): AiRisk[] {
    try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? (parsed as AiRisk[]) : []
    } catch {
        return []
    }
}

export function serializeClarification(
    clarification: ClarificationQuestion,
): ClarificationDTO {
    return {
        id: clarification.id,
        content: clarification.content,
        severity: clarification.severity as ClarificationDTO["severity"],
        status: clarification.status as ClarificationDTO["status"],
        answer: clarification.answer,
        createdAt: clarification.createdAt.toISOString(),
        updatedAt: clarification.updatedAt.toISOString(),
    }
}

export function serializeAnalysis(analysis: AiAnalysis): AiAnalysisDTO {
    return {
        id: analysis.id,
        summary: analysis.summary,
        suggestedAcceptanceCriteria: parseStringList(
            analysis.suggestedAcceptanceCriteria,
        ),
        risks: parseRisks(analysis.risks),
        suggestedClarificationQuestions: parseStringList(
            analysis.suggestedClarificationQuestions,
        ),
        taskBreakdown: parseStringList(analysis.taskBreakdown),
        createdAt: analysis.createdAt.toISOString(),
    }
}

export function serializeHistory(history: StatusHistory): StatusHistoryDTO {
    return {
        id: history.id,
        fromStatus: history.fromStatus as StatusHistoryDTO["fromStatus"],
        toStatus: history.toStatus as StatusHistoryDTO["toStatus"],
        actor: history.actor,
        reason: history.reason,
        createdAt: history.createdAt.toISOString(),
    }
}

export function serializeWorkItem(item: WorkItemWithRelations): WorkItemDTO {
    const latestAiAnalysis = item.aiAnalyses[0]
        ? serializeAnalysis(item.aiAnalyses[0])
        : null

    return {
        id: item.id,
        title: item.title,
        description: item.description,
        type: item.type as WorkItemDTO["type"],
        priority: item.priority as WorkItemDTO["priority"],
        status: item.status as WorkItemDTO["status"],
        assignee: item.assignee,
        tags: parseStringList(item.tags),
        riskLevel: item.riskLevel as WorkItemDTO["riskLevel"],
        acceptanceCriteria: parseStringList(item.acceptanceCriteria),
        clarifications: item.clarifications.map(serializeClarification),
        latestAiAnalysis,
        statusHistory: item.statusHistory.map(serializeHistory),
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
    }
}

export const workItemInclude = {
    clarifications: {
        orderBy: [{ status: "asc" as const }, { severity: "asc" as const }],
    },
    aiAnalyses: {
        orderBy: { createdAt: "desc" as const },
        take: 1,
    },
    statusHistory: {
        orderBy: { createdAt: "desc" as const },
        take: 8,
    },
}
