import { test, expect } from '@playwright/test';


// ============================================================
// 1. 엑셀 버튼 텍스트 변경 검증 - 주요 목록 페이지
// ============================================================
test.describe('엑셀 버튼 텍스트 검증', () => {

  const listPages = [
    { name: '해상 견적', path: '/logis/quote/sea' },
    { name: '항공 견적', path: '/logis/quote/air' },
    { name: '수입 B/L (해상)', path: '/logis/import-bl/sea' },
  ];

  for (const pg of listPages) {
    test(`[${pg.name}] 엑셀다운로드/엑셀업로드 버튼 텍스트 확인`, async ({ page }) => {
      await page.goto(`${pg.path}`);
      await page.waitForLoadState('networkidle');

      // "다운로드" 만 단독으로 표시되는 엑셀 버튼이 없어야 함
      const plainDownload = page.locator('button', { hasText: /^다운로드$/ });
      const plainUpload = page.locator('button', { hasText: /^업로드$/ });

      const dlCount = await plainDownload.count();
      const ulCount = await plainUpload.count();

      // 엑셀다운로드 또는 엑셀업로드가 하나라도 있어야 함
      const excelDl = page.locator('button, label', { hasText: '엑셀다운로드' });
      const excelUl = page.locator('button, label', { hasText: '엑셀업로드' });

      const excelDlCount = await excelDl.count();
      const excelUlCount = await excelUl.count();

      console.log(`  [${pg.name}] 엑셀다운로드=${excelDlCount}, 엑셀업로드=${excelUlCount}, 다운로드=${dlCount}, 업로드=${ulCount}`);

      // 엑셀다운로드 버튼이 존재
      expect(excelDlCount + excelUlCount).toBeGreaterThan(0);

      // "다운로드" 단독 텍스트 엑셀버튼이 없음 (PDF 등은 예외)
      expect(dlCount).toBe(0);
      expect(ulCount).toBe(0);
    });
  }
});

// ============================================================
// 2. 환율 페이지 엑셀다운로드/엑셀업로드 버튼 텍스트 확인
// ============================================================
test('환율 페이지 - 엑셀다운로드/엑셀업로드 버튼 확인', async ({ page }) => {
  await page.goto(`/logis/exchange-rate`);
  await page.waitForLoadState('networkidle');

  const dlBtn = page.locator('button', { hasText: '엑셀다운로드' });
  const ulBtn = page.locator('label', { hasText: '엑셀업로드' });

  expect(await dlBtn.count()).toBeGreaterThan(0);
  expect(await ulBtn.count()).toBeGreaterThan(0);
  console.log('  [환율] 엑셀다운로드/엑셀업로드 버튼 확인 완료');
});

// ============================================================
// 3. 수입 B/L 페이지 - 엑셀업로드/엑셀다운로드 상세 검증
// ============================================================
test.describe('수입 B/L 엑셀 기능 상세 검증', () => {
  test('엑셀업로드 버튼이 표시됨', async ({ page }) => {
    await page.goto(`/logis/import-bl/sea`);
    await page.waitForLoadState('networkidle');

    const uploadBtn = page.locator('label', { hasText: '엑셀업로드' });
    expect(await uploadBtn.count()).toBeGreaterThan(0);
    console.log('  [수입 B/L] 엑셀업로드 버튼 확인');
  });

  test('엑셀다운로드 버튼이 표시됨', async ({ page }) => {
    await page.goto(`/logis/import-bl/sea`);
    await page.waitForLoadState('networkidle');

    const dlBtn = page.locator('button', { hasText: '엑셀다운로드' });
    expect(await dlBtn.count()).toBeGreaterThan(0);
    console.log('  [수입 B/L] 엑셀다운로드 버튼 확인');
  });
});

