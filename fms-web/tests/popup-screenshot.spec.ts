import { test, expect } from '@playwright/test';

test('유니패스(수입) 모든 탭 스크린샷', async ({ page }) => {
  await page.goto('http://localhost:3000/logis/cargo/release');
  await page.waitForLoadState('networkidle');

  // 유니패스(수입) 팝업 열기
  await page.click('button:has-text("유니패스(수입)")');
  await page.waitForTimeout(500);

  // 1. 수입화물진행정보(건별) 탭
  await page.screenshot({ path: 'screenshots/tab1-import-cargo.png', fullPage: false });

  // 2. 해외직구 통관정보조회 탭
  await page.click('button:has-text("해외직구 통관정보조회")');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'screenshots/tab2-overseas.png', fullPage: false });

  // 3. Import cargo tracking 탭
  await page.click('button:has-text("Import cargo tracking")');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'screenshots/tab3-tracking.png', fullPage: false });

  // 4. B/L정보조회 탭
  await page.click('button:has-text("B/L정보조회")');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'screenshots/tab4-bl-info.png', fullPage: false });

  // 5. 진행정보 SMS통보 설정 탭
  await page.click('button:has-text("진행정보 SMS통보 설정")');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'screenshots/tab5-sms-settings.png', fullPage: false });
});

test('유니패스(수출) 모든 탭 스크린샷', async ({ page }) => {
  await page.goto('http://localhost:3000/logis/cargo/release');
  await page.waitForLoadState('networkidle');

  // 유니패스(수출) 팝업 열기
  await page.click('button:has-text("유니패스(수출)")');
  await page.waitForTimeout(500);

  // 1. 수출신고조회 탭
  await page.screenshot({ path: 'screenshots/export-tab1-decl.png', fullPage: false });

  // 2. 수출이행내역조회 탭
  await page.click('button:has-text("수출이행내역조회")');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'screenshots/export-tab2-perform.png', fullPage: false });

  // 3. 적하목록정보조회 탭
  await page.click('button:has-text("적하목록정보조회")');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'screenshots/export-tab3-manifest.png', fullPage: false });

  // 4. Export cargo tracking 탭
  await page.click('button:has-text("Export cargo tracking")');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'screenshots/export-tab4-tracking.png', fullPage: false });
});
