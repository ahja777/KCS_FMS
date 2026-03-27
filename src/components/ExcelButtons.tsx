'use client';

import { useState, useRef } from 'react';

interface ExcelButtonsProps<T> {
  data: T[];
  columns: { key: keyof T; label: string; width?: number }[];
  filename?: string;
  onUpload?: (data: T[]) => void;
  sheetName?: string;
}

export default function ExcelButtons<T extends Record<string, any>>({
  data,
  columns,
  filename = 'data',
  onUpload,
  sheetName = 'Sheet1',
}: ExcelButtonsProps<T>) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Excel 다운로드 (CSV 형식)
  const handleDownload = () => {
    if (data.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }

    // BOM 추가 (한글 깨짐 방지)
    const BOM = '\uFEFF';

    // 헤더 생성
    const headers = columns.map(col => col.label).join(',');

    // 데이터 행 생성
    const rows = data.map(item =>
      columns.map(col => {
        const value = item[col.key];
        // 쉼표나 줄바꿈이 포함된 경우 따옴표로 감싸기
        if (value === null || value === undefined) return '';
        const strValue = String(value);
        if (strValue.includes(',') || strValue.includes('\n') || strValue.includes('"')) {
          return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
      }).join(',')
    );

    const csvContent = BOM + headers + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Excel 업로드
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        alert('데이터가 없습니다.');
        return;
      }

      // 헤더 파싱
      const headerLine = lines[0].replace(/^\uFEFF/, ''); // BOM 제거
      const headers = parseCSVLine(headerLine);

      // 데이터 파싱
      const parsedData: T[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const item: Record<string, any> = {};

        columns.forEach((col, index) => {
          const headerIndex = headers.findIndex(h => h === col.label);
          if (headerIndex !== -1 && values[headerIndex] !== undefined) {
            item[col.key as string] = values[headerIndex];
          }
        });

        parsedData.push(item as T);
      }

      if (onUpload) {
        onUpload(parsedData);
      }

      alert(`${parsedData.length}건의 데이터가 업로드되었습니다.`);
    } catch (error) {
      console.error('File parsing error:', error);
      alert('파일 파싱 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // CSV 라인 파싱 (따옴표 처리)
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());

    return result;
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleDownload}
        className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)] transition-colors flex items-center gap-2"
        title="Excel 다운로드"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        엑셀다운로드
      </button>

      <button
        onClick={handleUploadClick}
        disabled={isUploading}
        className={`px-4 py-2 font-semibold rounded-lg transition-colors flex items-center gap-2 ${
          isUploading
            ? 'bg-[var(--surface-200)] text-[var(--muted)] cursor-not-allowed'
            : 'bg-[var(--surface-100)] text-[var(--foreground)] hover:bg-[var(--surface-200)]'
        }`}
        title="Excel 업로드"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        {isUploading ? '엑셀업로드 중...' : '엑셀업로드'}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