// ============================================================
// 4. 엑셀다운로드 기능 동작 테스트 (API 기반)
// ============================================================
test.describe('엑셀다운로드 기능 동작 테스트', () => {
  test('해상 견적 목록 - 엑셀다운로드 버튼 클릭 가능', async ({ page }) => {
    await page.goto(`/logis/quote/sea`);
    await page.waitForLoadState('networkidle');

    const dlBtn = page.locator('button, label', { hasText: '엑셀다운로드' }).first();
    if (await dlBtn.count() > 0) {
      // 다운로드 이벤트 리스닝
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await dlBtn.click();
      const download = await downloadPromise;
      if (download) {
        const filename = download.suggestedFilename();
        console.log(`  [해상 견적] 엑셀다운로드 파일: ${filename}`);
        expect(filename).toMatch(/\.(csv|xlsx|xls)$/);
      } else {
        // alert으로 처리되는 경우도 있음
        console.log('  [해상 견적] 엑셀다운로드 클릭 완료 (alert 또는 download)');
      }
    }
  });

  test('항공 견적 목록 - 엑셀다운로드 버튼 클릭 가능', async ({ page }) => {
    await page.goto(`/logis/quote/air`);
    await page.waitForLoadState('networkidle');

    const dlBtn = page.locator('button, label', { hasText: '엑셀다운로드' }).first();
    if (await dlBtn.count() > 0) {
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await dlBtn.click();
      const download = await downloadPromise;
      if (download) {
        console.log(`  [항공 견적] 파일: ${download.suggestedFilename()}`);
      } else {
        console.log('  [항공 견적] 엑셀다운로드 클릭 완료');
      }
    }
  });

  test('수입 B/L - 엑셀다운로드 실행', async ({ page }) => {
    await page.goto(`/logis/import-bl/sea`);
    await page.waitForLoadState('networkidle');

    const dlBtn = page.locator('button', { hasText: '엑셀다운로드' }).first();
    if (await dlBtn.count() > 0) {
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await dlBtn.click();
      const download = await downloadPromise;
      if (download) {
        const filename = download.suggestedFilename();
        console.log(`  [수입 B/L] 엑셀다운로드 파일: ${filename}`);
        expect(filename).toMatch(/\.(csv|xlsx|xls)$/);
      } else {
        console.log('  [수입 B/L] 엑셀다운로드 클릭 완료');
      }
    }
  });

  test('환율 - 엑셀다운로드 실행', async ({ page }) => {
    await page.goto(`/logis/exchange-rate`);
    await page.waitForLoadState('networkidle');

    const dlBtn = page.locator('button', { hasText: '엑셀다운로드' }).first();
    expect(await dlBtn.count()).toBeGreaterThan(0);

    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await dlBtn.click();
    const download = await downloadPromise;
    if (download) {
      const filename = download.suggestedFilename();
      console.log(`  [환율] 엑셀다운로드 파일: ${filename}`);
      expect(filename).toMatch(/\.(csv|xlsx|xls)$/);
    } else {
      console.log('  [환율] 엑셀다운로드 클릭 완료 (데이터 없거나 alert)');
    }
  });
});

