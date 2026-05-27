import { NextResponse } from "next/server"
import { ZodError } from "zod"
import type { ApiError, ApiErrorCode } from "@/lib/types"

export function dataResponse<T>(data: T, init?: ResponseInit) {
    return NextResponse.json({ data }, init)
}

export function errorResponse(
    code: ApiErrorCode,
    message: string,
    status = 400,
    details?: unknown,
) {
    const error: ApiError = { code, message, details }
    return NextResponse.json({ error }, { status })
}

export function zodErrorResponse(error: ZodError) {
    return errorResponse("VALIDATION_ERROR", "请求参数不符合要求。", 422, {
        issues: error.issues,
    })
}
