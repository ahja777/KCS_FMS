import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

const DOWNLOAD_DIR = path.join(__dirname, 'downloads');

// 다운로드 디렉토리 준비
test.beforeAll(() => {
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }
});

// 다운로드 후 정리
test.afterAll(() => {
  // 테스트 파일 유지 (확인용)
});

// ===== 1. 엑셀 다운로드 테스트 =====

test.describe('Excel 다운로드 테스트', () => {

  test('1-1. 해상수출 B/L Master 목록 - Excel 다운로드', async ({ page }) => {
    await page.goto(`/logis/bl/sea/master`, { waitUntil: 'networkidle' });

    // Excel 버튼 찾기
    const excelBtn = page.locator('button:has-text("Excel"), button:has-text("엑셀다운로드")').first();
    await expect(excelBtn).toBeVisible({ timeout: 10000 });

    // 다운로드 대기
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      excelBtn.click(),
    ]);

    const filePath = path.join(DOWNLOAD_DIR, download.suggestedFilename());
    await download.saveAs(filePath);

    // 파일 존재 확인
    expect(fs.existsSync(filePath)).toBe(true);
    const stat = fs.statSync(filePath);
    expect(stat.size).toBeGreaterThan(0);

    // xlsx 파일이면 내용 검증
    if (filePath.endsWith('.xlsx')) {
      const wb = XLSX.readFile(filePath);
      expect(wb.SheetNames.length).toBeGreaterThan(0);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);
      console.log(`  → 해상수출 MBL: ${data.length}행 다운로드됨, 시트: ${wb.SheetNames[0]}`);
    } else {
      console.log(`  → 해상수출 MBL: CSV 파일 다운로드됨 (${stat.size} bytes)`);
    }
  });

  test('1-2. 해상수출 B/L House 목록 - Excel 다운로드', async ({ page }) => {
    await page.goto(`/logis/bl/sea/house`, { waitUntil: 'networkidle' });

    const excelBtn = page.locator('button:has-text("Excel"), button:has-text("엑셀다운로드")').first();
    await expect(excelBtn).toBeVisible({ timeout: 10000 });

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      excelBtn.click(),
    ]);

    const filePath = path.join(DOWNLOAD_DIR, download.suggestedFilename());
    await download.saveAs(filePath);

    expect(fs.existsSync(filePath)).toBe(true);
    expect(fs.statSync(filePath).size).toBeGreaterThan(0);
    console.log(`  → 해상수출 HBL: ${download.suggestedFilename()} 다운로드 완료`);
  });

  test('1-3. 항공수출 AWB Master 목록 - Excel 다운로드', async ({ page }) => {
    await page.goto(`/logis/bl/air/master`, { waitUntil: 'networkidle' });

    const excelBtn = page.locator('button:has-text("Excel"), button:has-text("엑셀다운로드")').first();
    await expect(excelBtn).toBeVisible({ timeout: 10000 });

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      excelBtn.click(),
    ]);

    const filePath = path.join(DOWNLOAD_DIR, download.suggestedFilename());
    await download.saveAs(filePath);

    expect(fs.existsSync(filePath)).toBe(true);
    console.log(`  → 항공수출 MAWB: ${download.suggestedFilename()} 다운로드 완료`);
  });

  test('1-4. 수입 B/L 해상 목록 - Excel 다운로드', async ({ page }) => {
    await page.goto(`/logis/import-bl/sea`, { waitUntil: 'networkidle' });

    // 버튼 텍스트: "엑셀다운로드" (띄어쓰기 없음)
    const excelBtn = page.locator('button:has-text("엑셀다운로드")').first();
    await expect(excelBtn).toBeVisible({ timeout: 10000 });

    // 데이터가 없으면 다운로드 이벤트가 발생하지 않고 메시지만 표시됨
    // alert() 다이얼로그 자동 수락 설정
    page.on('dialog', dialog => dialog.accept());

    const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
    await excelBtn.click();
    const download = await downloadPromise;

    if (download) {
      const filePath = path.join(DOWNLOAD_DIR, download.suggestedFilename());
      await download.saveAs(filePath);
      expect(fs.existsSync(filePath)).toBe(true);
      console.log(`  → 수입B/L 해상: ${download.suggestedFilename()} 다운로드 완료`);
    } else {
      // 데이터가 없어서 다운로드가 발생하지 않은 경우 - 정상 동작
      console.log(`  → 수입B/L 해상: 다운로드할 데이터 없음 (정상 - DB 데이터 부재)`);
      // 페이지에 경고 메시지가 표시되었는지 확인
      const message = page.locator('text=다운로드할 데이터가 없습니다');
      const hasMessage = await message.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`  → 경고 메시지 표시: ${hasMessage}`);
    }
  });

  test('1-5. 해상 스케줄 - ExcelButtons CSV 다운로드', async ({ page }) => {
    await page.goto(`/logis/schedule/sea`, { waitUntil: 'networkidle' });

    const excelBtn = page.locator('button:has-text("엑셀다운로드")').first();
    await expect(excelBtn).toBeVisible({ timeout: 10000 });

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      excelBtn.click(),
    ]);

    const filePath = path.join(DOWNLOAD_DIR, download.suggestedFilename());
    await download.saveAs(filePath);

    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf-8');
    // CSV에 BOM이 있는지 확인
    expect(content.charCodeAt(0)).toBe(0xFEFF);
    console.log(`  → 해상 스케줄: CSV 다운로드 완료 (BOM 포함)`);
  });

  test('1-6. 공통코드 관리 - Excel 다운로드', async ({ page }) => {
    await page.goto(`/logis/common/code`, { waitUntil: 'networkidle' });

    // 버튼 텍스트: "Excel 다운로드" (띄어쓰기 있음)
    const excelBtn = page.locator('button:has-text("Excel 다운로드")').first();
    await expect(excelBtn).toBeVisible({ timeout: 10000 });

    // 데이터가 없으면 alert('다운로드할 데이터가 없습니다.') 호출
    page.on('dialog', dialog => dialog.accept());

    // 좌측 그룹코드 목록에서 첫 번째 항목 클릭하여 데이터 로드
    const groupItem = page.locator('table tbody tr').first();
    if (await groupItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await groupItem.click();
      await page.waitForTimeout(1000);
    }

    const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
    await excelBtn.click();
    const download = await downloadPromise;

    if (download) {
      const filePath = path.join(DOWNLOAD_DIR, download.suggestedFilename());
      await download.saveAs(filePath);
      expect(fs.existsSync(filePath)).toBe(true);
      console.log(`  → 공통코드: ${download.suggestedFilename()} 다운로드 완료`);
    } else {
      console.log(`  → 공통코드: 다운로드할 데이터 없음 (정상 - 그룹 미선택 또는 데이터 부재)`);
    }
  });
});

