import { describe, expect, it } from "vitest"
import { formatApiErrorMessage } from "@/lib/api-errors"
import { addTagToList, normalizeTag, removeTagFromList } from "@/lib/tags"
import type { ApiError } from "@/lib/types"

describe("form helper behavior", () => {
    it("surfaces concrete validation issue messages before the generic API message", () => {
        const error: ApiError = {
            code: "VALIDATION_ERROR",
            message: "请求参数不符合要求。",
            details: {
                issues: [
                    { path: ["description"], message: "描述至少 8 个字符" },
                    { path: ["assignee"], message: "负责人不能为空" },
                ],
            },
        }

        expect(formatApiErrorMessage(error)).toBe(
            "描述至少 8 个字符；负责人不能为空",
        )
    })

    it("normalizes and deduplicates custom tags", () => {
        expect(normalizeTag("  Workflow  ")).toBe("workflow")
        expect(addTagToList(["bug", "workflow"], " workflow ")).toEqual([
            "bug",
            "workflow",
        ])
        expect(addTagToList(["bug"], " API ")).toEqual(["bug", "api"])
    })

    it("removes a tag without disturbing the rest of the list", () => {
        expect(
            removeTagFromList(["bug", "workflow", "ai"], "workflow"),
        ).toEqual(["bug", "ai"])
    })
})
