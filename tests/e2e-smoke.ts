type ApiEnvelope<T> = {
    data?: T
    error?: {
        code: string
        message: string
        details?: unknown
    }
}

type WorkItemStatus =
    | "DRAFT"
    | "ANALYZING"
    | "READY"
    | "IN_PROGRESS"
    | "TESTING"
    | "DONE"

type WorkItemDTO = {
    id: string
    title: string
    description: string
    type: "story" | "bug" | "task"
    priority: "P0" | "P1" | "P2" | "P3"
    status: WorkItemStatus
    assignee: string
    tags: string[]
    riskLevel: "HIGH" | "MEDIUM" | "LOW"
    acceptanceCriteria: string[]
    clarifications: Array<{
        id: string
        content: string
        severity: "HIGH" | "MEDIUM" | "LOW"
        status: "OPEN" | "RESOLVED"
        answer: string | null
    }>
    latestAiAnalysis: {
        summary: string
        suggestedAcceptanceCriteria: string[]
        risks: Array<{
            title: string
            level: "HIGH" | "MEDIUM" | "LOW"
            reason: string
        }>
        suggestedClarificationQuestions: string[]
        taskBreakdown: string[]
    } | null
    statusHistory: Array<{
        fromStatus: WorkItemStatus | null
        toStatus: WorkItemStatus
    }>
}

type TagDTO = {
    id: string
    name: string
    createdAt: string
}

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000"
let devServer: ChildProcess | null = null

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) {
        throw new Error(message)
    }
}

async function request<T>(
    path: string,
    init?: RequestInit,
    expectedStatus = 200,
) {
    const response = await fetch(`${BASE_URL}${path}`, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
        },
    })
    const body = (await response.json()) as ApiEnvelope<T>

    if (response.status !== expectedStatus) {
        throw new Error(
            `${init?.method ?? "GET"} ${path} expected ${expectedStatus}, got ${
                response.status
            }: ${JSON.stringify(body)}`,
        )
    }

    return body
}

async function canReachServer() {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 1500)

    try {
        const response = await fetch(BASE_URL, { signal: controller.signal })
        return response.ok
    } catch {
        return false
    } finally {
        clearTimeout(timeout)
    }
}

async function ensureServer() {
    if (await canReachServer()) {
        return
    }

    const url = new URL(BASE_URL)
    const port = url.port || (url.protocol === "https:" ? "443" : "80")

    const command = process.platform === "win32" ? "cmd.exe" : "npm"
    const args =
        process.platform === "win32"
            ? ["/d", "/s", "/c", `npm run dev -- --port ${port}`]
            : ["run", "dev", "--", "--port", port]

    devServer = spawn(command, args, {
        cwd: process.cwd(),
        env: process.env,
        stdio: "ignore",
        windowsHide: true,
    })

    const deadline = Date.now() + 60_000
    while (Date.now() < deadline) {
        if (await canReachServer()) {
            return
        }
        await new Promise((resolve) => setTimeout(resolve, 750))
    }

    throw new Error(`Timed out waiting for dev server at ${BASE_URL}`)
}

function stopServerIfStarted() {
    if (devServer && !devServer.killed) {
        devServer.kill()
    }
}

async function expectApiError(
    path: string,
    init: RequestInit,
    code: string,
    expectedStatus = 409,
) {
    const body = await request<never>(path, init, expectedStatus)
    assert(
        body.error?.code === code,
        `Expected error code ${code}, got ${body.error?.code}`,
    )
    assert(Boolean(body.error.message), `Expected error message for ${code}`)
    return body.error
}

async function step(name: string, run: () => Promise<void>) {
    process.stdout.write(`E2E ${name} ... `)
    await run()
    process.stdout.write("ok\n")
}