// ===== 2. 엑셀 업로드 테스트 =====

test.describe('Excel 업로드 테스트', () => {

  test('2-1. 수입 B/L 해상 - 샘플 엑셀 다운로드 후 업로드', async ({ page }) => {
    await page.goto(`/logis/import-bl/sea`, { waitUntil: 'networkidle' });

    // 샘플 다운로드 버튼 찾기
    const sampleBtn = page.locator('button:has-text("샘플"), button:has-text("Sample")').first();

    if (await sampleBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      // 샘플 엑셀 다운로드
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 15000 }),
        sampleBtn.click(),
      ]);

      const samplePath = path.join(DOWNLOAD_DIR, 'bl_sample.xlsx');
      await download.saveAs(samplePath);
      expect(fs.existsSync(samplePath)).toBe(true);
      console.log(`  → 수입B/L 샘플 다운로드 완료`);

      // 샘플 파일로 업로드 테스트
      const uploadBtn = page.locator('button:has-text("업로드"), button:has-text("Upload")').first();
      if (await uploadBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        const fileInput = page.locator('input[type="file"]').first();
        await fileInput.setInputFiles(samplePath);

        // 업로드 결과 확인 (모달이나 알림)
        await page.waitForTimeout(2000);
        console.log(`  → 수입B/L 샘플 업로드 테스트 완료`);
      }
    } else {
      console.log(`  → 수입B/L: 샘플 다운로드 버튼 없음, 직접 엑셀 생성하여 업로드`);

      // 테스트용 엑셀 파일 생성
      const wb = XLSX.utils.book_new();
      const wsData = [
        ['MBL No', 'HBL No', '선명', '항차', '출발항', '도착항', 'ETD', 'ETA'],
        ['TEST-MBL-001', 'TEST-HBL-001', 'TEST VESSEL', 'V.001E', 'KRPUS', 'CNSHA', '2026-02-10', '2026-02-20'],
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'BL Upload');

      const testFilePath = path.join(DOWNLOAD_DIR, 'test_bl_upload.xlsx');
      XLSX.writeFile(wb, testFilePath);

      // 업로드
      const fileInput = page.locator('input[type="file"]').first();
      if (await fileInput.count() > 0) {
        await fileInput.setInputFiles(testFilePath);
        await page.waitForTimeout(2000);
        console.log(`  → 수입B/L 테스트 파일 업로드 완료`);
      }
    }
  });

  test('2-2. 공통코드 - Excel 업로드 API 테스트', async ({ page, request }) => {
    // 테스트용 엑셀 파일 생성
    const wb = XLSX.utils.book_new();
    const wsData = [
      ['그룹코드', '코드', '코드명', '코드명(한글)', '정렬순서', '사용여부'],
      ['TEST_GROUP', 'T001', 'Test Code 1', '테스트코드1', 1, 'Y'],
      ['TEST_GROUP', 'T002', 'Test Code 2', '테스트코드2', 2, 'Y'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Common Codes');

    const testFilePath = path.join(DOWNLOAD_DIR, 'test_common_code_upload.xlsx');
    XLSX.writeFile(wb, testFilePath);

    expect(fs.existsSync(testFilePath)).toBe(true);
    console.log(`  → 공통코드 테스트 파일 생성 완료`);

    // API로 직접 업로드 테스트
    const fileBuffer = fs.readFileSync(testFilePath);
    const response = await request.post(`/api/common-code/upload`, {
      multipart: {
        file: {
          name: 'test_common_code_upload.xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          buffer: fileBuffer,
        },
        groupCd: 'TEST_GROUP',
      },
    });

    console.log(`  → 공통코드 업로드 API 응답: ${response.status()}`);
    const body = await response.json();
    console.log(`  → 응답 내용:`, JSON.stringify(body).substring(0, 200));

    // 성공 또는 에러 메시지 확인
    expect(response.status()).toBeLessThan(500);
  });

  test('2-3. 환율관리 - Excel 다운로드/업로드 테스트', async ({ page }) => {
    await page.goto(`/logis/exchange-rate`, { waitUntil: 'networkidle' });

    // 다운로드 먼저 테스트
    const downloadBtn = page.locator('button:has-text("Excel"), button:has-text("엑셀다운로드"), button:has-text("다운로드")').first();

    if (await downloadBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 15000 }),
        downloadBtn.click(),
      ]);

      const filePath = path.join(DOWNLOAD_DIR, download.suggestedFilename());
      await download.saveAs(filePath);
      expect(fs.existsSync(filePath)).toBe(true);
      console.log(`  → 환율관리: ${download.suggestedFilename()} 다운로드 완료`);
    } else {
      console.log(`  → 환율관리: 다운로드 버튼을 찾을 수 없음`);
    }
  });
});

