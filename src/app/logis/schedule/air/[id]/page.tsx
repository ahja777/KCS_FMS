'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { LIST_PATHS } from '@/constants/paths';

interface AirScheduleDetailData {
  scheduleNo: string;
  airline: string;
  flightNo: string;
  aircraftType: string;
  origin: string;
  destination: string;
  via: string;
  etd: string;
  etdTime: string;
  eta: string;
  etaTime: string;
  atd: string;
  atdTime: string;
  ata: string;
  ataTime: string;
  transitTime: string;
  frequency: string;
  cutOffDate: string;
  cutOffTime: string;
  spaceKg: number;
  spaceCbm: number;
  bookedKg: number;
  bookedCbm: number;
  rateMin: number;
  rateNormal: number;
  rate45: number;
  rate100: number;
  rate300: number;
  rate500: number;
  status: string;
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

interface BookingItem {
  id: number;
  bookingNo: string;
  shipper: string;
  commodity: string;
  pieces: number;
  grossWeight: number;
  chargeWeight: number;
  status: string;
  createdAt: string;
}

const mockScheduleData: AirScheduleDetailData = {
  scheduleNo: 'AS-2026-0001',
  airline: 'KE',
  flightNo: 'KE001',
  aircraftType: 'B747-8F',
  origin: 'ICN',
  destination: 'LAX',
  via: '',
  etd: '2026-01-25',
  etdTime: '10:00',
  eta: '2026-01-25',
  etaTime: '08:30',
  atd: '',
  atdTime: '',
  ata: '',
  ataTime: '',
  transitTime: '10h 30m',
  frequency: '매일',
  cutOffDate: '2026-01-24',
  cutOffTime: '18:00',
  spaceKg: 50000,
  spaceCbm: 300,
  bookedKg: 32500,
  bookedCbm: 195,
  rateMin: 50,
  rateNormal: 5.50,
  rate45: 5.20,
  rate100: 4.80,
  rate300: 4.50,
  rate500: 4.20,
  status: 'OPEN',
  remarks: '정기 화물편',
  createdAt: '2026-01-15 09:00:00',
  updatedAt: '2026-01-20 14:30:00',
};

const mockBookings: BookingItem[] = [
  { id: 1, bookingNo: 'AB-2026-0001', shipper: '삼성전자', commodity: '전자제품', pieces: 50, grossWeight: 5000, chargeWeight: 5500, status: '확정', createdAt: '2026-01-16' },
  { id: 2, bookingNo: 'AB-2026-0002', shipper: 'LG전자', commodity: '디스플레이', pieces: 30, grossWeight: 3200, chargeWeight: 3500, status: '확정', createdAt: '2026-01-17' },
  { id: 3, bookingNo: 'AB-2026-0003', shipper: '현대자동차', commodity: '자동차부품', pieces: 100, grossWeight: 8000, chargeWeight: 8000, status: '대기', createdAt: '2026-01-18' },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  OPEN: { label: '부킹가능', color: 'bg-green-500' },
  LIMITED: { label: '잔여공간', color: 'bg-yellow-500' },
  FULL: { label: '만석', color: 'bg-red-500' },
  CLOSED: { label: '마감', color: 'bg-gray-500' },
};

export default function AirScheduleDetailPage() {
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const params = useParams();
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [data, setData] = useState<AirScheduleDetailData | null>(null);
  const [bookings] = useState<BookingItem[]>(mockBookings);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<AirScheduleDetailData | null>(null);

  useEffect(() => {
    setData(mockScheduleData);
    setEditData(mockScheduleData);
  }, [params.id]);

  const handleEdit = () => router.push(`/logis/schedule/air/register?id=${params.id}`);
  const handleCancel = () => { setIsEditing(false); setEditData(data); };
  const handleSave = () => {
    if (editData) {
      setData(editData);
      setIsEditing(false);
      alert('스케줄이 수정되었습니다.');
    }
  };

  const handleChange = (field: keyof AirScheduleDetailData, value: string | number) => {
    if (editData) setEditData({ ...editData, [field]: value });
  };

  const handleDelete = () => {
    if (confirm('이 스케줄을 삭제하시겠습니까?')) {
      alert('스케줄이 삭제되었습니다.');
      router.push('/logis/schedule/air');
    }
  };

  if (!data) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">로딩 중...</div>;

  const displayData = isEditing ? editData! : data;
  const usageKg = ((displayData.bookedKg / displayData.spaceKg) * 100).toFixed(1);
  const usageCbm = ((displayData.bookedCbm / displayData.spaceCbm) * 100).toFixed(1);

  const handleCloseClick = () => {
    setShowCloseModal(true);
  };

  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.push(LIST_PATHS.SCHEDULE_AIR);
  };

