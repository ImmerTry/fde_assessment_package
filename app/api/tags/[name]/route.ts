import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { dataResponse, errorResponse } from "@/lib/http"
import { normalizeTag } from "@/lib/tags"

export const runtime = "nodejs"

type RouteContext = {
    params: Promise<{ name: string }>
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
    const { name } = await context.params
    const normalized = normalizeTag(decodeURIComponent(name))

    if (!normalized) {
        return errorResponse("VALIDATION_ERROR", "标签不能为空。", 422)
    }

    try {
        await prisma.tag.delete({ where: { name: normalized } })
        return dataResponse({ name: normalized })
    } catch {
        return errorResponse("NOT_FOUND", "标签不存在或已删除。", 404)
    }
}
