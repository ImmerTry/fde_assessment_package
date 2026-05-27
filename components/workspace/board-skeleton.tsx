import { Skeleton } from "@/components/ui/skeleton"
import { STATUS_OPTIONS } from "@/lib/state-machine"

export function BoardSkeleton() {
    return (
        <div className="grid grid-cols-6 gap-3" aria-label="工作项加载中">
            {STATUS_OPTIONS.map((status) => (
                <section
                    key={status.value}
                    className="min-h-[640px] rounded-md border border-border bg-card/60 p-3"
                >
                    <div className="mb-4 flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-6 w-8" />
                    </div>
                    <div className="flex flex-col gap-2">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div
                                key={index}
                                className="rounded-lg border bg-background p-3"
                            >
                                <div className="flex flex-col gap-2">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-4/5" />
                                    <div className="flex gap-1.5">
                                        <Skeleton className="h-5 w-12" />
                                        <Skeleton className="h-5 w-10" />
                                    </div>
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    )
}
