/**
 * 상태값 설정 유틸리티
 * 모든 페이지에서 공통으로 사용하는 상태 표시 설정
 */

export interface StatusConfigItem {
  label: string;
  color: string;
  bgColor: string;
}

// 기본 상태 설정 (대소문자 모두 지원)
export const statusConfig: Record<string, StatusConfigItem> = {
  // 소문자 상태값
  draft: { label: '작성중', color: '#6B7280', bgColor: '#F3F4F6' },
  pending: { label: '대기', color: '#F59E0B', bgColor: '#FEF3C7' },
  submitted: { label: '제출', color: '#2563EB', bgColor: '#DBEAFE' },
  approved: { label: '승인', color: '#059669', bgColor: '#D1FAE5' },
  confirmed: { label: '확정', color: '#059669', bgColor: '#D1FAE5' },
  rejected: { label: '반려', color: '#DC2626', bgColor: '#FEE2E2' },
  expired: { label: '만료', color: '#9CA3AF', bgColor: '#F3F4F6' },
  cancelled: { label: '취소', color: '#DC2626', bgColor: '#FEE2E2' },
  completed: { label: '완료', color: '#059669', bgColor: '#D1FAE5' },
  in_progress: { label: '진행중', color: '#2563EB', bgColor: '#DBEAFE' },
  processing: { label: '처리중', color: '#2563EB', bgColor: '#DBEAFE' },
  active: { label: '활성', color: '#059669', bgColor: '#D1FAE5' },
  inactive: { label: '비활성', color: '#6B7280', bgColor: '#F3F4F6' },
  sent: { label: '발송', color: '#059669', bgColor: '#D1FAE5' },
  received: { label: '수신', color: '#2563EB', bgColor: '#DBEAFE' },

  // 대문자 상태값 (DB 호환)
  DRAFT: { label: '작성중', color: '#6B7280', bgColor: '#F3F4F6' },
  PENDING: { label: '대기', color: '#F59E0B', bgColor: '#FEF3C7' },
  SUBMITTED: { label: '제출', color: '#2563EB', bgColor: '#DBEAFE' },
  APPROVED: { label: '승인', color: '#059669', bgColor: '#D1FAE5' },
  CONFIRMED: { label: '확정', color: '#059669', bgColor: '#D1FAE5' },
  REJECTED: { label: '반려', color: '#DC2626', bgColor: '#FEE2E2' },
  EXPIRED: { label: '만료', color: '#9CA3AF', bgColor: '#F3F4F6' },
  CANCELLED: { label: '취소', color: '#DC2626', bgColor: '#FEE2E2' },
  COMPLETED: { label: '완료', color: '#059669', bgColor: '#D1FAE5' },
  IN_PROGRESS: { label: '진행중', color: '#2563EB', bgColor: '#DBEAFE' },
  PROCESSING: { label: '처리중', color: '#2563EB', bgColor: '#DBEAFE' },
  ACTIVE: { label: '활성', color: '#059669', bgColor: '#D1FAE5' },
  INACTIVE: { label: '비활성', color: '#6B7280', bgColor: '#F3F4F6' },
  SENT: { label: '발송', color: '#059669', bgColor: '#D1FAE5' },
  RECEIVED: { label: '수신', color: '#2563EB', bgColor: '#DBEAFE' },
};

// 기본 상태 설정 (알 수 없는 상태값용)
const defaultStatus: StatusConfigItem = {
  label: '미정',
  color: '#6B7280',
  bgColor: '#F3F4F6',
};

/**
 * 안전한 상태 설정 조회 함수
 * 상태값이 없거나 정의되지 않은 경우 기본값 반환
 */
export function getStatusConfig(status: string | undefined | null): StatusConfigItem {
  if (!status) return defaultStatus;
  return statusConfig[status] || { ...defaultStatus, label: status };
}

/**
 * 상태 라벨 조회
 */
export function getStatusLabel(status: string | undefined | null): string {
  return getStatusConfig(status).label;
}

/**
 * 상태 색상 조회
 */
export function getStatusColor(status: string | undefined | null): string {
  return getStatusConfig(status).color;
}

/**
 * 상태 배경색 조회
 */
export function getStatusBgColor(status: string | undefined | null): string {
  return getStatusConfig(status).bgColor;
}
