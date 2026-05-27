import { NextRequest } from "next/server"
import { ZodError } from "zod"
import { prisma } from "@/lib/db"
import { dataResponse, errorResponse, zodErrorResponse } from "@/lib/http"
import { serializeWorkItem } from "@/lib/serializers"
import { getWorkItemEntity } from "@/lib/work-items"
import { clarificationCreateSchema } from "@/lib/validators"

export const runtime = "nodejs"

type RouteContext = {
    params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
    const { id } = await context.params

    try {
        const body = await request.json()
        const payload = clarificationCreateSchema.parse(body)
        const item = await getWorkItemEntity(id)

        if (!item) {
            return errorResponse("NOT_FOUND", "工作项不存在。", 404)
        }

        await prisma.clarificationQuestion.create({
            data: {
                workItemId: id,
                content: payload.content,
                severity: payload.severity,
                answer: payload.answer,
                status: payload.answer ? "RESOLVED" : "OPEN",
            },
        })

        const updated = await getWorkItemEntity(id)
        return dataResponse(serializeWorkItem(updated!), { status: 201 })
    } catch (error) {
        if (error instanceof ZodError) {
            return zodErrorResponse(error)
        }

        return errorResponse("INTERNAL_ERROR", "新增澄清问题失败。", 500)
    }
}
