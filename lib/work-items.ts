import { prisma } from "@/lib/db"
import { serializeWorkItem, workItemInclude } from "@/lib/serializers"
import type { WorkItemDTO } from "@/lib/types"

export async function getWorkItemDTO(id: string): Promise<WorkItemDTO | null> {
    const item = await prisma.workItem.findUnique({
        where: { id },
        include: workItemInclude,
    })

    return item ? serializeWorkItem(item) : null
}

export async function getWorkItemEntity(id: string) {
    return prisma.workItem.findUnique({
        where: { id },
        include: workItemInclude,
    })
}

export async function nextWorkItemId() {
    const items = await prisma.workItem.findMany({
        select: { id: true },
    })
    const max = items.reduce((current: number, item: { id: string }) => {
        const match = /^WI-(\d+)$/.exec(item.id)
        return match ? Math.max(current, Number(match[1])) : current
    }, 0)
    return `WI-${String(max + 1).padStart(3, "0")}`
}