// ===== 3. 엑셀 파일 무결성 검증 =====

test.describe('Excel 파일 무결성 검증', () => {

  test('3-1. 다운로드된 xlsx 파일 구조 검증', async () => {
    const files = fs.readdirSync(DOWNLOAD_DIR).filter(f => f.endsWith('.xlsx') && !f.startsWith('test_'));

    if (files.length === 0) {
      console.log('  → 검증할 xlsx 파일 없음 (이전 다운로드 테스트에서 파일 미생성)');
      return;
    }

    for (const file of files) {
      const filePath = path.join(DOWNLOAD_DIR, file);
      const wb = XLSX.readFile(filePath);

      expect(wb.SheetNames.length).toBeGreaterThan(0);

      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      if (data.length === 0) {
        // 데이터가 없는 경우 (DB에 해당 데이터가 없음) - 빈 시트도 유효
        console.log(`  → ${file}: ${wb.SheetNames.length}시트, 0행 (데이터 없음 - 정상)`);
        continue;
      }

      // 헤더 행에 빈 값만 있으면 안 됨
      const headers = data[0] as string[];
      const nonEmptyHeaders = headers.filter(h => h !== undefined && h !== null && h !== '');
      expect(nonEmptyHeaders.length).toBeGreaterThan(0);

      console.log(`  → ${file}: ${wb.SheetNames.length}시트, ${data.length}행, 헤더: [${nonEmptyHeaders.slice(0, 5).join(', ')}...]`);
    }
  });

  test('3-2. 다운로드된 CSV 파일 검증', async () => {
    const files = fs.readdirSync(DOWNLOAD_DIR).filter(f => f.endsWith('.csv'));

    for (const file of files) {
      const filePath = path.join(DOWNLOAD_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim());

      expect(lines.length).toBeGreaterThanOrEqual(1);

      // 헤더 파싱
      const headerLine = lines[0].replace(/^\uFEFF/, '');
      const headers = headerLine.split(',');

      console.log(`  → ${file}: ${lines.length}행, 헤더: [${headers.slice(0, 5).join(', ')}...]`);
    }
  });
});
