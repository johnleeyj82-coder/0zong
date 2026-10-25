import { expect, test } from '@playwright/test'
import { CAMERA_BOUNDS } from '../../src/room/layout'
import { cameraPosition, openRoom, project, roomMode, waitForMode } from './helpers'

test.describe('방 둘러보기 (desktop)', () => {
  test.skip(({ isMobile }) => isMobile, '데스크톱 전용')

  test('방이 뜨고 콘솔 오류가 없다', async ({ page }) => {
    const errors = await openRoom(page)
    await expect(page.locator('canvas')).toBeVisible()
    await expect(page.getByText('임시 방 · 실사 복원 전')).toBeVisible()
    expect(await roomMode(page)).toBe('explore')
    await page.screenshot({ path: 'test-results/evidence/01-home.png' })
    expect(errors).toEqual([])
  })

  test('호버하면 이름표가 뜨고, 클릭하면 다가가 콘텐츠가 열리고, ESC로 돌아온다', async ({ page }) => {
    const errors = await openRoom(page)
    const before = await cameraPosition(page)
    const pt = await project(page, 'monitor-left')
    expect(pt).not.toBeNull()

    await page.mouse.move(pt!.x, pt!.y)
    await expect(page.getByTestId('hover-label')).toContainText('왼쪽 모니터')
    await page.screenshot({ path: 'test-results/evidence/02-hover.png' })

    await page.mouse.click(pt!.x, pt!.y)
    await waitForMode(page, 'content')
    const panel = page.getByTestId('content-panel')
    await expect(panel).toHaveAttribute('data-module', 'game-archive')
    await expect(panel.getByRole('heading', { name: 'GAME ARCHIVE' })).toBeVisible()
    await expect(page).toHaveURL(/#monitor-left$/)
    const near = await cameraPosition(page)
    expect(near[0]).toBeGreaterThan(before[0])
    await page.screenshot({ path: 'test-results/evidence/03-content.png' })

    await page.keyboard.press('Escape')
    await waitForMode(page, 'explore')
    await expect(panel).toHaveCount(0)
    await expect(page).not.toHaveURL(/#/)
    const after = await cameraPosition(page)
    after.forEach((v, i) => expect(v).toBeCloseTo(before[i], 2))
    expect(errors).toEqual([])
  })

  test('드래그로 시점이 돌고, 멀리 당겨도 카메라는 방 안에 머문다', async ({ page }) => {
    await openRoom(page)
    const start = await cameraPosition(page)
    const box = (await page.locator('canvas').boundingBox())!
    const cx = box.x + box.width * 0.3
    const cy = box.y + box.height * 0.8
    await page.mouse.move(cx, cy)
    await page.mouse.down()
    for (let i = 1; i <= 20; i++) await page.mouse.move(cx + i * 25, cy - i * 3)
    await page.mouse.up()
    await page.waitForTimeout(600)
    const turned = await cameraPosition(page)
    expect(Math.hypot(...turned.map((v, i) => v - start[i]))).toBeGreaterThan(0.2)
    // 드래그는 클릭으로 처리되지 않는다
    expect(await roomMode(page)).toBe('explore')

    for (let i = 0; i < 30; i++) await page.mouse.wheel(0, 400)
    await page.mouse.move(cx, cy)
    await page.mouse.down()
    for (let i = 1; i <= 30; i++) await page.mouse.move(cx - i * 30, cy + i * 4)
    await page.mouse.up()
    await page.waitForTimeout(800)
    const p = await cameraPosition(page)
    p.forEach((v, i) => {
      expect(v).toBeGreaterThanOrEqual(CAMERA_BOUNDS.min[i] - 1e-6)
      expect(v).toBeLessThanOrEqual(CAMERA_BOUNDS.max[i] + 1e-6)
    })
    await page.screenshot({ path: 'test-results/evidence/04-after-drag.png' })
  })

  test('바로가기 버튼으로 포스터에 들어가고, 열린 채로 다른 사물로 옮겨 간다', async ({ page }) => {
    await openRoom(page)
    await page.getByRole('button', { name: '포스터' }).click()
    await waitForMode(page, 'content')
    await expect(page.getByTestId('content-panel')).toHaveAttribute('data-module', 'cinema-archive')
    await expect(page.getByTestId('content-panel').locator('img')).toHaveCount(3)
    // 포스터 히트박스가 화면 안(패널 왼쪽)에 보인다
    const pt = await project(page, 'poster')
    expect(pt).not.toBeNull()
    expect(pt!.x).toBeLessThan(1280 - 460)
    await page.screenshot({ path: 'test-results/evidence/05-poster.png' })

    await page.getByRole('button', { name: '오른쪽 모니터', exact: true }).click()
    await waitForMode(page, 'content')
    await expect(page.getByTestId('content-panel')).toHaveAttribute('data-module', 'security-lab')
    await page.screenshot({ path: 'test-results/evidence/06-monitor-right.png' })

    await page.getByRole('button', { name: /방으로 돌아가기/ }).click()
    await waitForMode(page, 'explore')
  })

  test('새로고침해도 열려 있던 사물로 다시 들어간다', async ({ page }) => {
    await openRoom(page, '/#poster')
    await waitForMode(page, 'content')
    await expect(page.getByTestId('content-panel')).toHaveAttribute('data-module', 'cinema-archive')
    await page.reload()
    await page.waitForFunction(() => window.__room?.ready === true)
    await waitForMode(page, 'content')
    await expect(page.getByTestId('content-panel')).toHaveAttribute('data-module', 'cinema-archive')
  })

  test('없는 사물 주소는 무시하고 방을 보여 준다', async ({ page }) => {
    const errors = await openRoom(page, '/#nothing-here')
    expect(await roomMode(page)).toBe('explore')
    expect(errors).toEqual([])
  })

  test('WebGL이 없으면 목록형 방으로 들어갈 수 있다', async ({ page }) => {
    await page.goto('/?nowebgl=1')
    await expect(page.getByTestId('fallback')).toBeVisible()
    await page.getByRole('button', { name: /왼쪽 모니터/ }).click()
    await expect(page.getByTestId('content-panel')).toHaveAttribute('data-module', 'game-archive')
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('content-panel')).toHaveCount(0)
    await page.screenshot({ path: 'test-results/evidence/07-fallback.png' })
  })

  test('성능 기록: 소프트웨어 WebGL 기준 FPS와 그리기 호출 수', async ({ page }, info) => {
    await openRoom(page)
    await page.waitForTimeout(1000)
    const fps = await page.evaluate(() => window.__room!.sampleFps(3000))
    const render = await page.evaluate(() => window.__room!.renderInfo())
    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return { domContentLoaded: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd) }
    })
    const record = { environment: 'headless chromium + SwiftShader (GPU 없음)', viewport: '1280x760', fps: +fps.toFixed(1), ...render, ...timing }
    info.annotations.push({ type: 'perf', description: JSON.stringify(record) })
    console.log('PERF', JSON.stringify(record))
    // 하한만 확인한다. 실제 기기 목표치(60fps)는 수동 측정 대상이다.
    expect(fps).toBeGreaterThan(1)
    expect(render.calls).toBeLessThan(300)
  })
})

test.describe('모바일 375px', () => {
  test.skip(({ isMobile }) => !isMobile, '모바일 전용')

  test('좁은 화면에서도 사물에 들어가 읽고 돌아올 수 있다', async ({ page }) => {
    const errors = await openRoom(page)
    await page.screenshot({ path: 'test-results/evidence/08-mobile-home.png' })
    await page.getByRole('button', { name: '왼쪽 모니터' }).tap()
    await waitForMode(page, 'content')
    const panel = page.getByTestId('content-panel')
    await expect(panel.getByRole('heading', { name: 'GAME ARCHIVE' })).toBeInViewport()
    const box = (await panel.boundingBox())!
    expect(box.width).toBeLessThanOrEqual(375)
    // 시트 위쪽 남은 화면에 모니터가 보이도록 장면을 위로 민다
    await page.waitForTimeout(800)
    const pt = await project(page, 'monitor-left')
    expect(pt).not.toBeNull()
    expect(pt!.y).toBeLessThan(box.y)
    await page.screenshot({ path: 'test-results/evidence/09-mobile-content.png' })
    await panel.getByRole('button', { name: /방으로 돌아가기/ }).tap()
    await waitForMode(page, 'explore')
    expect(errors).toEqual([])
  })
})
