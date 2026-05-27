import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
    {
        variants: {
            variant: {
                default: "border-transparent bg-primary/10 text-primary",
                secondary:
                    "border-transparent bg-secondary text-secondary-foreground",
                outline: "border-border text-foreground",
                destructive:
                    "border-transparent bg-destructive/10 text-destructive dark:bg-destructive/15 dark:text-red-200",
                warning:
                    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/25 dark:bg-amber-300/15 dark:text-amber-100",
                success:
                    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-300/25 dark:bg-emerald-300/15 dark:text-emerald-100",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    },
)

export interface BadgeProps
    extends
        React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
