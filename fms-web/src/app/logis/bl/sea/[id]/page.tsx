'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { formatCurrency } from '@/utils/format';
import { ReportPrintModal } from '@/components/reports';

// 탭 타입
type TabType = 'MAIN' | 'CARGO' | 'OTHER';

// B/L 상세 데이터 인터페이스
interface BLDetailData {
  id: string;
  jobNo: string;
  bookingNo: string;
  mblNo: string;
  hblNo: string;
  srNo: string;
  ioType: string;
  businessType: string;
  blType: string;
  status: string;
  // Shipper/Consignee/Notify
  shipperCode: string;
  shipperName: string;
  shipperAddress: string;
  consigneeCode: string;
  consigneeName: string;
  consigneeAddress: string;
  notifyCode: string;
  notifyName: string;
  notifyAddress: string;
  forDeliveryCode: string;
  forDeliveryName: string;
  forDeliveryAddress: string;
  // Schedule
  placeOfReceipt: string;
  lineCode: string;
  lineName: string;
  portOfLoading: string;
  portOfDischarge: string;
  placeOfDelivery: string;
  finalDestination: string;
  vesselName: string;
  voyageNo: string;
  onboardDate: string;
  etd: string;
  eta: string;
  freightTerm: string;
  serviceTerm: string;
  // Cargo
  containerType: string;
  packageQty: number;
  packageUnit: string;
  grossWeight: number;
  measurement: number;
  rton: number;
  containers: ContainerInfo[];
  otherCharges: OtherCharge[];
  // Issue
  issuePlace: string;
  issueDate: string;
  blIssueType: string;
  noOfOriginalBL: number;
  // Other
  agentCode: string;
  agentName: string;
  partnerCode: string;
  partnerName: string;
  countryCode: string;
  regionCode: string;
  lcNo: string;
  poNo: string;
  createdAt: string;
  updatedAt: string;
}

interface ContainerInfo {
  id: string;
  containerNo: string;
  containerType: string;
  seal1No: string;
  seal2No: string;
  seal3No: string;
  packageQty: number;
  packageUnit: string;
  grossWeight: number;
  measurement: number;
}

interface OtherCharge {
  id: string;
  code: string;
  charges: string;
  currency: string;
  prepaid: number;
  collect: number;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: '작성중', color: '#6B7280', bgColor: '#F3F4F6' },
  ISSUED: { label: '발행완료', color: '#059669', bgColor: '#D1FAE5' },
  SURRENDERED: { label: 'Surrendered', color: '#2563EB', bgColor: '#DBEAFE' },
  RELEASED: { label: 'Released', color: '#7C3AED', bgColor: '#EDE9FE' },
};

const getStatusConfig = (status: string) => {
  return statusConfig[status] || { label: status || '미정', color: '#6B7280', bgColor: '#F3F4F6' };
};

