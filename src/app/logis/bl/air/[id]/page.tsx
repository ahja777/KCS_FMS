'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { formatCurrency } from '@/utils/format';

// 화면설계서 UI-G-01-07-07 기준 AWB 상세조회(항공)
type TabType = 'MAIN' | 'CARGO' | 'OTHER';

// MAIN TAB 데이터 인터페이스
interface MainData {
  ioType: string;
  jobNo: string;
  bookingNo: string;
  mawbNo: string;
  hawbNo: string;
  shipperCode: string;
  shipperName: string;
  shipperAddress: string;
  consigneeCode: string;
  consigneeName: string;
  consigneeAddress: string;
  notifyCode: string;
  notifyName: string;
  notifyAddress: string;
  currencyCode: string;
  wtVal: string;
  otherChgs: string;
  chgsCode: string;
  departure: string;
  arrival: string;
  flightNo: string;
  flightDate: string;
  handlingInfo: string;
  status: string;
}

// CARGO TAB 데이터 인터페이스
interface CargoData {
  cargoItems: CargoItem[];
  otherCharges: OtherCharge[];
  natureOfGoods: string;
  weightCharge: number;
  dimensions: DimensionItem[];
  totalPcs: number;
  totalVolume: number;
  atPlace: string;
  signatureCarrier: string;
}

// OTHER TAB 데이터 인터페이스
interface OtherData {
  agentCode: string;
  agentName: string;
  subAgentCode: string;
  subAgentName: string;
  partnerCode: string;
  partnerName: string;
  airlineCode: string;
  airlineName: string;
  regionCode: string;
  countryCode: string;
  mrnNo: string;
  msn: string;
  lcNo: string;
  poNo: string;
  createdAt: string;
  updatedAt: string;
}

// Cargo Item
interface CargoItem {
  id: string;
  piecesRcp: number;
  grossWeight: number;
  weightUnit: string;
  rateClass: string;
  chargeableWeight: number;
  rateCharge: number;
  total: number;
  asArranged: boolean;
}

// Other Charge
interface OtherCharge {
  id: string;
  codes: string;
  currency: string;
  rate: number;
  amount: number;
  pc: string;
  ac: string;
}

// Dimension Item
interface DimensionItem {
  id: string;
  print: boolean;
  width: number;
  length: number;
  height: number;
  pcs: number;
  volume: number;
}

const initialMainData: MainData = {
  ioType: '',
  jobNo: '',
  bookingNo: '',
  mawbNo: '',
  hawbNo: '',
  shipperCode: '',
  shipperName: '',
  shipperAddress: '',
  consigneeCode: '',
  consigneeName: '',
  consigneeAddress: '',
  notifyCode: '',
  notifyName: '',
  notifyAddress: '',
  currencyCode: '',
  wtVal: '',
  otherChgs: '',
  chgsCode: '',
  departure: '',
  arrival: '',
  flightNo: '',
  flightDate: '',
  handlingInfo: '',
  status: '',
};

const initialCargoData: CargoData = {
  cargoItems: [],
  otherCharges: [],
  natureOfGoods: '',
  weightCharge: 0,
  dimensions: [],
  totalPcs: 0,
  totalVolume: 0,
  atPlace: '',
  signatureCarrier: '',
};

const initialOtherData: OtherData = {
  agentCode: '',
  agentName: '',
  subAgentCode: '',
  subAgentName: '',
  partnerCode: '',
  partnerName: '',
  airlineCode: '',
  airlineName: '',
  regionCode: '',
  countryCode: '',
  mrnNo: '',
  msn: '',
  lcNo: '',
  poNo: '',
  createdAt: '',
  updatedAt: '',
};

