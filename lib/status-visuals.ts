import type { ComponentType } from "react"
import type { WorkItemStatus } from "@/lib/types"
import {
    ClipboardCheck,
    Code2,
    FileText,
    Flag,
    FlaskConical,
    Search,
} from "lucide-react"

export const RING_ACCENT: Record<WorkItemStatus, string> = {
    DRAFT: "ring-slate-500/50",
    ANALYZING: "ring-blue-500/50",
    READY: "ring-cyan-500/50",
    IN_PROGRESS: "ring-orange-500/50",
    TESTING: "ring-purple-500/50",
    DONE: "ring-emerald-500/50",
}

export const STATUS_ACCENT: Record<WorkItemStatus, string> = {
    DRAFT: "bg-slate-500",
    ANALYZING: "bg-blue-500",
    READY: "bg-cyan-500",
    IN_PROGRESS: "bg-orange-500",
    TESTING: "bg-purple-500",
    DONE: "bg-emerald-500",
}

export const STATUS_ICON: Record<
    WorkItemStatus,
    ComponentType<{ className?: string }>
> = {
    DRAFT: FileText,
    ANALYZING: Search,
    READY: ClipboardCheck,
    IN_PROGRESS: Code2,
    TESTING: FlaskConical,
    DONE: Flag,
}

export const STATUS_VISUALS: Record<
    WorkItemStatus,
    {
        column: string
        columnSelected: string
        overview: string
        overviewActive: string
        overviewSelected: string
        flowCurrent: string
        flowNext: string
        flowTarget: string
        progress: string
        text: string
    }
