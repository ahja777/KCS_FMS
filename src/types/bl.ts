// House B/L 타입
export interface HouseBL {
  hbl_id: number;
  hbl_no: string;
  shipment_id: number;
  mbl_id: number | null;
  mbl_no?: string;
  customer_id: number;
  customer_name?: string;
  carrier_id: number | null;
  carrier_name?: string;
  vessel_nm: string | null;
  voyage_no: string | null;
  pol_port_cd: string;
  pod_port_cd: string;
  pol_port_name?: string;
  pod_port_name?: string;
  place_of_receipt: string | null;
  place_of_delivery: string | null;
  final_dest: string | null;
  etd_dt: string | null;
  atd_dt: string | null;
  eta_dt: string | null;
  ata_dt: string | null;
  on_board_dt: string | null;
  issue_dt: string | null;
  issue_place: string | null;
  shipper_nm: string | null;
  shipper_addr: string | null;
  consignee_nm: string | null;
  consignee_addr: string | null;
  notify_party: string | null;
  total_pkg_qty: number | null;
  pkg_type_cd: string | null;
  gross_weight_kg: number | null;
  volume_cbm: number | null;
  commodity_desc: string | null;
  hs_code: string | null;
  marks_nos: string | null;
  freight_term_cd: string | null;
  bl_type_cd: string | null;
  original_bl_count: number | null;
  status_cd: string;
  print_yn: string | null;
  surrender_yn: string | null;
  created_dtm: string | null;
}

// Master B/L 타입
export interface MasterBL {
  mbl_id: number;
  mbl_no: string;
  shipment_id: number | null;
  booking_id: number | null;
  carrier_id: number;
  carrier_name?: string;
  vessel_nm: string | null;
  voyage_no: string | null;
  pol_port_cd: string;
  pod_port_cd: string;
  pol_port_name?: string;
  pod_port_name?: string;
  place_of_receipt: string | null;
  place_of_delivery: string | null;
  final_dest: string | null;
  etd_dt: string | null;
  atd_dt: string | null;
  eta_dt: string | null;
  ata_dt: string | null;
  on_board_dt: string | null;
  issue_dt: string | null;
  issue_place: string | null;
  shipper_nm: string | null;
  consignee_nm: string | null;
  notify_party: string | null;
  total_pkg_qty: number | null;
  pkg_type_cd: string | null;
  gross_weight_kg: number | null;
  volume_cbm: number | null;
  commodity_desc: string | null;
  cntr_count: number | null;
  hbl_count?: number;
  freight_term_cd: string | null;
  bl_type_cd: string | null;
  original_bl_count: number | null;
  status_cd: string;
  surrender_yn: string | null;
  created_dtm: string | null;
}

// Container 타입
export interface BLContainer {
  container_id: number;
  cntr_no: string;
  mbl_id: number | null;
  hbl_id: number | null;
  cntr_type_cd: string;
  cntr_size_cd: string | null;
  seal_no: string | null;
  gross_weight_kg: number | null;
  volume_cbm: number | null;
  pkg_qty: number | null;
  status_cd: string | null;
}

// HBL 생성/수정 폼 데이터
export interface HBLFormData {
  shipment_id: number;
  mbl_id?: number | null;
  customer_id: number;
  carrier_id?: number | null;
  vessel_nm?: string;
  voyage_no?: string;
  pol_port_cd: string;
  pod_port_cd: string;
  place_of_receipt?: string;
  place_of_delivery?: string;
  final_dest?: string;
  etd_dt?: string;
  eta_dt?: string;
  on_board_dt?: string;
  issue_dt?: string;
  issue_place?: string;
  shipper_nm?: string;
  shipper_addr?: string;
  consignee_nm?: string;
  consignee_addr?: string;
  notify_party?: string;
  total_pkg_qty?: number;
  pkg_type_cd?: string;
  gross_weight_kg?: number;
  volume_cbm?: number;
  commodity_desc?: string;
  hs_code?: string;
  marks_nos?: string;
  freight_term_cd?: string;
  bl_type_cd?: string;
  original_bl_count?: number;
}

// MBL 생성/수정 폼 데이터
export interface MBLFormData {
  shipment_id?: number | null;
  booking_id?: number | null;
  carrier_id: number;
  vessel_nm?: string;
  voyage_no?: string;
  pol_port_cd: string;
  pod_port_cd: string;
  place_of_receipt?: string;
  place_of_delivery?: string;
  final_dest?: string;
  etd_dt?: string;
  eta_dt?: string;
  on_board_dt?: string;
  issue_dt?: string;
  issue_place?: string;
  shipper_nm?: string;
  consignee_nm?: string;
  notify_party?: string;
  total_pkg_qty?: number;
  pkg_type_cd?: string;
  gross_weight_kg?: number;
  volume_cbm?: number;
  commodity_desc?: string;
  freight_term_cd?: string;
  bl_type_cd?: string;
  original_bl_count?: number;
}

// B/L 상태
export type BLStatus = 'DRAFT' | 'CONFIRMED' | 'PRINTED' | 'SURRENDERED' | 'RELEASED' | 'CANCELLED';

// B/L 타입
export type BLType = 'ORIGINAL' | 'SEAWAY' | 'EXPRESS' | 'SURRENDER';

// Freight Term
export type FreightTerm = 'PREPAID' | 'COLLECT' | 'FREIGHT_PAYABLE';
