import { NextRequest } from "next/server"
import { ZodError } from "zod"
import { prisma } from "@/lib/db"
import { dataResponse, errorResponse, zodErrorResponse } from "@/lib/http"
import { serializeWorkItem } from "@/lib/serializers"
import { validateTransition } from "@/lib/state-machine"
import { getWorkItemDTO, getWorkItemEntity } from "@/lib/work-items"
import { transitionSchema } from "@/lib/validators"

export const runtime = "nodejs"

type RouteContext = {
    params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    const { id } = await context.params

    try {
        const body = await request.json()
        const payload = transitionSchema.parse(body)
        const dto = await getWorkItemDTO(id)

        if (!dto) {
            return errorResponse("NOT_FOUND", "工作项不存在。", 404)
        }

        const result = validateTransition(
            dto.status,
            payload.targetStatus,
            dto.clarifications,
        )

        if (!result.ok) {
            return errorResponse(result.code, result.message, 409, {
                blockers: result.blockers ?? [],
            })
        }

        await prisma.$transaction([
            prisma.workItem.update({
                where: { id },
                data: { status: payload.targetStatus },
            }),
            prisma.statusHistory.create({
                data: {
                    workItemId: id,
                    fromStatus: dto.status,
                    toStatus: payload.targetStatus,
                    actor: payload.actor,
                    reason: payload.reason,
                },
            }),
        ])

        const item = await getWorkItemEntity(id)
        return dataResponse(serializeWorkItem(item!))
    } catch (error) {
        if (error instanceof ZodError) {
            return zodErrorResponse(error)
        }

        return errorResponse("INTERNAL_ERROR", "状态流转失败。", 500)
    }
}
