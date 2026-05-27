"use client"
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Loader2,
    Pencil,
    Plus,
    Save,
    Sparkles,
    Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type {
    ClarificationDTO,
    ClarificationSeverity,
    WorkItemDTO,
    WorkItemStatus,
} from "@/lib/types"
import {
    STATUS_LABEL,
    STATUS_OPTIONS,
    getNextStatusOptions,
} from "@/lib/state-machine"
import { CLARIFICATION_STATUS_LABEL } from "@/lib/state-machine"
import { STATUS_VISUALS } from "@/lib/status-visuals"
import { dateText, priorityTone, riskTone, severityTone } from "@/lib/helpers"
import { StatusFlow } from "@/components/workspace/status-flow"
import {
    AnalysisList,
    EmptyInline,
    Info,
    Section,
} from "@/components/workspace/detail-sections"
import { StatusDot } from "@/components/workspace/status-tabs"

export function DetailDialogHeader({ item }: { item: WorkItemDTO }) {
    const currentIndex = STATUS_OPTIONS.findIndex(
        (status) => status.value === item.status,
    )

    return (
        <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{item.id}</Badge>
                <Badge variant={priorityTone(item.priority)}>
                    {item.priority}
                </Badge>
                <Badge variant={riskTone(item.riskLevel)}>
                    风险 {item.riskLevel}
                </Badge>
            </div>
            <h2 className="mt-2 truncate text-lg leading-6 font-semibold">
                {item.title}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {STATUS_OPTIONS.map((status, index) => {
                    const current = status.value === item.status
                    const passed = index < currentIndex

                    return (
                        <div
                            key={status.value}
                            className="flex items-center gap-1.5"
                        >
                            <span
                                className={cn(
                                    "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-sm font-medium transition-colors",
                                    current
                                        ? "border-primary/35 bg-primary/10 text-primary"
                                        : passed
                                          ? "border-teal-200 bg-teal-50 text-teal-700 dark:border-emerald-300/20 dark:bg-teal-300/10 dark:text-teal-100"
                                          : "border-border bg-background/70 text-muted-foreground",
                                )}
                            >
                                <StatusDot
                                    status={status.value}
                                    active={current || passed}
                                />
                                {status.label}
                            </span>
                            {index < STATUS_OPTIONS.length - 1 ? (
                                <span className="text-muted-foreground/50">
                                    /
                                </span>
                            ) : null}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export function DetailPanel({
    item,
    busy,
    isMaximized,
    answerDrafts,
    questionContent,
    questionSeverity,
    focusedStatus,
    onAnswerDraftChange,
    onQuestionContentChange,
    onQuestionSeverityChange,
    onTransition,
    onEdit,
    onDelete,
    onAddClarification,
    onAddSuggestedQuestion,
    onPatchClarification,
    onDeleteClarification,
    onAnalyze,
}: {
    item: WorkItemDTO
    busy: string | null
    isMaximized: boolean
    answerDrafts: Record<string, string>
    questionContent: string
    questionSeverity: ClarificationSeverity
    focusedStatus: WorkItemStatus | null
    onAnswerDraftChange: (id: string, value: string) => void
    onQuestionContentChange: (value: string) => void
    onQuestionSeverityChange: (value: ClarificationSeverity) => void
    onTransition: (
        item: WorkItemDTO,
        targetStatus: WorkItemStatus,
    ) => Promise<void>
    onEdit: (item: WorkItemDTO) => void
    onDelete: (item: WorkItemDTO) => void
    onAddClarification: () => void
    onAddSuggestedQuestion: (content: string) => void
    onPatchClarification: (
        question: ClarificationDTO,
        patch: Partial<
            Pick<ClarificationDTO, "answer" | "content" | "severity" | "status">
        >,
    ) => Promise<void>
    onDeleteClarification: (question: ClarificationDTO) => Promise<void>
    onAnalyze: () => Promise<void>
}) {
    const nextOptions = getNextStatusOptions(item.status)
    const highBlockers = item.clarifications.filter(
        (question) =>
            question.severity === "HIGH" && question.status === "OPEN",
    )

    return (
        <div className="flex h-full min-h-0 flex-col bg-card/95">
            <div className="flex items-start justify-between gap-3 border-b p-4 lg:hidden">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{item.id}</Badge>
                        <Badge variant="secondary">
                            {STATUS_LABEL[item.status]}
                        </Badge>
                        <Badge variant={priorityTone(item.priority)}>
                            {item.priority}
                        </Badge>
                    </div>
                    <h2 className="mt-3 text-lg leading-6 font-semibold">
                        {item.title}
                    </h2>
                </div>
                <div className="flex shrink-0 gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                variant="ghost"
                                data-testid="edit-work-item-button"
                                className="text-sm"
                                aria-label="编辑工作项"
                                onClick={() => onEdit(item)}
                            >
                                <Pencil
                                    data-icon="inline-start"
                                    className="size-3"
                                />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>编辑工作项</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                variant="ghost"
                                data-testid="delete-work-item-button"
                                aria-label="删除工作项"
                                onClick={() => onDelete(item)}
                                disabled={busy === `delete-${item.id}`}
                            >
                                <Trash2
                                    data-icon="inline-start"
                                    className="size-3"
                                />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>删除工作项</TooltipContent>
                    </Tooltip>
                </div>
            </div>

            <div
                className={cn(
                    "flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto p-4",
                    isMaximized && "flex-row",
                )}
            >
                {isMaximized ? (
                    <>
                        <div className="flex w-2/3 min-w-0 flex-col gap-4">
                            <section className="flex flex-col gap-3">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <Info label="类型" value={item.type} />
                                    <div className="rounded-md border bg-background px-3 py-2">
                                        <div className="text-sm text-muted-foreground">
                                            负责人
                                        </div>
                                        <div className="mt-0.5 flex items-center gap-2">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(item.assignee)}&radius=50`}
                                                alt=""
                                                className="size-5 rounded-full"
                                            />
                                            <span className="text-sm font-medium">
                                                {item.assignee}
                                            </span>
                                        </div>
                                    </div>
                                    <Info label="风险" value={item.riskLevel} />
                                    <Info
                                        label="更新"
                                        value={dateText(item.updatedAt)}
                                    />
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {item.tags.length ? (
                                        item.tags.map((tag) => (
                                            <Badge key={tag} variant="outline">
                                                {tag}
                                            </Badge>
                                        ))
                                    ) : (
                                        <Badge variant="outline">无标签</Badge>
                                    )}
                                </div>
                            </section>

                            {highBlockers.length ? (
                                <Alert variant="destructive">
                                    <AlertTriangle />
                                    <AlertTitle>
                                        高优先级未解决问题阻断后续状态
                                    </AlertTitle>
                                    <AlertDescription>
                                        <ul className="flex list-disc flex-col gap-1 pl-5">
                                            {highBlockers.map((question) => (
                                                <li key={question.id}>
                                                    {question.content}
                                                </li>
                                            ))}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            ) : null}

                            <Section title="状态流转">
                                <div className="flex flex-wrap gap-2">
                                    {nextOptions.length ? (
                                        nextOptions.map((status) => (
                                            <Button
                                                key={status}
                                                size="sm"
                                                data-testid={`transition-button-${status}`}
                                                variant="outline"
                                                className={cn(
                                                    "h-7 text-xs",
                                                    focusedStatus === status &&
                                                        STATUS_VISUALS[status]
                                                            .flowTarget,
                                                    focusedStatus !== status &&
                                                        STATUS_VISUALS[status]
                                                            .flowNext,
                                                )}
                                                disabled={
                                                    busy === `status-${item.id}`
                                                }
                                                onClick={() =>
                                                    void onTransition(
                                                        item,
                                                        status,
                                                    )
                                                }
                                            >
                                                {busy ===
                                                `status-${item.id}` ? (
                                                    <Loader2
                                                        data-icon="inline-start"
                                                        className="size-3 animate-spin"
                                                    />
                                                ) : STATUS_OPTIONS.findIndex(
                                                      (s) => s.value === status,
                                                  ) <
                                                  STATUS_OPTIONS.findIndex(
                                                      (s) =>
                                                          s.value ===
                                                          item.status,
                                                  ) ? (
                                                    <ArrowLeft data-icon="inline-start" />
                                                ) : (
                                                    <ArrowRight data-icon="inline-start" />
                                                )}
                                                {STATUS_LABEL[status]}
                                            </Button>
                                        ))
                                    ) : (
                                        <span className="text-sm text-muted-foreground">
                                            当前状态没有可继续流转的目标。
                                        </span>
                                    )}
                                </div>
                                <StatusFlow
                                    item={item}
                                    busy={busy}
                                    focusedStatus={focusedStatus}
                                    nextOptions={nextOptions}
                                    onTransition={onTransition}
                                />
                            </Section>
                            <Section title="澄清问题">
                                <div className="grid gap-2">
                                    <Textarea
                                        data-testid="clarification-content-input"
                                        value={questionContent}
                                        onChange={(event) =>
                                            onQuestionContentChange(
                                                event.target.value,
                                            )
                                        }
                                        placeholder="新增一个需要澄清的问题"
                                        className="min-h-20"
                                    />
                                    <div className="grid grid-cols-[1fr_auto] gap-2">
                                        <Select
                                            value={questionSeverity}
                                            onValueChange={(value) =>
                                                onQuestionSeverityChange(
                                                    value as ClarificationSeverity,
                                                )
                                            }
                                        >
                                            <SelectTrigger
                                                data-testid="clarification-severity-select"
                                                className="w-full"
                                            >
                                                <SelectValue placeholder="严重程度" />
                                            </SelectTrigger>
                                            <SelectContent className="text-sm">
                                                <SelectGroup>
                                                    <SelectItem value="HIGH">
                                                        高
                                                    </SelectItem>
                                                    <SelectItem value="MEDIUM">
                                                        中
                                                    </SelectItem>
                                                    <SelectItem value="LOW">
                                                        低
                                                    </SelectItem>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            data-testid="add-clarification-button"
                                            onClick={onAddClarification}
                                            disabled={
                                                busy === "clarification" ||
                                                !questionContent.trim()
                                            }
                                        >
                                            {busy === "clarification" ? (
                                                <Loader2
                                                    data-icon="inline-start"
                                                    className="size-3 animate-spin"
                                                />
                                            ) : (
                                                <Plus data-icon="inline-start" />
                                            )}
                                            添加
                                        </Button>
                                    </div>
                                </div>

                                <div className="mt-3 space-y-3">
                                    {item.clarifications.length ? (
                                        item.clarifications.map((question) => {
                                            const answer =
                                                answerDrafts[question.id] ??
                                                question.answer ??
                                                ""
                                            return (
                                                <div
                                                    key={question.id}
                                                    data-testid={`clarification-card-${question.id}`}
                                                    className={cn(
                                                        "rounded-md border p-3",
                                                        question.severity ===
                                                            "HIGH" &&
                                                            question.status ===
                                                                "OPEN" &&
                                                            "border-destructive/40 bg-destructive/5",
                                                    )}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium">
                                                                {
                                                                    question.content
                                                                }
                                                            </p>
                                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                                <Badge
                                                                    variant={severityTone(
                                                                        question.severity,
                                                                    )}
                                                                >
                                                                    {
                                                                        question.severity
                                                                    }
                                                                </Badge>
                                                                <Badge
                                                                    variant={
                                                                        question.status ===
                                                                        "RESOLVED"
                                                                            ? "success"
                                                                            : "warning"
                                                                    }
                                                                >
                                                                    {
                                                                        CLARIFICATION_STATUS_LABEL[
                                                                            question
                                                                                .status
                                                                        ]
                                                                    }
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    data-testid={`clarification-delete-${question.id}`}
                                                                    aria-label="删除澄清问题"
                                                                    onClick={() =>
                                                                        void onDeleteClarification(
                                                                            question,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        busy ===
                                                                        `question-${question.id}`
                                                                    }
                                                                >
                                                                    <Trash2
                                                                        data-icon="inline-start"
                                                                        className="size-3"
                                                                    />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                删除澄清问题
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                    <Textarea
                                                        data-testid={`clarification-answer-${question.id}`}
                                                        value={answer}
                                                        onChange={(event) =>
                                                            onAnswerDraftChange(
                                                                question.id,
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        className="mt-3 min-h-20"
                                                        placeholder="填写回答"
                                                    />
                                                    <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                                                        <Select
                                                            value={
                                                                question.severity
                                                            }
                                                            onValueChange={(
                                                                value,
                                                            ) =>
                                                                void onPatchClarification(
                                                                    question,
                                                                    {
                                                                        severity:
                                                                            value as ClarificationSeverity,
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger
                                                                data-testid={`clarification-severity-${question.id}`}
                                                                className="w-full"
                                                            >
                                                                <SelectValue placeholder="严重程度" />
                                                            </SelectTrigger>
                                                            <SelectContent className="text-sm">
                                                                <SelectGroup>
                                                                    <SelectItem value="HIGH">
                                                                        高
                                                                    </SelectItem>
                                                                    <SelectItem value="MEDIUM">
                                                                        中
                                                                    </SelectItem>
                                                                    <SelectItem value="LOW">
                                                                        低
                                                                    </SelectItem>
                                                                </SelectGroup>
                                                            </SelectContent>
                                                        </Select>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            data-testid={`clarification-save-${question.id}`}
                                                            disabled={
                                                                busy ===
                                                                `question-${question.id}`
                                                            }
                                                            onClick={() =>
                                                                void onPatchClarification(
                                                                    question,
                                                                    {
                                                                        answer,
                                                                        status: answer.trim()
                                                                            ? "RESOLVED"
                                                                            : question.status,
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            <Save
                                                                data-icon="inline-start"
                                                                className="size-3"
                                                            />
                                                            保存回答
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            data-testid={`clarification-toggle-${question.id}`}
                                                            variant={
                                                                question.status ===
                                                                "RESOLVED"
                                                                    ? "secondary"
                                                                    : "default"
                                                            }
                                                            disabled={
                                                                busy ===
                                                                `question-${question.id}`
                                                            }
                                                            onClick={() =>
                                                                void onPatchClarification(
                                                                    question,
                                                                    {
                                                                        status:
                                                                            question.status ===
                                                                            "RESOLVED"
                                                                                ? "OPEN"
                                                                                : "RESOLVED",
                                                                        answer,
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            {question.status ===
                                                            "RESOLVED"
                                                                ? "重新打开"
                                                                : "标记解决"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <EmptyInline text="暂无澄清问题" />
                                    )}
                                </div>
                            </Section>
                        </div>
                        <div className="flex w-1/3 min-w-0 flex-col gap-4">
                            <Section title="描述">
                                <p className="text-sm leading-5 whitespace-pre-wrap text-muted-foreground">
                                    {item.description}
                                </p>
                            </Section>

                            <Section title="验收标准">
                                {item.acceptanceCriteria.length ? (
                                    <ul className="space-y-2">
                                        {item.acceptanceCriteria.map(
                                            (criteria) => (
                                                <li
                                                    key={criteria}
                                                    className="flex gap-2 text-sm"
                                                >
                                                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-300" />
                                                    <span>{criteria}</span>
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                ) : (
                                    <EmptyInline text="暂无验收标准" />
                                )}
                            </Section>

                            <Section title="AI 分析">
                                <Button
                                    data-testid="ai-analyze-button"
                                    onClick={onAnalyze}
                                    disabled={busy === "ai"}
                                    className="w-full"
                                >
                                    {busy === "ai" ? (
                                        <Loader2
                                            data-icon="inline-start"
                                            className="size-3 animate-spin"
                                        />
                                    ) : (
                                        <Sparkles
                                            data-icon="inline-start"
                                            className="size-3"
                                        />
                                    )}
                                    AI 分析需求
                                </Button>
                                {item.latestAiAnalysis ? (
                                    <div className="mt-3 space-y-4 rounded-md border bg-muted/30 p-3">
                                        <div>
                                            <h4 className="text-xs font-semibold">
                                                需求摘要
                                            </h4>
                                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                                {item.latestAiAnalysis.summary}
                                            </p>
                                        </div>
                                        <AnalysisList
                                            title="建议验收标准"
                                            items={
                                                item.latestAiAnalysis
                                                    .suggestedAcceptanceCriteria
                                            }
                                        />
                                        <div>
                                            <h4 className="text-sm font-semibold">
                                                风险点
                                            </h4>
                                            <div className="mt-2 space-y-2">
                                                {item.latestAiAnalysis.risks.map(
                                                    (risk) => (
                                                        <div
                                                            key={risk.title}
                                                            className="rounded-md border bg-card p-2"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Badge
                                                                    variant={riskTone(
                                                                        risk.level,
                                                                    )}
                                                                >
                                                                    {risk.level}
                                                                </Badge>
                                                                <span className="text-sm font-medium">
                                                                    {risk.title}
                                                                </span>
                                                            </div>
                                                            <p className="mt-1 text-sm text-muted-foreground">
                                                                {risk.reason}
                                                            </p>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold">
                                                建议澄清问题
                                            </h4>
                                            <div className="mt-2 space-y-2">
                                                {item.latestAiAnalysis.suggestedClarificationQuestions.map(
                                                    (question) => (
                                                        <div
                                                            key={question}
                                                            className="grid gap-2 rounded-md border bg-card p-2"
                                                        >
                                                            <p className="text-sm">
                                                                {question}
                                                            </p>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={item.clarifications.some(
                                                                    (c) =>
                                                                        c.content ===
                                                                        question,
                                                                )}
                                                                onClick={() =>
                                                                    onAddSuggestedQuestion(
                                                                        question,
                                                                    )
                                                                }
                                                            >
                                                                {item.clarifications.some(
                                                                    (c) =>
                                                                        c.content ===
                                                                        question,
                                                                ) ? (
                                                                    <>
                                                                        <CheckCircle2
                                                                            data-icon="inline-start"
                                                                            className="size-3"
                                                                        />
                                                                        已添加
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Plus data-icon="inline-start" />
                                                                        添加到澄清问题
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                        <AnalysisList
                                            title="任务拆解建议"
                                            items={
                                                item.latestAiAnalysis
                                                    .taskBreakdown
                                            }
                                        />
                                    </div>
                                ) : (
                                    <EmptyInline text="尚未生成 AI 分析" />
                                )}
                            </Section>

                            <Section title="状态历史">
                                {item.statusHistory.length ? (
                                    <div className="space-y-2">
                                        {item.statusHistory.map((history) => (
                                            <div
                                                key={history.id}
                                                className="rounded-md border bg-muted/20 px-3 py-2 text-sm"
                                            >
                                                <div className="font-medium">
                                                    {history.fromStatus
                                                        ? STATUS_LABEL[
                                                              history.fromStatus
                                                          ]
                                                        : "初始"}{" "}
                                                    →{" "}
                                                    {
                                                        STATUS_LABEL[
                                                            history.toStatus
                                                        ]
                                                    }
                                                </div>
                                                <div className="mt-1 text-muted-foreground">
                                                    {history.actor} ·{" "}
                                                    {dateText(
                                                        history.createdAt,
                                                    )}
                                                    {history.reason
                                                        ? ` · ${history.reason}`
                                                        : ""}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyInline text="暂无状态历史" />
                                )}
                            </Section>
                        </div>
                    </>
                ) : (
                    <>
                        <section className="flex flex-col gap-3">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <Info label="类型" value={item.type} />
                                <div className="rounded-md border bg-background px-3 py-2">
                                    <div className="text-sm text-muted-foreground">
                                        负责人
                                    </div>
                                    <div className="mt-0.5 flex items-center gap-2">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(item.assignee)}&radius=50`}
                                            alt=""
                                            className="size-5 rounded-full"
                                        />
                                        <span className="text-sm font-medium">
                                            {item.assignee}
                                        </span>
                                    </div>
                                </div>
                                <Info label="风险" value={item.riskLevel} />
                                <Info
                                    label="更新"
                                    value={dateText(item.updatedAt)}
                                />
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {item.tags.length ? (
                                    item.tags.map((tag) => (
                                        <Badge key={tag} variant="outline">
                                            {tag}
                                        </Badge>
                                    ))
                                ) : (
                                    <Badge variant="outline">无标签</Badge>
                                )}
                            </div>
                        </section>

                        {highBlockers.length ? (
                            <Alert variant="destructive">
                                <AlertTriangle />
                                <AlertTitle>
                                    高优先级未解决问题阻断后续状态
                                </AlertTitle>
                                <AlertDescription>
                                    <ul className="flex list-disc flex-col gap-1 pl-5">
                                        {highBlockers.map((question) => (
                                            <li key={question.id}>
                                                {question.content}
                                            </li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        ) : null}

                        <Section title="状态流转">
                            <div className="flex flex-wrap gap-2">
                                {nextOptions.length ? (
                                    nextOptions.map((status) => (
                                        <Button
                                            key={status}
                                            size="sm"
                                            data-testid={`transition-button-${status}`}
                                            variant="outline"
                                            className={cn(
                                                "h-7 text-xs",
                                                focusedStatus === status &&
                                                    STATUS_VISUALS[status]
                                                        .flowTarget,
                                                focusedStatus !== status &&
                                                    STATUS_VISUALS[status]
                                                        .flowNext,
                                            )}
                                            disabled={
                                                busy === `status-${item.id}`
                                            }
                                            onClick={() =>
                                                void onTransition(item, status)
                                            }
                                        >
                                            {busy === `status-${item.id}` ? (
                                                <Loader2
                                                    data-icon="inline-start"
                                                    className="size-3 animate-spin"
                                                />
                                            ) : STATUS_OPTIONS.findIndex(
                                                  (s) => s.value === status,
                                              ) <
                                              STATUS_OPTIONS.findIndex(
                                                  (s) =>
                                                      s.value === item.status,
                                              ) ? (
                                                <ArrowLeft data-icon="inline-start" />
                                            ) : (
                                                <ArrowRight data-icon="inline-start" />
                                            )}
                                            {STATUS_LABEL[status]}
                                        </Button>
                                    ))
                                ) : (
                                    <span className="text-sm text-muted-foreground">
                                        当前状态没有可继续流转的目标。
                                    </span>
                                )}
                            </div>
                            <StatusFlow
                                item={item}
                                busy={busy}
                                focusedStatus={focusedStatus}
                                nextOptions={nextOptions}
                                onTransition={onTransition}
                            />
                        </Section>

                        <Section title="描述">
                            <p className="text-sm leading-5 whitespace-pre-wrap text-muted-foreground">
                                {item.description}
                            </p>
                        </Section>

                        <Section title="验收标准">
                            {item.acceptanceCriteria.length ? (
                                <ul className="space-y-2">
                                    {item.acceptanceCriteria.map((criteria) => (
                                        <li
                                            key={criteria}
                                            className="flex gap-2 text-sm"
                                        >
                                            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-300" />
                                            <span>{criteria}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <EmptyInline text="暂无验收标准" />
                            )}
                        </Section>

                        <Section title="澄清问题">
                            <div className="grid gap-2">
                                <Textarea
                                    data-testid="clarification-content-input"
                                    value={questionContent}
                                    onChange={(event) =>
                                        onQuestionContentChange(
                                            event.target.value,
                                        )
                                    }
                                    placeholder="新增一个需要澄清的问题"
                                    className="min-h-20"
                                />
                                <div className="grid grid-cols-[1fr_auto] gap-2">
                                    <Select
                                        value={questionSeverity}
                                        onValueChange={(value) =>
                                            onQuestionSeverityChange(
                                                value as ClarificationSeverity,
                                            )
                                        }
                                    >
                                        <SelectTrigger
                                            data-testid="clarification-severity-select"
                                            className="w-full"
                                        >
                                            <SelectValue placeholder="严重程度" />
                                        </SelectTrigger>
                                        <SelectContent className="text-sm">
                                            <SelectGroup>
                                                <SelectItem value="HIGH">
                                                    高
                                                </SelectItem>
                                                <SelectItem value="MEDIUM">
                                                    中
                                                </SelectItem>
                                                <SelectItem value="LOW">
                                                    低
                                                </SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        data-testid="add-clarification-button"
                                        onClick={onAddClarification}
                                        disabled={
                                            busy === "clarification" ||
                                            !questionContent.trim()
                                        }
                                    >
                                        {busy === "clarification" ? (
                                            <Loader2
                                                data-icon="inline-start"
                                                className="size-3 animate-spin"
                                            />
                                        ) : (
                                            <Plus data-icon="inline-start" />
                                        )}
                                        添加
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-3 space-y-3">
                                {item.clarifications.length ? (
                                    item.clarifications.map((question) => {
                                        const answer =
                                            answerDrafts[question.id] ??
                                            question.answer ??
                                            ""
                                        return (
                                            <div
                                                key={question.id}
                                                data-testid={`clarification-card-${question.id}`}
                                                className={cn(
                                                    "rounded-md border p-3",
                                                    question.severity ===
                                                        "HIGH" &&
                                                        question.status ===
                                                            "OPEN" &&
                                                        "border-destructive/40 bg-destructive/5",
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium">
                                                            {question.content}
                                                        </p>
                                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                                            <Badge
                                                                variant={severityTone(
                                                                    question.severity,
                                                                )}
                                                            >
                                                                {
                                                                    question.severity
                                                                }
                                                            </Badge>
                                                            <Badge
                                                                variant={
                                                                    question.status ===
                                                                    "RESOLVED"
                                                                        ? "success"
                                                                        : "warning"
                                                                }
                                                            >
                                                                {
                                                                    CLARIFICATION_STATUS_LABEL[
                                                                        question
                                                                            .status
                                                                    ]
                                                                }
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                data-testid={`clarification-delete-${question.id}`}
                                                                aria-label="删除澄清问题"
                                                                onClick={() =>
                                                                    void onDeleteClarification(
                                                                        question,
                                                                    )
                                                                }
                                                                disabled={
                                                                    busy ===
                                                                    `question-${question.id}`
                                                                }
                                                            >
                                                                <Trash2
                                                                    data-icon="inline-start"
                                                                    className="size-3"
                                                                />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            删除澄清问题
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                                <Textarea
                                                    data-testid={`clarification-answer-${question.id}`}
                                                    value={answer}
                                                    onChange={(event) =>
                                                        onAnswerDraftChange(
                                                            question.id,
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="mt-3 min-h-20"
                                                    placeholder="填写回答"
                                                />
                                                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                                                    <Select
                                                        value={
                                                            question.severity
                                                        }
                                                        onValueChange={(
                                                            value,
                                                        ) =>
                                                            void onPatchClarification(
                                                                question,
                                                                {
                                                                    severity:
                                                                        value as ClarificationSeverity,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger
                                                            data-testid={`clarification-severity-${question.id}`}
                                                            className="w-full"
                                                        >
                                                            <SelectValue placeholder="严重程度" />
                                                        </SelectTrigger>
                                                        <SelectContent className="text-sm">
                                                            <SelectGroup>
                                                                <SelectItem value="HIGH">
                                                                    高
                                                                </SelectItem>
                                                                <SelectItem value="MEDIUM">
                                                                    中
                                                                </SelectItem>
                                                                <SelectItem value="LOW">
                                                                    低
                                                                </SelectItem>
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        data-testid={`clarification-save-${question.id}`}
                                                        disabled={
                                                            busy ===
                                                            `question-${question.id}`
                                                        }
                                                        onClick={() =>
                                                            void onPatchClarification(
                                                                question,
                                                                {
                                                                    answer,
                                                                    status: answer.trim()
                                                                        ? "RESOLVED"
                                                                        : question.status,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        <Save
                                                            data-icon="inline-start"
                                                            className="size-3"
                                                        />
                                                        保存回答
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        data-testid={`clarification-toggle-${question.id}`}
                                                        variant={
                                                            question.status ===
                                                            "RESOLVED"
                                                                ? "secondary"
                                                                : "default"
                                                        }
                                                        disabled={
                                                            busy ===
                                                            `question-${question.id}`
                                                        }
                                                        onClick={() =>
                                                            void onPatchClarification(
                                                                question,
                                                                {
                                                                    status:
                                                                        question.status ===
                                                                        "RESOLVED"
                                                                            ? "OPEN"
                                                                            : "RESOLVED",
                                                                    answer,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        {question.status ===
                                                        "RESOLVED"
                                                            ? "重新打开"
                                                            : "标记解决"}
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <EmptyInline text="暂无澄清问题" />
                                )}
                            </div>
                        </Section>

                        <Section title="AI 分析">
                            <Button
                                data-testid="ai-analyze-button"
                                onClick={onAnalyze}
                                disabled={busy === "ai"}
                                className="w-full"
                            >
                                {busy === "ai" ? (
                                    <Loader2
                                        data-icon="inline-start"
                                        className="size-3 animate-spin"
                                    />
                                ) : (
                                    <Sparkles
                                        data-icon="inline-start"
                                        className="size-3"
                                    />
                                )}
                                AI 分析需求
                            </Button>
                            {item.latestAiAnalysis ? (
                                <div className="mt-3 space-y-4 rounded-md border bg-muted/30 p-3">
                                    <div>
                                        <h4 className="text-xs font-semibold">
                                            需求摘要
                                        </h4>
                                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                            {item.latestAiAnalysis.summary}
                                        </p>
                                    </div>
                                    <AnalysisList
                                        title="建议验收标准"
                                        items={
                                            item.latestAiAnalysis
                                                .suggestedAcceptanceCriteria
                                        }
                                    />
                                    <div>
                                        <h4 className="text-sm font-semibold">
                                            风险点
                                        </h4>
                                        <div className="mt-2 space-y-2">
                                            {item.latestAiAnalysis.risks.map(
                                                (risk) => (
                                                    <div
                                                        key={risk.title}
                                                        className="rounded-md border bg-card p-2"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Badge
                                                                variant={riskTone(
                                                                    risk.level,
                                                                )}
                                                            >
                                                                {risk.level}
                                                            </Badge>
                                                            <span className="text-sm font-medium">
                                                                {risk.title}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 text-sm text-muted-foreground">
                                                            {risk.reason}
                                                        </p>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold">
                                            建议澄清问题
                                        </h4>
                                        <div className="mt-2 space-y-2">
                                            {item.latestAiAnalysis.suggestedClarificationQuestions.map(
                                                (question) => (
                                                    <div
                                                        key={question}
                                                        className="grid gap-2 rounded-md border bg-card p-2"
                                                    >
                                                        <p className="text-sm">
                                                            {question}
                                                        </p>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={item.clarifications.some(
                                                                (c) =>
                                                                    c.content ===
                                                                    question,
                                                            )}
                                                            onClick={() =>
                                                                onAddSuggestedQuestion(
                                                                    question,
                                                                )
                                                            }
                                                        >
                                                            {item.clarifications.some(
                                                                (c) =>
                                                                    c.content ===
                                                                    question,
                                                            ) ? (
                                                                <>
                                                                    <CheckCircle2
                                                                        data-icon="inline-start"
                                                                        className="size-3"
                                                                    />
                                                                    已添加
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Plus data-icon="inline-start" />
                                                                    添加到澄清问题
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                    <AnalysisList
                                        title="任务拆解建议"
                                        items={
                                            item.latestAiAnalysis.taskBreakdown
                                        }
                                    />
                                </div>
                            ) : (
                                <EmptyInline text="尚未生成 AI 分析" />
                            )}
                        </Section>

                        <Section title="状态历史">
                            {item.statusHistory.length ? (
                                <div className="space-y-2">
                                    {item.statusHistory.map((history) => (
                                        <div
                                            key={history.id}
                                            className="rounded-md border bg-muted/20 px-3 py-2 text-sm"
                                        >
                                            <div className="font-medium">
                                                {history.fromStatus
                                                    ? STATUS_LABEL[
                                                          history.fromStatus
                                                      ]
                                                    : "初始"}{" "}
                                                →{" "}
                                                {STATUS_LABEL[history.toStatus]}
                                            </div>
                                            <div className="mt-1 text-muted-foreground">
                                                {history.actor} ·{" "}
                                                {dateText(history.createdAt)}
                                                {history.reason
                                                    ? ` · ${history.reason}`
                                                    : ""}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyInline text="暂无状态历史" />
                            )}
                        </Section>
                    </>
                )}
            </div>
        </div>
    )
}
