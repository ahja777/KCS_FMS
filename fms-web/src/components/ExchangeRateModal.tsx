'use client';

import { useState, useEffect, useCallback } from 'react';

interface ExchangeRate {
  currencyCode: string;
  currencyName: string;
  ttb: number;
  tts: number;
  dealBasR: number;
  bkpr: number;
  kftcDealBasR: number;
}

interface ExchangeRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (rate: ExchangeRate) => void;
  selectedCurrency?: string;
}

// 통화별 국기
const currencyFlags: Record<string, string> = {
  'USD': '\u{1F1FA}\u{1F1F8}',
  'EUR': '\u{1F1EA}\u{1F1FA}',
  'JPY(100)': '\u{1F1EF}\u{1F1F5}',
  'CNY': '\u{1F1E8}\u{1F1F3}',
  'GBP': '\u{1F1EC}\u{1F1E7}',
  'HKD': '\u{1F1ED}\u{1F1F0}',
  'SGD': '\u{1F1F8}\u{1F1EC}',
  'AUD': '\u{1F1E6}\u{1F1FA}',
  'CAD': '\u{1F1E8}\u{1F1E6}',
  'CHF': '\u{1F1E8}\u{1F1ED}',
  'THB': '\u{1F1F9}\u{1F1ED}',
  'NZD': '\u{1F1F3}\u{1F1FF}',
  'MYR': '\u{1F1F2}\u{1F1FE}',
  'IDR(100)': '\u{1F1EE}\u{1F1E9}',
  'VND(100)': '\u{1F1FB}\u{1F1F3}',
  'PHP': '\u{1F1F5}\u{1F1ED}',
  'INR': '\u{1F1EE}\u{1F1F3}',
  'TWD': '\u{1F1F9}\u{1F1FC}',
};

// 숫자 포맷
function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function ExchangeRateModal({
  isOpen,
  onClose,
  onSelect,
  selectedCurrency,
}: ExchangeRateModalProps) {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [rateDate, setRateDate] = useState('');

  // 환율 조회
  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const response = await fetch(`/api/exchange-rate?date=${today}`);
      const result = await response.json();
      if (result.success) {
        setRates(result.data);
        setRateDate(result.searchDate);
      }
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchRates();
    }
  }, [isOpen, fetchRates]);

  // 필터링된 환율 목록
  const filteredRates = rates.filter(rate => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      rate.currencyCode.toLowerCase().includes(term) ||
      rate.currencyName.toLowerCase().includes(term)
    );
  });

  // 환율 선택
  const handleSelect = (rate: ExchangeRate) => {
    if (onSelect) {
      onSelect(rate);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-50 rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-100">
          <div>
            <h2 className="text-lg font-bold">환율 조회</h2>
            {rateDate && (
              <p className="text-xs text-gray-500">
                기준일: {rateDate.slice(0, 4)}-{rateDate.slice(4, 6)}-{rateDate.slice(6, 8)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-200">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="통화코드 또는 통화명으로 검색..."
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        {/* Content */}
        <div className="overflow-auto max-h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : filteredRates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              환율 데이터가 없습니다.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">통화</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">통화명</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">매매기준율</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-red-400">TTS</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-blue-400">TTB</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">선택</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRates.map(rate => (
                  <tr
                    key={rate.currencyCode}
                    className={`transition-colors cursor-pointer ${
                      selectedCurrency === rate.currencyCode ? 'bg-blue-100' : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelect(rate)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{currencyFlags[rate.currencyCode] || '\u{1F4B1}'}</span>
                        <span className="font-medium">{rate.currencyCode}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{rate.currencyName}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-[#E8A838]">
                      {formatNumber(rate.dealBasR)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-red-400">
                      {formatNumber(rate.tts)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-blue-400">
                      {formatNumber(rate.ttb)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(rate);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        선택
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            총 {filteredRates.length}개 통화
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