> = {
    DRAFT: {
        column: "border-slate-300/80 bg-slate-100/75 dark:border-slate-400/25 dark:bg-slate-300/10",
        columnSelected:
            "border-slate-500 bg-slate-100 shadow-sm ring-1 ring-slate-300 dark:border-slate-300/60 dark:bg-slate-300/14 dark:ring-slate-300/20",
        overview:
            "border-slate-300/80 bg-slate-50 text-slate-900 dark:border-slate-400/25 dark:bg-slate-300/10 dark:text-slate-100",
        overviewActive:
            "border-slate-500 bg-slate-100 shadow-sm ring-1 ring-slate-300 dark:border-slate-300/70 dark:bg-slate-300/18 dark:ring-slate-300/20",
        overviewSelected:
            "border-slate-400 bg-slate-100/80 dark:border-slate-300/45 dark:bg-slate-300/14",
        flowCurrent:
            "border-slate-600 bg-slate-700 text-white shadow-sm dark:border-slate-200/70 dark:bg-slate-200 dark:text-slate-950",
        flowNext:
            "border-slate-400 bg-slate-100 text-slate-900 hover:bg-slate-200 dark:border-slate-300/35 dark:bg-slate-300/12 dark:text-slate-100",
        flowTarget:
            "border-slate-700 bg-slate-800 text-white shadow-lg ring-2 ring-slate-300 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950 dark:ring-slate-200/35",
        progress: "bg-slate-500",
        text: "text-slate-700 dark:text-slate-200",
    },
    ANALYZING: {
        column: "border-blue-300/80 bg-blue-50/85 dark:border-blue-300/25 dark:bg-blue-300/10",
        columnSelected:
            "border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-200 dark:border-blue-300/70 dark:bg-blue-300/14 dark:ring-blue-300/20",
        overview:
            "border-blue-300/80 bg-blue-50 text-blue-950 dark:border-blue-300/25 dark:bg-blue-300/10 dark:text-blue-100",
        overviewActive:
            "border-blue-500 bg-blue-100 shadow-sm ring-1 ring-blue-200 dark:border-blue-300/70 dark:bg-blue-300/18 dark:ring-blue-300/20",
        overviewSelected:
            "border-blue-400 bg-blue-50 dark:border-blue-300/45 dark:bg-blue-300/14",
        flowCurrent:
            "border-blue-600 bg-blue-700 text-white shadow-sm dark:border-blue-200/70 dark:bg-blue-200 dark:text-blue-950",
        flowNext:
            "border-blue-400 bg-blue-50 text-blue-950 hover:bg-blue-100 dark:border-blue-300/40 dark:bg-blue-300/12 dark:text-blue-100",
        flowTarget:
            "border-blue-700 bg-blue-700 text-white shadow-lg ring-2 ring-blue-200 dark:border-blue-100 dark:bg-blue-100 dark:text-blue-950 dark:ring-blue-200/35",
        progress: "bg-blue-500",
        text: "text-blue-700 dark:text-blue-200",
    },
    READY: {
        column: "border-cyan-400/60 bg-cyan-100/90 dark:border-cyan-300/35 dark:bg-cyan-400/12",
        columnSelected:
            "border-cyan-500 bg-cyan-50 shadow-sm ring-1 ring-cyan-200 dark:border-cyan-300/70 dark:bg-cyan-300/14 dark:ring-cyan-300/20",
        overview:
            "border-cyan-400/60 bg-cyan-50 text-cyan-950 dark:border-cyan-300/35 dark:bg-cyan-400/12 dark:text-cyan-100",
        overviewActive:
            "border-cyan-500 bg-cyan-100 shadow-sm ring-1 ring-cyan-200 dark:border-cyan-300/70 dark:bg-cyan-300/18 dark:ring-cyan-300/20",
        overviewSelected:
            "border-cyan-400 bg-cyan-50 dark:border-cyan-300/45 dark:bg-cyan-300/14",
        flowCurrent:
            "border-cyan-600 bg-cyan-600 text-white shadow-sm dark:border-cyan-200/70 dark:bg-cyan-200 dark:text-cyan-950",
        flowNext:
            "border-cyan-400 bg-cyan-50 text-cyan-950 hover:bg-cyan-100 dark:border-cyan-300/40 dark:bg-cyan-300/12 dark:text-cyan-100",
        flowTarget:
            "border-cyan-700 bg-cyan-600 text-white shadow-lg ring-2 ring-cyan-200 dark:border-cyan-100 dark:bg-cyan-100 dark:text-cyan-950 dark:ring-cyan-200/35",
        progress: "bg-cyan-500",
        text: "text-cyan-700 dark:text-cyan-200",
    },
    IN_PROGRESS: {
        column: "border-orange-400/60 bg-orange-100/90 dark:border-orange-300/35 dark:bg-orange-400/12",
        columnSelected:
            "border-orange-500 bg-orange-50 shadow-sm ring-1 ring-orange-200 dark:border-amber-300/70 dark:bg-orange-300/14 dark:ring-amber-300/20",
        overview:
            "border-orange-400/60 bg-orange-50 text-orange-950 dark:border-orange-300/35 dark:bg-orange-400/12 dark:text-orange-100",
        overviewActive:
            "border-orange-500 bg-orange-100 shadow-sm ring-1 ring-orange-200 dark:border-amber-300/70 dark:bg-orange-300/18 dark:ring-amber-300/20",
        overviewSelected:
            "border-orange-400 bg-orange-50 dark:border-amber-300/45 dark:bg-orange-300/14",
        flowCurrent:
            "border-orange-600 bg-orange-500 text-white shadow-sm dark:border-orange-200/70 dark:bg-orange-200 dark:text-orange-950",
        flowNext:
            "border-orange-400 bg-orange-50 text-orange-950 hover:bg-orange-100 dark:border-amber-300/40 dark:bg-orange-300/12 dark:text-orange-100",
        flowTarget:
            "border-orange-700 bg-orange-500 text-white shadow-lg ring-2 ring-orange-200 dark:border-orange-100 dark:bg-orange-100 dark:text-orange-950 dark:ring-orange-200/35",
        progress: "bg-orange-500",
        text: "text-orange-700 dark:text-orange-200",
    },
    TESTING: {
        column: "border-purple-400/60 bg-purple-100/90 dark:border-purple-300/35 dark:bg-purple-400/12",
        columnSelected:
            "border-purple-500 bg-purple-50 shadow-sm ring-1 ring-purple-200 dark:border-violet-300/70 dark:bg-purple-300/14 dark:ring-violet-300/20",
        overview:
            "border-purple-400/60 bg-purple-50 text-purple-950 dark:border-purple-300/35 dark:bg-purple-400/12 dark:text-purple-100",
        overviewActive:
            "border-purple-500 bg-purple-100 shadow-sm ring-1 ring-purple-200 dark:border-violet-300/70 dark:bg-purple-300/18 dark:ring-violet-300/20",
        overviewSelected:
            "border-purple-400 bg-purple-50 dark:border-violet-300/45 dark:bg-purple-300/14",
        flowCurrent:
            "border-purple-600 bg-violet-700 text-white shadow-sm dark:border-purple-200/70 dark:bg-purple-200 dark:text-purple-950",
        flowNext:
            "border-purple-400 bg-purple-50 text-purple-950 hover:bg-purple-100 dark:border-violet-300/40 dark:bg-purple-300/12 dark:text-purple-100",
        flowTarget:
            "border-purple-700 bg-violet-700 text-white shadow-lg ring-2 ring-purple-200 dark:border-purple-100 dark:bg-purple-100 dark:text-purple-950 dark:ring-purple-200/35",
        progress: "bg-purple-500",
        text: "text-purple-700 dark:text-purple-200",
    },
    DONE: {
        column: "border-emerald-400/60 bg-emerald-100/90 dark:border-emerald-300/35 dark:bg-emerald-400/12",
        columnSelected:
            "border-emerald-500 bg-emerald-50 shadow-sm ring-1 ring-emerald-200 dark:border-emerald-300/70 dark:bg-emerald-300/14 dark:ring-emerald-300/20",
        overview:
            "border-emerald-400/60 bg-emerald-50 text-emerald-950 dark:border-emerald-300/35 dark:bg-emerald-400/12 dark:text-emerald-100",
        overviewActive:
            "border-emerald-500 bg-emerald-100 shadow-sm ring-1 ring-emerald-200 dark:border-emerald-300/70 dark:bg-emerald-300/18 dark:ring-emerald-300/20",
        overviewSelected:
            "border-emerald-400 bg-emerald-50 dark:border-emerald-300/45 dark:bg-emerald-300/14",
        flowCurrent:
            "border-emerald-600 bg-emerald-600 text-white shadow-sm dark:border-emerald-200/70 dark:bg-emerald-200 dark:text-emerald-950",
        flowNext:
            "border-emerald-400 bg-emerald-50 text-emerald-950 hover:bg-emerald-100 dark:border-emerald-300/40 dark:bg-emerald-300/12 dark:text-emerald-100",
        flowTarget:
            "border-emerald-700 bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-200 dark:border-emerald-100 dark:bg-emerald-100 dark:text-emerald-950 dark:ring-emerald-200/35",
        progress: "bg-emerald-500",
        text: "text-emerald-700 dark:text-emerald-200",
    },
}
