import { test, expect } from '@playwright/test';

test.describe.serial('버튼+탭 sticky 고정 검증', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3600/login');
    await page.fill('#userId', 'admin');
    await page.fill('#password', 'admin1234');
    await page.click('button[type="submit"]');
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
    await page.waitForTimeout(500);
  });

  test('BL 항공 House 등록 - 스크롤 시 버튼+탭 고정', async ({ page }) => {
    await page.goto('http://localhost:3600/logis/bl/air/house/register');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1000);

    // 스크롤 전 스크린샷
    await page.screenshot({ path: 'test-results/bl-air-house-before-scroll.png', fullPage: false });

    // 탭 버튼 확인
    const mainTab = page.locator('button:has-text("MAIN")').first();
    const cargoTab = page.locator('button:has-text("CARGO")').first();
    await expect(mainTab).toBeVisible();
    await expect(cargoTab).toBeVisible();

    // 저장 버튼 확인
    const saveBtn = page.locator('button:has-text("저장")').first();
    await expect(saveBtn).toBeVisible();

    // 스크롤 끝까지 내림
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // 스크롤 후 스크린샷
    await page.screenshot({ path: 'test-results/bl-air-house-after-scroll.png', fullPage: false });

    // 스크롤 후에도 버튼들이 뷰포트 상단에 보이는지 확인
    const saveBtnBox = await saveBtn.boundingBox();
    expect(saveBtnBox).not.toBeNull();
    if (saveBtnBox) {
      console.log(`저장 버튼 Y=${saveBtnBox.y}`);
      expect(saveBtnBox.y).toBeLessThan(100); // 상단 100px 이내
    }

    // 탭도 뷰포트 상단에 보이는지 확인
    const mainTabBox = await mainTab.boundingBox();
    expect(mainTabBox).not.toBeNull();
    if (mainTabBox) {
      console.log(`MAIN 탭 Y=${mainTabBox.y}`);
      expect(mainTabBox.y).toBeLessThan(150); // 상단 150px 이내 (버튼 아래)
    }

    // CARGO 탭 클릭해서 탭 전환도 동작하는지 확인
    await cargoTab.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'test-results/bl-air-house-cargo-tab.png', fullPage: false });

    console.log('✓ 버튼+탭 모두 sticky 동작 확인');
  });
});
