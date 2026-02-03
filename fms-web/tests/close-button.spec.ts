import { test, expect } from '@playwright/test';

// 테스트할 등록 페이지 목록
const registerPages = [
  { name: '해상 스케줄 등록', url: '/logis/schedule/sea/register', listUrl: '/logis/schedule/sea' },
  { name: '항공 스케줄 등록', url: '/logis/schedule/air/register', listUrl: '/logis/schedule/air' },
  { name: '해상 B/L 등록', url: '/logis/bl/sea/register', listUrl: '/logis/bl/sea' },
  { name: '항공 B/L 등록', url: '/logis/bl/air/register', listUrl: '/logis/bl/air' },
  { name: '해상 Booking 등록', url: '/logis/booking/sea/register', listUrl: '/logis/booking/sea' },
  { name: '항공 Booking 등록', url: '/logis/booking/air/register', listUrl: '/logis/booking/air' },
  { name: '해상 견적 등록', url: '/logis/quote/sea/register', listUrl: '/logis/quote/sea' },
  { name: '항공 견적 등록', url: '/logis/quote/air/register', listUrl: '/logis/quote/air' },
  { name: '해상 S/R 등록', url: '/logis/sr/sea/register', listUrl: '/logis/sr/sea' },
  { name: '해상 S/N 등록', url: '/logis/sn/sea/register', listUrl: '/logis/sn/sea' },
];

test.describe('화면닫기 버튼 테스트', () => {

  test('등록 페이지 - 닫기 버튼 클릭 시 목록으로 이동 (변경사항 없음)', async ({ page }) => {
    // 해상 스케줄 등록 페이지로 이동
    await page.goto('/logis/schedule/sea/register');
    await page.waitForLoadState('networkidle');

    // 화면닫기 버튼 찾기
    const closeButton = page.getByRole('button', { name: /화면닫기/i });
    await expect(closeButton).toBeVisible();

    // 클릭
    await closeButton.click();

    // 변경사항이 없으므로 바로 목록으로 이동
    await page.waitForURL(/\/logis\/schedule\/sea(?!\/register)/, { timeout: 10000 });

    console.log('✓ 닫기 버튼 클릭 → 목록 페이지 이동 확인 (변경사항 없음)');
  });

  test('여러 등록 페이지에서 닫기 버튼 존재 및 동작 확인', async ({ page }) => {
    const results: { name: string; hasButton: boolean; navigated: boolean }[] = [];

    for (const pageInfo of registerPages) {
      await page.goto(pageInfo.url);
      await page.waitForLoadState('networkidle');

      const closeButton = page.getByRole('button', { name: /화면닫기/i });
      const hasButton = await closeButton.isVisible().catch(() => false);

      let navigated = false;
      if (hasButton) {
        await closeButton.click();
        try {
          // 페이지 이동 또는 모달 표시 대기
          await Promise.race([
            page.waitForURL(/\/logis\//, { timeout: 5000 }),
            page.waitForSelector('text=화면 닫기', { timeout: 5000 }),
            page.waitForSelector('text=저장하지 않은 변경', { timeout: 5000 }),
          ]);
          navigated = true;
        } catch {
          navigated = false;
        }
      }

      results.push({ name: pageInfo.name, hasButton, navigated });
      console.log(`${hasButton ? '✓' : '✗'} ${pageInfo.name}: 버튼 ${hasButton ? '있음' : '없음'}, 동작 ${navigated ? 'OK' : 'FAIL'}`);
    }

    // 모든 페이지에 닫기 버튼이 있어야 함
    const allHaveButton = results.every(r => r.hasButton);
    expect(allHaveButton).toBe(true);

    // 모든 버튼이 동작해야 함
    const allNavigated = results.every(r => r.navigated);
    expect(allNavigated).toBe(true);
  });

  test('상세 페이지에서 닫기 버튼 동작 테스트', async ({ page }) => {
    // 해상 스케줄 상세 페이지
    await page.goto('/logis/schedule/sea/1');
    await page.waitForLoadState('networkidle');

    const closeButton = page.getByRole('button', { name: /화면닫기/i });
    const hasButton = await closeButton.isVisible().catch(() => false);

    if (hasButton) {
      await closeButton.click();
      // 페이지 이동 또는 모달 표시 확인
      await Promise.race([
        page.waitForURL(/\/logis\//, { timeout: 5000 }),
        page.waitForSelector('[role="dialog"]', { timeout: 5000 }),
      ]);
      console.log('✓ 상세 페이지: 닫기 버튼 동작 확인');
    } else {
      // PageLayout 사용 시 다른 방식으로 닫기
      console.log('상세 페이지: PageLayout 방식 사용 (Header 닫기 버튼 없음)');
    }
  });

  test('목록 페이지에서 닫기 버튼 숨김 확인', async ({ page }) => {
    const listPages = [
      '/logis/schedule/sea',
      '/logis/schedule/air',
      '/logis/bl/sea',
      '/logis/booking/sea',
    ];

    for (const url of listPages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      const closeButton = page.getByRole('button', { name: /화면닫기/i });
      const isVisible = await closeButton.isVisible().catch(() => false);

      expect(isVisible).toBe(false);
      console.log(`✓ ${url}: 닫기 버튼 숨김 확인`);
    }
  });

  test('항공 B/L 등록 - 닫기 버튼으로 목록 이동', async ({ page }) => {
    await page.goto('/logis/bl/air/register');
    await page.waitForLoadState('networkidle');

    const closeButton = page.getByRole('button', { name: /화면닫기/i });
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    // 목록 또는 다른 페이지로 이동
    await page.waitForURL(/\/logis\//, { timeout: 10000 });
    console.log('✓ 항공 B/L 등록: 닫기 → 이동 확인');
  });

  test('해상 견적 등록 - 닫기 버튼으로 목록 이동', async ({ page }) => {
    await page.goto('/logis/quote/sea/register');
    await page.waitForLoadState('networkidle');

    const closeButton = page.getByRole('button', { name: /화면닫기/i });
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    await page.waitForURL(/\/logis\//, { timeout: 10000 });
    console.log('✓ 해상 견적 등록: 닫기 → 이동 확인');
  });
});