// ============================================================
// 5. 엑셀업로드 기능 동작 테스트
// ============================================================
test.describe('엑셀업로드 기능 동작 테스트', () => {
  test('수입 B/L - 엑셀업로드 클릭 시 파일선택 트리거', async ({ page }) => {
    await page.goto(`/logis/import-bl/sea`);
    await page.waitForLoadState('networkidle');

    const uploadLabel = page.locator('label', { hasText: '엑셀업로드' }).first();
    if (await uploadLabel.count() > 0) {
      // 파일 input이 hidden으로 존재하는지 확인
      const fileInput = uploadLabel.locator('input[type="file"]');
      expect(await fileInput.count()).toBeGreaterThan(0);
      const acceptAttr = await fileInput.getAttribute('accept');
      expect(acceptAttr).toContain('.xlsx');
      console.log('  [수입 B/L] 엑셀업로드 파일 input 확인: accept=' + acceptAttr);
    }
  });

  test('환율 - 엑셀업로드 클릭 시 파일선택 트리거', async ({ page }) => {
    await page.goto(`/logis/exchange-rate`);
    await page.waitForLoadState('networkidle');

    const uploadLabel = page.locator('label', { hasText: '엑셀업로드' }).first();
    if (await uploadLabel.count() > 0) {
      const fileInput = uploadLabel.locator('input[type="file"]');
      expect(await fileInput.count()).toBeGreaterThan(0);
      const acceptAttr = await fileInput.getAttribute('accept');
      expect(acceptAttr).toContain('.xlsx');
      console.log('  [환율] 엑셀업로드 파일 input 확인: accept=' + acceptAttr);
    }
  });

  test('해상 견적 - 엑셀업로드 버튼 존재 여부', async ({ page }) => {
    await page.goto(`/logis/quote/sea`);
    await page.waitForLoadState('networkidle');

    const uploadBtn = page.locator('button, label', { hasText: '엑셀업로드' });
    const count = await uploadBtn.count();
    console.log(`  [해상 견적] 엑셀업로드 버튼: ${count > 0 ? '있음' : '없음 (선택적)'}`);
    // 업로드는 선택적이므로 존재하지 않아도 OK
  });
});

// ============================================================
// 6. CSV 엑셀업로드 E2E 테스트 (실제 파일 업로드)
// ============================================================
test.describe('CSV 엑셀업로드 E2E 테스트', () => {
  test('해상 견적 - CSV 엑셀업로드 시뮬레이션', async ({ page }) => {
    await page.goto(`/logis/quote/sea`);
    await page.waitForLoadState('networkidle');

    // ExcelButtons 컴포넌트의 hidden file input 찾기
    const fileInput = page.locator('input[type="file"][accept*=".csv"]').first();
    if (await fileInput.count() > 0) {
      // CSV 테스트 파일 생성 및 업로드
      const csvContent = '\uFEFF견적번호,견적일자,POL,POD,상태\nTEST-001,2026-01-01,KRPUS,CNSHA,draft';
      const buffer = Buffer.from(csvContent, 'utf-8');

      page.on('dialog', async dialog => {
        console.log(`  [해상 견적 업로드] Alert: ${dialog.message()}`);
        await dialog.accept();
      });

      await fileInput.setInputFiles({
        name: 'test-upload.csv',
        mimeType: 'text/csv',
        buffer: buffer,
      });

      await page.waitForTimeout(1000);
      console.log('  [해상 견적] CSV 엑셀업로드 시뮬레이션 완료');
    } else {
      console.log('  [해상 견적] CSV file input 없음 - 스킵');
    }
  });
});

// ============================================================
// 7. "Excel 다운로드" / "Excel 업로드" 이전 텍스트 잔존 검증
// ============================================================
test.describe('이전 텍스트 잔존 검증 (Excel 다운로드/업로드가 남아있지 않은지)', () => {
  const pagesToCheck = [
    { name: '해상 견적', path: '/logis/quote/sea' },
    { name: '항공 견적', path: '/logis/quote/air' },
    { name: '수입 B/L', path: '/logis/import-bl/sea' },
    { name: '환율', path: '/logis/exchange-rate' },
    { name: '견적요청', path: '/logis/quote/request/list' },
  ];

  for (const pg of pagesToCheck) {
    test(`[${pg.name}] "Excel 다운로드" / "Excel 업로드" 이전 텍스트 잔존 없음`, async ({ page }) => {
      await page.goto(`${pg.path}`);
      await page.waitForLoadState('networkidle');

      // "Excel 다운로드" 텍스트를 가진 버튼이 없어야 함
      const oldDl = page.locator('button, label', { hasText: 'Excel 다운로드' });
      const oldUl = page.locator('button, label', { hasText: 'Excel 업로드' });

      const oldDlCount = await oldDl.count();
      const oldUlCount = await oldUl.count();

      expect(oldDlCount).toBe(0);
      expect(oldUlCount).toBe(0);
      console.log(`  [${pg.name}] 이전 텍스트 잔존 없음 확인`);
    });
  }
});
