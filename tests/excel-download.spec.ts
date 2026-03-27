import { test, expect } from '@playwright/test';


// 페이지 로드 및 다운로드에 충분한 시간 확보
test.setTimeout(120_000);

/**
 * 엑셀 다운로드 테스트 - 7개 목록 페이지에서 Excel 다운로드 기능 검증
 *
 * 검증 항목:
 * 1. Excel 버튼이 화면에 표시되는지
 * 2. 클릭 시 파일 다운로드가 발생하는지
 * 3. 다운로드된 파일명에 올바른 확장자가 포함되는지
 */

interface ExcelPage {
  name: string;
  url: string;
  buttonSelector: string;
  expectedExtension: string;
}

const EXCEL_PAGES: ExcelPage[] = [
  {
    name: '해상수출 Master B/L',
    url: '/logis/bl/sea/master',
    buttonSelector: 'button:has-text("Excel")',
    expectedExtension: '.xlsx',
  },
  {
    name: '해상수출 House B/L',
    url: '/logis/bl/sea/house',
    buttonSelector: 'button:has-text("Excel")',
    expectedExtension: '.xlsx',
  },
  {
    name: '항공수출 Master AWB',
    url: '/logis/bl/air/master',
    buttonSelector: 'button:has-text("Excel")',
    expectedExtension: '.xlsx',
  },
  {
    name: '항공수출 House AWB',
    url: '/logis/bl/air/house',
    buttonSelector: 'button:has-text("Excel")',
    expectedExtension: '.xlsx',
  },
  {
    name: '해상수입 Master B/L',
    url: '/logis/import-bl/sea/master',
    buttonSelector: 'button:has-text("Excel")',
    expectedExtension: '.xlsx',
  },
  {
    name: '해상수입 House B/L',
    url: '/logis/import-bl/sea/house',
    buttonSelector: 'button:has-text("Excel")',
    expectedExtension: '.xlsx',
  },
  {
    name: '항공수입 Master AWB',
    url: '/logis/import-bl/air/master',
    buttonSelector: 'button:has-text("Excel")',
    expectedExtension: '.xlsx',
  },
];

test.describe('엑셀 다운로드 테스트', () => {

  for (const pg of EXCEL_PAGES) {
    test(`${pg.name} 엑셀 다운로드`, async ({ page }) => {
      // domcontentloaded로 빠르게 페이지 진입 후 버튼이 렌더링될 때까지 대기
      await page.goto(`${pg.url}`, { waitUntil: 'domcontentloaded', timeout: 60000 });

      // Excel 버튼이 렌더링될 때까지 대기
      const excelBtn = page.locator(pg.buttonSelector).first();
      await expect(excelBtn).toBeVisible({ timeout: 30000 });

      // 데이터 로드 대기 (API 응답 완료 후 Excel 다운로드가 정상 작동)
      await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

      // 다운로드 이벤트 대기 + 버튼 클릭
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 30000 }),
        excelBtn.click(),
      ]);

      // 파일명 확장자 검증
      const filename = download.suggestedFilename();
      expect(filename).toContain(pg.expectedExtension);
      console.log(`  [DOWNLOAD] ${pg.name}: ${filename}`);
    });
  }

});
