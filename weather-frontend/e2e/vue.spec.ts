import { test, expect } from '@playwright/test'

test('click start button navigates to weather page', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('小慕天气')).toBeVisible()
  await expect(page.getByPlaceholder('搜索城市')).toHaveCount(0)
  await page.getByRole('button', { name: '开启天气查询' }).click()
  await expect(page).toHaveURL(/\/weather$/)
})

test('renders HomeView panels on /weather', async ({ page }) => {
  await page.goto('/weather')
  await expect(page.getByText('小慕天气 · 控制台')).toBeVisible()
  await expect(page.getByPlaceholder('搜索城市')).toBeVisible()
  await expect(page.locator('.search-icon')).toBeVisible()
  await expect(page.getByText('当前天气')).toBeVisible()
  await expect(page.getByRole('heading', { name: '每小时预报' })).toBeVisible()
})
