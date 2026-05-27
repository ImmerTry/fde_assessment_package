import { defineConfig, devices } from "@playwright/test"
import { fileURLToPath } from "node:url"
import path from "node:path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = 3010
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
    testDir: "./e2e",
    globalSetup: "./e2e/global-setup.ts",

    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : 2,
    reporter: [["html", { open: "never" }], ["list"]],
    timeout: 30_000,
    expect: { timeout: 10_000 },

    use: {
        baseURL: BASE_URL,
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
        channel: "chromium",
    },

    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],

    webServer: {
        command: `npx next dev -p ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: false,
        timeout: 60_000,
        cwd: __dirname,
    },
})