// 샘플 상세 데이터
const sampleDetailData: Record<string, BLDetailData> = {
  '1': {
    id: '1',
    jobNo: 'SEX-2026-0001',
    bookingNo: 'BK-2026-0001',
    mblNo: 'MAEU123456789',
    hblNo: 'HBL2026010001',
    srNo: 'SR-2026-0001',
    ioType: 'OUT',
    businessType: 'SIMPLE',
    blType: 'ORIGINAL',
    status: 'ISSUED',
    shipperCode: 'SH001',
    shipperName: '삼성전자(주)',
    shipperAddress: '서울시 강남구 삼성동 123\nTEL: 02-1234-5678',
    consigneeCode: 'CN001',
    consigneeName: 'ABC CORPORATION',
    consigneeAddress: '1234 MAIN STREET, LOS ANGELES, CA 90001\nTEL: +1-310-123-4567',
    notifyCode: '',
    notifyName: 'SAME AS CONSIGNEE',
    notifyAddress: '',
    forDeliveryCode: '',
    forDeliveryName: '',
    forDeliveryAddress: '',
    placeOfReceipt: 'BUSAN, KOREA',
    lineCode: 'MAEU',
    lineName: 'MAERSK LINE',
    portOfLoading: 'KRPUS',
    portOfDischarge: 'USLGB',
    placeOfDelivery: 'LONG BEACH, CA',
    finalDestination: 'LOS ANGELES, CA',
    vesselName: 'HANJIN BUSAN',
    voyageNo: '001E',
    onboardDate: '2026-01-20',
    etd: '2026-01-20',
    eta: '2026-02-05',
    freightTerm: 'PREPAID',
    serviceTerm: 'CY/CY',
    containerType: 'FCL',
    packageQty: 500,
    packageUnit: 'CTN',
    grossWeight: 15000,
    measurement: 65,
    rton: 15.0,
    containers: [
      { id: 'C1', containerNo: 'MAEU1234567', containerType: '40HC', seal1No: 'SEAL001', seal2No: '', seal3No: '', packageQty: 250, packageUnit: 'CTN', grossWeight: 7500, measurement: 32.5 },
      { id: 'C2', containerNo: 'MAEU7654321', containerType: '40HC', seal1No: 'SEAL002', seal2No: '', seal3No: '', packageQty: 250, packageUnit: 'CTN', grossWeight: 7500, measurement: 32.5 },
    ],
    otherCharges: [
      { id: 'CH1', code: 'OFR', charges: 'OCEAN FREIGHT', currency: 'USD', prepaid: 2500, collect: 0 },
      { id: 'CH2', code: 'THC', charges: 'TERMINAL HANDLING CHARGE', currency: 'USD', prepaid: 350, collect: 0 },
    ],
    issuePlace: 'SEOUL, KOREA',
    issueDate: '2026-01-19',
    blIssueType: 'ORIGINAL',
    noOfOriginalBL: 3,
    agentCode: 'AG001',
    agentName: 'ABC SHIPPING AGENCY',
    partnerCode: 'PT001',
    partnerName: 'XYZ LOGISTICS',
    countryCode: 'US',
    regionCode: 'NA',
    lcNo: 'LC2026-001',
    poNo: 'PO-001',
    createdAt: '2026-01-18 10:30:00',
    updatedAt: '2026-01-19 14:20:00',
  },
};

