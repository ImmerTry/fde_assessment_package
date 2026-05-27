import { NextRequest } from "next/server"
import { ZodError } from "zod"
import { prisma } from "@/lib/db"
import { dataResponse, errorResponse, zodErrorResponse } from "@/lib/http"
import { serializeWorkItem, workItemInclude } from "@/lib/serializers"
import { stringifyStringList } from "@/lib/utils"
import { getWorkItemEntity } from "@/lib/work-items"
import { workItemUpdateSchema } from "@/lib/validators"

export const runtime = "nodejs"

type RouteContext = {
    params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
    const { id } = await context.params
    const item = await getWorkItemEntity(id)

    if (!item) {
        return errorResponse("NOT_FOUND", "工作项不存在。", 404)
    }

    return dataResponse(serializeWorkItem(item))
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    const { id } = await context.params

    try {
        const body = await request.json()
        const payload = workItemUpdateSchema.parse(body)
        const item = await prisma.workItem.update({
            where: { id },
            data: {
                ...(payload.title !== undefined
                    ? { title: payload.title }
                    : {}),
                ...(payload.description !== undefined
                    ? { description: payload.description }
                    : {}),
                ...(payload.type !== undefined ? { type: payload.type } : {}),
                ...(payload.priority !== undefined
                    ? { priority: payload.priority }
                    : {}),
                ...(payload.assignee !== undefined
                    ? { assignee: payload.assignee }
                    : {}),
                ...(payload.riskLevel !== undefined
                    ? { riskLevel: payload.riskLevel }
                    : {}),
                ...(payload.tags !== undefined
                    ? { tags: stringifyStringList(payload.tags) }
                    : {}),
                ...(payload.acceptanceCriteria !== undefined
                    ? {
                          acceptanceCriteria: stringifyStringList(
                              payload.acceptanceCriteria,
                          ),
                      }
                    : {}),
            },
            include: workItemInclude,
        })

        return dataResponse(serializeWorkItem(item))
    } catch (error) {
        if (error instanceof ZodError) {
            return zodErrorResponse(error)
        }

        return errorResponse("NOT_FOUND", "工作项不存在或更新失败。", 404)
    }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
    const { id } = await context.params

    try {
        await prisma.workItem.delete({ where: { id } })
        return dataResponse({ id })
    } catch {
        return errorResponse("NOT_FOUND", "工作项不存在或已被删除。", 404)
    }
}
