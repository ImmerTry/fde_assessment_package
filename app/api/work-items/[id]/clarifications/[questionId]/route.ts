import { NextRequest } from "next/server"
import { ZodError } from "zod"
import { prisma } from "@/lib/db"
import { dataResponse, errorResponse, zodErrorResponse } from "@/lib/http"
import { serializeWorkItem } from "@/lib/serializers"
import { getWorkItemEntity } from "@/lib/work-items"
import { clarificationUpdateSchema } from "@/lib/validators"

export const runtime = "nodejs"

type RouteContext = {
    params: Promise<{ id: string; questionId: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    const { id, questionId } = await context.params

    try {
        const body = await request.json()
        const payload = clarificationUpdateSchema.parse(body)

        await prisma.clarificationQuestion.update({
            where: { id: questionId, workItemId: id },
            data: payload,
        })

        const item = await getWorkItemEntity(id)
        return dataResponse(serializeWorkItem(item!))
    } catch (error) {
        if (error instanceof ZodError) {
            return zodErrorResponse(error)
        }

        return errorResponse("NOT_FOUND", "澄清问题不存在或更新失败。", 404)
    }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
    const { id, questionId } = await context.params

    try {
        await prisma.clarificationQuestion.delete({
            where: { id: questionId, workItemId: id },
        })

        const item = await getWorkItemEntity(id)
        return dataResponse(serializeWorkItem(item!))
    } catch {
        return errorResponse("NOT_FOUND", "澄清问题不存在或已删除。", 404)
    }
}
