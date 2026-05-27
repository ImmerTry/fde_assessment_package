"use client"

import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    Edit3,
    Eye,
    GitBranch,
    GripVertical,
    Kanban,
    Maximize2,
    Minimize2,
    Loader2,
    Plus,
    RefreshCcw,
    Save,
    Search,
    Trash2,
    X,
} from "lucide-react"
import { motion } from "motion/react"
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { ThemeToggle } from "@/components/workspace/theme-toggle"
import {
    PRIORITY_OPTIONS,
    STATUS_LABEL,
    STATUS_OPTIONS,
    getNextStatusOptions,
} from "@/lib/state-machine"
import type {
    ApiError,
    ClarificationDTO,
    ClarificationSeverity,
    Priority,
    RiskLevel,
    TagDTO,
    WorkItemDTO,
    WorkItemStatus,
    WorkItemType,
} from "@/lib/types"
import { formatApiErrorMessage } from "@/lib/api-errors"
import { addTagToList, removeTagFromList, uniqueTags } from "@/lib/tags"
import { cn, toInputList } from "@/lib/utils"
import {
    dateText,
    formFromItem,
    priorityTone,
    riskTone,
    sortItems,
} from "@/lib/helpers"
import { Metric } from "@/components/workspace/metric"
import { StatusDot, StatusTabs } from "@/components/workspace/status-tabs"
import { BoardSkeleton } from "@/components/workspace/board-skeleton"
import { EmptyState } from "@/components/workspace/detail-sections"
import {
    STATUS_ACCENT,
    STATUS_ICON,
    STATUS_VISUALS,
} from "@/lib/status-visuals"
import {
    DetailDialogHeader,
    DetailPanel,
} from "@/components/workspace/detail-panel"

type ApiEnvelope<T> = {
    data?: T
    error?: ApiError
}

type FormMode = "create" | "edit" | null

type WorkItemFormState = {
    title: string
    description: string
    type: WorkItemType
    priority: Priority
    status: WorkItemStatus
    assignee: string
    tags: string[]
    riskLevel: RiskLevel
    acceptanceCriteriaText: string
}

const emptyForm: WorkItemFormState = {
    title: "",
    description: "",
    type: "story",
    priority: "P2",
    status: "DRAFT",
    assignee: "candidate",
    tags: [],
    riskLevel: "MEDIUM",
    acceptanceCriteriaText: "",
}

const riseIn = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.36, ease: [0.16, 1, 0.3, 1] },
} as const

const softSpring = {
    type: "spring",
    stiffness: 260,
    damping: 28,
} as const

async function requestData<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
        },
    })
    const body = (await response.json()) as ApiEnvelope<T>

    if (!response.ok) {
        throw new Error(formatApiErrorMessage(body.error))
    }

    return body.data as T
}

