import type { Metadata } from "next"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

export const metadata: Metadata = {
    title: "AI 辅助工作项看板",
    description: "Next.js + Prisma SQLite implementation for FDE assessment",
    icons: "/ico.svg",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const themeScript = `
    (() => {
      try {
        const mode = localStorage.getItem("fde-theme") || "system";
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const resolved = mode === "dark" || (mode !== "light" && prefersDark) ? "dark" : "light";
        document.documentElement.classList.toggle("dark", resolved === "dark");
        document.documentElement.dataset.theme = mode;
        document.documentElement.style.colorScheme = resolved;
      } catch {
        document.documentElement.dataset.theme = "system";
      }
    })();
  `

    return (
        <html lang="zh-CN" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
            </head>
            <body>
                <TooltipProvider>
                    {children}
                    <Toaster richColors closeButton position="bottom-right" />
                </TooltipProvider>
            </body>
        </html>
    )
}
