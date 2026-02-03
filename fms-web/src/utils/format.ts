/**
 * 숫자 포맷팅 유틸리티 함수
 * - 중량(Weight): 소숫점 둘째자리
 * - 용적(CBM): 소숫점 셋째자리
 */

/**
 * 중량 값을 소숫점 둘째자리로 포맷팅
 * @param value 중량 값 (number | string | null | undefined)
 * @param includeUnit 단위(KG) 포함 여부
 * @returns 포맷팅된 문자열
 */
export function formatWeight(value: number | string | null | undefined, includeUnit: boolean = false): string {
  if (value === null || value === undefined || value === '') {
    return includeUnit ? '0.00 KG' : '0.00';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return includeUnit ? '0.00 KG' : '0.00';
  }

  const formatted = numValue.toFixed(2);
  return includeUnit ? `${formatted} KG` : formatted;
}

/**
 * 용적(CBM) 값을 소숫점 셋째자리로 포맷팅
 * @param value CBM 값 (number | string | null | undefined)
 * @param includeUnit 단위(CBM) 포함 여부
 * @returns 포맷팅된 문자열
 */
export function formatCBM(value: number | string | null | undefined, includeUnit: boolean = false): string {
  if (value === null || value === undefined || value === '') {
    return includeUnit ? '0.000 CBM' : '0.000';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return includeUnit ? '0.000 CBM' : '0.000';
  }

  const formatted = numValue.toFixed(3);
  return includeUnit ? `${formatted} CBM` : formatted;
}

/**
 * 천단위 구분자와 함께 중량 포맷팅
 * @param value 중량 값
 * @param includeUnit 단위 포함 여부
 * @returns 포맷팅된 문자열 (예: "1,234.56 KG")
 */
export function formatWeightWithComma(value: number | string | null | undefined, includeUnit: boolean = false): string {
  if (value === null || value === undefined || value === '') {
    return includeUnit ? '0.00 KG' : '0.00';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return includeUnit ? '0.00 KG' : '0.00';
  }

  const formatted = numValue.toLocaleString('ko-KR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return includeUnit ? `${formatted} KG` : formatted;
}

/**
 * 천단위 구분자와 함께 CBM 포맷팅
 * @param value CBM 값
 * @param includeUnit 단위 포함 여부
 * @returns 포맷팅된 문자열 (예: "1,234.567 CBM")
 */
export function formatCBMWithComma(value: number | string | null | undefined, includeUnit: boolean = false): string {
  if (value === null || value === undefined || value === '') {
    return includeUnit ? '0.000 CBM' : '0.000';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return includeUnit ? '0.000 CBM' : '0.000';
  }

  const formatted = numValue.toLocaleString('ko-KR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  });

  return includeUnit ? `${formatted} CBM` : formatted;
}

/**
 * 중량 입력 필드용 step 속성
 */
export const WEIGHT_INPUT_STEP = '0.01';

/**
 * CBM 입력 필드용 step 속성
 */
export const CBM_INPUT_STEP = '0.001';

/**
 * 숫자 값을 중량 형식으로 파싱 (소숫점 둘째자리까지)
 * @param value 입력 값
 * @returns 파싱된 숫자
 */
export function parseWeight(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return 0;
  }

  return Math.round(numValue * 100) / 100;
}

/**
 * 숫자 값을 CBM 형식으로 파싱 (소숫점 셋째자리까지)
 * @param value 입력 값
 * @returns 파싱된 숫자
 */
export function parseCBM(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return 0;
  }

  return Math.round(numValue * 1000) / 1000;
}

/**
 * 금액을 천단위 구분자 + 소수점 둘째자리로 포맷팅 (외화용)
 * @param value 금액 값
 * @param currency 통화코드 (예: 'USD', 'EUR') - 포함 시 앞에 표시
 * @returns 포맷팅된 문자열 (예: "USD 1,234.56" 또는 "1,234.56")
 */
export function formatCurrency(value: number | string | null | undefined, currency?: string): string {
  if (value === null || value === undefined || value === '') {
    const formatted = '0.00';
    return currency ? `${currency} ${formatted}` : formatted;
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    const formatted = '0.00';
    return currency ? `${currency} ${formatted}` : formatted;
  }

  const formatted = numValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return currency ? `${currency} ${formatted}` : formatted;
}

/**
 * 금액 입력 필드용 step 속성
 */
export const CURRENCY_INPUT_STEP = '0.01';
