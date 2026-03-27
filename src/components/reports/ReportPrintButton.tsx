'use client';

import { useState } from 'react';

// 보고서 유형 정의
export type ReportType =
  | 'QUOTE'              // 견적서
  | 'BOOKING_CONFIRM'    // 부킹확인서
  | 'DO'                 // D/O (Delivery Order)
  | 'MANIFEST'           // 적하목록
  | 'MANIFEST_CORRECTION' // 적하목록정정신청서
  | 'REASON'             // 사유서
  | 'SR'                 // 선적요청서
  | 'BL_CHECK'           // B/L (CHECK)
  | 'BL'                 // B/L
  | 'AN'                 // 화물도착통지서
  | 'TRANSPORT'          // 운송요청서
  | 'VGM'                // VGM
  | 'WAREHOUSE'          // 보세창고지정신청서
  | 'INVOICE';           // 청구서

// 보고서 유형별 라벨
export const REPORT_LABELS: Record<ReportType, string> = {
  QUOTE: '견적서',
  BOOKING_CONFIRM: '부킹확인서',
  DO: 'D/O',
  MANIFEST: '적하목록',
  MANIFEST_CORRECTION: '적하목록정정신청서',
  REASON: '사유서',
  SR: '선적요청서(SR)',
  BL_CHECK: 'B/L (CHECK)',
  BL: 'B/L',
  AN: '화물도착통지서(A/N)',
  TRANSPORT: '운송요청서',
  VGM: 'VGM',
  WAREHOUSE: '보세창고지정신청서',
  INVOICE: '청구서',
};

interface ReportPrintButtonProps {
  reportType: ReportType;
  data?: Record<string, unknown> | Record<string, unknown>[];
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onPrint?: (reportType: ReportType, data: Record<string, unknown> | Record<string, unknown>[]) => void;
  className?: string;
  showLabel?: boolean;
  label?: string;
}

export default function ReportPrintButton({
  reportType,
  data,
  disabled = false,
  variant = 'secondary',
  size = 'md',
  onPrint,
  className = '',
  showLabel = true,
  label,
}: ReportPrintButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  // 크기별 스타일
  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  // 변형별 스타일
  const variantStyles = {
    primary: 'bg-[#E8A838] hover:bg-[#d99a2f] text-white',
    secondary: 'bg-[#4B5563] hover:bg-[#374151] text-white',
    outline: 'border border-[#4B5563] text-[#4B5563] hover:bg-[#4B5563] hover:text-white',
  };

  // 비활성화 스타일
  const disabledStyle = disabled
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer';

  const handleClick = async () => {
    if (disabled || isPrinting || !data) return;

    setIsPrinting(true);
    try {
      if (onPrint) {
        onPrint(reportType, data);
      } else {
        // 기본 출력 동작: 새 창에서 보고서 열기
        const printData = Array.isArray(data) ? data : [data];
        const params = new URLSearchParams({
          type: reportType,
          data: JSON.stringify(printData),
        });
        window.open(`/reports/print?${params.toString()}`, '_blank', 'width=800,height=600');
      }
    } finally {
      setIsPrinting(false);
    }
  };

  const buttonLabel = label || (showLabel ? '출력' : '');

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isPrinting}
      className={`
        inline-flex items-center justify-center gap-1.5 rounded font-medium transition-all duration-200
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${disabledStyle}
        ${className}
      `}
      title={disabled ? '저장된 데이터만 출력 가능합니다' : `${REPORT_LABELS[reportType]} 출력`}
    >
      {isPrinting ? (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
      )}
      {buttonLabel && <span>{buttonLabel}</span>}
    </button>
  );
}

// 출력 버튼 드롭다운 (여러 보고서 유형 선택 가능)
interface ReportPrintDropdownProps {
  reportTypes: ReportType[];
  data?: Record<string, unknown> | Record<string, unknown>[];
  disabled?: boolean;
  onPrint?: (reportType: ReportType, data: Record<string, unknown> | Record<string, unknown>[]) => void;
}

export function ReportPrintDropdown({
  reportTypes,
  data,
  disabled = false,
  onPrint,
}: ReportPrintDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (reportType: ReportType) => {
    if (data && onPrint) {
      onPrint(reportType, data);
    }
    setIsOpen(false);
  };

  if (reportTypes.length === 1) {
    return (
      <ReportPrintButton
        reportType={reportTypes[0]}
        data={data}
        disabled={disabled}
        onPrint={onPrint}
      />
    );
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded
          bg-[#4B5563] hover:bg-[#374151] text-white transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        <span>출력</span>
        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            {reportTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleSelect(type)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
              >
                {REPORT_LABELS[type]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
