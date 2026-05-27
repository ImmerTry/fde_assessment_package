"use client"

import { ArrowLeft, ArrowRight, CircleDot } from "lucide-react"
import { motion } from "motion/react"
import type { WorkItemDTO, WorkItemStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { STATUS_OPTIONS } from "@/lib/state-machine"
import { STATUS_ACCENT, STATUS_VISUALS } from "@/lib/status-visuals"

const softSpring = { type: "spring", stiffness: 260, damping: 28 } as const

export function StatusFlow({
    item,
    busy,
    focusedStatus,
    nextOptions,
    onTransition,
}: {
    item: WorkItemDTO
    busy: string | null
    focusedStatus: WorkItemStatus | null
    nextOptions: WorkItemStatus[]
    onTransition: (
        item: WorkItemDTO,
        targetStatus: WorkItemStatus,
    ) => Promise<void>
}) {
    return (
        <div className="overflow-x-auto">
            <div className="grid min-w-[420px] grid-cols-6 gap-1.5">
                {STATUS_OPTIONS.map((status, index) => {
                    const isCurrent = item.status === status.value
                    const isNext = nextOptions.includes(status.value)
                    const isFocused =
                        focusedStatus === status.value && !isCurrent
                    const isPast =
                        STATUS_OPTIONS.findIndex(
                            (option) => option.value === item.status,
                        ) > index

                    return (
                        <motion.button
                            key={status.value}
                            type="button"
                            data-testid={`status-flow-${status.value}`}
                            disabled={
                                isCurrent ||
                                busy === `status-${item.id}` ||
                                (!isCurrent && !isNext)
                            }
                            onClick={() =>
                                void onTransition(item, status.value)
                            }
                            whileHover={!isCurrent ? { y: -2 } : undefined}
                            whileTap={!isCurrent ? { scale: 0.98 } : undefined}
                            animate={{
                                scale: isFocused ? 1.02 : 1,
                            }}
                            transition={softSpring}
                            className={cn(
                                "relative min-h-11 overflow-hidden rounded-md border px-1.5 py-1 text-left text-sm transition-all",
                                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                                isCurrent &&
                                    STATUS_VISUALS[status.value].flowCurrent,
                                isFocused &&
                                    STATUS_VISUALS[status.value].flowTarget,
                                isNext &&
                                    !isCurrent &&
                                    !isFocused &&
                                    STATUS_VISUALS[status.value].flowNext,
                                !isCurrent &&
                                    !isFocused &&
                                    !isNext &&
                                    "bg-muted/20 text-muted-foreground hover:border-muted-foreground/35 hover:bg-muted/35",
                                isPast && !isCurrent && "text-foreground",
                            )}
                            title={
                                !isCurrent && !isNext
                                    ? "当前状态不可直接流转至此，需先经过中间状态。"
                                    : status.description
                            }
                        >
                            {isFocused ? (
                                <div className="absolute top-1.5 right-1.5 rounded-sm bg-white/20 px-1 py-0.5 text-[10px] font-semibold tracking-normal dark:bg-black/15">
                                    TARGET
                                </div>
                            ) : null}
                            <div className="flex items-center gap-1.5">
                                {isCurrent ? (
                                    <CircleDot className="size-3" />
                                ) : isFocused ? (
                                    index <
                                    STATUS_OPTIONS.findIndex(
                                        (s) => s.value === item.status,
                                    ) ? (
                                        <ArrowLeft className="size-3" />
                                    ) : (
                                        <ArrowRight className="size-3" />
                                    )
                                ) : (
                                    <span
                                        className={cn(
                                            "h-1.5 w-1.5 rounded-full",
                                            STATUS_ACCENT[status.value],
                                            isFocused || isNext || isPast
                                                ? "opacity-100"
                                                : "opacity-45",
                                        )}
                                    />
                                )}
                                <span className="text-sm font-medium">
                                    {status.label}
                                </span>
                            </div>
                        </motion.button>
                    )
                })}
            </div>
        </div>
    )
}
