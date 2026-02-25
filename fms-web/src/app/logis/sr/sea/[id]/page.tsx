'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { LIST_PATHS } from '@/constants/paths';

interface ContainerData {
  id: number;
  hblNo: string;
  containerNo: string;
  sealNo1: string;
  sealNo2: string;
  sealNo3: string;
  packageQty: number;
  packageUnit: string;
  grossWeight: number;
  volume: number;
  sortSeq: number;
}

interface SRDetailData {
  id: number;
  srNo: string;
  jobNo: string;
  blType: string;
  mblNo: string;
  shipperName: string;
  consigneeName: string;
  notifyParty: string;
  msn: string;
  mrnNo: string;
  lineTo: string;
  fromCd: string;
  bookingId: number | null;
  hblId: number | null;
  pol: string;
  pod: string;
  placeOfReceipt: string;
  placeOfDelivery: string;
  finalDest: string;
  vessel: string;
  voyage: string;
  etd: string;
  eta: string;
  freightTerms: string;
  consolYn: string;
  marksNos: string;
  descriptionText: string;
  packageQty: number;
  packageType: string;
  grossWeight: number;
  volume: number;
  container20Qty: number;
  container40Qty: number;
  inputUser: string;
  branchCd: string;
  cargoReadyDate: string;
  commodityDesc: string;
  status: string;
  remark: string;
  carrier: string;
  createdAt: string;
  containers: ContainerData[];
}

const thClass = 'bg-gray-100 text-right px-3 py-2 text-sm font-medium w-[140px] border border-[var(--border)]';
const tdClass = 'px-3 py-2 text-sm border border-[var(--border)]';
const inputClass = 'w-full h-[32px] px-2 bg-gray-100 text-gray-500 border-0 outline-none text-sm';
const textareaClass = 'w-full px-2 py-1 bg-gray-100 text-gray-500 border-0 outline-none text-sm resize-none';

