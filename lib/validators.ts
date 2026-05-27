import { z } from "zod"

export const workItemCreateSchema = z.object({
    title: z.string().trim().min(2, "标题至少 2 个字符"),
    description: z.string().trim().min(8, "描述至少 8 个字符"),
    type: z.enum(["story", "bug", "task"]),
    priority: z.enum(["P0", "P1", "P2", "P3"]),
    status: z
        .enum(["DRAFT", "ANALYZING", "READY", "IN_PROGRESS", "TESTING", "DONE"])
        .default("DRAFT"),
    assignee: z.string().trim().min(1, "负责人不能为空"),
    tags: z.array(z.string().trim().min(1)).default([]),
    riskLevel: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
    acceptanceCriteria: z.array(z.string().trim().min(1)).default([]),
})

export const workItemUpdateSchema = workItemCreateSchema.partial().extend({
    title: z.string().trim().min(2, "标题至少 2 个字符").optional(),
})

export const transitionSchema = z.object({
    targetStatus: z.enum([
        "DRAFT",
        "ANALYZING",
        "READY",
        "IN_PROGRESS",
        "TESTING",
        "DONE",
    ]),
    actor: z.string().trim().min(1).default("candidate"),
    reason: z.string().trim().max(240).optional(),
})

export const clarificationCreateSchema = z.object({
    content: z.string().trim().min(4, "问题内容至少 4 个字符"),
    severity: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
    answer: z.string().trim().optional(),
})

export const clarificationUpdateSchema = z.object({
    content: z.string().trim().min(4).optional(),
    severity: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
    status: z.enum(["OPEN", "RESOLVED"]).optional(),
    answer: z.string().trim().nullable().optional(),
})

export const tagCreateSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "标签不能为空")
        .max(24, "标签最多 24 个字符")
        .regex(/^[\w-]+$/, "标签只能包含字母、数字、下划线或短横线")
        .transform((value) => value.toLowerCase()),
})
