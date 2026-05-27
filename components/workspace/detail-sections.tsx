"use client"

import { Info as InfoIcon, Kanban } from "lucide-react"
import { motion } from "motion/react"
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty"
import { Label } from "@/components/ui/label"
import { CheckCircle2 } from "lucide-react"

export function Section({
    title,
    children,
}: {
    title: string
    children: React.ReactNode
}) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-3 rounded-md border bg-background/85 p-3"
        >
            <h3 className="text-xs font-semibold">{title}</h3>
            {children}
        </motion.section>
    )
}

export function Field({
    label,
    children,
}: {
    label: string
    children: React.ReactNode
}) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            {children}
        </div>
    )
}

export function FieldHint({
    required,
    text,
}: {
    required?: boolean
    text: string
}) {
    return (
        <p className="flex items-start gap-1.5 text-sm leading-5 text-muted-foreground">
            <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
            <span>
                {required ? (
                    <span className="font-medium text-foreground">必填：</span>
                ) : null}
                {text}
            </span>
        </p>
    )
}

export function Info({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border bg-background px-3 py-2">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-0.5 truncate text-sm font-medium">{value}</div>
        </div>
    )
}

export function EmptyInline({ text }: { text: string }) {
    return (
        <Empty className="min-h-20 gap-2 rounded-md border bg-muted/20 p-3 md:p-3">
            <EmptyHeader className="gap-1">
                <EmptyDescription>{text}</EmptyDescription>
            </EmptyHeader>
        </Empty>
    )
}

export function EmptyState({
    title,
    description,
    action,
}: {
    title: string
    description: string
    action: React.ReactNode
}) {
    return (
        <Empty className="h-72 border bg-muted/20">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <Kanban />
                </EmptyMedia>
                <EmptyTitle>{title}</EmptyTitle>
                <EmptyDescription>{description}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>{action}</EmptyContent>
        </Empty>
    )
}

export function AnalysisList({
    title,
    items,
}: {
    title: string
    items: string[]
}) {
    return (
        <div>
            <h4 className="text-sm font-semibold">{title}</h4>
            {items.length ? (
                <ul className="mt-2 space-y-1.5">
                    {items.map((item) => (
                        <li key={item} className="flex gap-2 text-sm">
                            <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-primary" />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <EmptyInline text="暂无内容" />
            )}
        </div>
    )
}
