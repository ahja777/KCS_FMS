'use client';

interface ReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: string;
  data: Record<string, unknown>[];
}

export default function ReportPrintModal({ isOpen, onClose, reportType, data }: ReportPrintModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-50 rounded-lg shadow-xl p-6 w-[500px]">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">
          {reportType} 출력
        </h2>
        <div className="mb-4">
          <p className="text-gray-500 mb-2">
            선택한 {data.length}건의 {reportType}를 출력합니다.
          </p>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {data.map((item, idx) => (
              <div key={idx} className="text-sm py-1 border-b border-gray-200 last:border-0">
                {JSON.stringify(item).slice(0, 100)}...
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            취소
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            출력
          </button>
        </div>
      </div>
    </div>
  );
}
