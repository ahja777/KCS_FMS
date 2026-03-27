/**
 * 목록 페이지 경로 상수
 * 화면닫기 시 이동할 목록 페이지 경로를 정의합니다.
 */
export const LIST_PATHS = {
  // Dashboard
  DASHBOARD: '/',

  // Booking
  BOOKING_SEA: '/logis/booking/sea',
  BOOKING_AIR: '/logis/booking/air',

  // Quote
  QUOTE_SEA: '/logis/quote/sea',
  QUOTE_AIR: '/logis/quote/air',
  QUOTE_REQUEST: '/logis/quote/request',

  // Schedule
  SCHEDULE_SEA: '/logis/schedule/sea',
  SCHEDULE_AIR: '/logis/schedule/air',

  // Import B/L
  IMPORT_BL_SEA: '/logis/import-bl/sea',
  IMPORT_BL_AIR: '/logis/import-bl/air',

  // S/R, S/N
  SR_SEA: '/logis/sr/sea',
  SN_SEA: '/logis/sn/sea',

  // Customs & AMS
  CUSTOMS_SEA: '/logis/customs/sea',
  CUSTOMS_ACCOUNT_SEA: '/logis/customs-account/sea',
  AMS_SEA: '/logis/ams/sea',
  MANIFEST_SEA: '/logis/manifest/sea',

  // Import Customs
  IMPORT_CUSTOMS_SEA: '/logis/import/customs/sea',

  // B/L Management
  BL_MANAGE: '/logis/bl/manage',

  // Cargo Trace
  CARGO_TRACE: '/logis/cargo/trace',

  // Transport Inland
  TRANSPORT_INLAND: '/logis/transport/inland',

  // Partner
  PARTNER: '/logis/common/partner',

  // Air Tariff
  AIR_TARIFF: '/logis/common/air-tariff',

  // Corporate Rate
  CORPORATE_RATE_SEA: '/logis/rate/corporate/sea',
  CORPORATE_RATE_AIR: '/logis/rate/corporate/air',

} as const;

export type ListPathKey = keyof typeof LIST_PATHS;
export type ListPath = typeof LIST_PATHS[ListPathKey];
