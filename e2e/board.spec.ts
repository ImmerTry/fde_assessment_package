import { test, expect } from "@playwright/test"

test.describe("看板主页", () => {
    test("页面加载正常，显示标题和指标", async ({ page }) => {
        await page.goto("/")
        await page.waitForLoadState("networkidle")
        await expect(page.locator("h1")).toContainText("AI 辅助工作项看板")
        await expect(page.getByText("工作项", { exact: true })).toBeVisible({
            timeout: 10000,
        })
        await expect(page.getByText("流转中", { exact: true })).toBeVisible()
        await expect(page.getByText("高危阻断", { exact: true })).toBeVisible()
    })

    test("状态Tab栏可见并可切换", async ({ page }) => {
        await page.goto("/")
        await page.waitForLoadState("networkidle")
        const allTab = page.getByTestId("status-tab-ALL")
        await expect(allTab).toBeVisible({ timeout: 15000 })
        await expect(page.getByTestId("status-tab-DRAFT")).toBeVisible()

        await page.getByTestId("status-tab-DRAFT").click()
        await page.waitForTimeout(300)
        await expect(page.getByTestId("status-tab-DRAFT")).toHaveClass(/ring-2/)

        await allTab.click()
    })

    test("搜索框可用", async ({ page }) => {
        await page.goto("/")
        await page.waitForLoadState("networkidle")
        const searchInput = page.getByTestId("search-input")
        await expect(searchInput).toBeVisible({ timeout: 15000 })
        await searchInput.fill("用户登录")
        await page.waitForTimeout(800)
    })

    test("刷新按钮可用", async ({ page }) => {
        await page.goto("/")
        await page.waitForLoadState("networkidle")
        const refreshBtn = page.getByTestId("refresh-button")
        await expect(refreshBtn).toBeVisible({ timeout: 15000 })
        // 等待数据加载完成，刷新按钮不再被禁用
        await expect(refreshBtn).toBeEnabled({ timeout: 15000 })
    })
})
