import { test as base, expect } from "@playwright/test"
import type { Page } from "@playwright/test"

export const test = base

export async function openBoard(page: Page) {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    // 等待看板卡片加载
    await expect(page.getByTestId(/^work-item-card-/).first()).toBeVisible({
        timeout: 15000,
    })
}

export async function openDetailDialog(page: Page, cardIndex = 0) {
    const cards = page.getByTestId(/^work-item-card-/)
    await cards.nth(cardIndex).click()
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 })
    return page.getByRole("dialog")
}

export async function closeDialog(page: Page) {
    const dialog = page.getByRole("dialog")
    await dialog.getByLabel("关闭").click()
    await expect(dialog).not.toBeVisible()
}

export { expect }
