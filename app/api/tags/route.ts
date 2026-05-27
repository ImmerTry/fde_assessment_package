import { NextRequest } from "next/server"
import { ZodError } from "zod"
import { prisma } from "@/lib/db"
import { dataResponse, errorResponse, zodErrorResponse } from "@/lib/http"
import { tagCreateSchema } from "@/lib/validators"

export const runtime = "nodejs"

function serializeTag(tag: { id: string; name: string; createdAt: Date }) {
    return {
        id: tag.id,
        name: tag.name,
        createdAt: tag.createdAt.toISOString(),
    }
}

export async function GET() {
    const tags = await prisma.tag.findMany({
        orderBy: { name: "asc" },
    })

    return dataResponse(tags.map(serializeTag))
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const payload = tagCreateSchema.parse(body)

        const tag = await prisma.tag.upsert({
            where: { name: payload.name },
            update: {},
            create: { name: payload.name },
        })

        return dataResponse(serializeTag(tag), { status: 201 })
    } catch (error) {
        if (error instanceof ZodError) {
            return zodErrorResponse(error)
        }

        return errorResponse("INTERNAL_ERROR", "新增标签失败。", 500)
    }
}
