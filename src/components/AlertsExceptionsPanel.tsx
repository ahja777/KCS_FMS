'use client';

import { useState, useEffect } from 'react';

interface Alert {
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  desc: string;
  time?: string;
  shipmentNo?: string;
}

interface AlertsExceptionsPanelProps {
  alerts: Alert[];
}

// 알림 타입별 설정
const alertConfig = {
  critical: {
    label: 'Critical',
    color: '#DC2626',
    bgColor: 'rgba(220, 38, 38, 0.06)',
    borderColor: 'rgba(220, 38, 38, 0.15)',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  },
  warning: {
    label: 'Warning',
    color: '#D97706',
    bgColor: 'rgba(217, 119, 6, 0.06)',
    borderColor: 'rgba(217, 119, 6, 0.15)',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  info: {
    label: 'Info',
    color: '#2563EB',
    bgColor: 'rgba(37, 99, 235, 0.06)',
    borderColor: 'rgba(37, 99, 235, 0.15)',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    ),
  },
  success: {
    label: 'Success',
    color: '#059669',
    bgColor: 'rgba(5, 150, 105, 0.06)',
    borderColor: 'rgba(5, 150, 105, 0.15)',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

// 타입별 우선순위
const priorityOrder = { critical: 0, warning: 1, info: 2, success: 3 };

export default function AlertsExceptionsPanel({ alerts }: AlertsExceptionsPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 우선순위별 정렬
  const sortedAlerts = [...alerts].sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type]);

  // 타입별 카운트
  const counts = alerts.reduce((acc, alert) => {
    acc[alert.type] = (acc[alert.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const criticalCount = counts.critical || 0;
  const warningCount = counts.warning || 0;

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 요약 */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[var(--border)]">
        {/* Critical 카운터 */}
        {criticalCount > 0 && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
            style={{
              backgroundColor: alertConfig.critical.bgColor,
              border: `1px solid ${alertConfig.critical.borderColor}`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: alertConfig.critical.color }}
            />
            <span className="text-[11px] font-semibold" style={{ color: alertConfig.critical.color }}>
              {criticalCount} Critical
            </span>
          </div>
        )}

        {/* Warning 카운터 */}
        {warningCount > 0 && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
            style={{
              backgroundColor: alertConfig.warning.bgColor,
              border: `1px solid ${alertConfig.warning.borderColor}`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: alertConfig.warning.color }}
            />
            <span className="text-[11px] font-semibold" style={{ color: alertConfig.warning.color }}>
              {warningCount} Warning
            </span>
          </div>
        )}

        {/* 전체 카운트 */}
        <div className="ml-auto text-[11px] text-[var(--muted)]">
          Total {alerts.length} alerts
        </div>
      </div>

      {/* 알림 리스트 */}
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {sortedAlerts.map((alert, index) => {
          const config = alertConfig[alert.type];
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={index}
              className="relative group rounded-lg cursor-pointer transition-all duration-200"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(8px)',
                transition: `all 0.3s ease-out ${index * 0.08}s`,
                backgroundColor: isHovered ? config.bgColor : 'transparent',
                border: `1px solid ${isHovered ? config.borderColor : 'var(--border)'}`,
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex items-start gap-3 p-3">
                {/* 아이콘 */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                  style={{
                    backgroundColor: `${config.color}10`,
                    color: config.color,
                  }}
                >
                  {config.icon}
                </div>

                {/* 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h4
                      className="text-xs font-semibold truncate transition-colors duration-200"
                      style={{ color: isHovered ? config.color : 'var(--foreground)' }}
                    >
                      {alert.title}
                    </h4>
                    <span
                      className="text-[9px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 uppercase tracking-wide"
                      style={{
                        backgroundColor: `${config.color}12`,
                        color: config.color,
                      }}
                    >
                      {config.label}
                    </span>
                  </div>

                  <p className="text-[11px] text-[var(--muted)] truncate">
                    {alert.desc}
                  </p>

                  {/* 시간 정보 */}
                  {alert.time && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <svg className="w-3 h-3 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-[10px] text-[var(--muted)]">{alert.time}</span>
                    </div>
                  )}
                </div>

                {/* 화살표 */}
                <div
                  className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all duration-200"
                  style={{
                    backgroundColor: isHovered ? `${config.color}15` : 'transparent',
                    opacity: isHovered ? 1 : 0,
                    transform: isHovered ? 'translateX(0)' : 'translateX(-4px)',
                  }}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke={config.color}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* 좌측 인디케이터 라인 */}
              <div
                className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full transition-all duration-200"
                style={{
                  backgroundColor: config.color,
                  opacity: isHovered ? 1 : 0.3,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* 하단 액션 */}
      <div className="mt-3 pt-3 border-t border-[var(--border)]">
        <button
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:bg-[var(--surface-50)]"
          style={{ color: 'var(--foreground)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          View All Alerts
        </button>
      </div>
    </div>
  );
}