  // 브라우저 뒤로가기 버튼 처리
  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  return (
        <PageLayout title="스케줄 상세조회 (항공)" subtitle="Logis > 스케줄관리 > 스케줄 상세조회 (항공)" onClose={handleCloseClick} >
        <main ref={formRef} className="p-6">
          <div className="flex justify-end items-center mb-6">
            <div className="flex gap-2">
              <button onClick={() => router.push('/logis/schedule/air')} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">목록</button>
              {isEditing ? (
                <>
                  <button onClick={handleCancel} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">취소</button>
                  <button onClick={handleSave} className="px-6 py-2 bg-[var(--surface-100)] text-[var(--foreground)] font-semibold rounded-lg hover:bg-[var(--surface-200)]">저장</button>
                </>
              ) : (
                <>
                  <button onClick={handleEdit} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">수정</button>
                  <button onClick={handleDelete} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">삭제</button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">기본 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">스케줄 번호</label><input type="text" value={displayData.scheduleNo} disabled className="w-full h-[38px] px-3 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-[var(--muted)]" /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">상태</label>
                  {isEditing ? (
                    <select value={displayData.status} onChange={e => handleChange('status', e.target.value)} className="w-full h-[38px] px-3 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg">
                      <option value="OPEN">부킹가능</option><option value="LIMITED">잔여공간</option><option value="FULL">만석</option><option value="CLOSED">마감</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2"><span className={`px-2 py-1 text-xs rounded-full text-white ${statusConfig[displayData.status]?.color}`}>{statusConfig[displayData.status]?.label}</span></div>
                  )}
                </div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">항공사</label><input type="text" value={displayData.airline === 'KE' ? '대한항공 (KE)' : displayData.airline} disabled={!isEditing} onChange={e => handleChange('airline', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">편명</label><input type="text" value={displayData.flightNo} disabled={!isEditing} onChange={e => handleChange('flightNo', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">기종</label><input type="text" value={displayData.aircraftType} disabled={!isEditing} onChange={e => handleChange('aircraftType', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">운항주기</label><input type="text" value={displayData.frequency} disabled={!isEditing} onChange={e => handleChange('frequency', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">구간/일정 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">출발지</label><input type="text" value={displayData.origin} disabled={!isEditing} onChange={e => handleChange('origin', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">도착지</label><input type="text" value={displayData.destination} disabled={!isEditing} onChange={e => handleChange('destination', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETD 일자</label><input type="date" value={displayData.etd} disabled={!isEditing} onChange={e => handleChange('etd', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETD 시간</label><input type="time" value={displayData.etdTime} disabled={!isEditing} onChange={e => handleChange('etdTime', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETA 일자</label><input type="date" value={displayData.eta} disabled={!isEditing} onChange={e => handleChange('eta', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETA 시간</label><input type="time" value={displayData.etaTime} disabled={!isEditing} onChange={e => handleChange('etaTime', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ATD (실제출발)</label><input type="date" value={displayData.atd} disabled={!isEditing} onChange={e => handleChange('atd', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ATA (실제도착)</label><input type="date" value={displayData.ata} disabled={!isEditing} onChange={e => handleChange('ata', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">Space 현황</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-[var(--surface-50)] rounded-lg">
                  <div className="text-sm text-[var(--muted)] mb-2">중량 (KG)</div>
                  <div className="text-2xl font-bold">{displayData.bookedKg.toLocaleString()} / {displayData.spaceKg.toLocaleString()}</div>
                  <div className="mt-2 h-2 bg-[var(--surface-100)] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${usageKg}%` }} />
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-1">사용률: {usageKg}% | 잔여: {(displayData.spaceKg - displayData.bookedKg).toLocaleString()} KG</div>
                </div>
                <div className="p-4 bg-[var(--surface-50)] rounded-lg">
                  <div className="text-sm text-[var(--muted)] mb-2">용적 (CBM)</div>
                  <div className="text-2xl font-bold">{displayData.bookedCbm} / {displayData.spaceCbm}</div>
                  <div className="mt-2 h-2 bg-[var(--surface-100)] rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${usageCbm}%` }} />
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-1">사용률: {usageCbm}% | 잔여: {displayData.spaceCbm - displayData.bookedCbm} CBM</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Cut-Off 일자</label><input type="date" value={displayData.cutOffDate} disabled={!isEditing} onChange={e => handleChange('cutOffDate', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Cut-Off 시간</label><input type="time" value={displayData.cutOffTime} disabled={!isEditing} onChange={e => handleChange('cutOffTime', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">운임 정보 ($/KG)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-[var(--surface-50)] rounded-lg"><div className="text-sm text-[var(--muted)]">Minimum</div><div className="text-lg font-bold">${displayData.rateMin}</div></div>
                <div className="text-center p-3 bg-[var(--surface-50)] rounded-lg"><div className="text-sm text-[var(--muted)]">Normal</div><div className="text-lg font-bold">${displayData.rateNormal}</div></div>
                <div className="text-center p-3 bg-[var(--surface-50)] rounded-lg"><div className="text-sm text-[var(--muted)]">+45KG</div><div className="text-lg font-bold">${displayData.rate45}</div></div>
                <div className="text-center p-3 bg-[var(--surface-50)] rounded-lg"><div className="text-sm text-[var(--muted)]">+100KG</div><div className="text-lg font-bold">${displayData.rate100}</div></div>
                <div className="text-center p-3 bg-[var(--surface-50)] rounded-lg"><div className="text-sm text-[var(--muted)]">+300KG</div><div className="text-lg font-bold">${displayData.rate300}</div></div>
                <div className="text-center p-3 bg-[var(--surface-50)] rounded-lg"><div className="text-sm text-[var(--muted)]">+500KG</div><div className="text-lg font-bold">${displayData.rate500}</div></div>
              </div>
              <div className="mt-4"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">비고</label><input type="text" value={displayData.remarks} disabled={!isEditing} onChange={e => handleChange('remarks', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">연결된 부킹 목록</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>부킹번호</th>
                  <th>화주</th>
                  <th>품명</th>
                  <th>PCS</th>
                  <th>G/W (KG)</th>
                  <th>C/W (KG)</th>
                  <th>상태</th>
                  <th>등록일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {bookings.map(booking => (
                  <tr key={booking.id} className="hover:bg-[var(--surface-50)]">
                    <td className="px-4 py-3 text-blue-400 hover:underline cursor-pointer">{booking.bookingNo}</td>
                    <td className="px-4 py-3">{booking.shipper}</td>
                    <td className="px-4 py-3">{booking.commodity}</td>
                    <td className="px-4 py-3">{booking.pieces}</td>
                    <td className="px-4 py-3">{booking.grossWeight.toLocaleString()}</td>
                    <td className="px-4 py-3">{booking.chargeWeight.toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full text-white ${booking.status === '확정' ? 'bg-green-500' : 'bg-yellow-500'}`}>{booking.status}</span></td>
                    <td className="px-4 py-3">{booking.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-[var(--muted)]">
            <span>등록일: {data.createdAt}</span>
            <span className="ml-4">수정일: {data.updatedAt}</span>
          </div>
        </main>
      {/* 화면 닫기 확인 모달 */}
      <CloseConfirmModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onConfirm={handleConfirmClose}
      />
    </PageLayout>
  );
}
