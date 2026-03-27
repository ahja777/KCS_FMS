'use client';

interface DateRangeButtonsProps {
  onRangeSelect: (startDate: string, endDate: string) => void;
}

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환
export function getToday(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// 날짜 계산 함수
export function calculateDateRange(range: 'today' | 'week' | 'month' | 'year'): { startDate: string; endDate: string } {
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];
  let startDate: string;

  switch (range) {
    case 'today':
      startDate = endDate;
      break;
    case 'week':
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      startDate = weekAgo.toISOString().split('T')[0];
      break;
    case 'month':
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      startDate = monthAgo.toISOString().split('T')[0];
      break;
    case 'year':
      const yearAgo = new Date(today);
      yearAgo.setFullYear(today.getFullYear() - 1);
      startDate = yearAgo.toISOString().split('T')[0];
      break;
    default:
      startDate = endDate;
  }

  return { startDate, endDate };
}

export default function DateRangeButtons({ onRangeSelect }: DateRangeButtonsProps) {
  const handleClick = (range: 'today' | 'week' | 'month' | 'year') => {
    const { startDate, endDate } = calculateDateRange(range);
    onRangeSelect(startDate, endDate);
  };

  const buttonStyle = "h-[38px] px-2.5 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--surface-50)] hover:bg-[var(--surface-100)] hover:border-[#E8A838] transition-colors flex items-center justify-center whitespace-nowrap flex-shrink-0";

  return (
    <div className="flex items-center gap-0.5 flex-shrink-0">
      <button
        type="button"
        onClick={() => handleClick('today')}
        className={buttonStyle}
      >
        당일
      </button>
      <button
        type="button"
        onClick={() => handleClick('week')}
        className={buttonStyle}
      >
        일주일
      </button>
      <button
        type="button"
        onClick={() => handleClick('month')}
        className={buttonStyle}
      >
        한달
      </button>
      <button
        type="button"
        onClick={() => handleClick('year')}
        className={buttonStyle}
      >
        1년
      </button>
    </div>
  );
}
