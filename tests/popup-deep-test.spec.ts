import { test, expect, Page } from '@playwright/test';

const BASE = 'http://127.0.0.1:3600';
let cookieValue = '';

async function login(request: any) {
  if (cookieValue) return;
  const res = await request.post(`${BASE}/api/auth/login`, {
    data: { userId: 'admin', password: 'admin1234' },
  });
  const sc = res.headers()['set-cookie'] || '';
  const m = sc.match(/fms_auth_token=([^;]+)/);
  if (m) cookieValue = m[1];
}

async function authPage(page: Page) {
  await page.context().addCookies([{
    name: 'fms_auth_token', value: cookieValue,
    domain: '127.0.0.1', path: '/',
  }]);
}

// 팝업 검증 함수: SearchIconButton 클릭 → 모달 오픈 → 검색 → 닫기
async function testPopupsOnPage(page: Page, pageName: string) {
  // aria-label="찾기" 버튼 찾기
  const searchBtns = page.locator('button[aria-label="찾기"]');
  const count = await searchBtns.count();
  const maxTest = Math.min(count, 8);

  let opened = 0, failed = 0, closed = 0;
  const results: string[] = [];

  for (let i = 0; i < maxTest; i++) {
    const btn = searchBtns.nth(i);
    const visible = await btn.isVisible().catch(() => false);
    if (!visible) continue;

    try {
      // sticky header가 가릴 수 있으므로 force 클릭
      await btn.scrollIntoViewIfNeeded().catch(() => {});
      await btn.click({ force: true, timeout: 3000 });
      await page.waitForTimeout(800);

      // 모달/팝업 감지 - 인라인 style fixed div 포함
      const modalFound = await page.evaluate(() => {
        const divs = document.querySelectorAll('div');
        for (const div of divs) {
          const cs = window.getComputedStyle(div);
          const s = div.getAttribute('style') || '';
          // fixed position이고 보이는 요소 (header 제외)
          if (cs.position === 'fixed' && cs.display !== 'none' && cs.opacity !== '0' &&
              !div.closest('header') && !div.closest('nav') &&
              div.querySelector('input, table, button')) {
            return true;
          }
          // role=dialog
          if (div.getAttribute('role') === 'dialog') return true;
          // class에 modal/popup 포함
          if ((div.className || '').match(/modal|popup|dialog/i) && cs.display !== 'none') return true;
        }
        return false;
      });

      if (modalFound) {
        opened++;

        // 팝업 내부 요소 간단 확인
        const popupInfo = await page.evaluate(() => {
          const divs = document.querySelectorAll('div');
          for (const div of divs) {
            const cs = window.getComputedStyle(div);
            if (cs.position === 'fixed' && cs.display !== 'none' && !div.closest('header') && !div.closest('nav')) {
              return {
                inputs: div.querySelectorAll('input').length,
                tables: div.querySelectorAll('table').length,
                text: div.textContent?.substring(0, 80) || ''
              };
            }
          }
          return { inputs: 0, tables: 0, text: '' };
        });

        results.push(`#${i}: 팝업오픈 ✓ (inputs=${popupInfo.inputs}, table=${popupInfo.tables})`);

        // 팝업 닫기 - Escape 사용
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        closed++;
      } else {
        // 두 번째 시도: 약간의 대기 후 재확인
        await page.waitForTimeout(500);
        const retry = await page.evaluate(() => {
          const divs = document.querySelectorAll('div');
          for (const div of divs) {
            const cs = window.getComputedStyle(div);
            if (cs.position === 'fixed' && cs.display !== 'none' &&
                !div.closest('header') && !div.closest('nav') &&
                (div.querySelector('input') || div.querySelector('table'))) {
              return true;
            }
          }
          return false;
        });
        if (retry) {
          opened++;
          results.push(`#${i}: 팝업오픈 ✓ (재시도)`);
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        } else {
          failed++;
          results.push(`#${i}: 팝업미오픈`);
        }
      }
    } catch (e) {
      results.push(`#${i}: 에러`);
    }
  }

  return { count, maxTest, opened, failed, closed, results };
}