export default function SRSeaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [data, setData] = useState<SRDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  const handleCloseClick = () => setShowCloseModal(true);
  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.push(LIST_PATHS.SR_SEA);
  };

  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/sr/sea?srId=${params.id}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          setData(null);
        }
      } catch (error) {
        console.error('Failed to fetch SR:', error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--muted)]">로딩 중...</div>
      </div>
    );
  }

  // Not found state
  if (!data) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--muted)] mb-4">S/R을 찾을 수 없습니다.</p>
          <button
            onClick={() => router.push(LIST_PATHS.SR_SEA)}
            className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]"
          >
            목록으로
          </button>
        </div>
      </div>
    );
  }

  // Container totals
  const containers = data.containers || [];
  const totalPackage = containers.reduce((sum, c) => sum + (Number(c.packageQty) || 0), 0);
  const totalGrossWeight = containers.reduce((sum, c) => sum + (Number(c.grossWeight) || 0), 0);
  const totalVolume = containers.reduce((sum, c) => sum + (Number(c.volume) || 0), 0);

  return (
    <PageLayout
      title="S/R 상세조회 (해상)"
      subtitle="Logis > 선적관리 > S/R 상세조회 (해상)"
      onClose={handleCloseClick}
    >
      <main ref={formRef} className="p-6">
        {/* Top buttons */}
        <div className="flex justify-end items-center mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => router.push(LIST_PATHS.SR_SEA)}
              className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
            >
              목록
            </button>
            <button
              onClick={() => router.push(`/logis/sr/sea/register?id=${params.id}`)}
              className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)] font-medium"
            >
              수정
            </button>
          </div>
        </div>

        {/* ===== Main Information ===== */}
        <div className="card mb-6">
          <div className="p-3 border-b border-[var(--border)] bg-[var(--surface-50)]">
            <h3 className="font-bold text-sm">Main Information</h3>
          </div>
          <div className="p-0">
            <table className="w-full border-collapse">
              <tbody>
                {/* Row 1 */}
                <tr>
                  <th className={thClass}>BL TYPE</th>
                  <td className={tdClass}>
                    <input type="text" value={data.blType || ''} disabled className={inputClass} />
                  </td>
                  <th className={thClass}>S/R NO</th>
                  <td className={tdClass}>
                    <input type="text" value={data.srNo || ''} disabled className={inputClass} />
                  </td>
                  <th className={thClass}>등록일자</th>
                  <td className={tdClass}>
                    <input type="text" value={data.createdAt || ''} disabled className={inputClass} />
                  </td>
                </tr>
                {/* Row 2 */}
                <tr>
                  <th className={thClass}>입력사원</th>
                  <td className={tdClass}>
                    <input type="text" value={data.inputUser || ''} disabled className={inputClass} />
                  </td>
                  <th className={thClass}>M B/L NO</th>
                  <td className={tdClass} colSpan={3}>
                    <input type="text" value={data.mblNo || ''} disabled className={inputClass} />
                  </td>
                </tr>
                {/* Row 3 */}
                <tr>
                  <th className={thClass}>SHIPPER</th>
                  <td className={tdClass} colSpan={5}>
                    <input type="text" value={data.shipperName || ''} disabled className={inputClass} />
                  </td>
                </tr>
                {/* Row 4 */}
                <tr>
                  <th className={thClass}>CONSIGNEE</th>
                  <td className={tdClass} colSpan={5}>
                    <input type="text" value={data.consigneeName || ''} disabled className={inputClass} />
                  </td>
                </tr>
                {/* Row 5 */}
                <tr>
                  <th className={thClass}>MSN</th>
                  <td className={tdClass}>
                    <input type="text" value={data.msn || ''} disabled className={inputClass} />
                  </td>
                  <th className={thClass}>MRN NO</th>
                  <td className={tdClass}>
                    <input type="text" value={data.mrnNo || ''} disabled className={inputClass} />
                  </td>
                  <th className={thClass}>LINE TO</th>
                  <td className={tdClass}>
                    <input type="text" value={data.lineTo || ''} disabled className={inputClass} />
                  </td>
                </tr>
                {/* Row 6 */}
                <tr>
                  <th className={thClass}>NOTIFY</th>
                  <td className={tdClass} colSpan={2}>
                    <input type="text" value={data.notifyParty || ''} disabled className={inputClass} />
                  </td>
                  <th className={thClass}>BOOKING NO</th>
                  <td className={tdClass}>
                    <input type="text" value={data.bookingId ? `BK-${data.bookingId}` : ''} disabled className={inputClass} />
                  </td>
                  <th className={thClass} style={{ display: 'none' }}></th>
                  <td className={tdClass} style={{ display: 'none' }}></td>
                </tr>
                {/* Row 7 */}
                <tr>
                  <th className={thClass}>FROM</th>
                  <td className={tdClass}>
                    <input type="text" value={data.fromCd || ''} disabled className={inputClass} />
                  </td>
                  <th className={thClass}>House B/L NO</th>
                  <td className={tdClass} colSpan={3}>
                    <input type="text" value={data.hblId ? String(data.hblId) : ''} disabled className={inputClass} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== Schedule Information ===== */}
        <div className="card mb-6">
          <div className="p-3 border-b border-[var(--border)] bg-[var(--surface-50)]">
            <h3 className="font-bold text-sm">Schedule Information</h3>
          </div>
          <div className="p-0">
            <table className="w-full border-collapse">
              <tbody>
                {/* Row 1 */}
                <tr>
                  <th className={thClass}>Place of Receipt</th>
                  <td className={tdClass}>
                    <input type="text" value={data.placeOfReceipt || ''} disabled className={inputClass} />
                  </td>
                  <th className={thClass}>POL</th>
                  <td className={tdClass}>
                    <input type="text" value={data.pol || ''} disabled className={inputClass} />
                  </td>
                  <th className={thClass}>POD</th>
                  <td className={tdClass}>
                    <input type="text" value={data.pod || ''} disabled className={inputClass} />
                  </td>
                </tr>
                {/* Row 2 */}
                <tr>
                  <th className={thClass}>Place of Delivery</th>
                  <td className={tdClass}>
                    <input type="text" value={data.placeOfDelivery || ''} disabled className={inputClass} />
                  </td>
                  <th className={thClass}>Final Destination</th>
                  <td className={tdClass} colSpan={3}>
                    <input type="text" value={data.finalDest || ''} disabled className={inputClass} />
                  </td>
                </tr>
                {/* Row 3 */}
                <tr>
                  <th className={thClass}>Vessel/Voyage</th>
                  <td className={tdClass}>
                    <input type="text" value={[data.vessel, data.voyage].filter(Boolean).join(' / ') || ''} disabled className={inputClass} />
                  </td>
                  <th className={thClass}>ETD</th>
                  <td className={tdClass}>
                    <input type="text" value={data.etd || ''} disabled className={inputClass} />
                  </td>
                  <th className={thClass}>ETA</th>
                  <td className={tdClass}>
                    <input type="text" value={data.eta || ''} disabled className={inputClass} />
                  </td>
                </tr>
                {/* Row 4 */}
                <tr>
                  <th className={thClass}>Freight Service Term</th>
                  <td className={tdClass}>
                    <input type="text" value={data.freightTerms || ''} disabled className={inputClass} />
                  </td>
                  <th className={thClass}>CONSOL</th>
                  <td className={tdClass} colSpan={3}>
                    <input type="text" value={data.consolYn === 'Y' ? 'Yes' : 'No'} disabled className={inputClass} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== Cargo Information ===== */}
        <div className="card mb-6">
          <div className="p-3 border-b border-[var(--border)] bg-[var(--surface-50)]">
            <h3 className="font-bold text-sm">Cargo Information</h3>
          </div>
          <div className="p-0">
            <table className="w-full border-collapse">
              <tbody>
                {/* Row 1: MARK & Description (tall, pre-formatted) */}
                <tr>
                  <th className={`${thClass} align-top`}>MARK</th>
                  <td className={`${tdClass} align-top`} colSpan={2}>
                    <textarea
                      value={data.marksNos || ''}
                      disabled
                      rows={5}
                      className={textareaClass}
                      style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
                    />
                  </td>
                  <th className={`${thClass} align-top`}>Description</th>
                  <td className={`${tdClass} align-top`} colSpan={2}>
                    <textarea
                      value={data.descriptionText || ''}
                      disabled
                      rows={5}
                      className={textareaClass}
                      style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
                    />
                  </td>
                </tr>
                {/* Row 2 */}
                <tr>
                  <th className={thClass}>Package</th>
                  <td className={tdClass}>
                    <input type="text" value={data.packageType || ''} disabled className={inputClass} />
                  </td>
                  <th className={thClass}>No of Package</th>
                  <td className={tdClass}>
                    <input type="text" value={data.packageQty != null ? Number(data.packageQty).toLocaleString() : ''} disabled className={inputClass} />
                  </td>
                  <th className={thClass}>Gross Weight</th>
                  <td className={tdClass}>
                    <input type="text" value={data.grossWeight != null ? `${Number(data.grossWeight).toLocaleString()} KG` : ''} disabled className={inputClass} />
                  </td>
                </tr>
                {/* Row 3 */}
                <tr>
                  <th className={thClass}>Measurement</th>
                  <td className={tdClass}>
                    <input type="text" value={data.volume != null ? `${Number(data.volume).toLocaleString()} CBM` : ''} disabled className={inputClass} />
                  </td>
                  <th className={thClass}>Container 20</th>
                  <td className={tdClass}>
                    <input
                      type="text"
                      value={
                        data.container20Qty != null
                          ? `${Number(data.container20Qty)} (20DR/20HC/20RF)`
                          : ''
                      }
                      disabled
                      className={inputClass}
                    />
                  </td>
                  <th className={thClass}>Container 40</th>
                  <td className={tdClass}>
                    <input
                      type="text"
                      value={
                        data.container40Qty != null
                          ? `${Number(data.container40Qty)} (40DR/40HC/40RF)`
                          : ''
                      }
                      disabled
                      className={inputClass}
                    />
                  </td>
                </tr>
                {/* Row 4 */}
                <tr>
                  <th className={thClass}>Total Packages in Words</th>
                  <td className={tdClass} colSpan={5}>
                    <input
                      type="text"
                      value={
                        data.packageQty != null && data.packageType
                          ? `${numberToWords(Number(data.packageQty))} ${data.packageType} ONLY`
                          : ''
                      }
                      disabled
                      className={inputClass}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== Container Information ===== */}
        <div className="card mb-6">
          <div className="p-3 border-b border-[var(--border)] bg-[var(--surface-50)]">
            <h3 className="font-bold text-sm">Container Information</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-gray-100 px-3 py-2 text-sm font-medium text-center border border-[var(--border)] w-[50px]">No</th>
                  <th className="bg-gray-100 px-3 py-2 text-sm font-medium text-center border border-[var(--border)]">HBL No</th>
                  <th className="bg-gray-100 px-3 py-2 text-sm font-medium text-center border border-[var(--border)]">Container No</th>
                  <th className="bg-gray-100 px-3 py-2 text-sm font-medium text-center border border-[var(--border)]">Seal 1</th>
                  <th className="bg-gray-100 px-3 py-2 text-sm font-medium text-center border border-[var(--border)]">Seal 2</th>
                  <th className="bg-gray-100 px-3 py-2 text-sm font-medium text-center border border-[var(--border)]">Seal 3</th>
                  <th className="bg-gray-100 px-3 py-2 text-sm font-medium text-center border border-[var(--border)]">Package</th>
                  <th className="bg-gray-100 px-3 py-2 text-sm font-medium text-center border border-[var(--border)]">Unit</th>
                  <th className="bg-gray-100 px-3 py-2 text-sm font-medium text-center border border-[var(--border)]">G.Weight</th>
                  <th className="bg-gray-100 px-3 py-2 text-sm font-medium text-center border border-[var(--border)]">Measurement</th>
                </tr>
              </thead>
              <tbody>
                {containers.length > 0 ? (
                  containers.map((c, index) => (
                    <tr key={c.id || index} className="bg-white">
                      <td className="px-3 py-2 text-sm text-center border border-[var(--border)]">{index + 1}</td>
                      <td className="px-3 py-2 text-sm border border-[var(--border)]">{c.hblNo || '-'}</td>
                      <td className="px-3 py-2 text-sm border border-[var(--border)]">{c.containerNo || '-'}</td>
                      <td className="px-3 py-2 text-sm border border-[var(--border)]">{c.sealNo1 || '-'}</td>
                      <td className="px-3 py-2 text-sm border border-[var(--border)]">{c.sealNo2 || '-'}</td>
                      <td className="px-3 py-2 text-sm border border-[var(--border)]">{c.sealNo3 || '-'}</td>
                      <td className="px-3 py-2 text-sm text-right border border-[var(--border)]">{Number(c.packageQty || 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-sm text-center border border-[var(--border)]">{c.packageUnit || '-'}</td>
                      <td className="px-3 py-2 text-sm text-right border border-[var(--border)]">{Number(c.grossWeight || 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-sm text-right border border-[var(--border)]">{Number(c.volume || 0).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="bg-white">
                    <td colSpan={10} className="px-3 py-4 text-sm text-center text-gray-400 border border-[var(--border)]">
                      컨테이너 정보가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
              {containers.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50 font-medium">
                    <td colSpan={6} className="px-3 py-2 text-sm text-center border border-[var(--border)]">Total</td>
                    <td className="px-3 py-2 text-sm text-right border border-[var(--border)]">{totalPackage.toLocaleString()}</td>
                    <td className="px-3 py-2 text-sm text-center border border-[var(--border)]">-</td>
                    <td className="px-3 py-2 text-sm text-right border border-[var(--border)]">{totalGrossWeight.toLocaleString()}</td>
                    <td className="px-3 py-2 text-sm text-right border border-[var(--border)]">{totalVolume.toLocaleString()}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </main>

      <CloseConfirmModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleConfirmClose}
      />
    </PageLayout>
  );
}

/**
 * Convert a number to English words (simplified for logistics package counts).
 * Handles numbers up to 999,999.
 */
function numberToWords(num: number): string {
  if (num === 0) return 'ZERO';
  if (num < 0) return 'MINUS ' + numberToWords(-num);

  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
    'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  const convertHundreds = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 !== 0 ? ' ' + convertHundreds(n % 100) : '');
  };

  const intNum = Math.floor(num);
  if (intNum >= 1000000) {
    const millions = Math.floor(intNum / 1000000);
    const remainder = intNum % 1000000;
    return convertHundreds(millions) + ' MILLION' + (remainder > 0 ? ' ' + numberToWords(remainder) : '');
  }
  if (intNum >= 1000) {
    const thousands = Math.floor(intNum / 1000);
    const remainder = intNum % 1000;
    return convertHundreds(thousands) + ' THOUSAND' + (remainder > 0 ? ' ' + convertHundreds(remainder) : '');
  }
  return convertHundreds(intNum);
}
