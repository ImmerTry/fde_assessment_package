import type { ApiError } from "@/lib/types"

type ValidationIssue = {
    message?: unknown
}

function validationIssues(details: unknown): ValidationIssue[] {
    if (!details || typeof details !== "object") {
        return []
    }

    const issues = (details as { issues?: unknown }).issues
    return Array.isArray(issues) ? (issues as ValidationIssue[]) : []
}

export function formatApiErrorMessage(error: ApiError | undefined) {
    const issueMessages = validationIssues(error?.details)
        .map((issue) => issue.message)
        .filter((message): message is string => typeof message === "string")
        .filter(Boolean)

    if (issueMessages.length > 0) {
        return Array.from(new Set(issueMessages)).join("；")
    }

    return error?.message ?? "请求失败，请稍后重试。"
}
