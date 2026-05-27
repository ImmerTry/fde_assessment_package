import { NextRequest } from "next/server"
import { ZodError } from "zod"
import { prisma } from "@/lib/db"
import { dataResponse, errorResponse, zodErrorResponse } from "@/lib/http"
import { serializeWorkItem, workItemInclude } from "@/lib/serializers"
import { nextWorkItemId } from "@/lib/work-items"
import { stringifyStringList } from "@/lib/utils"
import { workItemCreateSchema } from "@/lib/validators"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")?.trim()
    const status = searchParams.get("status")?.trim()
    const priority = searchParams.get("priority")?.trim()

    const items = await prisma.workItem.findMany({
        where: {
            ...(query
                ? {
                      OR: [
                          { title: { contains: query } },
                          { description: { contains: query } },
                          { assignee: { contains: query } },
                          { tags: { contains: query } },
                      ],
                  }
                : {}),
            ...(status && status !== "ALL" ? { status } : {}),
            ...(priority && priority !== "ALL" ? { priority } : {}),
        },
        include: workItemInclude,
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    })

    return dataResponse(items.map(serializeWorkItem))
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const payload = workItemCreateSchema.parse(body)
        const id = await nextWorkItemId()

        const item = await prisma.workItem.create({
            data: {
                id,
                title: payload.title,
                description: payload.description,
                type: payload.type,
                priority: payload.priority,
                status: payload.status,
                assignee: payload.assignee,
                tags: stringifyStringList(payload.tags),
                riskLevel: payload.riskLevel,
                acceptanceCriteria: stringifyStringList(
                    payload.acceptanceCriteria,
                ),
                statusHistory: {
                    create: {
                        fromStatus: null,
                        toStatus: payload.status,
                        actor: "candidate",
                        reason: "创建工作项",
                    },
                },
            },
            include: workItemInclude,
        })

        return dataResponse(serializeWorkItem(item), { status: 201 })
    } catch (error) {
        if (error instanceof ZodError) {
            return zodErrorResponse(error)
        }

        return errorResponse("INTERNAL_ERROR", "创建工作项失败。", 500)
    }
}
