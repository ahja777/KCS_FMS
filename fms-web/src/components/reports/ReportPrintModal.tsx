'use client';

import { useRef, useCallback } from 'react';
import { ReportType, REPORT_LABELS } from './ReportPrintButton';

// 보고서 템플릿 임포트
import QuoteReport from './templates/QuoteReport';
import BookingConfirmReport from './templates/BookingConfirmReport';
import BLReport from './templates/BLReport';
import SRReport from './templates/SRReport';
import ANReport from './templates/ANReport';
import InvoiceReport from './templates/InvoiceReport';

interface ReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: ReportType;
  data: Record<string, unknown> | Record<string, unknown>[];
  options?: ReportOptions;
}

interface ReportOptions {
  copies?: number;
  paperSize?: 'A4' | 'A3';
  orientation?: 'portrait' | 'landscape';
  includeHeader?: boolean;
  includeFooter?: boolean;
}

export default function ReportPrintModal({
  isOpen,
  onClose,
  reportType,
  data,
  options = {},
}: ReportPrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // 인쇄 실행
  const handlePrint = useCallback(() => {
    if (!printRef.current) return;

    const printContents = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (!printWindow) {
      alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
      return;
    }

    const orientation = options.orientation || 'portrait';
    const paperSize = options.paperSize || 'A4';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${REPORT_LABELS[reportType]}</title>
          <style>
            @page {
              size: ${paperSize} ${orientation};
              margin: 15mm;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
              font-size: 10pt;
              line-height: 1.4;
              color: #000;
              background: #fff;
            }
            .report-container {
              width: 100%;
              max-width: 210mm;
              margin: 0 auto;
            }
            .report-header {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 2px solid #333;
            }
            .report-title {
              font-size: 18pt;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .report-subtitle {
              font-size: 10pt;
              color: #666;
            }
            .report-section {
              margin-bottom: 15px;
            }
            .section-title {
              font-size: 11pt;
              font-weight: bold;
              background: #f5f5f5;
              padding: 5px 10px;
              margin-bottom: 8px;
              border-left: 3px solid #E8A838;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 6px 8px;
              text-align: left;
              font-size: 9pt;
            }
            th {
              background: #f9f9f9;
              font-weight: 600;
              width: 120px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 0;
            }
            .info-grid td:first-child {
              background: #f9f9f9;
              font-weight: 600;
              width: 100px;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .font-bold {
              font-weight: bold;
            }
            .total-row {
              background: #fffbeb;
              font-weight: bold;
            }
            .company-info {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 9pt;
              color: #666;
            }
            .stamp-area {
              display: flex;
              justify-content: flex-end;
              margin-top: 30px;
            }
            .stamp-box {
              width: 80px;
              height: 80px;
              border: 1px solid #ddd;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8pt;
              color: #999;
            }
            .signature-area {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              width: 200px;
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #333;
              margin-top: 40px;
              padding-top: 5px;
              font-size: 9pt;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }, [reportType, options]);

  // PDF 다운로드
  const handleDownloadPdf = useCallback(async () => {
    if (!printRef.current) return;

    try {
      // html2canvas와 jspdf 동적 로드
      const [html2canvasModule, jsPDFModule] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const html2canvas = html2canvasModule.default;
      const { jsPDF } = jsPDFModule;

      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: options.orientation || 'portrait',
        unit: 'mm',
        format: options.paperSize || 'a4',
      });

      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // 파일명 생성
      const dataArray = Array.isArray(data) ? data : [data];
      const docNo = (dataArray[0]?.documentNo || dataArray[0]?.quoteNo || dataArray[0]?.bookingNo || 'document') as string;
      const today = new Date().toISOString().split('T')[0];
      const fileName = `${REPORT_LABELS[reportType]}_${docNo}_${today}.pdf`;

      pdf.save(fileName);
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      alert('PDF 생성에 실패했습니다. 브라우저 인쇄 기능을 사용해주세요.');
    }
  }, [data, reportType, options]);

  // 보고서 템플릿 렌더링
  const renderReportTemplate = () => {
    const dataArray = Array.isArray(data) ? data : [data];

    switch (reportType) {
      case 'QUOTE':
        return <QuoteReport data={dataArray} />;
      case 'BOOKING_CONFIRM':
        return <BookingConfirmReport data={dataArray} />;
      case 'BL':
      case 'BL_CHECK':
        return <BLReport data={dataArray} isCheck={reportType === 'BL_CHECK'} />;
      case 'SR':
        return <SRReport data={dataArray} />;
      case 'AN':
        return <ANReport data={dataArray} />;
      case 'INVOICE':
        return <InvoiceReport data={dataArray} />;
      default:
        return (
          <div className="text-center py-10">
            <p className="text-gray-500">{REPORT_LABELS[reportType]} 템플릿 준비중...</p>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative bg-white rounded-xl shadow-2xl w-[900px] max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            {REPORT_LABELS[reportType]} 미리보기
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 text-sm font-medium text-white bg-[#2563EB] hover:bg-[#1d4ed8] rounded transition-colors"
            >
              PDF 다운로드
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-sm font-medium text-white bg-[#E8A838] hover:bg-[#d99a2f] rounded transition-colors"
            >
              인쇄
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 미리보기 영역 */}
        <div className="flex-1 overflow-auto p-6 bg-gray-100">
          <div
            ref={printRef}
            className="bg-white shadow-lg mx-auto"
            style={{
              width: '210mm',
              minHeight: '297mm',
              padding: '15mm',
            }}
          >
            {renderReportTemplate()}
          </div>
        </div>
      </div>
    </div>
  );
}
