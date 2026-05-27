export const INITIAL_TAGS = [
    "bug",
    "workflow",
    "ai",
    "validation",
    "kanban",
    "api",
    "docs",
    "clarification",
]

export function normalizeTag(value: string) {
    return value.trim().toLowerCase()
}

export function uniqueTags(values: string[]) {
    return Array.from(
        new Set(values.map(normalizeTag).filter((value) => value.length > 0)),
    )
}

export function addTagToList(values: string[], value: string) {
    return uniqueTags([...values, value])
}

export function removeTagFromList(values: string[], value: string) {
    const target = normalizeTag(value)
    return uniqueTags(values).filter((tag) => tag !== target)
}
