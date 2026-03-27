import { test, expect } from '@playwright/test';

// 테스트 대상: 목록 데이터가 있는 모듈의 등록 페이지
const modules = [
  { name: 'Export Master AWB', list: '/api/bl/air/master', register: '/logis/bl/air/master/register', idParam: 'id' },
  { name: 'Export House AWB', list: '/api/bl/air/house', register: '/logis/bl/air/house/register', idParam: 'id' },
  { name: 'Import Master AWB', list: '/api/bl/air/master?ioType=IN', register: '/logis/import-bl/air/master/register', idParam: 'id' },
  { name: 'Booking Sea', list: '/api/booking/sea', register: '/logis/booking/sea/register', idParam: 'id' },
  { name: 'Booking Air', list: '/api/booking/air', register: '/logis/booking/air/register', idParam: 'id' },
  { name: 'Quote Sea', list: '/api/quote/sea', register: '/logis/quote/sea/register', idParam: 'id' },
  { name: 'Quote Air', list: '/api/quote/air', register: '/logis/quote/air/register', idParam: 'id' },
  { name: 'Quote Request', list: '/api/quote/request', register: '/logis/quote/request/register', idParam: 'id' },
  { name: 'Schedule Sea', list: '/api/schedule/sea', register: '/logis/schedule/sea/register', idParam: 'id' },
  { name: 'Schedule Air', list: '/api/schedule/air', register: '/logis/schedule/air/register', idParam: 'id' },
  { name: 'SR Sea', list: '/api/sr/sea', register: '/logis/sr/sea/register', idParam: 'id' },
  { name: 'SN Sea', list: '/api/sn/sea', register: '/logis/sn/sea/register', idParam: 'id' },
  { name: 'BL Sea Export', list: '/api/bl/sea', register: '/logis/bl/sea/register', idParam: 'id' },
  { name: 'BL Sea Master', list: '/api/bl/sea', register: '/logis/bl/sea/master/register', idParam: 'id' },
  { name: 'BL Sea House', list: '/api/bl/sea', register: '/logis/bl/sea/house/register', idParam: 'id' },
  { name: 'Customs Sea', list: '/api/customs/sea', register: '/logis/customs/sea/register', idParam: 'id' },
  { name: 'Customs Account', list: '/api/customs-account/sea', register: '/logis/customs-account/sea/register', idParam: 'id' },
  { name: 'Manifest Sea', list: '/api/manifest/sea', register: '/logis/manifest/sea/register', idParam: 'id' },
  { name: 'AMS Sea', list: '/api/ams/sea', register: '/logis/ams/sea/register', idParam: 'id' },
];

test.describe('전체 등록 페이지 데이터 로딩 테스트', () => {
  for (const mod of modules) {
    test(`${mod.name} - 데이터 로딩`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && !msg.text().includes('hydration') && !msg.text().includes('Warning'))
          errors.push(msg.text().substring(0, 150));
      });
      page.on('pageerror', err => errors.push(`PAGE_ERR: ${err.message.substring(0, 150)}`));

      // 1) API에서 첫 번째 레코드 ID 가져오기
      const apiRes = await page.request.get(mod.list);
      expect(apiRes.ok()).toBeTruthy();
      const data = await apiRes.json();
      const items = Array.isArray(data) ? data : (data.data || []);
      expect(items.length).toBeGreaterThan(0);

      const firstItem = items[0];
      const recordId = firstItem.ID || firstItem.id || firstItem.mbl_id || firstItem.hbl_id || firstItem.DECLARATION_NO || firstItem.MANIFEST_NO || firstItem.AMS_NO;
      console.log(`${mod.name}: first record ID = ${recordId}`);

      // 2) 등록 페이지에 ID로 접근
      await page.goto(`${mod.register}?${mod.idParam}=${recordId}`, { timeout: 15000 });
      await page.waitForTimeout(2000);

      // 3) 런타임 에러 확인 (Next.js error overlay)
      const errorOverlay = await page.locator('nextjs-portal').count();
      const runtimeError = await page.locator('text=Runtime').count();
      const typeError = await page.locator('text=TypeError').count();

      // 4) input 필드에 데이터가 로딩되었는지 확인
      const inputs = await page.locator('input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"])').all();
      let filledCount = 0;
      for (const inp of inputs) {
        const val = await inp.inputValue().catch(() => '');
        if (val.trim().length > 0) filledCount++;
      }

      console.log(`${mod.name}: ${filledCount}/${inputs.length} inputs filled, errors: ${errors.length}, runtime: ${runtimeError}, typeError: ${typeError}`);

      // 5) 스크린샷
      await page.screenshot({ path: `test-results/load-${mod.name.replace(/\s+/g, '-').toLowerCase()}.png`, fullPage: true });

      // 6) 검증
      expect(runtimeError + typeError, `${mod.name} has runtime errors`).toBe(0);
      expect(filledCount, `${mod.name} no data loaded`).toBeGreaterThan(0);
    });
  }
});
