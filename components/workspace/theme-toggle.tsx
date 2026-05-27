"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import type { ComponentType } from "react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

type ThemeMode = "system" | "light" | "dark"

const STORAGE_KEY = "fde-theme"

const OPTIONS: Array<{
    value: ThemeMode
    label: string
    icon: ComponentType<{ className?: string }>
}> = [
    { value: "system", label: "跟随系统", icon: Monitor },
    { value: "light", label: "日间模式", icon: Sun },
    { value: "dark", label: "夜间模式", icon: Moon },
]

function resolveTheme(mode: ThemeMode) {
    if (mode === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
    }

    return mode
}

function applyTheme(mode: ThemeMode) {
    const resolved = resolveTheme(mode)
    document.documentElement.classList.toggle("dark", resolved === "dark")
    document.documentElement.dataset.theme = mode
    document.documentElement.style.colorScheme = resolved
}

export function ThemeToggle() {
    const [mode, setMode] = useState<ThemeMode>("system")

    useEffect(() => {
        const stored = window.localStorage.getItem(
            STORAGE_KEY,
        ) as ThemeMode | null
        const initial =
            stored === "light" || stored === "dark" || stored === "system"
                ? stored
                : "system"

        setMode(initial)
        applyTheme(initial)

        const media = window.matchMedia("(prefers-color-scheme: dark)")
        const onChange = () => {
            if (
                (window.localStorage.getItem(STORAGE_KEY) ?? "system") ===
                "system"
            ) {
                applyTheme("system")
            }
        }

        media.addEventListener("change", onChange)
        return () => media.removeEventListener("change", onChange)
    }, [])

    const choose = (nextMode: ThemeMode) => {
        setMode(nextMode)
        window.localStorage.setItem(STORAGE_KEY, nextMode)
        applyTheme(nextMode)
    }

    return (
        <div className="inline-flex rounded-md border bg-background/70 p-1 shadow-sm">
            {OPTIONS.map((option) => {
                const Icon = option.icon
                const active = mode === option.value

                return (
                    <button
                        key={option.value}
                        type="button"
                        data-testid={`theme-${option.value}`}
                        title={option.label}
                        aria-label={option.label}
                        aria-pressed={active}
                        onClick={() => choose(option.value)}
                        className={cn(
                            "flex size-8 items-center justify-center rounded-sm text-muted-foreground transition-colors",
                            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                            active
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "hover:bg-secondary hover:text-foreground",
                        )}
                    >
                        <Icon className="size-4" />
                    </button>
                )
            })}
        </div>
    )
}