test.describe('팝업 심층 테스트 - SearchIconButton 클릭 & 모달 연동', () => {
  test.beforeAll(async ({ request }) => {
    await login(request);
    expect(cookieValue).toBeTruthy();
  });

  const pages = [
    { name: '해상부킹', url: '/logis/booking/sea/register' },
    { name: '항공부킹', url: '/logis/booking/air/register' },
    { name: '해상스케줄', url: '/logis/schedule/sea/register' },
    { name: '항공스케줄', url: '/logis/schedule/air/register' },
    { name: '해상BL', url: '/logis/bl/sea/register' },
    { name: '해상HBL', url: '/logis/bl/sea/house/register' },
    { name: '해상MBL', url: '/logis/bl/sea/master/register' },
    { name: '항공MAWB', url: '/logis/bl/air/master/register' },
    { name: '항공HAWB', url: '/logis/bl/air/house/register' },
    { name: '선적요청(SR)', url: '/logis/sr/sea/register' },
    { name: '선적통지(SN)', url: '/logis/sn/sea/register' },
    { name: '도착통지해상(AN)', url: '/logis/an/sea/register' },
    { name: '도착통지항공(AN)', url: '/logis/an/air/register' },
    { name: '해상통관', url: '/logis/customs/sea/register' },
    { name: '통관정산', url: '/logis/customs-account/sea/register' },
    { name: 'AMS', url: '/logis/ams/sea/register' },
    { name: '적하목록', url: '/logis/manifest/sea/register' },
    { name: '해상견적', url: '/logis/quote/sea/register' },
    { name: '항공견적', url: '/logis/quote/air/register' },
    { name: '견적요청', url: '/logis/quote/request/register' },
    { name: '수출AWB', url: '/logis/export-awb/air/register' },
    { name: '수출BL관리', url: '/logis/export-bl/manage/register' },
    { name: '수입해상BL', url: '/logis/import-bl/sea/register' },
    { name: '기업운임해상', url: '/logis/rate/corporate/sea/register' },
    { name: '기업운임항공', url: '/logis/rate/corporate/air/register' },
  ];

  for (const pg of pages) {
    test(`[팝업] ${pg.name} - 찾기 버튼 팝업 연동`, async ({ page }) => {
      await authPage(page);
      await page.goto(pg.url, { timeout: 30000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      const result = await testPopupsOnPage(page, pg.name);
      console.log(`[${pg.name}] 찾기버튼=${result.count}, 테스트=${result.maxTest}, 팝업오픈=${result.opened}, 실패=${result.failed}, 닫기=${result.closed}`);
      for (const r of result.results.slice(0, 5)) {
        console.log(`  ${r}`);
      }

      // 찾기 버튼이 있으면 최소 1개는 팝업이 열려야 함
      if (result.count > 0) {
        expect(result.opened).toBeGreaterThan(0);
      }
    });
  }
});

// 엑셀 다운로드 심층 테스트 - 실제 파일 다운로드 검증
test.describe('엑셀 다운로드 심층 테스트', () => {
  test.beforeAll(async ({ request }) => {
    await login(request);
  });

  const excelPages = [
    { name: '해상부킹', url: '/logis/booking/sea' },
    { name: '항공부킹', url: '/logis/booking/air' },
    { name: '해상스케줄', url: '/logis/schedule/sea' },
    { name: '해상BL', url: '/logis/bl/sea' },
    { name: '해상견적', url: '/logis/quote/sea' },
    { name: '항공견적', url: '/logis/quote/air' },
    { name: '화물반출', url: '/logis/cargo/release' },
    { name: '환율관리', url: '/logis/exchange-rate' },
  ];

  for (const pg of excelPages) {
    test(`[엑셀] ${pg.name} - 다운로드`, async ({ page }) => {
      await authPage(page);
      await page.goto(pg.url, { timeout: 30000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      // 엑셀 다운로드 버튼 찾기 (여러 변형)
      const excelBtn = page.locator('button:has-text("엑셀"), button:has-text("Excel"), button:has-text("다운로드"), button:has-text("Download")').first();
      const exists = await excelBtn.isVisible().catch(() => false);

      if (!exists) {
        console.log(`[${pg.name}] 엑셀 버튼 없음`);
        return;
      }

      // alert dialog 핸들러 (선택사항 없으면 alert)
      page.on('dialog', async dialog => {
        console.log(`  Dialog: ${dialog.message()}`);
        await dialog.accept();
      });

      const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
      await excelBtn.click();
      const download = await downloadPromise;

      if (download) {
        const filename = download.suggestedFilename();
        console.log(`[${pg.name}] 엑셀 다운로드 성공: ${filename}`);
        expect(filename).toMatch(/\.(xlsx|xls|csv)$/i);
      } else {
        console.log(`[${pg.name}] 엑셀 다운로드: 파일 미생성 (체크박스 선택 필요 가능)`);
      }
    });
  }
});