// 상태 배지 컴포넌트
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-500/20 text-gray-400';
      case 'CONFIRMED':
        return 'bg-blue-500/20 text-blue-400';
      case 'SHIPPED':
        return 'bg-green-500/20 text-green-400';
      case 'ARRIVED':
        return 'bg-purple-500/20 text-purple-400';
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'DRAFT': return 'Draft';
      case 'CONFIRMED': return 'Confirmed';
      case 'SHIPPED': return 'Shipped';
      case 'ARRIVED': return 'Arrived';
      case 'CANCELLED': return 'Cancelled';
      default: return status || '-';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle()}`}>
      {getStatusLabel()}
    </span>
  );
};

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function AWBDetailPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const awbId = resolvedParams.id;

  const [activeTab, setActiveTab] = useState<TabType>('MAIN');
  const [mainData, setMainData] = useState<MainData>(initialMainData);
  const [cargoData, setCargoData] = useState<CargoData>(initialCargoData);
  const [otherData, setOtherData] = useState<OtherData>(initialOtherData);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.push('/logis/bl/air');
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
        const response = await fetch(`/api/bl/air?awbId=${awbId}`);
        if (response.ok) {
          const data = await response.json();
          setMainData(prev => ({
            ...prev,
            ioType: data.ioType || '',
            jobNo: data.jobNo || '',
            bookingNo: data.bookingNo || '',
            mawbNo: data.mawbNo || '',
            hawbNo: data.hawbNo || '',
            shipperCode: data.shipperCode || '',
            shipperName: data.shipperName || '',
            shipperAddress: data.shipperAddress || '',
            consigneeCode: data.consigneeCode || '',
            consigneeName: data.consigneeName || '',
            consigneeAddress: data.consigneeAddress || '',
            notifyCode: data.notifyCode || '',
            notifyName: data.notifyName || '',
            notifyAddress: data.notifyAddress || '',
            currencyCode: data.currencyCode || '',
            wtVal: data.wtVal || '',
            otherChgs: data.otherChgs || '',
            departure: data.departure || '',
            arrival: data.arrival || '',
            flightNo: data.flightNo || '',
            flightDate: data.departureDate || '',
            status: data.status || '',
          }));
          setOtherData(prev => ({
            ...prev,
            agentCode: data.agentCode || '',
            agentName: data.agentName || '',
            partnerCode: data.partnerCode || '',
            partnerName: data.partnerName || '',
            lcNo: data.lcNo || '',
            poNo: data.poNo || '',
            createdAt: data.createdAt || '',
            updatedAt: data.updatedAt || '',
          }));
        }
      } catch (error) {
        console.error('Failed to fetch AWB data:', error);
        // 로컬 샘플 데이터
        setMainData({
          ...initialMainData,
          ioType: 'OUT',
          jobNo: `AEX-2026-${awbId.padStart(4, '0')}`,
          mawbNo: '180-12345675',
          hawbNo: 'HAWB2026001',
          shipperName: 'ABC TRADING CO., LTD',
          shipperAddress: '123 GANGNAM-RO, SEOUL, KOREA',
          consigneeName: 'XYZ수입',
          consigneeAddress: '456 MAIN STREET, LOS ANGELES, CA, USA',
          notifyName: 'SAME AS CONSIGNEE',
          currencyCode: 'USD',
          wtVal: 'C',
          otherChgs: 'C',
          departure: 'ICN',
          arrival: 'LAX',
          flightNo: 'KE001',
          flightDate: '2026-01-27',
          status: 'CONFIRMED',
        });
        setCargoData({
          ...initialCargoData,
          cargoItems: [
            {
              id: 'CARGO-1',
              piecesRcp: 100,
              grossWeight: 500.5,
              weightUnit: 'K',
              rateClass: 'GCR',
              chargeableWeight: 600,
              rateCharge: 2.5,
              total: 1500,
              asArranged: false,
            },
          ],
          natureOfGoods: 'ELECTRONIC PARTS\nFREIGHT PREPAID',
          totalPcs: 100,
          totalVolume: 3.5,
        });
        setOtherData({
          ...initialOtherData,
          agentCode: 'AGT001',
          agentName: 'ABC LOGISTICS',
          partnerCode: 'PTN001',
          partnerName: 'LAX PARTNER INC',
          airlineCode: 'KE',
          airlineName: 'KOREAN AIR',
          lcNo: 'LC2026001',
          poNo: 'PO2026001',
          createdAt: '2026-01-20 10:30:00',
          updatedAt: '2026-01-25 15:45:00',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [awbId]);

  // 목록으로
  const handleList = () => {
    router.push('/logis/bl/air');
  };

  // 수정 화면으로
  const handleEdit = () => {
    router.push(`/logis/bl/air/register?id=${awbId}`);
  };

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

  // 읽기 전용 입력 필드
  const ReadOnlyField = ({ label, value, required = false }: { label: string; value: string | number; required?: boolean }) => (
    <div>
      <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-sm min-h-[38px] flex items-center">
        {value || '-'}
      </div>
    </div>
  );

  // 읽기 전용 텍스트 영역
  const ReadOnlyTextArea = ({ label, value, rows = 3 }: { label: string; value: string; rows?: number }) => (
    <div>
      <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">{label}</label>
      <div
        className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-sm whitespace-pre-wrap"
        style={{ minHeight: `${rows * 24 + 16}px` }}
      >
        {value || '-'}
      </div>
    </div>
  );

  // MAIN TAB 렌더링
  const renderMainTab = () => (
    <div className="space-y-6">
      {/* Main Information */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="font-bold">Main Information</h3>
          </div>
          <StatusBadge status={mainData.status} />
        </div>
        <div className="p-4">
          <div className="grid grid-cols-6 gap-4 mb-4">
            <ReadOnlyField label="수출입구분" value={mainData.ioType === 'OUT' ? '수출(OUT)' : '수입(IN)'} required />
            <ReadOnlyField label="JOB NO" value={mainData.jobNo} />
            <ReadOnlyField label="BOOKING NO" value={mainData.bookingNo} />
            <ReadOnlyField label="통화종류" value={mainData.currencyCode} />
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">WT/VAL</label>
              <div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-sm">
                {mainData.wtVal === 'P' ? 'Prepaid' : mainData.wtVal === 'C' ? 'Collect' : '-'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">OTHER</label>
              <div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-sm">
                {mainData.otherChgs === 'P' ? 'Prepaid' : mainData.otherChgs === 'C' ? 'Collect' : '-'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-4 mb-4">
            <div className="col-span-2">
              <ReadOnlyField label="MAWB NO" value={mainData.mawbNo} />
            </div>
            <div className="col-span-2">
              <ReadOnlyField label="HAWB NO" value={mainData.hawbNo} required />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ACCOUNT INFORMATION</label>
              <div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-sm">
                {mainData.wtVal === 'P' ? 'Freight Prepaid' : 'Freight Collect'}
              </div>
            </div>
          </div>

          {/* Shipper / Consignee / Notify */}
          <div className="grid grid-cols-3 gap-4">
            {/* SHIPPER */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">SHIPPER</label>
              <div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-sm mb-2">
                {mainData.shipperCode ? `[${mainData.shipperCode}] ` : ''}{mainData.shipperName || '-'}
              </div>
              <ReadOnlyTextArea label="" value={mainData.shipperAddress} />
            </div>
            {/* CONSIGNEE */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">CONSIGNEE</label>
              <div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-sm mb-2">
                {mainData.consigneeCode ? `[${mainData.consigneeCode}] ` : ''}{mainData.consigneeName || '-'}
              </div>
              <ReadOnlyTextArea label="" value={mainData.consigneeAddress} />
            </div>
            {/* NOTIFY */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">NOTIFY PARTY</label>
              <div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-sm mb-2">
                {mainData.notifyCode ? `[${mainData.notifyCode}] ` : ''}{mainData.notifyName || '-'}
              </div>
              <ReadOnlyTextArea label="" value={mainData.notifyAddress} />
            </div>
          </div>
        </div>
      </div>

      {/* Flight Information */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <h3 className="font-bold">Flight Information</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-6 gap-4">
            <ReadOnlyField label="출발지" value={mainData.departure} />
            <ReadOnlyField label="도착지" value={mainData.arrival} />
            <ReadOnlyField label="Flight No." value={mainData.flightNo} />
            <ReadOnlyField label="Flight Date" value={mainData.flightDate} />
            <div className="col-span-2">
              <ReadOnlyField label="HANDLING INFORMATION" value={mainData.handlingInfo} />
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
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="text-center">No.</th>
                <th className="text-center">No. of pieces RCP</th>
                <th className="text-center">GrossWeight</th>
                <th className="text-center">Kg/lb</th>
                <th className="text-center">Rate Class</th>
                <th className="text-center">Chargeable Weight</th>
                <th className="text-center">Rate/Charge</th>
                <th className="text-center">Total</th>
                <th className="text-center">As Arranged</th>
              </tr>
            </thead>
            <tbody>
              {cargoData.cargoItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-[var(--muted)] text-sm">
                    Cargo 정보가 없습니다.
                  </td>
                </tr>
              ) : cargoData.cargoItems.map((item, index) => (
                <tr key={item.id} className="border-t border-[var(--border)]">
                  <td className="p-2 text-center text-sm">{index + 1}</td>
                  <td className="p-2 text-center text-sm">{item.piecesRcp.toLocaleString()}</td>
                  <td className="p-2 text-center text-sm">{item.grossWeight.toLocaleString()}</td>
                  <td className="p-2 text-center text-sm">{item.weightUnit === 'K' ? 'Kg' : 'lb'}</td>
                  <td className="p-2 text-center text-sm">{item.rateClass}</td>
                  <td className="p-2 text-center text-sm">{item.chargeableWeight.toLocaleString()}</td>
                  <td className="p-2 text-center text-sm">{formatCurrency(item.rateCharge)}</td>
                  <td className="p-2 text-center text-sm font-medium text-[#E8A838]">{formatCurrency(item.total)}</td>
                  <td className="p-2 text-center text-sm">
                    {item.asArranged ? (
                      <span className="text-green-400">Yes</span>
                    ) : (
                      <span className="text-[var(--muted)]">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Other Charges */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="font-bold">Other Charges</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="text-center">No.</th>
                <th className="text-center">Codes</th>
                <th className="text-center">CUR</th>
                <th className="text-center">Rate</th>
                <th className="text-center">Amount</th>
                <th className="text-center">P/C</th>
                <th className="text-center">A/C</th>
              </tr>
            </thead>
            <tbody>
              {cargoData.otherCharges.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-[var(--muted)] text-sm">
                    운임 정보가 없습니다.
                  </td>
                </tr>
              ) : cargoData.otherCharges.map((charge, index) => (
                <tr key={charge.id} className="border-t border-[var(--border)]">
                  <td className="p-2 text-center text-sm">{index + 1}</td>
                  <td className="p-2 text-center text-sm">{charge.codes}</td>
                  <td className="p-2 text-center text-sm">{charge.currency}</td>
                  <td className="p-2 text-center text-sm">{formatCurrency(charge.rate)}</td>
                  <td className="p-2 text-center text-sm font-medium text-[#E8A838]">{formatCurrency(charge.amount)}</td>
                  <td className="p-2 text-center text-sm">{charge.pc}</td>
                  <td className="p-2 text-center text-sm">{charge.ac}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Information */}
      <div className="card">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="font-bold">Additional Information</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Nature and Quantity of Goods */}
            <ReadOnlyTextArea label="Nature and Quantity of Goods" value={cargoData.natureOfGoods} rows={4} />
            {/* Dimensions */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Dimensions</label>
              <div className="p-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-[var(--muted)]">Total PCS:</span>
                    <span className="ml-2 font-medium">{cargoData.totalPcs.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[var(--muted)]">Total Volume:</span>
                    <span className="ml-2 font-medium">{cargoData.totalVolume.toFixed(3)} CBM</span>
                  </div>
                </div>
                {cargoData.dimensions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[var(--border)]">
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          <th className="p-1 text-center">W(cm)</th>
                          <th className="p-1 text-center">L(cm)</th>
                          <th className="p-1 text-center">H(cm)</th>
                          <th className="p-1 text-center">PCS</th>
                          <th className="p-1 text-center">Vol</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cargoData.dimensions.map((dim) => (
                          <tr key={dim.id}>
                            <td className="p-1 text-center">{dim.width}</td>
                            <td className="p-1 text-center">{dim.length}</td>
                            <td className="p-1 text-center">{dim.height}</td>
                            <td className="p-1 text-center">{dim.pcs}</td>
                            <td className="p-1 text-center">{dim.volume.toFixed(3)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <ReadOnlyField label="Weight Charge" value={formatCurrency(cargoData.weightCharge)} />
            <ReadOnlyField label="At(Place)" value={cargoData.atPlace} />
            <div className="col-span-2">
              <ReadOnlyField label="Signature of Issuing Carrier" value={cargoData.signatureCarrier} />
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
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Agent</label>
              <div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-sm">
                {otherData.agentCode ? `[${otherData.agentCode}] ` : ''}{otherData.agentName || '-'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Sub Agent</label>
              <div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-sm">
                {otherData.subAgentCode ? `[${otherData.subAgentCode}] ` : ''}{otherData.subAgentName || '-'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Partner</label>
              <div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-sm">
                {otherData.partnerCode ? `[${otherData.partnerCode}] ` : ''}{otherData.partnerName || '-'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">항공사</label>
              <div className="px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-sm">
                {otherData.airlineCode ? `[${otherData.airlineCode}] ` : ''}{otherData.airlineName || '-'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <ReadOnlyField label="지역" value={otherData.regionCode} />
            <ReadOnlyField label="국가" value={otherData.countryCode} />
            <ReadOnlyField label="MRN NO" value={otherData.mrnNo} />
            <ReadOnlyField label="MSN" value={otherData.msn} />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <ReadOnlyField label="L/C NO" value={otherData.lcNo} />
            <ReadOnlyField label="P/O NO" value={otherData.poNo} />
            <ReadOnlyField label="최초등록일" value={otherData.createdAt} />
            <ReadOnlyField label="최종수정일" value={otherData.updatedAt} />
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#E8A838] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--muted)]">Loading...</p>
        </div>
      </div>
  );
}

  return (
    <PageLayout
      title="AWB 상세조회 (항공)"
      subtitle="HOME > 선적관리 > B/L 관리(항공) > AWB 상세조회"
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
                onClick={handleEdit}
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] font-medium"
              >
                수정
              </button>
              <button
                className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)] font-medium"
                onClick={() => alert('AWB 출력 기능')}
              >
                AWB 출력
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
    </PageLayout>
  );
}
