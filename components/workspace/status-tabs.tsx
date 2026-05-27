"use client"

import { Kanban } from "lucide-react"
import { cn } from "@/lib/utils"
import { STATUS_OPTIONS } from "@/lib/state-machine"
import {
    RING_ACCENT,
    STATUS_ACCENT,
    STATUS_ICON,
    STATUS_VISUALS,
} from "@/lib/status-visuals"
import type { WorkItemStatus } from "@/lib/types"

export function StatusDot({
    status,
    active,
}: {
    status: WorkItemStatus
    active?: boolean
}) {
    return (
        <span
            aria-hidden="true"
            className={cn(
                "inline-flex size-2.5 shrink-0 rounded-full ring-2 ring-background",
                STATUS_ACCENT[status],
                active ? "opacity-100 shadow-sm" : "opacity-65",
            )}
        />
    )
}

export function StatusTabs({
    counts,
    activeStatus,
    onSelect,
    onSelectAll,
}: {
    counts: Record<WorkItemStatus, number>
    activeStatus: WorkItemStatus | "ALL"
    onSelect: (status: WorkItemStatus) => void
    onSelectAll: () => void
}) {
    const totalCount = Object.values(counts).reduce((sum, c) => sum + c, 0)

    return (
        <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-muted/40">
            <button
                type="button"
                data-testid="status-tab-ALL"
                onClick={onSelectAll}
                className={cn(
                    "inline-flex h-9 items-center gap-1 rounded-md px-2.5 text-sm font-medium transition-all",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    activeStatus === "ALL"
                        ? "bg-background font-semibold text-foreground shadow-sm ring-2 ring-primary/40 ring-inset"
                        : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                )}
            >
                <Kanban className="size-3.5" />
                <span>全部</span>
                <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-sm font-bold text-foreground tabular-nums">
                    {totalCount}
                </span>
            </button>
            {STATUS_OPTIONS.map((status) => {
                const active = activeStatus === status.value
                const Icon = STATUS_ICON[status.value]

                return (
                    <button
                        key={status.value}
                        type="button"
                        data-testid={`status-tab-${status.value}`}
                        onClick={() => onSelect(status.value)}
                        className={cn(
                            "inline-flex h-9 items-center gap-1 rounded-md px-2.5 text-sm font-medium transition-all",
                            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                            active
                                ? cn(
                                      "bg-background font-semibold shadow-sm ring-2 ring-inset",
                                      RING_ACCENT[status.value],
                                      STATUS_VISUALS[status.value].text,
                                  )
                                : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                        )}
                        title={status.description}
                    >
                        <Icon className="size-3.5" />
                        <span>{status.label}</span>
                        <span
                            className={cn(
                                "ml-1 rounded-full px-1.5 py-0.5 text-sm font-bold tabular-nums",
                                active
                                    ? "bg-muted text-foreground"
                                    : "bg-muted/60 text-muted-foreground",
                            )}
                        >
                            {counts[status.value]}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
