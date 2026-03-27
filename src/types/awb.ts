// Master AWB 타입
export interface MasterAWB {
  mawb_id: number;
  mawb_no: string;
  shipment_id: number | null;
  booking_id: number | null;
  carrier_id: number;
  carrier_name?: string;
  airline_code: string | null;
  flight_no: string | null;
  origin_airport_cd: string;
  dest_airport_cd: string;
  origin_airport_name?: string;
  dest_airport_name?: string;
  etd_dt: string | null;
  etd_time: string | null;
  atd_dt: string | null;
  eta_dt: string | null;
  eta_time: string | null;
  ata_dt: string | null;
  issue_dt: string | null;
  issue_place: string | null;
  shipper_nm: string | null;
  shipper_addr: string | null;
  consignee_nm: string | null;
  consignee_addr: string | null;
  notify_party: string | null;
  pieces: number | null;
  gross_weight_kg: number | null;
  charge_weight_kg: number | null;
  volume_cbm: number | null;
  commodity_desc: string | null;
  hs_code: string | null;
  dimensions: string | null;
  special_handling: string | null;
  declared_value: number | null;
  declared_currency: string | null;
  insurance_value: number | null;
  freight_charges: number | null;
  other_charges: number | null;
  payment_terms: string | null;
  hawb_count?: number;
  status_cd: string;
  remarks: string | null;
  created_dtm: string | null;
}

// House AWB 타입
export interface HouseAWB {
  hawb_id: number;
  hawb_no: string;
  shipment_id: number;
  mawb_id: number | null;
  mawb_no?: string;
  customer_id: number;
  customer_name?: string;
  carrier_id: number | null;
  carrier_name?: string;
  airline_code: string | null;
  flight_no: string | null;
  origin_airport_cd: string;
  dest_airport_cd: string;
  origin_airport_name?: string;
  dest_airport_name?: string;
  etd_dt: string | null;
  etd_time: string | null;
  atd_dt: string | null;
  eta_dt: string | null;
  eta_time: string | null;
  ata_dt: string | null;
  issue_dt: string | null;
  issue_place: string | null;
  shipper_nm: string | null;
  shipper_addr: string | null;
  consignee_nm: string | null;
  consignee_addr: string | null;
  notify_party: string | null;
  pieces: number | null;
  gross_weight_kg: number | null;
  charge_weight_kg: number | null;
  volume_cbm: number | null;
  commodity_desc: string | null;
  hs_code: string | null;
  dimensions: string | null;
  special_handling: string | null;
  declared_value: number | null;
  declared_currency: string | null;
  insurance_value: number | null;
  freight_charges: number | null;
  other_charges: number | null;
  payment_terms: string | null;
  status_cd: string;
  remarks: string | null;
  created_dtm: string | null;
}

// MAWB 생성/수정 폼 데이터
export interface MAWBFormData {
  shipment_id?: number | null;
  booking_id?: number | null;
  carrier_id: number;
  airline_code?: string;
  flight_no?: string;
  origin_airport_cd: string;
  dest_airport_cd: string;
  etd_dt?: string;
  etd_time?: string;
  eta_dt?: string;
  eta_time?: string;
  issue_dt?: string;
  issue_place?: string;
  shipper_nm?: string;
  shipper_addr?: string;
  consignee_nm?: string;
  consignee_addr?: string;
  notify_party?: string;
  pieces?: number;
  gross_weight_kg?: number;
  charge_weight_kg?: number;
  volume_cbm?: number;
  commodity_desc?: string;
  hs_code?: string;
  dimensions?: string;
  special_handling?: string;
  declared_value?: number;
  declared_currency?: string;
  insurance_value?: number;
  freight_charges?: number;
  other_charges?: number;
  payment_terms?: string;
  remarks?: string;
}

// HAWB 생성/수정 폼 데이터
export interface HAWBFormData {
  shipment_id: number;
  mawb_id?: number | null;
  customer_id: number;
  carrier_id?: number | null;
  airline_code?: string;
  flight_no?: string;
  origin_airport_cd: string;
  dest_airport_cd: string;
  etd_dt?: string;
  etd_time?: string;
  eta_dt?: string;
  eta_time?: string;
  issue_dt?: string;
  issue_place?: string;
  shipper_nm?: string;
  shipper_addr?: string;
  consignee_nm?: string;
  consignee_addr?: string;
  notify_party?: string;
  pieces?: number;
  gross_weight_kg?: number;
  charge_weight_kg?: number;
  volume_cbm?: number;
  commodity_desc?: string;
  hs_code?: string;
  dimensions?: string;
  special_handling?: string;
  declared_value?: number;
  declared_currency?: string;
  insurance_value?: number;
  freight_charges?: number;
  other_charges?: number;
  payment_terms?: string;
  remarks?: string;
}

// AWB 상태
export type AWBStatus = 'DRAFT' | 'BOOKED' | 'ACCEPTED' | 'DEPARTED' | 'IN_TRANSIT' | 'ARRIVED' | 'DELIVERED' | 'CANCELLED';

// Payment Terms
export type PaymentTerms = 'PREPAID' | 'COLLECT';