export default function BLSeaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const blId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabType>('MAIN');
  const [data, setData] = useState<BLDetailData | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 화면닫기 핸들러
  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.push('/logis/bl/sea');
  };

  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/bl/sea?blId=${blId}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          // API 실패시 샘플 데이터 사용
          setData(sampleDetailData[blId] || sampleDetailData['1']);
        }
      } catch (error) {
        console.error('Failed to fetch B/L data:', error);
        // 샘플 데이터 사용
        setData(sampleDetailData[blId] || sampleDetailData['1']);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [blId]);

  // 목록으로
  const handleList = () => {
    router.push('/logis/bl/sea');
  };

  // 수정
  const handleEdit = () => {
    router.push(`/logis/bl/sea/register?id=${blId}`);
  };

  // 출력
  const handlePrint = () => {
    setShowPrintModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--muted)]">Loading...</div>
      </div>
  );
}

  if (!data) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--muted)] mb-4">데이터를 찾을 수 없습니다.</p>
          <button
            onClick={handleList}
            className="px-4 py-2 bg-[#E8A838] text-white rounded-lg hover:bg-[#d99a2f]"
          >
            목록으로
          </button>
        </div>
      </div>
    );
  }

  // MAIN TAB 렌더링
  const renderMainTab = () => (
    <div className="space-y-6">
      {/* Main Information */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="font-bold">Main Information</h3>
          </div>
          <span
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{ color: getStatusConfig(data.status).color, backgroundColor: getStatusConfig(data.status).bgColor }}
          >
            {getStatusConfig(data.status).label}
          </span>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-6 gap-4 mb-4">
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">수출입구분</label>
              <p className="font-medium">{data.ioType === 'OUT' ? '수출(OUT)' : '수입(IN)'}</p>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">JOB NO</label>
              <p className="font-medium text-[#E8A838]">{data.jobNo}</p>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">BOOKING NO</label>
              <p className="font-medium">{data.bookingNo || '-'}</p>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">업무유형</label>
              <p className="font-medium">{data.businessType}</p>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">B/L TYPE</label>
              <p className="font-medium">{data.blType}</p>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">S/R NO</label>
              <p className="font-medium">{data.srNo || '-'}</p>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-4 mb-4">
            <div className="col-span-3">
              <label className="block text-xs text-[var(--foreground)] mb-1">M B/L NO</label>
              <p className="font-medium text-lg">{data.mblNo}</p>
            </div>
            <div className="col-span-3">
              <label className="block text-xs text-[var(--foreground)] mb-1">H B/L NO</label>
              <p className="font-medium text-lg">{data.hblNo}</p>
            </div>
          </div>

          {/* Shipper / Consignee / Notify */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-[var(--surface-50)] rounded-lg">
              <label className="block text-xs text-[var(--foreground)] mb-1">SHIPPER</label>
              <p className="font-medium">{data.shipperName}</p>
              <p className="text-sm text-[var(--muted)] whitespace-pre-line">{data.shipperAddress}</p>
            </div>
            <div className="p-3 bg-[var(--surface-50)] rounded-lg">
              <label className="block text-xs text-[var(--foreground)] mb-1">CONSIGNEE</label>
              <p className="font-medium">{data.consigneeName}</p>
              <p className="text-sm text-[var(--muted)] whitespace-pre-line">{data.consigneeAddress}</p>
            </div>
            <div className="p-3 bg-[var(--surface-50)] rounded-lg">
              <label className="block text-xs text-[var(--foreground)] mb-1">NOTIFY PARTY</label>
              <p className="font-medium">{data.notifyName || '-'}</p>
              <p className="text-sm text-[var(--muted)] whitespace-pre-line">{data.notifyAddress}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Information */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="font-bold">Schedule Information</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-6 gap-4 mb-4">
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">Place of Receipt</label>
              <p className="font-medium">{data.placeOfReceipt || '-'}</p>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">LINE</label>
              <p className="font-medium">{data.lineName || '-'}</p>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">Port of Loading</label>
              <p className="font-medium">{data.portOfLoading}</p>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">Port of Discharge</label>
              <p className="font-medium">{data.portOfDischarge}</p>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">Onboard Date</label>
              <p className="font-medium">{data.onboardDate || '-'}</p>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">SERVICE TERM</label>
              <p className="font-medium">{data.serviceTerm}</p>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-[var(--foreground)] mb-1">Vessel Name & Voyage No</label>
              <p className="font-medium">{data.vesselName} / {data.voyageNo}</p>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">ETD</label>
              <p className="font-medium">{data.etd}</p>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">ETA</label>
              <p className="font-medium">{data.eta}</p>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">FREIGHT TERM</label>
              <p className="font-medium">{data.freightTerm}</p>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">Final Destination</label>
              <p className="font-medium">{data.finalDestination || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // CARGO TAB 렌더링
  const renderCargoTab = () => (
    <div className="space-y-6">
      {/* Cargo Information */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="font-bold">Cargo Information</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-6 gap-4 mb-4">
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">컨테이너 규격</label>
              <p className="font-medium">{data.containerType}</p>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">Package</label>
              <p className="font-medium">{data.packageQty.toLocaleString()} {data.packageUnit}</p>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">Gross Weight (KG)</label>
              <p className="font-medium">{data.grossWeight.toLocaleString()}</p>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">Measurement (CBM)</label>
              <p className="font-medium">{data.measurement.toLocaleString()}</p>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">R.TON</label>
              <p className="font-medium">{data.rton.toFixed(3)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Container Information Grid */}
      {data.containerType === 'FCL' && data.containers.length > 0 && (
        <div className="card">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-bold">Container Information</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="text-center">No</th>
                  <th>Container No</th>
                  <th className="text-center">규격</th>
                  <th>Seal 1</th>
                  <th>Seal 2</th>
                  <th>Seal 3</th>
                  <th className="text-center">Package</th>
                  <th className="text-center">Unit</th>
                  <th className="text-center">G.Weight</th>
                  <th className="text-center">Measurement</th>
                </tr>
              </thead>
              <tbody>
                {data.containers.map((container, index) => (
                  <tr key={container.id} className="border-t border-[var(--border)]">
                    <td className="p-2 text-center text-sm">{index + 1}</td>
                    <td className="p-2 text-sm font-medium">{container.containerNo}</td>
                    <td className="p-2 text-center text-sm">{container.containerType}</td>
                    <td className="p-2 text-sm">{container.seal1No || '-'}</td>
                    <td className="p-2 text-sm">{container.seal2No || '-'}</td>
                    <td className="p-2 text-sm">{container.seal3No || '-'}</td>
                    <td className="p-2 text-center text-sm">{container.packageQty.toLocaleString()}</td>
                    <td className="p-2 text-center text-sm">{container.packageUnit}</td>
                    <td className="p-2 text-center text-sm">{container.grossWeight.toLocaleString()}</td>
                    <td className="p-2 text-center text-sm">{container.measurement.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Other Charges Grid */}
      {data.otherCharges.length > 0 && (
        <div className="card">
          <div className="p-4 border-b border-[var(--border)]">
            <h3 className="font-bold">Other Charges</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="text-center">No</th>
                  <th>CODE</th>
                  <th>Charges</th>
                  <th className="text-center">Cur</th>
                  <th className="text-center">Prepaid</th>
                  <th className="text-center">Collect</th>
                </tr>
              </thead>
              <tbody>
                {data.otherCharges.map((charge, index) => (
                  <tr key={charge.id} className="border-t border-[var(--border)]">
                    <td className="p-2 text-center text-sm">{index + 1}</td>
                    <td className="p-2 text-sm font-medium">{charge.code}</td>
                    <td className="p-2 text-sm">{charge.charges}</td>
                    <td className="p-2 text-center text-sm">{charge.currency}</td>
                    <td className="p-2 text-center text-sm">{formatCurrency(charge.prepaid)}</td>
                    <td className="p-2 text-center text-sm">{formatCurrency(charge.collect)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[var(--surface-50)]">
                <tr className="border-t border-[var(--border)] font-medium">
                  <td colSpan={4} className="p-2 text-center text-sm">Total:</td>
                  <td className="p-2 text-center text-sm">
                    {formatCurrency(data.otherCharges.reduce((sum, c) => sum + c.prepaid, 0))}
                  </td>
                  <td className="p-2 text-center text-sm">
                    {formatCurrency(data.otherCharges.reduce((sum, c) => sum + c.collect, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Issue Information */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-bold">Issue Information</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">Issue Place</label>
              <p className="font-medium">{data.issuePlace || '-'}</p>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">Issue Date</label>
              <p className="font-medium">{data.issueDate || '-'}</p>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">B/L Issue Type</label>
              <p className="font-medium">{data.blIssueType || '-'}</p>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">No. of Original B/L</label>
              <p className="font-medium">{data.noOfOriginalBL}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // OTHER TAB 렌더링
  const renderOtherTab = () => (
    <div className="space-y-6">
      <div className="card">
        <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-bold">Other Information</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">AGENT</label>
              <p className="font-medium">{data.agentName || '-'}</p>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">PARTNER</label>
              <p className="font-medium">{data.partnerName || '-'}</p>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">국가코드</label>
              <p className="font-medium">{data.countryCode || '-'}</p>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">지역코드</label>
              <p className="font-medium">{data.regionCode || '-'}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">L/C NO</label>
              <p className="font-medium">{data.lcNo || '-'}</p>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">P/O NO</label>
              <p className="font-medium">{data.poNo || '-'}</p>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">최초등록일</label>
              <p className="font-medium">{data.createdAt || '-'}</p>
            </div>
            <div>
              <label className="block text-xs text-[var(--foreground)] mb-1">최종수정일</label>
              <p className="font-medium">{data.updatedAt || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 탭 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'MAIN':
        return renderMainTab();
      case 'CARGO':
        return renderCargoTab();
      case 'OTHER':
        return renderOtherTab();
      default:
        return null;
    }
  };

  return (
    <PageLayout
      title="B/L 상세조회 (해상)"
      subtitle="HOME > 선적관리 > B/L 관리(해상) > B/L 상세조회"
      onClose={() => setShowCloseModal(true)}
    >
        <main className="p-6">
          {/* 상단 버튼 영역 */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <button
                onClick={handleList}
                className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
              >
                목록
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
              >
                출력
              </button>
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] font-medium"
              >
                수정
              </button>
            </div>
          </div>

          {/* TAB 영역 */}
          <div className="flex gap-1 border-b border-[var(--border)] mb-6">
            {(['MAIN', 'CARGO', 'OTHER'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-6 py-3 font-medium rounded-t-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-[var(--surface-100)] text-[var(--muted)] hover:bg-[var(--surface-200)] hover:text-[var(--foreground)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* TAB 컨텐츠 */}
          {renderTabContent()}
        </main>
      <CloseConfirmModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleConfirmClose}
      />

      <ReportPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        reportType="BL"
        data={data as unknown as Record<string, unknown>}
      />
    </PageLayout>
  );
}
