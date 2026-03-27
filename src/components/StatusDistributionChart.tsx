'use client';

import { useState, useEffect, useMemo, ReactNode } from 'react';

interface StatusData {
  label: string;
  value: number;
  color: string;
}

interface StatusDistributionChartProps {
  data: StatusData[];
}

// 상태별 아이콘 컴포넌트
function StatusIcon({ label, color }: { label: string; color: string }) {
  const iconMap: Record<string, ReactNode> = {
    'In Transit': (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    'Pending': (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'Completed': (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'Delayed': (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  };

  return (
    <div
      className="w-5 h-5 flex items-center justify-center transition-all duration-300"
      style={{ color: color }}
    >
      {iconMap[label] || iconMap['Pending']}
    </div>
  );
}

export default function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [mounted, setMounted] = useState(false);

  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  // 애니메이션 진행
  useEffect(() => {
    setMounted(true);
    const duration = 1000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimationProgress(eased);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, []);

  // 도넛 차트 세그먼트 계산
  const segments = useMemo(() => {
    const radius = 45;
    const strokeWidth = 12;
    const circumference = 2 * Math.PI * radius;
    let currentOffset = circumference * 0.25; // 12시 방향에서 시작

    return data.map((item, index) => {
      const percentage = (item.value / total) * 100;
      const segmentLength = (circumference * percentage) / 100;
      const offset = currentOffset;
      currentOffset += segmentLength;

      return {
        ...item,
        percentage,
        radius,
        strokeWidth,
        circumference,
        offset,
        length: segmentLength * animationProgress,
      };
    });
  }, [data, total, animationProgress]);

  return (
    <div className="flex items-center gap-4 py-0 w-full">
      {/* 도넛 차트 영역 */}
      <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: '130px', height: '130px' }}>
        <svg
          width="130"
          height="130"
          viewBox="0 0 130 130"
          className="transform -rotate-90"
        >
          {/* 배경 원 */}
          <circle
            cx="65"
            cy="65"
            r="45"
            fill="none"
            stroke="var(--surface-100)"
            strokeWidth="12"
          />

          {/* 데이터 세그먼트 */}
          {segments.map((seg, index) => (
            <circle
              key={index}
              cx="65"
              cy="65"
              r={seg.radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={seg.strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${seg.length} ${seg.circumference}`}
              strokeDashoffset={-seg.offset}
              className="cursor-pointer transition-all duration-300"
              style={{
                opacity: hoveredIndex !== null && hoveredIndex !== index ? 0.35 : 1,
                filter: hoveredIndex === index ? `drop-shadow(0 2px 6px ${seg.color}50)` : 'none',
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>

        {/* 중앙 정보 */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'scale(1)' : 'scale(0.9)',
            transition: 'all 0.4s ease-out 0.2s',
          }}
        >
          {hoveredIndex !== null ? (
            <div className="text-center">
              <div
                className="text-lg font-bold number-display"
                style={{ color: segments[hoveredIndex].color }}
              >
                {segments[hoveredIndex].value}
              </div>
              <div className="text-[9px] font-medium text-[var(--muted)]">
                {segments[hoveredIndex].label}
              </div>
              <div
                className="text-[10px] font-semibold mt-0.5 px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: `${segments[hoveredIndex].color}12`,
                  color: segments[hoveredIndex].color
                }}
              >
                {segments[hoveredIndex].percentage.toFixed(1)}%
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-lg font-bold text-[var(--foreground)] number-display">
                {Math.round(total * animationProgress)}
              </div>
              <div className="text-[9px] font-medium text-[var(--muted)]">
                Total
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 범례 영역 */}
      <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
        {segments.map((item, index) => (
          <div
            key={index}
            className="group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-200"
            style={{
              backgroundColor: hoveredIndex === index ? `${item.color}08` : 'transparent',
              borderLeft: hoveredIndex === index ? `2px solid ${item.color}` : '2px solid transparent',
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div
              className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${item.color}12`, color: item.color }}
            >
              <StatusIcon label={item.label} color={item.color} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-medium text-[var(--foreground)] truncate">
                  {item.label}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span
                    className="text-xs font-bold number-display transition-colors duration-200"
                    style={{ color: hoveredIndex === index ? item.color : 'var(--foreground)' }}
                  >
                    {item.value}
                  </span>
                  <span
                    className="text-[9px] font-medium px-1 py-0.5 rounded transition-all duration-200"
                    style={{
                      backgroundColor: `${item.color}12`,
                      color: item.color,
                      opacity: hoveredIndex === index ? 1 : 0.7,
                    }}
                  >
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* 프로그레스 바 */}
              <div className="h-1 rounded-full overflow-hidden bg-[var(--surface-100)] mt-1">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${item.percentage * animationProgress}%`,
                    backgroundColor: item.color,
                    opacity: hoveredIndex !== null && hoveredIndex !== index ? 0.4 : 1,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
