import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { dataResponse, errorResponse } from "@/lib/http"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
    try {
        const q = request.nextUrl.searchParams.get("q") || ""
        const assignees = await prisma.assignee.findMany({
            where: q ? { name: { contains: q } } : {},
            orderBy: { name: "asc" },
            take: 20,
        })
        return dataResponse(
            assignees.map((a: { name: unknown; avatar: unknown }) => ({
                name: a.name,
                avatar: a.avatar,
            })),
        )
    } catch {
        return errorResponse("INTERNAL_ERROR", "获取负责人列表失败。", 500)
    }
}

export async function POST(request: NextRequest) {
    try {
        const { name, avatar } = await request.json()
        if (!name || typeof name !== "string" || !name.trim()) {
            return errorResponse("VALIDATION_ERROR", "负责人名称不能为空。")
        }
        const trimmed = name.trim()
        const existing = await prisma.assignee.findUnique({
            where: { name: trimmed },
        })
        if (existing) {
            return dataResponse({
                name: existing.name,
                avatar: existing.avatar,
            })
        }
        const avatarUrl = avatar || ""
        const created = await prisma.assignee.create({
            data: { name: trimmed, avatar: avatarUrl },
        })
        return dataResponse({ name: created.name, avatar: created.avatar })
    } catch {
        return errorResponse("INTERNAL_ERROR", "添加负责人失败。", 500)
    }
}
