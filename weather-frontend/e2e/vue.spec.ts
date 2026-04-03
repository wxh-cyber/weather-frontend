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
  await expect(page.locator('img.weather-icon').first()).toBeVisible()
  await expect(page.getByText('🌧️')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '每小时预报' })).toBeVisible()
})

test('clicking 未登录 opens login and can navigate to register', async ({ page }) => {
  await page.goto('/weather')
  await page.getByRole('button', { name: '前往登录页面' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: '登录' })).toBeVisible()
  await expect(page.getByPlaceholder('请输入邮箱')).toBeVisible()
  await expect(page.getByPlaceholder('请输入密码')).toBeVisible()
  await page.getByRole('link', { name: '请注册' }).click()
  await expect(page).toHaveURL(/\/register$/)
  await expect(page.getByRole('heading', { name: '注册' })).toBeVisible()
  await expect(page.getByPlaceholder('请输入注册邮箱')).toBeVisible()
  await expect(page.getByPlaceholder('请输入用户昵称')).toBeVisible()
  await expect(page.getByPlaceholder('请输入密码')).toBeVisible()
  await page.getByRole('link', { name: '去登录' }).click()
  await expect(page).toHaveURL(/\/login$/)
})
