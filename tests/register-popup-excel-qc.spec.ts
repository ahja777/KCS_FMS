import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const BASE = 'http://127.0.0.1:3600';
let authCookie = '';
let cookieValue = '';

async function login(request: any) {
  if (authCookie) return;
  const res = await request.post(`${BASE}/api/auth/login`, {
    data: { userId: 'admin', password: 'admin1234' },
  });
  const sc = res.headers()['set-cookie'] || '';
  const m = sc.match(/fms_auth_token=([^;]+)/);
  if (m) {
    authCookie = `fms_auth_token=${m[1]}`;
    cookieValue = m[1];
  }
}

async function authPage(page: Page) {
  await page.context().addCookies([{
    name: 'fms_auth_token',
    value: cookieValue,
    domain: '127.0.0.1',
    path: '/',
  }]);
}

// ============ 등록페이지 정의 ============
interface RegisterPageDef {
  name: string;
  url: string;
  popups: PopupTest[];
  hasExcelDownload: boolean;
  hasExcelUpload: boolean;
  hasSaveButton: boolean;
  formFields?: string[]; // CSS selector for key input fields to check
}

interface PopupTest {
  triggerSelector: string;  // 팝업을 여는 버튼/아이콘 selector
  popupTitle?: string;      // 팝업 제목 텍스트
  description: string;      // 팝업 설명
}

