import ExcelJS from 'exceljs';

/**
 * 엑셀 파일 읽기
 * @param file - 엑셀 파일
 * @param hasHeader - 첫 번째 행이 헤더인지 여부 (기본값: true)
 * @returns 데이터 배열 (헤더가 있으면 객체 배열, 없으면 2차원 배열)
 */
export async function readExcelFile(
  file: File,
  hasHeader: boolean = true
): Promise<Record<string, unknown>[] | unknown[][]> {
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('엑셀 파일에 시트가 없습니다.');
  }

  const rows: unknown[][] = [];
  worksheet.eachRow((row, rowNumber) => {
    const rowData: unknown[] = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      let value: unknown = cell.value;
      // 날짜 처리
      if (value instanceof Date) {
        value = value.toISOString().split('T')[0];
      }
      // 객체 형태의 값 처리 (rich text 등)
      if (value && typeof value === 'object' && 'text' in value) {
        value = (value as { text: string }).text;
      }
      if (value && typeof value === 'object' && 'result' in value) {
        value = (value as { result: unknown }).result;
      }
      rowData[colNumber - 1] = value;
    });
    rows.push(rowData);
  });

  if (!hasHeader || rows.length === 0) {
    return rows;
  }

  // 헤더를 키로 사용하여 객체 배열로 변환
  const headers = rows[0] as string[];
  const dataRows = rows.slice(1);

  return dataRows.map(row => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      if (header) {
        obj[String(header)] = row[index];
      }
    });
    return obj;
  });
}

/**
 * 샘플 엑셀 파일 생성 및 다운로드
 * @param headers - 헤더 배열
 * @param sampleData - 샘플 데이터 (2차원 배열)
 * @param sheetName - 시트 이름
 * @param fileName - 파일 이름 (확장자 제외)
 */
export async function downloadSampleExcel(
  headers: string[],
  sampleData: unknown[][],
  sheetName: string,
  fileName: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // 헤더 추가
  worksheet.addRow(headers);

  // 헤더 스타일
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8E8E8' },
  };

  // 샘플 데이터 추가
  sampleData.forEach(row => {
    worksheet.addRow(row);
  });

  // 컬럼 너비 자동 조절
  worksheet.columns.forEach((column, index) => {
    column.width = Math.max(headers[index]?.length + 2 || 10, 12);
  });

  // 파일 다운로드
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * 데이터를 엑셀 파일로 다운로드
 * @param data - 내보낼 데이터 배열
 * @param sheetName - 시트 이름
 * @param fileName - 파일 이름 (확장자 제외)
 */
export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  sheetName: string,
  fileName: string
): Promise<void> {
  if (data.length === 0) {
    alert('내보낼 데이터가 없습니다.');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // 헤더 설정
  const headers = Object.keys(data[0]);
  worksheet.columns = headers.map(key => ({
    header: key,
    key: key,
    width: Math.max(key.length + 2, 15),
  }));

  // 헤더 스타일
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8E8E8' },
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  // 금액 관련 컬럼 식별 (소수점 2자리 포맷 적용 대상)
  const currencyKeywords = ['금액', '운임', '매출', '매입', '이익', '요금', '단가', '합계', 'amount', 'charge', 'rate', 'price', 'value', 'freight', 'total', 'cost'];
  const currencyColumnIndices: Set<number> = new Set();
  headers.forEach((key, index) => {
    const lowerKey = key.toLowerCase();
    if (currencyKeywords.some(kw => lowerKey.includes(kw))) {
      currencyColumnIndices.add(index + 1); // ExcelJS 컬럼은 1-based
    }
  });

  // 데이터 추가
  data.forEach(item => {
    worksheet.addRow(item);
  });

  // 금액 컬럼에 숫자 포맷 적용
  currencyColumnIndices.forEach(colIndex => {
    worksheet.getColumn(colIndex).numFmt = '#,##0.00';
  });

  // 테두리 추가
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  // 파일 다운로드
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}
