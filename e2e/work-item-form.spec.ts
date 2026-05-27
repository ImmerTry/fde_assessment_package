import { test, expect } from "@playwright/test"

test.describe("工作项表单", () => {
    test("新建按钮打开创建表单", async ({ page }) => {
        await page.goto("/")
        const newBtn = page.getByTestId("new-work-item-button")
        await expect(newBtn).toBeVisible()
        await newBtn.click()

        // 表单弹框出现
        const dialog = page.getByRole("dialog")
        await expect(dialog).toBeVisible({ timeout: 5000 })
        await expect(dialog.getByText("新建工作项")).toBeVisible()
    })

    test("表单必填验证", async ({ page }) => {
        await page.goto("/")
        await page.getByTestId("new-work-item-button").click()

        const dialog = page.getByRole("dialog")
        await expect(dialog).toBeVisible({ timeout: 5000 })

        // 不填标题直接提交
        const titleInput = page.getByTestId("work-item-title-input")
        await titleInput.fill("")
        await page.getByTestId("submit-work-item-button").click()

        // HTML5 表单验证应阻止提交（required 属性）
        // 标题输入框应该有 required 属性
        await expect(titleInput).toHaveAttribute("required", "")
    })

    test("创建并删除工作项", async ({ page }) => {
        await page.goto("/")
        await page.getByTestId("new-work-item-button").click()

        const dialog = page.getByRole("dialog")
        await expect(dialog).toBeVisible({ timeout: 5000 })

        // 填写表单
        await page
            .getByTestId("work-item-title-input")
            .fill("Playwright E2E 测试工作项")
        const descInput = page.getByTestId("work-item-description-input")
        await descInput.fill("这是一个通过 Playwright 创建的 E2E 测试工作项。")

        // 提交
        await page.getByTestId("submit-work-item-button").click()

        // 等待创建完成，弹框关闭
        await expect(dialog).not.toBeVisible({ timeout: 8000 })

        // 新卡片应该出现在页面上
        const newCard = page
            .locator('[data-testid^="work-item-card-"]')
            .filter({ hasText: "Playwright E2E" })
        await expect(newCard.first()).toBeVisible({ timeout: 8000 })

        // 右键菜单删除
        await newCard.first().click({ button: "right" })
        const deleteMenuItem = page.getByText("删除")
        if (await deleteMenuItem.isVisible({ timeout: 3000 })) {
            // 处理 confirm 弹框
            page.once("dialog", (d) => d.accept())
            await deleteMenuItem.click()
        }
    })

    test("表单可以关闭", async ({ page }) => {
        await page.goto("/")
        await page.getByTestId("new-work-item-button").click()

        const dialog = page.getByRole("dialog")
        await expect(dialog).toBeVisible({ timeout: 5000 })

        // 点击关闭
        await dialog.getByLabel("关闭").click()
        await expect(dialog).not.toBeVisible()
    })
})