export function WorkItemConsole() {
    const [items, setItems] = useState<WorkItemDTO[]>([])
    const [tagLibrary, setTagLibrary] = useState<TagDTO[]>([])
    const [assigneeList, setAssigneeList] = useState<
        { name: string; avatar: string }[]
    >([])
    const [assigneeSearch, setAssigneeSearch] = useState("")
    const [assigneeOpen, setAssigneeOpen] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<WorkItemStatus | "ALL">(
        "ALL",
    )
    const [priorityFilter, setPriorityFilter] = useState<Priority | "ALL">(
        "ALL",
    )
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState<string | null>(null)
    const [formMode, setFormMode] = useState<FormMode>(null)
    const [form, setForm] = useState<WorkItemFormState>(emptyForm)
    const [questionContent, setQuestionContent] = useState("")
    const [questionSeverity, setQuestionSeverity] =
        useState<ClarificationSeverity>("MEDIUM")
    const [tagDraft, setTagDraft] = useState("")
    const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({})
    const [draggingId, setDraggingId] = useState<string | null>(null)
    const [isDetailMaximized, setIsDetailMaximized] = useState(false)
    const [transitionFocus, setTransitionFocus] = useState<{
        itemId: string
        status: WorkItemStatus
    } | null>(null)

    const showToast = useCallback(
        ({ tone, message }: { tone: "success" | "error"; message: string }) => {
            if (tone === "success") {
                toast.success(message)
            } else {
                toast.error(message)
            }
        },
        [],
    )

    const loadItems = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (query.trim()) {
                params.set("q", query.trim())
            }
            if (priorityFilter !== "ALL") {
                params.set("priority", priorityFilter)
            }
            const suffix = params.toString() ? `?${params.toString()}` : ""
            const data = await requestData<WorkItemDTO[]>(
                `/api/work-items${suffix}`,
            )
            setItems(data)
            setSelectedId((current) =>
                current && data.some((item) => item.id === current)
                    ? current
                    : null,
            )
        } catch (error) {
            showToast({
                tone: "error",
                message: error instanceof Error ? error.message : "加载失败。",
            })
        } finally {
            setLoading(false)
        }
    }, [priorityFilter, query, showToast])

    const loadAssignees = useCallback(async (search?: string) => {
        try {
            const params = new URLSearchParams()
            if (search) params.set("q", search)
            const suffix = params.toString() ? "?" + params.toString() : ""
            const data = await requestData<{ name: string; avatar: string }[]>(
                "/api/assignees" + suffix,
            )
            setAssigneeList(data)
        } catch {
            // silent
        }
    }, [])

    const addAssignee = useCallback(
        async (name: string) => {
            try {
                await requestData<{ name: string; avatar: string }>(
                    "/api/assignees",
                    {
                        method: "POST",
                        body: JSON.stringify({ name }),
                    },
                )
                void loadAssignees()
            } catch {
                // silent
            }
        },
        [loadAssignees],
    )

    const loadTags = useCallback(async () => {
        try {
            const data = await requestData<TagDTO[]>("/api/tags")
            setTagLibrary(data)
        } catch (error) {
            showToast({
                tone: "error",
                message:
                    error instanceof Error ? error.message : "加载标签失败。",
            })
        }
    }, [showToast])

    useEffect(() => {
        void loadItems()
        void loadTags()
        void loadAssignees()
    }, [loadAssignees, loadItems, loadTags])

    const selectedItem = useMemo(
        () => items.find((item) => item.id === selectedId) ?? null,
        [items, selectedId],
    )

    const statusCounts = useMemo(
        () =>
            Object.fromEntries(
                STATUS_OPTIONS.map((status) => [
                    status.value,
                    items.filter((item) => item.status === status.value).length,
                ]),
            ) as Record<WorkItemStatus, number>,
        [items],
    )

    const metrics = useMemo(() => {
        const highBlockers = items.reduce(
            (total, item) =>
                total +
                item.clarifications.filter(
                    (question) =>
                        question.severity === "HIGH" &&
                        question.status === "OPEN",
                ).length,
            0,
        )
        return {
            total: items.length,
            inFlight: items.filter((item) =>
                ["ANALYZING", "READY", "IN_PROGRESS", "TESTING"].includes(
                    item.status,
                ),
            ).length,
            highBlockers,
        }
    }, [items])

    const upsertItem = useCallback((item: WorkItemDTO) => {
        setItems((current) => {
            const exists = current.some((candidate) => candidate.id === item.id)
            const next = exists
                ? current.map((candidate) =>
                      candidate.id === item.id ? item : candidate,
                  )
                : [item, ...current]
            return sortItems(next)
        })
        setSelectedId(item.id)
    }, [])

    const handleTransition = async (
        item: WorkItemDTO,
        targetStatus: WorkItemStatus,
    ) => {
        setTransitionFocus({ itemId: item.id, status: targetStatus })
        setBusy(`status-${item.id}`)
        try {
            const updated = await requestData<WorkItemDTO>(
                `/api/work-items/${item.id}/status`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        targetStatus,
                        actor: "candidate",
                        reason: "前端工作台触发流转",
                    }),
                },
            )
            upsertItem(updated)
            showToast({
                tone: "success",
                message: `已流转到${STATUS_LABEL[targetStatus]}。`,
            })
        } catch (error) {
            showToast({
                tone: "error",
                message:
                    error instanceof Error ? error.message : "状态流转失败。",
            })
        } finally {
            setBusy(null)
            setDraggingId(null)
        }
    }

    const openCreate = () => {
        setForm(emptyForm)
        setTagDraft("")
        setFormMode("create")
    }

    const openEdit = (item: WorkItemDTO) => {
        setForm(formFromItem(item))
        setTagDraft("")
        setFormMode("edit")
    }

    const submitWorkItem = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setBusy("form")

        const payload = {
            title: form.title,
            description: form.description,
            type: form.type,
            priority: form.priority,
            status: form.status,
            assignee: form.assignee,
            tags: uniqueTags(form.tags),
            riskLevel: form.riskLevel,
            acceptanceCriteria: toInputList(form.acceptanceCriteriaText),
        }

        try {
            const updated = await requestData<WorkItemDTO>(
                formMode === "create"
                    ? "/api/work-items"
                    : `/api/work-items/${selectedItem?.id}`,
                {
                    method: formMode === "create" ? "POST" : "PATCH",
                    body: JSON.stringify(payload),
                },
            )
            upsertItem(updated)
            setFormMode(null)
            showToast({
                tone: "success",
                message:
                    formMode === "create" ? "工作项已创建。" : "工作项已更新。",
            })
        } catch (error) {
            showToast({
                tone: "error",
                message: error instanceof Error ? error.message : "保存失败。",
            })
        } finally {
            setBusy(null)
        }
    }

    const addFormTag = (tag: string) => {
        setForm((current) => ({
            ...current,
            tags: addTagToList(current.tags, tag),
        }))
    }

    const removeFormTag = (tag: string) => {
        setForm((current) => ({
            ...current,
            tags: removeTagFromList(current.tags, tag),
        }))
    }

    const createTag = async () => {
        if (!tagDraft.trim()) {
            return
        }

        setBusy("tag")
        try {
            const tag = await requestData<TagDTO>("/api/tags", {
                method: "POST",
                body: JSON.stringify({ name: tagDraft }),
            })
            setTagLibrary((current) =>
                [...current.filter((item) => item.name !== tag.name), tag].sort(
                    (a, b) => a.name.localeCompare(b.name),
                ),
            )
            addFormTag(tag.name)
            setTagDraft("")
            showToast({ tone: "success", message: "标签已添加。" })
        } catch (error) {
            showToast({
                tone: "error",
                message:
                    error instanceof Error ? error.message : "新增标签失败。",
            })
        } finally {
            setBusy(null)
        }
    }

    const deleteTag = async (tag: string) => {
        setBusy(`tag-${tag}`)
        try {
            await requestData<{ name: string }>(
                `/api/tags/${encodeURIComponent(tag)}`,
                {
                    method: "DELETE",
                },
            )
            setTagLibrary((current) =>
                current.filter((item) => item.name !== tag),
            )
            removeFormTag(tag)
            showToast({ tone: "success", message: "标签已删除。" })
        } catch (error) {
            showToast({
                tone: "error",
                message:
                    error instanceof Error ? error.message : "删除标签失败。",
            })
        } finally {
            setBusy(null)
        }
    }

    const deleteWorkItem = async (item: WorkItemDTO) => {
        if (!window.confirm(`确认删除 ${item.id}？`)) {
            return
        }

        setBusy(`delete-${item.id}`)
        try {
            await requestData<{ id: string }>(`/api/work-items/${item.id}`, {
                method: "DELETE",
            })
            setItems((current) =>
                current.filter((candidate) => candidate.id !== item.id),
            )
            setSelectedId((current) => (current === item.id ? null : current))
            showToast({ tone: "success", message: "工作项已删除。" })
        } catch (error) {
            showToast({
                tone: "error",
                message: error instanceof Error ? error.message : "删除失败。",
            })
        } finally {
            setBusy(null)
        }
    }

    const addClarification = async (
        content = questionContent,
        severity = questionSeverity,
    ) => {
        if (!selectedItem || !content.trim()) {
            return
        }

        setBusy("clarification")
        try {
            const updated = await requestData<WorkItemDTO>(
                `/api/work-items/${selectedItem.id}/clarifications`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        content,
                        severity,
                    }),
                },
            )
            upsertItem(updated)
            setQuestionContent("")
            setQuestionSeverity("MEDIUM")
            showToast({ tone: "success", message: "澄清问题已新增。" })
        } catch (error) {
            showToast({
                tone: "error",
                message:
                    error instanceof Error ? error.message : "新增问题失败。",
            })
        } finally {
            setBusy(null)
        }
    }

    const patchClarification = async (
        question: ClarificationDTO,
        patch: Partial<
            Pick<ClarificationDTO, "answer" | "content" | "severity" | "status">
        >,
    ) => {
        if (!selectedItem) {
            return
        }

        setBusy(`question-${question.id}`)
        try {
            const updated = await requestData<WorkItemDTO>(
                `/api/work-items/${selectedItem.id}/clarifications/${question.id}`,
                {
                    method: "PATCH",
                    body: JSON.stringify(patch),
                },
            )
            upsertItem(updated)
            showToast({ tone: "success", message: "澄清问题已更新。" })
        } catch (error) {
            showToast({
                tone: "error",
                message: error instanceof Error ? error.message : "更新失败。",
            })
        } finally {
            setBusy(null)
        }
    }

    const deleteClarification = async (question: ClarificationDTO) => {
        if (!selectedItem) {
            return
        }

        setBusy(`question-${question.id}`)
        try {
            const updated = await requestData<WorkItemDTO>(
                `/api/work-items/${selectedItem.id}/clarifications/${question.id}`,
                { method: "DELETE" },
            )
            upsertItem(updated)
            showToast({ tone: "success", message: "澄清问题已删除。" })
        } catch (error) {
            showToast({
                tone: "error",
                message: error instanceof Error ? error.message : "删除失败。",
            })
        } finally {
            setBusy(null)
        }
    }

    const analyze = async () => {
        if (!selectedItem) {
            return
        }

        setBusy("ai")
        try {
            const updated = await requestData<WorkItemDTO>(
                `/api/work-items/${selectedItem.id}/ai-analysis`,
                { method: "POST" },
            )
            upsertItem(updated)
            showToast({ tone: "success", message: "AI 分析已生成。" })
        } catch (error) {
            showToast({
                tone: "error",
                message:
                    error instanceof Error ? error.message : "AI 分析失败。",
            })
        } finally {
            setBusy(null)
        }
    }

    const onDropToStatus = async (status: WorkItemStatus) => {
        if (!draggingId) {
            return
        }
        const item = items.find((candidate) => candidate.id === draggingId)
        if (!item || item.status === status) {
            setDraggingId(null)
            return
        }
        await handleTransition(item, status)
    }

    const selectItem = (id: string) => {
        setSelectedId(id)
        setDetailOpen(true)
    }

    const closeDetail = () => {
        setDetailOpen(false)
    }

    return (
        <motion.main
            className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_26%),linear-gradient(180deg,var(--background),color-mix(in_oklch,var(--background)_84%,var(--muted)))] dark:bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_26%),linear-gradient(180deg,var(--background),color-mix(in_oklch,var(--background)_82%,black))]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.28 }}
        >
            <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-4 p-4 lg:p-5">
                <motion.header
                    {...riseIn}
                    className="relative overflow-hidden rounded-lg border border-teal-200/70 bg-card/95 shadow-[0_16px_42px_rgba(15,118,110,0.08)] dark:border-teal-200/15 dark:shadow-black/20"
                >
                    <div
                        className="pointer-events-none absolute inset-x-0 top-0 h-1"
                        style={{
                            background:
                                "linear-gradient(90deg, var(--primary), color-mix(in oklch, var(--accent) 70%, transparent), transparent)",
                        }}
                    />
                    <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3">
                            <motion.div
                                className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-emerald-300/60 bg-[linear-gradient(135deg,#10b981,#0ea5e9)] text-white shadow-sm dark:border-teal-200/25"
                                initial={{ scale: 0.92, rotate: -3 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={softSpring}
                            >
                                <Kanban className="size-6" />
                            </motion.div>
                            <div>
                                <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
                                    <GitBranch className="size-3.5" />
                                    FDE Assessment
                                </p>
                                <h1 className="mt-1 text-xl font-semibold tracking-normal">
                                    AI 辅助工作项看板
                                </h1>
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                    搜索、点卡片、看阻断、走流转，像处理待办一样推进研发工作。
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="grid grid-cols-3 gap-2 text-sm">
                                <Metric label="工作项" value={metrics.total} />
                                <Metric
                                    label="流转中"
                                    value={metrics.inFlight}
                                    highlight
                                />
                                <Metric
                                    label="高危阻断"
                                    value={metrics.highBlockers}
                                    danger
                                />
                            </div>
                            <ThemeToggle />
                        </div>
                    </div>
                </motion.header>

                <motion.section
                    {...riseIn}
                    transition={{
                        duration: 0.4,
                        delay: 0.05,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                    className="flex flex-col gap-4"
                >
                    <div className="flex min-w-0 flex-col gap-4">
                        <motion.div className="rounded-lg border border-slate-200/80 bg-card/95 p-2.5 shadow-sm dark:border-white/10">
                            <div className="flex items-center gap-2 overflow-x-auto">
                                <StatusTabs
                                    counts={statusCounts}
                                    activeStatus={statusFilter}
                                    onSelectAll={() => setStatusFilter("ALL")}
                                    onSelect={(status) =>
                                        setStatusFilter((current) =>
                                            current === status ? "ALL" : status,
                                        )
                                    }
                                />
                                <div className="relative w-full sm:max-w-[220px]">
                                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        data-testid="search-input"
                                        value={query}
                                        onChange={(event) =>
                                            setQuery(event.target.value)
                                        }
                                        className="pl-8 text-sm"
                                        placeholder="搜索标题、描述、负责人或标签"
                                    />
                                </div>
                                <Select
                                    value={priorityFilter}
                                    onValueChange={(value) =>
                                        setPriorityFilter(
                                            value as Priority | "ALL",
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        data-testid="priority-filter"
                                        aria-label="优先级筛选"
                                        className="w-full text-sm sm:w-[140px]"
                                    >
                                        <SelectValue placeholder="全部优先级" />
                                    </SelectTrigger>
                                    <SelectContent className="text-sm">
                                        <SelectGroup>
                                            <SelectItem value="ALL">
                                                全部优先级
                                            </SelectItem>
                                            {PRIORITY_OPTIONS.map(
                                                (priority) => {
                                                    const dotColor =
                                                        priority.value ===
                                                            "P0" ||
                                                        priority.value === "P1"
                                                            ? "bg-red-500"
                                                            : priority.value ===
                                                                "P2"
                                                              ? "bg-amber-500"
                                                              : "bg-slate-400"
                                                    return (
                                                        <SelectItem
                                                            key={priority.value}
                                                            value={
                                                                priority.value
                                                            }
                                                        >
                                                            <span
                                                                className={cn(
                                                                    "inline-flex size-2 shrink-0 rounded-full",
                                                                    dotColor,
                                                                )}
                                                            />
                                                            {priority.label}
                                                        </SelectItem>
                                                    )
                                                },
                                            )}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <div className="ml-auto flex items-center gap-2">
                                    {(query || priorityFilter !== "ALL") && (
                                        <Button
                                            data-testid="reset-filters-button"
                                            className="text-sm"
                                            variant="outline"
                                            onClick={() => {
                                                setQuery("")
                                                setPriorityFilter("ALL")
                                            }}
                                        >
                                            <X
                                                data-icon="inline-start"
                                                className="size-3"
                                            />
                                            重置
                                        </Button>
                                    )}
                                    <Button
                                        data-testid="refresh-button"
                                        className="text-sm"
                                        variant="outline"
                                        onClick={loadItems}
                                        disabled={loading}
                                    >
                                        <RefreshCcw
                                            data-icon="inline-start"
                                            className={cn(
                                                "size-3.5",
                                                loading && "animate-spin",
                                            )}
                                        />
                                        刷新
                                    </Button>
                                    <Button
                                        data-testid="new-work-item-button"
                                        onClick={openCreate}
                                        className="text-sm"
                                    >
                                        <Plus
                                            data-icon="inline-start"
                                            className="size-3"
                                        />
                                        新建
                                    </Button>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div className="overflow-x-auto rounded-lg border border-slate-200/80 bg-card/95 p-3 shadow-sm dark:border-white/10">
                            {loading ? (
                                <BoardSkeleton />
                            ) : items.length === 0 ? (
                                <EmptyState
                                    title="没有匹配的工作项"
                                    description="可以清空筛选条件，或创建一个新的工作项。"
                                    action={
                                        <Button onClick={openCreate}>
                                            <Plus data-icon="inline-start" />
                                            新建工作项
                                        </Button>
                                    }
                                />
                            ) : (
                                <div className="flex gap-3 overflow-x-auto pb-2 lg:flex-wrap">
                                    {STATUS_OPTIONS.filter(
                                        (s) =>
                                            statusFilter === "ALL" ||
                                            s.value === statusFilter,
                                    ).map((status, index) => {
                                        const columnItems = items.filter(
                                            (item) =>
                                                item.status === status.value,
                                        )
                                        return (
                                            <motion.section
                                                key={status.value}
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    ...softSpring,
                                                    delay: index * 0.025,
                                                }}
                                                className={cn(
                                                    "min-h-[560px] rounded-md border border-border bg-card/60 p-3 transition-colors",
                                                    statusFilter !== "ALL"
                                                        ? "min-w-0 flex-1"
                                                        : "max-w-[90vw] min-w-[280px] flex-shrink-0 lg:w-[calc(16.666%-0.75rem)] lg:max-w-none lg:min-w-0",
                                                )}
                                                onDragOver={(event) =>
                                                    event.preventDefault()
                                                }
                                                onDrop={() =>
                                                    void onDropToStatus(
                                                        status.value,
                                                    )
                                                }
                                            >
                                                <div
                                                    className={cn(
                                                        "-mx-3 -mt-3 mb-3 rounded-t-md px-3 pt-3 pb-3",
                                                        STATUS_VISUALS[
                                                            status.value
                                                        ].column,
                                                    )}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <h2
                                                                className={cn(
                                                                    "flex items-center gap-2 text-sm font-semibold",
                                                                    status.value ===
                                                                        "DONE"
                                                                        ? STATUS_VISUALS[
                                                                              "DONE"
                                                                          ].text
                                                                        : STATUS_VISUALS[
                                                                              status
                                                                                  .value
                                                                          ]
                                                                              .text,
                                                                )}
                                                            >
                                                                {(() => {
                                                                    const Icon =
                                                                        STATUS_ICON[
                                                                            status
                                                                                .value
                                                                        ]
                                                                    return (
                                                                        <Icon
                                                                            className={cn(
                                                                                "size-3.5 shrink-0",
                                                                                status.value ===
                                                                                    "DONE"
                                                                                    ? STATUS_VISUALS[
                                                                                          "DONE"
                                                                                      ]
                                                                                          .text
                                                                                    : STATUS_VISUALS[
                                                                                          status
                                                                                              .value
                                                                                      ]
                                                                                          .text,
                                                                            )}
                                                                        />
                                                                    )
                                                                })()}
                                                                {status.label}
                                                            </h2>
                                                            <p
                                                                className={cn(
                                                                    "mt-1 truncate text-sm",
                                                                    STATUS_VISUALS[
                                                                        status
                                                                            .value
                                                                    ].text,
                                                                    "opacity-70",
                                                                )}
                                                            >
                                                                {
                                                                    status.description
                                                                }
                                                            </p>
                                                        </div>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "min-w-[2rem] justify-center border-2 bg-background/80 text-sm font-bold tabular-nums",
                                                                status.value ===
                                                                    "DONE"
                                                                    ? STATUS_VISUALS[
                                                                          "DONE"
                                                                      ].text
                                                                    : STATUS_VISUALS[
                                                                          status
                                                                              .value
                                                                      ].text,
                                                            )}
                                                        >
                                                            {columnItems.length}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div
                                                    className={cn(
                                                        statusFilter !== "ALL"
                                                            ? "grid grid-cols-2 gap-2"
                                                            : "flex flex-col gap-2",
                                                    )}
                                                >
                                                    {columnItems.length ===
                                                    0 ? (
                                                        <div className="rounded-md border border-dashed bg-background/60 p-4 text-center text-sm text-muted-foreground">
                                                            暂无工作项
                                                        </div>
                                                    ) : (
                                                        columnItems.map(
                                                            (item) => (
                                                                <WorkItemCard
                                                                    key={
                                                                        item.id
                                                                    }
                                                                    item={item}
                                                                    selected={
                                                                        selectedId ===
                                                                        item.id
                                                                    }
                                                                    onClick={() =>
                                                                        selectItem(
                                                                            item.id,
                                                                        )
                                                                    }
                                                                    onDragStart={() =>
                                                                        setDraggingId(
                                                                            item.id,
                                                                        )
                                                                    }
                                                                    onDragEnd={() =>
                                                                        setDraggingId(
                                                                            null,
                                                                        )
                                                                    }
                                                                    onEdit={
                                                                        openEdit
                                                                    }
                                                                    onDelete={
                                                                        deleteWorkItem
                                                                    }
                                                                    onTransition={
                                                                        handleTransition
                                                                    }
                                                                    singleColumn={
                                                                        statusFilter !==
                                                                        "ALL"
                                                                    }
                                                                />
                                                            ),
                                                        )
                                                    )}
                                                </div>
                                            </motion.section>
                                        )
                                    })}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </motion.section>
            </div>

            <Dialog
                open={detailOpen && selectedItem !== null}
                title={
                    selectedItem
                        ? `${selectedItem.id} · ${selectedItem.title}`
                        : "工作项详情"
                }
                className={
                    isDetailMaximized
                        ? "h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] rounded-xl"
                        : "h-[min(85vh,50rem)] max-h-[85vh] w-[min(90vw,56rem)] max-w-[min(90vw,56rem)] rounded-xl"
                }
                contentClassName="min-h-0 flex-1 p-0"
                headerClassName="bg-[linear-gradient(90deg,color-mix(in_oklch,var(--accent)_30%,var(--card)),var(--card))] px-5 py-4"
                header={
                    selectedItem ? (
                        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                            <DetailDialogHeader item={selectedItem} />
                            <div className="flex shrink-0 items-center gap-1">
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="size-8"
                                    aria-label={
                                        isDetailMaximized ? "还原" : "最大化"
                                    }
                                    onClick={() =>
                                        setIsDetailMaximized((v) => !v)
                                    }
                                >
                                    {isDetailMaximized ? (
                                        <Minimize2
                                            data-icon="inline-start"
                                            className="size-3.5"
                                        />
                                    ) : (
                                        <Maximize2
                                            data-icon="inline-start"
                                            className="size-3.5"
                                        />
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : undefined
                }
                onOpenChange={(open) => {
                    if (!open) {
                        closeDetail()
                        setIsDetailMaximized(false)
                    }
                }}
            >
                {selectedItem ? (
                    <DetailPanel
                        item={selectedItem}
                        busy={busy}
                        isMaximized={isDetailMaximized}
                        answerDrafts={answerDrafts}
                        questionContent={questionContent}
                        questionSeverity={questionSeverity}
                        focusedStatus={
                            transitionFocus?.itemId === selectedItem.id
                                ? transitionFocus.status
                                : null
                        }
                        onAnswerDraftChange={(id, value) =>
                            setAnswerDrafts((current) => ({
                                ...current,
                                [id]: value,
                            }))
                        }
                        onQuestionContentChange={setQuestionContent}
                        onQuestionSeverityChange={setQuestionSeverity}
                        onTransition={handleTransition}
                        onEdit={openEdit}
                        onDelete={deleteWorkItem}
                        onAddClarification={() => void addClarification()}
                        onAddSuggestedQuestion={(content) =>
                            void addClarification(content, "MEDIUM")
                        }
                        onPatchClarification={patchClarification}
                        onDeleteClarification={deleteClarification}
                        onAnalyze={analyze}
                    />
                ) : null}
            </Dialog>

            <Dialog
                open={formMode !== null}
                title={formMode === "create" ? "新建工作项" : "编辑工作项"}
                onOpenChange={(open) => {
                    if (!open) {
                        setFormMode(null)
                    }
                }}
            >
                <form className="grid gap-4 text-sm" onSubmit={submitWorkItem}>
                    <div className="grid gap-1.5">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                                1
                            </span>
                            <Label>标题</Label>
                        </div>
                        <Input
                            data-testid="work-item-title-input"
                            required
                            minLength={2}
                            value={form.title}
                            placeholder="工作项标题"
                            className="h-8 text-sm"
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    title: event.target.value,
                                }))
                            }
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                                2
                            </span>
                            <Label>描述</Label>
                        </div>
                        <Textarea
                            data-testid="work-item-description-input"
                            required
                            minLength={8}
                            value={form.description}
                            placeholder="简要描述"
                            className="min-h-16 text-sm"
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    description: event.target.value,
                                }))
                            }
                        />
                    </div>
                    <div className="mb-1.5 flex items-center gap-2">
                        <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                            3
                        </span>
                        <span className="text-sm font-medium">分类信息</span>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label>类型</Label>
                                <Select
                                    value={form.type}
                                    onValueChange={(v) =>
                                        setForm((c) => ({
                                            ...c,
                                            type: v as WorkItemType,
                                        }))
                                    }
                                >
                                    <SelectTrigger className="h-8 w-full text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="text-sm">
                                        <SelectGroup>
                                            <SelectItem value="story">
                                                <span className="mr-1.5 inline-flex size-1.5 rounded-full bg-blue-500" />
                                                story
                                            </SelectItem>
                                            <SelectItem value="bug">
                                                <span className="mr-1.5 inline-flex size-1.5 rounded-full bg-red-500" />
                                                bug
                                            </SelectItem>
                                            <SelectItem value="task">
                                                <span className="mr-1.5 inline-flex size-1.5 rounded-full bg-emerald-500" />
                                                task
                                            </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-1.5">
                                <Label>优先级</Label>
                                <Select
                                    value={form.priority}
                                    onValueChange={(v) =>
                                        setForm((c) => ({
                                            ...c,
                                            priority: v as Priority,
                                        }))
                                    }
                                >
                                    <SelectTrigger className="h-8 w-full text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="text-sm">
                                        <SelectGroup>
                                            {PRIORITY_OPTIONS.map((p) => {
                                                const dc =
                                                    p.value === "P0" ||
                                                    p.value === "P1"
                                                        ? "bg-red-500"
                                                        : p.value === "P2"
                                                          ? "bg-amber-500"
                                                          : "bg-slate-400"
                                                return (
                                                    <SelectItem
                                                        key={p.value}
                                                        value={p.value}
                                                    >
                                                        <span
                                                            className={
                                                                "mr-1.5 inline-flex size-1.5 rounded-full " +
                                                                dc
                                                            }
                                                        />
                                                        {p.label}
                                                    </SelectItem>
                                                )
                                            })}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-1.5">
                                <Label>风险</Label>
                                <Select
                                    value={form.riskLevel}
                                    onValueChange={(v) =>
                                        setForm((c) => ({
                                            ...c,
                                            riskLevel: v as RiskLevel,
                                        }))
                                    }
                                >
                                    <SelectTrigger className="h-8 w-full text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="text-sm">
                                        <SelectGroup>
                                            <SelectItem value="HIGH">
                                                <span className="mr-1.5 inline-flex size-1.5 rounded-full bg-red-500" />
                                                HIGH
                                            </SelectItem>
                                            <SelectItem value="MEDIUM">
                                                <span className="mr-1.5 inline-flex size-1.5 rounded-full bg-amber-500" />
                                                MEDIUM
                                            </SelectItem>
                                            <SelectItem value="LOW">
                                                <span className="mr-1.5 inline-flex size-1.5 rounded-full bg-emerald-500" />
                                                LOW
                                            </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-1.5">
                                <Label>负责人</Label>
                                <div className="relative">
                                    <div className="flex gap-1">
                                        <Input
                                            data-testid="work-item-assignee-input"
                                            value={assigneeSearch}
                                            placeholder={
                                                form.assignee ||
                                                "搜索或输入负责人"
                                            }
                                            className="h-8 flex-1 text-sm"
                                            onFocus={() => {
                                                void loadAssignees()
                                                setAssigneeOpen(true)
                                            }}
                                            onBlur={() =>
                                                setTimeout(
                                                    () =>
                                                        setAssigneeOpen(false),
                                                    150,
                                                )
                                            }
                                            onChange={(e) => {
                                                setAssigneeSearch(
                                                    e.target.value,
                                                )
                                                void loadAssignees(
                                                    e.target.value,
                                                )
                                                setAssigneeOpen(true)
                                            }}
                                            onKeyDown={(e) => {
                                                if (
                                                    e.key === "Enter" &&
                                                    assigneeSearch.trim() &&
                                                    !assigneeList.some(
                                                        (a) =>
                                                            a.name ===
                                                            assigneeSearch.trim(),
                                                    )
                                                ) {
                                                    e.preventDefault()
                                                    void addAssignee(
                                                        assigneeSearch.trim(),
                                                    ).then(() => {
                                                        setForm((c) => ({
                                                            ...c,
                                                            assignee:
                                                                assigneeSearch.trim(),
                                                        }))
                                                        setAssigneeSearch("")
                                                    })
                                                }
                                            }}
                                        />
                                        {form.assignee && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-sm"
                                                onClick={() => {
                                                    setForm((c) => ({
                                                        ...c,
                                                        assignee: "",
                                                    }))
                                                    setAssigneeSearch("")
                                                }}
                                            >
                                                <X className="size-3" />
                                            </Button>
                                        )}
                                    </div>
                                    {assigneeOpen &&
                                        (assigneeList.length > 0 ||
                                            assigneeSearch.trim()) && (
                                            <div className="absolute z-50 mt-1 max-h-36 w-full overflow-auto rounded-md border bg-popover shadow-md">
                                                {assigneeSearch.trim() &&
                                                    assigneeList.filter(
                                                        (a) =>
                                                            !assigneeSearch ||
                                                            a.name
                                                                .toLowerCase()
                                                                .includes(
                                                                    assigneeSearch.toLowerCase(),
                                                                ),
                                                    ).length === 0 && (
                                                        <div className="px-2.5 py-2 text-sm text-muted-foreground">
                                                            未找到，按 Enter
                                                            或点击下方按钮新建
                                                        </div>
                                                    )}
                                                {assigneeList
                                                    .filter(
                                                        (a) =>
                                                            !assigneeSearch ||
                                                            a.name
                                                                .toLowerCase()
                                                                .includes(
                                                                    assigneeSearch.toLowerCase(),
                                                                ),
                                                    )
                                                    .map((a) => (
                                                        <button
                                                            key={a.name}
                                                            type="button"
                                                            className="flex w-full items-center gap-2 px-2.5 py-1.5 text-sm hover:bg-accent"
                                                            onMouseDown={(
                                                                e,
                                                            ) => {
                                                                e.preventDefault()
                                                                setForm(
                                                                    (c) => ({
                                                                        ...c,
                                                                        assignee:
                                                                            a.name,
                                                                    }),
                                                                )
                                                                setAssigneeSearch(
                                                                    "",
                                                                )
                                                                setAssigneeOpen(
                                                                    false,
                                                                )
                                                            }}
                                                        >
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={
                                                                    a.avatar ||
                                                                    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(a.name)}&radius=50`
                                                                }
                                                                alt=""
                                                                className="size-5 rounded-full"
                                                            />
                                                            {a.name}
                                                        </button>
                                                    ))}
                                                {assigneeSearch.trim() &&
                                                    !assigneeList.some(
                                                        (a) =>
                                                            a.name.toLowerCase() ===
                                                            assigneeSearch
                                                                .trim()
                                                                .toLowerCase(),
                                                    ) && (
                                                        <button
                                                            type="button"
                                                            className="flex w-full items-center gap-2 border-t px-2.5 py-1.5 text-sm font-medium text-primary hover:bg-accent"
                                                            onMouseDown={(
                                                                e,
                                                            ) => {
                                                                e.preventDefault()
                                                                void addAssignee(
                                                                    assigneeSearch.trim(),
                                                                ).then(() => {
                                                                    setForm(
                                                                        (
                                                                            c,
                                                                        ) => ({
                                                                            ...c,
                                                                            assignee:
                                                                                assigneeSearch.trim(),
                                                                        }),
                                                                    )
                                                                    setAssigneeSearch(
                                                                        "",
                                                                    )
                                                                    setAssigneeOpen(
                                                                        false,
                                                                    )
                                                                })
                                                            }}
                                                        >
                                                            <Plus className="size-3" />
                                                            新建负责人&quot;
                                                            {assigneeSearch.trim()}
                                                            &quot;
                                                        </button>
                                                    )}
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                    </div>
                    {formMode === "create" && (
                        <div className="grid gap-1.5">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                                    4
                                </span>
                                <Label>初始状态</Label>
                            </div>
                            <Select
                                value={form.status}
                                onValueChange={(v) =>
                                    setForm((c) => ({
                                        ...c,
                                        status: v as WorkItemStatus,
                                    }))
                                }
                            >
                                <SelectTrigger className="h-8 w-full text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="text-sm">
                                    <SelectGroup>
                                        {STATUS_OPTIONS.map((s) => (
                                            <SelectItem
                                                key={s.value}
                                                value={s.value}
                                            >
                                                <StatusDot status={s.value} />
                                                {s.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="mb-1.5 flex items-center gap-2">
                        <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                            {formMode === "create" ? "5" : "4"}
                        </span>
                        <span className="text-sm font-medium">标签</span>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3">
                        <div className="flex flex-wrap gap-1 rounded-md border bg-background/60 p-1.5">
                            {form.tags.length ? (
                                form.tags.map((tag) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => removeFormTag(tag)}
                                        className="inline-flex items-center gap-0.5 rounded border bg-secondary px-1.5 py-0.5 text-sm hover:bg-secondary/80"
                                    >
                                        {tag}
                                        <X
                                            data-icon="inline-end"
                                            className="size-2.5"
                                        />
                                    </button>
                                ))
                            ) : (
                                <span className="px-1 py-0.5 text-sm text-muted-foreground">
                                    无
                                </span>
                            )}
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                            {tagLibrary.map((tag) => {
                                const sel = form.tags.includes(tag.name)
                                return (
                                    <span
                                        key={tag.id}
                                        className={cn(
                                            "inline-flex items-center overflow-hidden rounded border text-sm",
                                            sel
                                                ? "border-primary/30 bg-primary/10 text-primary"
                                                : "bg-background",
                                        )}
                                    >
                                        <button
                                            type="button"
                                            className="px-1.5 py-0.5 hover:bg-secondary"
                                            onClick={() => addFormTag(tag.name)}
                                        >
                                            {tag.name}
                                        </button>
                                        <button
                                            type="button"
                                            title="删除标签"
                                            className="border-l px-1 py-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                            disabled={
                                                busy === "tag-" + tag.name
                                            }
                                            onClick={() =>
                                                void deleteTag(tag.name)
                                            }
                                        >
                                            <X
                                                data-icon="inline-start"
                                                className="size-2.5"
                                            />
                                        </button>
                                    </span>
                                )
                            })}
                        </div>
                        <div className="mt-1.5 flex gap-1.5">
                            <Input
                                data-testid="work-item-tag-draft-input"
                                value={tagDraft}
                                onChange={(e) => setTagDraft(e.target.value)}
                                placeholder="新标签名"
                                className="h-8 text-sm"
                            />
                            <Button
                                type="button"
                                data-testid="create-tag-button"
                                size="sm"
                                className="h-8 text-sm"
                                onClick={() => void createTag()}
                                disabled={busy === "tag" || !tagDraft.trim()}
                            >
                                <Plus
                                    data-icon="inline-start"
                                    className="size-2.5"
                                />
                                新增
                            </Button>
                        </div>
                    </div>
                    <Button
                        type="submit"
                        data-testid="submit-work-item-button"
                        disabled={busy === "form"}
                        className="w-full"
                    >
                        {busy === "form" ? (
                            <Loader2
                                data-icon="inline-start"
                                className="size-3 animate-spin"
                            />
                        ) : (
                            <Save data-icon="inline-start" className="size-3" />
                        )}
                        {formMode === "create" ? "创建工作项" : "保存修改"}
                    </Button>
                </form>
            </Dialog>
        </motion.main>
    )
}

function WorkItemCard({
    item,
    selected,
    onClick,
    onDragStart,
    onDragEnd,
    onEdit,
    onDelete,
    onTransition,
    singleColumn,
}: {
    item: WorkItemDTO
    selected: boolean
    onClick: () => void
    onDragStart: () => void
    onDragEnd: () => void
    onEdit: (item: WorkItemDTO) => void
    onDelete: (item: WorkItemDTO) => void
    onTransition: (item: WorkItemDTO, targetStatus: WorkItemStatus) => void
    singleColumn?: boolean
}) {
    const highBlockers = item.clarifications.filter(
        (question) =>
            question.severity === "HIGH" && question.status === "OPEN",
    ).length

    const nextOptions = getNextStatusOptions(item.status)

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <motion.div
                    draggable
                    data-testid={`work-item-card-${item.id}`}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onClick={onClick}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -3, scale: 1.01 }}
                    whileTap={{ scale: 0.985 }}
                    transition={softSpring}
                    className={cn(
                        "cursor-pointer rounded-lg",
                        selected && "shadow-sm",
                    )}
                >
                    <Card
                        className={cn(
                            "relative h-full overflow-hidden bg-card/95 transition-all duration-200 hover:scale-[1.02] hover:border-primary/40 hover:shadow-lg dark:hover:border-primary/30",
                            selected &&
                                "shadow-md ring-2 ring-offset-1 ring-offset-background",
                            selected &&
                                STATUS_VISUALS[item.status].columnSelected,
                            highBlockers > 0 && "border-destructive/45",
                        )}
                    >
                        <div
                            className={cn(
                                "absolute inset-y-0 left-0 w-1.5 rounded-r-sm",
                                STATUS_ACCENT[item.status],
                            )}
                        />
                        <CardHeader className="flex flex-col gap-2 p-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                        <span
                                            className={cn(
                                                "h-1 w-1 rounded-full",
                                                STATUS_ACCENT[item.status],
                                            )}
                                        />
                                        <span>{item.id}</span>
                                    </div>
                                    <h3 className="mt-1 line-clamp-2 text-sm leading-5 font-semibold">
                                        {item.title}
                                    </h3>
                                </div>
                                {!singleColumn && (
                                    <GripVertical className="mt-1 size-3 shrink-0 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                <Badge variant="outline">{item.type}</Badge>
                                <Badge variant={priorityTone(item.priority)}>
                                    {item.priority}
                                </Badge>
                                <Badge variant={riskTone(item.riskLevel)}>
                                    风险 {item.riskLevel}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3 px-3 pb-3">
                            <p className="line-clamp-2 text-sm leading-4 text-muted-foreground">
                                {item.description}
                            </p>
                            <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(item.assignee)}&radius=50`}
                                        alt=""
                                        className="size-3.5 rounded-full"
                                    />
                                    {item.assignee}
                                </span>
                                <span>{dateText(item.updatedAt)}</span>
                            </div>
                            {highBlockers > 0 ? (
                                <div className="flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-sm text-destructive">
                                    <AlertTriangle className="size-3" />
                                    {highBlockers} 个高优先级阻断
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                </motion.div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
                <ContextMenuItem onClick={() => onClick()}>
                    <Eye className="size-3" />
                    <span>查看详情</span>
                    <ContextMenuShortcut>Enter</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onEdit(item)}>
                    <Edit3 className="size-3" />
                    <span>编辑</span>
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                    className="text-sm text-muted-foreground"
                    disabled
                >
                    <span className="text-sm">流转状态</span>
                </ContextMenuItem>
                {nextOptions.map((status) => {
                    const currentIdx = STATUS_OPTIONS.findIndex(
                        (s) => s.value === item.status,
                    )
                    const targetIdx = STATUS_OPTIONS.findIndex(
                        (s) => s.value === status,
                    )
                    const isForward = targetIdx > currentIdx

                    return (
                        <ContextMenuItem
                            key={status}
                            onClick={() => onTransition(item, status)}
                        >
                            {isForward ? (
                                <ArrowRight className="size-2.5 text-muted-foreground" />
                            ) : (
                                <ArrowLeft className="size-2.5 text-muted-foreground" />
                            )}
                            <span
                                className={cn(
                                    "inline-flex size-2 shrink-0 rounded-full",
                                    STATUS_ACCENT[status],
                                )}
                            />
                            <span>{STATUS_LABEL[status]}</span>
                        </ContextMenuItem>
                    )
                })}
                <ContextMenuSeparator />
                <ContextMenuItem
                    variant="destructive"
                    onClick={() => onDelete(item)}
                >
                    <Trash2 className="size-3" />
                    <span>删除</span>
                    <ContextMenuShortcut>Del</ContextMenuShortcut>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}
