import { useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type DialogProps = {
    open: boolean
    title: string
    children: React.ReactNode
    onOpenChange: (open: boolean) => void
    className?: string
    contentClassName?: string
    header?: React.ReactNode
    headerClassName?: string
}

export function Dialog({
    open,
    title,
    children,
    onOpenChange,
    className,
    contentClassName,
    header,
    headerClassName,
}: DialogProps) {
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = ""
        }
        return () => {
            document.body.style.overflow = ""
        }
    }, [open])

    if (!open) {
        return null
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
            <div
                className={cn(
                    "flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border bg-card shadow-xl",
                    className,
                )}
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                <div
                    className={cn(
                        "flex items-start justify-between gap-3 border-b bg-muted/20 px-5 py-4",
                        headerClassName,
                    )}
                >
                    {header ?? (
                        <h2 className="text-lg font-semibold">{title}</h2>
                    )}
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-8 shrink-0"
                        aria-label="关闭"
                        onClick={() => onOpenChange(false)}
                    >
                        <X data-icon="inline-start" className="size-3.5" />
                    </Button>
                </div>
                <div className={cn("overflow-auto p-5", contentClassName)}>
                    {children}
                </div>
            </div>
        </div>
    )
}
