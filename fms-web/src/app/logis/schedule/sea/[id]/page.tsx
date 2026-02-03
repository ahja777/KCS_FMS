'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import CloseConfirmModal from '@/components/CloseConfirmModal';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useCloseConfirm } from '@/hooks/useCloseConfirm';
import { LIST_PATHS } from '@/constants/paths';

interface ScheduleDetailData {
  scheduleNo: string;
  carrier: string;
  vessel: string;
  voyage: string;
  callSign: string;
  pol: string;
  polTerminal: string;
  pod: string;
  podTerminal: string;
  etd: string;
  eta: string;
  atd: string;
  ata: string;
  transitTime: number;
  cutOffDate: string;
  cutOffTime: string;
  docCutOffDate: string;
  docCutOffTime: string;
  vgmCutOff: string;
  serviceType: string;
  space20: number;
  space40: number;
  space40hc: number;
  spaceRF: number;
  booked20: number;
  booked40: number;
  booked40hc: number;
  bookedRF: number;
  status: string;
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

interface BookingItem {
  id: number;
  bookingNo: string;
  shipper: string;
  containerType: string;
  quantity: number;
  status: string;
  createdAt: string;
}

const mockScheduleData: ScheduleDetailData = {
  scheduleNo: 'SCH-2026-0001',
  carrier: 'HMM',
  vessel: 'HMM GDANSK',
  voyage: '001E',
  callSign: 'H9HM',
  pol: 'KRPUS',
  polTerminal: 'HPNT',
  pod: 'USLAX',
  podTerminal: 'APL',
  etd: '2026-01-25',
  eta: '2026-02-12',
  atd: '',
  ata: '',
  transitTime: 18,
  cutOffDate: '2026-01-23',
  cutOffTime: '17:00',
  docCutOffDate: '2026-01-24',
  docCutOffTime: '12:00',
  vgmCutOff: '2026-01-23',
  serviceType: 'DIRECT',
  space20: 200,
  space40: 300,
  space40hc: 500,
  spaceRF: 50,
  booked20: 120,
  booked40: 180,
  booked40hc: 320,
  bookedRF: 30,
  status: 'OPEN',
  remarks: '정기 서비스 스케줄',
  createdAt: '2026-01-15 09:00:00',
  updatedAt: '2026-01-20 14:30:00',
};

const mockBookings: BookingItem[] = [
  { id: 1, bookingNo: 'BK-2026-0001', shipper: '삼성전자', containerType: '40HC', quantity: 5, status: '확정', createdAt: '2026-01-16' },
  { id: 2, bookingNo: 'BK-2026-0002', shipper: 'LG전자', containerType: '40HC', quantity: 3, status: '확정', createdAt: '2026-01-17' },
  { id: 3, bookingNo: 'BK-2026-0003', shipper: '현대자동차', containerType: '20GP', quantity: 10, status: '대기', createdAt: '2026-01-18' },
  { id: 4, bookingNo: 'BK-2026-0004', shipper: 'SK하이닉스', containerType: 'RF', quantity: 2, status: '확정', createdAt: '2026-01-19' },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  OPEN: { label: '부킹가능', color: 'bg-green-500' },
  LIMITED: { label: '잔여공간', color: 'bg-yellow-500' },
  FULL: { label: '만석', color: 'bg-red-500' },
  CLOSED: { label: '마감', color: 'bg-gray-500' },
};

export default function ScheduleDetailPage() {
  const router = useRouter();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const params = useParams();
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });

  const [data, setData] = useState<ScheduleDetailData | null>(null);
  const [bookings] = useState<BookingItem[]>(mockBookings);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ScheduleDetailData | null>(null);

  useEffect(() => {
    // Simulate API call
    setData(mockScheduleData);
    setEditData(mockScheduleData);
  }, [params.id]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(data);
  };

  const handleSave = () => {
    if (editData) {
      setData(editData);
      setIsEditing(false);
      alert('스케줄이 수정되었습니다.');
    }
  };

  const handleChange = (field: keyof ScheduleDetailData, value: string | number) => {
    if (editData) {
      setEditData({ ...editData, [field]: value });
    }
  };

  const handleDelete = () => {
    if (confirm('이 스케줄을 삭제하시겠습니까?')) {
      alert('스케줄이 삭제되었습니다.');
      router.push('/logis/schedule/sea');
    }
  };

  if (!data) {
    return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">로딩 중...</div>;
  }

  const displayData = isEditing ? editData! : data;

  const handleCloseClick = () => {
    setShowCloseModal(true);
  };

  const handleConfirmClose = () => {
    setShowCloseModal(false);
    router.push(LIST_PATHS.SCHEDULE_SEA);
  };

  // 브라우저 뒤로가기 버튼 처리
  useCloseConfirm({
    showModal: showCloseModal,
    setShowModal: setShowCloseModal,
    onConfirmClose: handleConfirmClose,
  });

  return (
        <PageLayout title="스케줄 상세조회 (해상)" subtitle="Logis > 스케줄관리 > 스케줄 상세조회 (해상)" onClose={handleCloseClick} >
        <main ref={formRef} className="p-6">
          <div className="flex justify-end items-center mb-6">
            <div className="flex gap-2">
              <button onClick={() => router.push('/logis/schedule/sea')} className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]">목록</button>
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
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선사</label><input type="text" value={displayData.carrier} disabled={!isEditing} onChange={e => handleChange('carrier', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">서비스 타입</label><input type="text" value={displayData.serviceType} disabled={!isEditing} onChange={e => handleChange('serviceType', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선명</label><input type="text" value={displayData.vessel} disabled={!isEditing} onChange={e => handleChange('vessel', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">항차</label><input type="text" value={displayData.voyage} disabled={!isEditing} onChange={e => handleChange('voyage', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">호출부호</label><input type="text" value={displayData.callSign} disabled={!isEditing} onChange={e => handleChange('callSign', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">구간/일정 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선적항 (POL)</label><input type="text" value={displayData.pol} disabled={!isEditing} onChange={e => handleChange('pol', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">선적터미널</label><input type="text" value={displayData.polTerminal} disabled={!isEditing} onChange={e => handleChange('polTerminal', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">양하항 (POD)</label><input type="text" value={displayData.pod} disabled={!isEditing} onChange={e => handleChange('pod', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">양하터미널</label><input type="text" value={displayData.podTerminal} disabled={!isEditing} onChange={e => handleChange('podTerminal', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETD</label><input type="date" value={displayData.etd} disabled={!isEditing} onChange={e => handleChange('etd', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ETA</label><input type="date" value={displayData.eta} disabled={!isEditing} onChange={e => handleChange('eta', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ATD (실제출항)</label><input type="date" value={displayData.atd} disabled={!isEditing} onChange={e => handleChange('atd', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">ATA (실제도착)</label><input type="date" value={displayData.ata} disabled={!isEditing} onChange={e => handleChange('ata', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">Cut-Off 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Cargo Cut-Off 일자</label><input type="date" value={displayData.cutOffDate} disabled={!isEditing} onChange={e => handleChange('cutOffDate', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Cargo Cut-Off 시간</label><input type="time" value={displayData.cutOffTime} disabled={!isEditing} onChange={e => handleChange('cutOffTime', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Doc Cut-Off 일자</label><input type="date" value={displayData.docCutOffDate} disabled={!isEditing} onChange={e => handleChange('docCutOffDate', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Doc Cut-Off 시간</label><input type="time" value={displayData.docCutOffTime} disabled={!isEditing} onChange={e => handleChange('docCutOffTime', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-[var(--foreground)]">VGM Cut-Off</label><input type="date" value={displayData.vgmCutOff} disabled={!isEditing} onChange={e => handleChange('vgmCutOff', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} /></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">Space 현황 (TEU)</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-[var(--surface-50)] rounded-lg">
                  <div className="text-sm text-[var(--muted)]">20GP</div>
                  <div className="text-lg font-bold">{displayData.booked20} / {displayData.space20}</div>
                  <div className="text-xs text-[var(--muted)]">잔여: {displayData.space20 - displayData.booked20}</div>
                </div>
                <div className="text-center p-3 bg-[var(--surface-50)] rounded-lg">
                  <div className="text-sm text-[var(--muted)]">40GP</div>
                  <div className="text-lg font-bold">{displayData.booked40} / {displayData.space40}</div>
                  <div className="text-xs text-[var(--muted)]">잔여: {displayData.space40 - displayData.booked40}</div>
                </div>
                <div className="text-center p-3 bg-[var(--surface-50)] rounded-lg">
                  <div className="text-sm text-[var(--muted)]">40HC</div>
                  <div className="text-lg font-bold">{displayData.booked40hc} / {displayData.space40hc}</div>
                  <div className="text-xs text-[var(--muted)]">잔여: {displayData.space40hc - displayData.booked40hc}</div>
                </div>
                <div className="text-center p-3 bg-[var(--surface-50)] rounded-lg">
                  <div className="text-sm text-[var(--muted)]">RF</div>
                  <div className="text-lg font-bold">{displayData.bookedRF} / {displayData.spaceRF}</div>
                  <div className="text-xs text-[var(--muted)]">잔여: {displayData.spaceRF - displayData.bookedRF}</div>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">비고</label>
                <input type="text" value={displayData.remarks} disabled={!isEditing} onChange={e => handleChange('remarks', e.target.value)} className={`w-full h-[38px] px-3 border border-[var(--border)] rounded-lg ${isEditing ? 'bg-[var(--surface-50)]' : 'bg-[var(--surface-100)] text-[var(--muted)]'}`} />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-lg mb-4 pb-2 border-b border-[var(--border)]">연결된 부킹 목록</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>부킹번호</th>
                  <th>화주</th>
                  <th>컨테이너 타입</th>
                  <th>수량</th>
                  <th>상태</th>
                  <th>등록일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {bookings.map(booking => (
                  <tr key={booking.id} className="hover:bg-[var(--surface-50)]">
                    <td className="px-4 py-3 text-blue-400 hover:underline cursor-pointer">{booking.bookingNo}</td>
                    <td className="px-4 py-3">{booking.shipper}</td>
                    <td className="px-4 py-3">{booking.containerType}</td>
                    <td className="px-4 py-3">{booking.quantity}</td>
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
