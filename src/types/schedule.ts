// 선박 스케줄 타입
export interface VesselSchedule {
  schedule_id: number;
  carrier_id: number;
  carrier_name?: string;
  carrier_code?: string;
  vessel_nm: string;
  voyage_no: string;
  service_lane?: string;
  pol_port_cd: string;
  pod_port_cd: string;
  pol_port_name?: string;
  pod_port_name?: string;
  pol_terminal?: string;
  pod_terminal?: string;
  etd_dt: string;
  eta_dt: string;
  atd_dt?: string;
  ata_dt?: string;
  doc_cutoff_dt?: string;
  cargo_cutoff_dt?: string;
  vgm_cutoff_dt?: string;
  transit_time?: number;
  space_20gp?: number;
  space_40gp?: number;
  space_40hc?: number;
  space_45hc?: number;
  status_cd: string;
  remark?: string;
  created_dtm?: string;
}

// 스케줄 생성/수정 폼 데이터
export interface ScheduleFormData {
  carrier_id: number;
  vessel_nm: string;
  voyage_no: string;
  service_lane?: string;
  pol_port_cd: string;
  pod_port_cd: string;
  pol_terminal?: string;
  pod_terminal?: string;
  etd_dt: string;
  eta_dt: string;
  doc_cutoff_dt?: string;
  cargo_cutoff_dt?: string;
  vgm_cutoff_dt?: string;
  transit_time?: number;
  space_20gp?: number;
  space_40gp?: number;
  space_40hc?: number;
  space_45hc?: number;
  remark?: string;
}

// 스케줄 상태
export type ScheduleStatus = 'SCHEDULED' | 'DEPARTED' | 'ARRIVED' | 'CANCELLED' | 'DELAYED';

// 스케줄 검색 필터
export interface ScheduleFilter {
  carrier_id?: number;
  pol_port_cd?: string;
  pod_port_cd?: string;
  etd_from?: string;
  etd_to?: string;
  status_cd?: string;
}
