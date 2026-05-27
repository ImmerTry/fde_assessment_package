import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function parseStringList(value: string | null | undefined): string[] {
    if (!value) {
        return []
    }

    try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed.map(String) : []
    } catch {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
    }
}

export function stringifyStringList(values: string[]) {
    return JSON.stringify(values.map((value) => value.trim()).filter(Boolean))
}

export function toInputList(value: string) {
    return value
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean)
}
