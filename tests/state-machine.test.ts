import { describe, expect, it } from "vitest"
import { validateTransition } from "@/lib/state-machine"
import type { ClarificationDTO } from "@/lib/types"

const baseClarification: ClarificationDTO = {
    id: "Q-1",
    content: "是否需要补充验收口径？",
    severity: "LOW",
    status: "OPEN",
    answer: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
}

describe("work item state machine", () => {
    it("allows configured forward transition", () => {
        expect(validateTransition("DRAFT", "ANALYZING", [])).toEqual({
            ok: true,
        })
    })

    it("rejects illegal jump", () => {
        const result = validateTransition("DRAFT", "IN_PROGRESS", [])
        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.code).toBe("INVALID_TRANSITION")
        }
    })

    it("blocks delivery states when high clarification is unresolved", () => {
        const result = validateTransition("ANALYZING", "READY", [
            { ...baseClarification, severity: "HIGH", status: "OPEN" },
        ])
        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.code).toBe("BLOCKED_BY_CLARIFICATION")
            expect(result.blockers).toHaveLength(1)
        }
    })

    it("allows delivery states after high clarification is resolved", () => {
        const result = validateTransition("ANALYZING", "READY", [
            {
                ...baseClarification,
                severity: "HIGH",
                status: "RESOLVED",
                answer: "进入 READY 前必须完成澄清。",
            },
        ])
        expect(result).toEqual({ ok: true })
    })

    it("locks completed work items", () => {
        const result = validateTransition("DONE", "TESTING", [])
        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.code).toBe("COMPLETE_LOCKED")
        }
    })
})
