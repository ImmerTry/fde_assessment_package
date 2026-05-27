"use client"

import { Button } from "@/components/ui/button"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <main className="flex min-h-screen items-center justify-center bg-background p-6">
            <section className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
                <h1 className="text-lg font-semibold">页面暂时不可用</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    {error.message}
                </p>
                <Button className="mt-4" onClick={reset}>
                    重试
                </Button>
            </section>
        </main>
    )
}
