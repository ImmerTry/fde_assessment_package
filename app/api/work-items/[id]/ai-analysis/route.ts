import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { dataResponse, errorResponse } from "@/lib/http"
import { analyzeWorkItem } from "@/lib/ai-service"
import { serializeWorkItem } from "@/lib/serializers"
import { getWorkItemDTO, getWorkItemEntity } from "@/lib/work-items"
import { stringifyStringList } from "@/lib/utils"

export const runtime = "nodejs"

type RouteContext = {
    params: Promise<{ id: string }>
}

export async function POST(_request: NextRequest, context: RouteContext) {
    const { id } = await context.params
    const item = await getWorkItemDTO(id)

    if (!item) {
        return errorResponse("NOT_FOUND", "工作项不存在。", 404)
    }

    const analysis = await analyzeWorkItem(item)

    await prisma.aiAnalysis.create({
        data: {
            workItemId: id,
            summary: analysis.summary,
            suggestedAcceptanceCriteria: stringifyStringList(
                analysis.suggestedAcceptanceCriteria,
            ),
            risks: JSON.stringify(analysis.risks),
            suggestedClarificationQuestions: stringifyStringList(
                analysis.suggestedClarificationQuestions,
            ),
            taskBreakdown: stringifyStringList(analysis.taskBreakdown),
            provider: "mock-rule-service",
        },
    })

    const updated = await getWorkItemEntity(id)
    return dataResponse(serializeWorkItem(updated!))
}