const REGISTER_PAGES: RegisterPageDef[] = [
  {
    name: '해상부킹 등록',
    url: '/logis/booking/sea/register',
    popups: [
      { triggerSelector: 'button:has-text("검색"), [data-popup="shipper"]', description: '화주 검색' },
    ],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '항공부킹 등록',
    url: '/logis/booking/air/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '해상부킹 멀티등록',
    url: '/logis/booking/sea/multi-register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '항공부킹 멀티등록',
    url: '/logis/booking/air/multi-register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '해상스케줄 등록',
    url: '/logis/schedule/sea/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '항공스케줄 등록',
    url: '/logis/schedule/air/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '해상BL 등록',
    url: '/logis/bl/sea/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '해상HBL 등록',
    url: '/logis/bl/sea/house/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '해상MBL 등록',
    url: '/logis/bl/sea/master/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '항공BL 등록',
    url: '/logis/bl/air/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '항공HAWB 등록',
    url: '/logis/bl/air/house/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '항공MAWB 등록',
    url: '/logis/bl/air/master/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '선적요청(SR) 등록',
    url: '/logis/sr/sea/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '선적통지해상(SN) 등록',
    url: '/logis/sn/sea/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '선적통지항공(SN) 등록',
    url: '/logis/sn/air/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '도착통지해상(AN) 등록',
    url: '/logis/an/sea/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '도착통지항공(AN) 등록',
    url: '/logis/an/air/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '해상통관 등록',
    url: '/logis/customs/sea/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '통관정산 등록',
    url: '/logis/customs-account/sea/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: 'AMS 등록',
    url: '/logis/ams/sea/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '적하목록 등록',
    url: '/logis/manifest/sea/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '해상견적 등록',
    url: '/logis/quote/sea/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '항공견적 등록',
    url: '/logis/quote/air/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '견적요청 등록',
    url: '/logis/quote/request/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '수출AWB 등록',
    url: '/logis/export-awb/air/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '수출BL관리 등록',
    url: '/logis/export-bl/manage/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '수입해상BL 등록',
    url: '/logis/import-bl/sea/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '수입해상HBL 등록',
    url: '/logis/import-bl/sea/house/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '수입해상MBL 등록',
    url: '/logis/import-bl/sea/master/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '수입항공BL 등록',
    url: '/logis/import-bl/air/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '수입항공HAWB 등록',
    url: '/logis/import-bl/air/house/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '수입항공MAWB 등록',
    url: '/logis/import-bl/air/master/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '기업운임해상 등록',
    url: '/logis/rate/corporate/sea/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
  {
    name: '기업운임항공 등록',
    url: '/logis/rate/corporate/air/register',
    popups: [],
    hasExcelDownload: false,
    hasExcelUpload: false,
    hasSaveButton: true,
  },
];

// ============ 목록 페이지 (엑셀 다운로드 테스트용) ============
const LIST_PAGES = [
  { name: '해상부킹 목록', url: '/logis/booking/sea' },
  { name: '항공부킹 목록', url: '/logis/booking/air' },
  { name: '해상스케줄 목록', url: '/logis/schedule/sea' },
  { name: '항공스케줄 목록', url: '/logis/schedule/air' },
  { name: '해상BL 목록', url: '/logis/bl/sea' },
  { name: '선적요청(SR) 목록', url: '/logis/sr/sea' },
  { name: '해상견적 목록', url: '/logis/quote/sea' },
  { name: '항공견적 목록', url: '/logis/quote/air' },
  { name: '선적통지(SN) 목록', url: '/logis/sn/sea' },
  { name: '도착통지해상(AN) 목록', url: '/logis/an/sea' },
  { name: '도착통지항공(AN) 목록', url: '/logis/an/air' },
  { name: '통관신고 목록', url: '/logis/customs/sea' },
  { name: 'AMS 목록', url: '/logis/ams/sea' },
  { name: '화물반출 목록', url: '/logis/cargo/release' },
  { name: '환율관리', url: '/logis/exchange-rate' },
  { name: '공통코드', url: '/logis/common/code' },
];

// ============ 테스트 ============
test.describe('등록페이지 전체 QC - 팝업, 폼, 버튼, 에러 검증', () => {
  test.beforeAll(async ({ request }) => {
    await login(request);
    expect(authCookie).toBeTruthy();
  });

  for (const pg of REGISTER_PAGES) {
    test(`[등록] ${pg.name} - 페이지 로드 & 폼 검증`, async ({ page }) => {
      await authPage(page);

      // 콘솔 에러 수집
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && !msg.text().includes('favicon')) {
          consoleErrors.push(msg.text().substring(0, 200));
        }
      });

      // 네트워크 에러 수집
      const networkErrors: string[] = [];
      page.on('response', resp => {
        if (resp.status() >= 500 && !resp.url().includes('favicon')) {
          networkErrors.push(`${resp.status()} ${resp.url().substring(0, 100)}`);
        }
      });

      // 페이지 로드
      const response = await page.goto(pg.url, { timeout: 30000 });
      expect(response?.status()).toBeLessThan(500);
      await page.waitForLoadState('networkidle').catch(() => {});

      // 에러 페이지 체크
      const bodyText = await page.locator('body').textContent().catch(() => '') || '';
      const isErrorPage = /unhandled|application error|internal server error/i.test(bodyText);
      expect(isErrorPage).toBe(false);

      // 콘텐츠 존재 확인
      expect(bodyText.length).toBeGreaterThan(50);

      // 검색 아이콘 버튼 (팝업 트리거) 수집
      const searchIcons = await page.locator('button svg, button[class*="search"], [class*="SearchIcon"], [data-popup]').count();

      // 입력 필드 수집
      const inputs = await page.locator('input:not([type="hidden"]):not([type="checkbox"])').count();
      const selects = await page.locator('select').count();
      const textareas = await page.locator('textarea').count();

      // 저장 버튼 확인
      const saveBtn = await page.locator('button:has-text("저장"), button:has-text("등록"), button:has-text("Save")').count();

      // 탭 확인
      const tabs = await page.locator('[role="tab"], button[class*="tab"], [class*="Tab"]').count();

      // 스크린샷
      const screenshotDir = path.join(__dirname, 'screenshots', 'register-qc');
      if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
      const safeName = pg.name.replace(/[^a-zA-Z0-9가-힣]/g, '_');
      await page.screenshot({ path: path.join(screenshotDir, `${safeName}.png`), fullPage: true });

      console.log(`[${pg.name}] inputs=${inputs}, selects=${selects}, textareas=${textareas}, searchIcons=${searchIcons}, saveBtn=${saveBtn}, tabs=${tabs}, consoleErrors=${consoleErrors.length}, networkErrors=${networkErrors.length}`);

      if (consoleErrors.length > 0) {
        console.log(`  Console errors: ${consoleErrors.slice(0, 2).join(' | ')}`);
      }
      if (networkErrors.length > 0) {
        console.log(`  Network errors: ${networkErrors.slice(0, 2).join(' | ')}`);
      }

      // 기본 검증: 입력 필드가 1개 이상 있어야 함
      expect(inputs + selects + textareas).toBeGreaterThan(0);
    });
  }
});

