import { test, expect } from '@playwright/test';

const LOGIN = async (page: import('@playwright/test').Page) => {
  await page.goto('http://localhost:4000/login');
  await page.waitForLoadState('networkidle');
  await page.fill('#userId', 'admin');
  await page.fill('#password', 'admin1234');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/logis/**', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);
};

test.describe.serial('찾기 버튼 브라우저 검증', () => {

  test('항공운임 Tariff - 저장 후 모달 유지 + 닫기 버튼 확인', async ({ page }) => {
    await LOGIN(page);
    await page.goto('http://localhost:4000/logis/common/air-tariff');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 조회
    await page.click('button:has-text("조회")');
    await page.waitForTimeout(2000);

    // 첫 번째 행 클릭 → 수정 모달
    const rows = page.locator('table tbody tr');
    if (await rows.count() > 0) {
      await rows.first().click();
      await page.waitForTimeout(1000);

      // 모달 확인
      const modalTitle = page.locator('h3:has-text("항공운임 Tariff 수정")');
      await expect(modalTitle).toBeVisible({ timeout: 5000 });

      // 닫기(X) 버튼 확인
      const closeBtn = page.locator('button[title="닫기"]');
      await expect(closeBtn).toBeVisible();
      console.log('✓ 닫기(X) 버튼 존재');

      // 찾기 버튼 확인
      const findBtns = page.locator('.fixed button:has-text("찾기")');
      const findCount = await findBtns.count();
      console.log(`✓ 모달 내 찾기 버튼: ${findCount}개`);
      expect(findCount).toBeGreaterThanOrEqual(3);

      // 저장
      page.on('dialog', async d => { console.log(`Dialog: ${d.message()}`); await d.accept(); });

      const responsePromise = page.waitForResponse(
        r => r.url().includes('/api/air-tariff') && r.request().method() === 'POST', { timeout: 10000 }
      );
      await page.click('button:has-text("저장")');
      const res = await responsePromise;
      expect(res.status()).toBe(200);

      // 저장 후 모달이 여전히 열려있는지 확인
      await page.waitForTimeout(1000);
      await expect(modalTitle).toBeVisible();
      console.log('✓ 저장 후 모달 유지됨');

      // 스크린샷
      await page.screenshot({ path: 'tests/screenshots/air-tariff-modal-save-keep.png' });

      // 닫기 버튼으로 닫기
      await closeBtn.click();
      await page.waitForTimeout(500);
      await expect(modalTitle).not.toBeVisible();
      console.log('✓ 닫기 버튼으로 모달 닫힘');
    }
  });

  test('등록 페이지 찾기 버튼 확인 (6개 페이지)', async ({ page }) => {
    await LOGIN(page);
    page.on('dialog', async d => await d.accept());

    const pages = [
      { url: '/logis/export-awb/air/register', name: '수출AWB 등록', minBtns: 3 },
      { url: '/logis/import-bl/air/register', name: '수입BL(항공) 등록', minBtns: 3 },
      { url: '/logis/sn/air/register', name: 'SN(항공) 등록', minBtns: 2 },
      { url: '/logis/quote/air/register', name: '견적(항공) 등록', minBtns: 5 },
      { url: '/logis/quote/sea/register', name: '견적(해상) 등록', minBtns: 5 },
      { url: '/logis/customs/sea/register', name: '통관(해상) 등록', minBtns: 3 },
    ];

    for (const p of pages) {
      await page.goto(`http://localhost:4000${p.url}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const findBtns = page.locator('button:has-text("찾기")');
      const count = await findBtns.count();
      console.log(`${p.name}: 찾기 버튼 ${count}개 (최소 ${p.minBtns}개 필요)`);

      // 버튼이 실제로 보이는지 확인
      let visibleCount = 0;
      for (let i = 0; i < count; i++) {
        const btn = findBtns.nth(i);
        if (await btn.isVisible()) {
          const box = await btn.boundingBox();
          if (box && box.width > 0 && box.height > 0) {
            visibleCount++;
          }
        }
      }
      console.log(`  → 실제 보이는 버튼: ${visibleCount}개`);
      expect(visibleCount).toBeGreaterThanOrEqual(p.minBtns);
    }
  });

  test('AWB 등록 페이지 찾기 버튼 확인 (BL/Master/House)', async ({ page }) => {
    await LOGIN(page);
    page.on('dialog', async d => await d.accept());

    const pages = [
      { url: '/logis/bl/air/master/register', name: 'BL(항공) Master 등록', minBtns: 5 },
      { url: '/logis/bl/air/house/register', name: 'BL(항공) House 등록', minBtns: 5 },
      { url: '/logis/import-bl/air/master/register', name: '수입BL(항공) Master 등록', minBtns: 5 },
      { url: '/logis/import-bl/air/house/register', name: '수입BL(항공) House 등록', minBtns: 3 },
      { url: '/logis/import-bl/sea/master/register', name: '수입BL(해상) Master 등록', minBtns: 2 },
      { url: '/logis/import-bl/sea/house/register', name: '수입BL(해상) House 등록', minBtns: 2 },
    ];

    for (const p of pages) {
      await page.goto(`http://localhost:4000${p.url}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const findBtns = page.locator('button:has-text("찾기")');
      const count = await findBtns.count();

      let visibleCount = 0;
      for (let i = 0; i < count; i++) {
        const btn = findBtns.nth(i);
        if (await btn.isVisible()) {
          const box = await btn.boundingBox();
          if (box && box.width > 0 && box.height > 0) {
            visibleCount++;
          }
        }
      }
      console.log(`${p.name}: 찾기 버튼 ${count}개 (보이는: ${visibleCount}개, 최소: ${p.minBtns})`);
      expect(visibleCount).toBeGreaterThanOrEqual(p.minBtns);
    }
  });
});