async function main() {
    await ensureServer()

    await step("health and seeded board", async () => {
        const body = await request<WorkItemDTO[]>("/api/work-items")
        assert(
            body.data?.length === 18,
            `Expected 18 seeded items, got ${body.data?.length}`,
        )
        const counts = body.data.reduce<Record<string, number>>((acc, item) => {
            acc[item.status] = (acc[item.status] ?? 0) + 1
            return acc
        }, {})
        for (const status of [
            "DRAFT",
            "ANALYZING",
            "READY",
            "IN_PROGRESS",
            "TESTING",
            "DONE",
        ]) {
            assert(
                counts[status] === 3,
                `Expected 3 items in ${status}, got ${counts[status]}`,
            )
        }
    })

    await step("detail read", async () => {
        const body = await request<WorkItemDTO>("/api/work-items/WI-001")
        assert(body.data?.id === "WI-001", "WI-001 detail should load")
        assert(
            body.data.clarifications.length >= 2,
            "WI-001 should include clarifications",
        )
    })

    await step("tag library create list delete", async () => {
        const initial = await request<TagDTO[]>("/api/tags")
        assert(
            initial.data?.some((tag) => tag.name === "bug") &&
                initial.data.some((tag) => tag.name === "workflow"),
            "Seeded tag library should include bug and workflow",
        )

        const created = await request<TagDTO>(
            "/api/tags",
            {
                method: "POST",
                body: JSON.stringify({ name: "E2E-Tag" }),
            },
            201,
        )
        assert(
            created.data?.name === "e2e-tag",
            "Created tag should be normalized",
        )

        const afterCreate = await request<TagDTO[]>("/api/tags")
        assert(
            afterCreate.data?.some((tag) => tag.name === "e2e-tag"),
            "Created tag should be listed",
        )

        const removed = await request<{ name: string }>("/api/tags/e2e-tag", {
            method: "DELETE",
        })
        assert(
            removed.data?.name === "e2e-tag",
            "Deleted tag should return its name",
        )
    })

    await step("legal transition then blocked transition", async () => {
        const moved = await request<WorkItemDTO>(
            "/api/work-items/WI-001/status",
            {
                method: "PATCH",
                body: JSON.stringify({
                    targetStatus: "ANALYZING",
                    actor: "e2e",
                    reason: "E2E legal transition",
                }),
            },
        )
        assert(
            moved.data?.status === "ANALYZING",
            "WI-001 should move to ANALYZING",
        )

        const error = await expectApiError(
            "/api/work-items/WI-001/status",
            {
                method: "PATCH",
                body: JSON.stringify({
                    targetStatus: "READY",
                    actor: "e2e",
                    reason: "E2E blocked transition",
                }),
            },
            "BLOCKED_BY_CLARIFICATION",
        )
        assert(
            JSON.stringify(error.details).includes("高优先级澄清问题"),
            "Blocked transition should include blocker details",
        )
    })

    await step("resolve blocker and continue transition", async () => {
        const item = (await request<WorkItemDTO>("/api/work-items/WI-001")).data
        const blocker = item?.clarifications.find(
            (question) =>
                question.severity === "HIGH" && question.status === "OPEN",
        )
        assert(blocker, "Expected an unresolved high blocker")

        const resolved = await request<WorkItemDTO>(
            `/api/work-items/WI-001/clarifications/${blocker.id}`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    answer: "E2E 已确认阻断范围。",
                    status: "RESOLVED",
                }),
            },
        )
        assert(
            resolved.data?.clarifications.every(
                (question) =>
                    !(
                        question.severity === "HIGH" &&
                        question.status === "OPEN"
                    ),
            ),
            "High blocker should be resolved",
        )

        const ready = await request<WorkItemDTO>(
            "/api/work-items/WI-001/status",
            {
                method: "PATCH",
                body: JSON.stringify({
                    targetStatus: "READY",
                    actor: "e2e",
                    reason: "E2E continue after resolving blocker",
                }),
            },
        )
        assert(ready.data?.status === "READY", "WI-001 should move to READY")

        await expectApiError(
            "/api/work-items/WI-001/status",
            {
                method: "PATCH",
                body: JSON.stringify({
                    targetStatus: "DONE",
                    actor: "e2e",
                }),
            },
            "INVALID_TRANSITION",
        )
    })

    await step("clarification create update reopen delete", async () => {
        const created = await request<WorkItemDTO>(
            "/api/work-items/WI-004/clarifications",
            {
                method: "POST",
                body: JSON.stringify({
                    content: "E2E 新增澄清问题是否能完整闭环？",
                    severity: "MEDIUM",
                }),
            },
            201,
        )
        const question = created.data?.clarifications.find((item) =>
            item.content.includes("E2E 新增澄清问题"),
        )
        assert(question, "Created clarification should be returned")

        const answered = await request<WorkItemDTO>(
            `/api/work-items/WI-004/clarifications/${question.id}`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    answer: "E2E 回答内容。",
                    status: "RESOLVED",
                }),
            },
        )
        assert(
            answered.data?.clarifications.find(
                (item) => item.id === question.id,
            )?.status === "RESOLVED",
            "Clarification should be resolved",
        )

        const reopened = await request<WorkItemDTO>(
            `/api/work-items/WI-004/clarifications/${question.id}`,
            {
                method: "PATCH",
                body: JSON.stringify({ status: "OPEN" }),
            },
        )
        assert(
            reopened.data?.clarifications.find(
                (item) => item.id === question.id,
            )?.status === "OPEN",
            "Clarification should be reopened",
        )

        const deleted = await request<WorkItemDTO>(
            `/api/work-items/WI-004/clarifications/${question.id}`,
            { method: "DELETE" },
        )
        assert(
            !deleted.data?.clarifications.some(
                (item) => item.id === question.id,
            ),
            "Clarification should be deleted",
        )
    })

    await step("AI analysis generation", async () => {
        const analyzed = await request<WorkItemDTO>(
            "/api/work-items/WI-005/ai-analysis",
            {
                method: "POST",
            },
        )
        assert(analyzed.data?.latestAiAnalysis, "AI analysis should be present")
        assert(
            analyzed.data.latestAiAnalysis.risks.length > 0,
            "AI analysis should include risks",
        )
        assert(
            analyzed.data.latestAiAnalysis.suggestedClarificationQuestions
                .length > 0,
            "AI analysis should include suggested clarification questions",
        )
    })

    await step("work item create edit transition delete", async () => {
        const created = await request<WorkItemDTO>(
            "/api/work-items",
            {
                method: "POST",
                body: JSON.stringify({
                    title: "E2E 临时工作项",
                    description:
                        "用于自动化验收创建、编辑、状态流转和删除的临时工作项。",
                    type: "task",
                    priority: "P2",
                    status: "DRAFT",
                    assignee: "e2e",
                    tags: ["e2e", "temporary"],
                    riskLevel: "LOW",
                    acceptanceCriteria: ["可以创建", "可以编辑", "可以删除"],
                }),
            },
            201,
        )
        const id = created.data?.id
        assert(id, "Created work item should include id")

        const edited = await request<WorkItemDTO>(`/api/work-items/${id}`, {
            method: "PATCH",
            body: JSON.stringify({
                title: "E2E 临时工作项已编辑",
                priority: "P1",
                riskLevel: "MEDIUM",
            }),
        })
        assert(
            edited.data?.title.endsWith("已编辑"),
            "Work item title should update",
        )
        assert(
            edited.data?.priority === "P1",
            "Work item priority should update",
        )

        const transitioned = await request<WorkItemDTO>(
            `/api/work-items/${id}/status`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    targetStatus: "ANALYZING",
                    actor: "e2e",
                    reason: "E2E transition",
                }),
            },
        )
        assert(
            transitioned.data?.status === "ANALYZING",
            "Created item should transition",
        )

        const removed = await request<{ id: string }>(`/api/work-items/${id}`, {
            method: "DELETE",
        })
        assert(removed.data?.id === id, "Deleted work item should return id")

        await expectApiError(`/api/work-items/${id}`, {}, "NOT_FOUND", 404)
    })
}

main()
    .catch((error) => {
        console.error(error)
        stopServerIfStarted()
        process.exit(1)
    })
    .then(() => {
        stopServerIfStarted()
    })
import { spawn, type ChildProcess } from "node:child_process"
