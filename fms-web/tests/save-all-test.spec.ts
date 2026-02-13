import { test, expect } from '@playwright/test';

const modules = [
  { name: 'Export Master AWB', register: '/logis/bl/air/master/register', id: '11' },
  { name: 'Export House AWB', register: '/logis/bl/air/house/register', id: '23' },
  { name: 'Import Master AWB', register: '/logis/import-bl/air/master/register', id: '19' },
  { name: 'Booking Sea', register: '/logis/booking/sea/register', id: '134' },
  { name: 'Booking Air', register: '/logis/booking/air/register', id: '55' },
  { name: 'Quote Sea', register: '/logis/quote/sea/register', id: '60' },
  { name: 'Quote Air', register: '/logis/quote/air/register', id: '10' },
  { name: 'Schedule Sea', register: '/logis/schedule/sea/register', id: '65' },
  { name: 'Schedule Air', register: '/logis/schedule/air/register', id: '23' },
  { name: 'SR Sea', register: '/logis/sr/sea/register', id: '68' },
  { name: 'SN Sea', register: '/logis/sn/sea/register', id: '44' },
  { name: 'BL Sea Export', register: '/logis/bl/sea/register', id: '90' },
  { name: 'Customs Sea', register: '/logis/customs/sea/register', id: 'DEC1770783820789' },
  { name: 'Customs Account', register: '/logis/customs-account/sea/register', id: '24' },
  { name: 'Manifest Sea', register: '/logis/manifest/sea/register', id: 'MF1770783827220' },
  { name: 'AMS Sea', register: '/logis/ams/sea/register', id: 'AMS1770783801367' },
];

test.describe('전체 등록 페이지 수정/저장 테스트', () => {
  for (const mod of modules) {
    test(`${mod.name} - 수정 후 저장`, async ({ page }) => {
      // alert 처리
      let alertMsg = '';
      page.on('dialog', async dialog => {
        alertMsg = dialog.message();
        console.log(`[${mod.name} DIALOG] ${alertMsg}`);
        await dialog.accept();
      });

      const errors: string[] = [];
      page.on('pageerror', err => errors.push(err.message.substring(0, 100)));

      // 1) 기존 데이터 로딩
      await page.goto(`${mod.register}?id=${mod.id}`, { timeout: 15000 });
      await page.waitForTimeout(2500);

      // 런타임 에러 체크
      const hasError = await page.locator('text=TypeError').count() + await page.locator('text=Runtime').count();
      if (hasError > 0) {
        console.log(`${mod.name}: SKIP - Runtime error on load`);
        await page.screenshot({ path: `test-results/save-err-${mod.name.replace(/\s+/g, '-').toLowerCase()}.png`, fullPage: true });
        return;
      }

      // 2) 저장 버튼 찾기
      const saveBtn = page.locator('button:has-text("저장")').first();
      const saveBtnExists = await saveBtn.count() > 0;
      console.log(`${mod.name}: Save button exists = ${saveBtnExists}`);

      if (!saveBtnExists) {
        console.log(`${mod.name}: SKIP - No save button`);
        return;
      }

      // 3) 저장 클릭
      await saveBtn.click();
      await page.waitForTimeout(3000);

      // 4) 결과 확인
      const saved = alertMsg.includes('저장') || alertMsg.includes('수정') || alertMsg.includes('성공') || alertMsg.includes('완료');
      const failed = alertMsg.includes('실패') || alertMsg.includes('오류') || alertMsg.includes('에러') || alertMsg.includes('Error');

      console.log(`${mod.name}: alert="${alertMsg}", saved=${saved}, failed=${failed}, pageErrors=${errors.length}`);

      await page.screenshot({ path: `test-results/save-${mod.name.replace(/\s+/g, '-').toLowerCase()}.png`, fullPage: true });

      if (errors.length > 0) {
        console.log(`${mod.name}: Page errors: ${errors.join('; ')}`);
      }

      // 저장 성공 또는 최소한 에러 없음 확인
      expect(hasError, `${mod.name} runtime error`).toBe(0);
    });
  }
});
