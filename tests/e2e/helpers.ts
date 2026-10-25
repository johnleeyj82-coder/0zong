import { expect, type Page } from '@playwright/test'

export async function openRoom(page: Page, path = '/') {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto(path)
  await page.waitForFunction(() => window.__room?.ready === true)
  await expect(page.getByTestId('loading')).toHaveCount(0, { timeout: 30_000 })
  return errors
}

export async function roomMode(page: Page) {
  return page.evaluate(() => window.__room!.state.mode)
}

export async function waitForMode(page: Page, mode: string) {
  await page.waitForFunction((m) => window.__room?.state.mode === m, mode)
}

export async function project(page: Page, objectId: string) {
  return page.evaluate((id) => window.__room!.project(id), objectId)
}

export async function cameraPosition(page: Page) {
  return page.evaluate(() => window.__room!.camera().position)
}