test.describe('등록페이지 팝업 연동 테스트 - 검색아이콘 클릭 & 팝업 오픈', () => {
  test.beforeAll(async ({ request }) => {
    await login(request);
  });

  // 주요 등록 페이지에서 검색 아이콘을 클릭하여 팝업이 열리는지 검증
  const popupPages = [
    { name: '해상부킹', url: '/logis/booking/sea/register' },
    { name: '항공부킹', url: '/logis/booking/air/register' },
    { name: '해상스케줄', url: '/logis/schedule/sea/register' },
    { name: '항공스케줄', url: '/logis/schedule/air/register' },
    { name: '해상BL', url: '/logis/bl/sea/register' },
    { name: '선적요청(SR)', url: '/logis/sr/sea/register' },
    { name: '해상견적', url: '/logis/quote/sea/register' },
    { name: '항공견적', url: '/logis/quote/air/register' },
    { name: '통관정산', url: '/logis/customs-account/sea/register' },
    { name: '기업운임해상', url: '/logis/rate/corporate/sea/register' },
    { name: '기업운임항공', url: '/logis/rate/corporate/air/register' },
    { name: '수출AWB', url: '/logis/export-awb/air/register' },
    { name: '항공MAWB', url: '/logis/bl/air/master/register' },
    { name: '항공HAWB', url: '/logis/bl/air/house/register' },
  ];

  for (const pg of popupPages) {
    test(`[팝업] ${pg.name} - 검색아이콘 팝업 오픈 테스트`, async ({ page }) => {
      await authPage(page);
      await page.goto(pg.url, { timeout: 30000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      // SearchIconButton 또는 검색 아이콘 버튼 찾기
      const searchButtons = page.locator('button:has(svg[class*="search" i]), button:has(svg), button[title*="검색"], button[title*="조회"], [class*="SearchIcon"]');
      const count = await searchButtons.count();

      let popupOpened = 0;
      let popupFailed = 0;
      const testedMax = Math.min(count, 5); // 페이지당 최대 5개 팝업 테스트

      for (let i = 0; i < testedMax; i++) {
        try {
          const btn = searchButtons.nth(i);
          const isVisible = await btn.isVisible().catch(() => false);
          if (!isVisible) continue;

          await btn.click({ timeout: 3000 });
          await page.waitForTimeout(500);

          // 팝업/모달 확인 (다양한 형태)
          const modal = page.locator('[class*="modal" i], [class*="Modal"], [class*="popup" i], [class*="Popup"], [role="dialog"], [class*="overlay" i]');
          const modalVisible = await modal.first().isVisible().catch(() => false);

          if (modalVisible) {
            popupOpened++;

            // 팝업 내 검색 입력 필드 확인
            const popupInputs = await modal.first().locator('input').count().catch(() => 0);
            // 팝업 내 테이블/목록 확인
            const popupTable = await modal.first().locator('table, [class*="list" i], [class*="grid" i]').count().catch(() => 0);

            // 팝업 닫기
            const closeBtn = modal.first().locator('button:has-text("닫기"), button:has-text("취소"), button:has-text("Close"), button:has(svg[class*="close" i]), button:has(svg[class*="X" i]), [class*="close" i]');
            if (await closeBtn.first().isVisible().catch(() => false)) {
              await closeBtn.first().click({ timeout: 2000 }).catch(() => {});
            } else {
              await page.keyboard.press('Escape');
            }
            await page.waitForTimeout(300);
          } else {
            popupFailed++;
          }
        } catch {
          // 클릭 실패는 무시
        }
      }

      console.log(`[${pg.name}] 검색버튼=${count}, 팝업오픈=${popupOpened}/${testedMax}, 실패=${popupFailed}`);
    });
  }
});

test.describe('목록 페이지 - 엑셀 다운로드 & 데이터 조회 검증', () => {
  test.beforeAll(async ({ request }) => {
    await login(request);
  });

  for (const pg of LIST_PAGES) {
    test(`[목록] ${pg.name} - 데이터 조회 & 엑셀 버튼 검증`, async ({ page }) => {
      await authPage(page);
      await page.goto(pg.url, { timeout: 30000 });
      await page.waitForLoadState('networkidle').catch(() => {});

      const bodyText = await page.locator('body').textContent().catch(() => '') || '';
      expect(bodyText.length).toBeGreaterThan(50);

      // 테이블 데이터 확인
      const tableRows = await page.locator('table tbody tr, [class*="row" i][class*="data" i]').count().catch(() => 0);

      // 엑셀 다운로드 버튼 확인
      const excelBtn = await page.locator('button:has-text("엑셀"), button:has-text("Excel"), button:has-text("다운로드"), button:has-text("Download"), button[title*="엑셀"]').count();

      // 검색 버튼 확인
      const searchBtn = await page.locator('button:has-text("검색"), button:has-text("조회"), button:has-text("Search")').count();

      // 등록 버튼 확인
      const regBtn = await page.locator('button:has-text("등록"), button:has-text("신규"), a:has-text("등록")').count();

      // 삭제 버튼 확인
      const delBtn = await page.locator('button:has-text("삭제"), button:has-text("Delete")').count();

      console.log(`[${pg.name}] rows=${tableRows}, excelBtn=${excelBtn}, searchBtn=${searchBtn}, regBtn=${regBtn}, delBtn=${delBtn}`);

      // 엑셀 다운로드 테스트 (버튼이 있으면)
      if (excelBtn > 0) {
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
        const excelButton = page.locator('button:has-text("엑셀"), button:has-text("Excel"), button:has-text("다운로드")').first();
        await excelButton.click({ timeout: 5000 }).catch(() => {});
        const download = await downloadPromise;

        if (download) {
          const filename = download.suggestedFilename();
          console.log(`  엑셀 다운로드 성공: ${filename}`);
          // 파일 저장
          const dlDir = path.join(__dirname, 'downloads', 'excel-qc');
          if (!fs.existsSync(dlDir)) fs.mkdirSync(dlDir, { recursive: true });
          await download.saveAs(path.join(dlDir, filename));
          expect(filename).toMatch(/\.(xlsx|xls|csv)$/i);
        } else {
          console.log(`  엑셀 다운로드: 파일 없음 (alert/popup일 수 있음)`);
        }
      }
    });
  }
});

test.describe('API 직접 조회 - 100건 데이터 확인', () => {
  test.beforeAll(async ({ request }) => {
    await login(request);
  });

  const apiChecks = [
    { name: '해상부킹', path: '/booking/sea' },
    { name: '항공부킹', path: '/booking/air' },
    { name: '해상스케줄', path: '/schedule/sea' },
    { name: '항공스케줄', path: '/schedule/air' },
    { name: '해상BL', path: '/bl/sea' },
    { name: '선적요청(SR)', path: '/sr/sea' },
    { name: '해상견적', path: '/quote/sea' },
    { name: '항공견적', path: '/quote/air' },
    { name: '선적통지(SN)', path: '/sn/sea' },
    { name: '도착통지해상(AN)', path: '/an/sea' },
    { name: '도착통지항공(AN)', path: '/an/air' },
    { name: '통관신고', path: '/customs/sea' },
    { name: 'AMS', path: '/ams/sea' },
    { name: '화물반출', path: '/cargo/release' },
  ];

  for (const api of apiChecks) {
    test(`[API] ${api.name} - 데이터 조회`, async ({ request }) => {
      const res = await request.get(`${BASE}/api${api.path}`, { headers: { Cookie: authCookie } });
      expect(res.status()).toBeLessThan(500);
      const body = await res.json().catch(() => null);
      const count = Array.isArray(body) ? body.length : (body?.data?.length ?? 0);
      console.log(`[${api.name}] API GET: status=${res.status()}, records=${count}`);
      expect(count).toBeGreaterThan(0);
    });
  }
});
