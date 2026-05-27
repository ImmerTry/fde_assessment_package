import type { AiAnalysisDTO, AiRisk, WorkItemDTO } from "@/lib/types"

type AiAnalysisInput = Pick<
    WorkItemDTO,
    | "id"
    | "title"
    | "description"
    | "type"
    | "priority"
    | "acceptanceCriteria"
    | "clarifications"
    | "tags"
>

function riskFor(input: AiAnalysisInput): AiRisk[] {
    const risks: AiRisk[] = []
    const text = `${input.title} ${input.description} ${input.tags.join(" ")}`

    if (input.acceptanceCriteria.length < 2) {
        risks.push({
            title: "验收标准不足",
            level: "HIGH",
            reason: "当前验收标准较少，容易导致实现完成后难以判定是否达标。",
        })
    }

    if (/权限|数据范围|接口|字段|异常|边界/.test(text)) {
        risks.push({
            title: "边界条件需要补充",
            level: "MEDIUM",
            reason: "描述中出现权限、数据范围、接口或异常流程等关键词，需要在开发前确认。",
        })
    }

    if (input.priority === "P0" || input.priority === "P1") {
        risks.push({
            title: "高优先级交付风险",
            level: "HIGH",
            reason: "高优先级工作项需要更明确的阻断项清单、负责人和验收口径。",
        })
    }

    return risks.length
        ? risks
        : [
              {
                  title: "常规实现风险",
                  level: "LOW",
                  reason: "当前描述基本完整，但仍建议在进入测试前复核异常流程。",
              },
          ]
}

export async function analyzeWorkItem(
    input: AiAnalysisInput,
): Promise<Omit<AiAnalysisDTO, "id" | "createdAt">> {
    const risks = riskFor(input)
    const unresolvedCount = input.clarifications.filter(
        (item) => item.status === "OPEN",
    ).length

    return {
        summary: `${input.title} 需要围绕“${input.description.slice(
            0,
            48,
        )}${input.description.length > 48 ? "..." : ""}”完成需求澄清、状态推进和验收闭环。当前有 ${unresolvedCount} 个未解决澄清问题。`,
        suggestedAcceptanceCriteria: [
            "用户能够在列表或看板中快速定位该工作项并查看完整详情。",
            "状态流转必须遵循配置化状态机，非法流转返回明确错误。",
            "存在高优先级未解决澄清问题时，系统阻断进入交付后续状态。",
            "关键操作完成后页面数据自动刷新，并保留状态历史记录。",
        ],
        risks,
        suggestedClarificationQuestions: [
            "该工作项的完成边界是什么，哪些场景明确不在本次范围内？",
            "验收时由谁确认结果，是否需要保留操作记录或状态历史？",
            "异常流程、权限范围或接口字段是否已与上下游确认？",
        ],
        taskBreakdown: [
            "补齐需求边界和高优先级澄清问题。",
            "确认接口契约、状态机规则和错误码。",
            "完成前端页面、交互状态和 API 对接。",
            "覆盖合法流转、非法流转、阻断规则和 AI 分析的验证。",
        ],
    }
}
