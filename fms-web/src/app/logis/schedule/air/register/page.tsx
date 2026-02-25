'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { useScreenClose } from '@/hooks/useScreenClose';
import { LIST_PATHS } from '@/constants/paths';
import { getToday } from '@/components/DateRangeButtons';
import {
  CodeSearchModal,
  AirlineCodeModal,
  LocationCodeModal,
  type CodeItem,
  type CodeType,
  type LocationItem,
  type AirlineItem,
} from '@/components/popup';
import SearchIconButton from '@/components/SearchIconButton';

interface AirScheduleFormData {
  scheduleNo: string;
  airline: string;
  flightNo: string;
  aircraftType: string;
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  via: string;
  viaName: string;
  etd: string;
  etdTime: string;
  eta: string;
  etaTime: string;
  transitTime: string;
  frequency: string;
  cutOffDate: string;
  cutOffTime: string;
  spaceKg: number;
  spaceCbm: number;
  rateMin: number;
  rateNormal: number;
  rate45: number;
  rate100: number;
  rate300: number;
  rate500: number;
  status: string;
  remarks: string;
}

const initialFormData: AirScheduleFormData = {
  scheduleNo: '자동생성',
  airline: '',
  flightNo: '',
  aircraftType: '',
  origin: 'ICN',
  originName: '',
  destination: '',
  destinationName: '',
  via: '',
  viaName: '',
  etd: getToday(),
  etdTime: '',
  eta: '',
  etaTime: '',
  transitTime: '',
  frequency: '',
  cutOffDate: getToday(),
  cutOffTime: '18:00',
  spaceKg: 0,
  spaceCbm: 0,
  rateMin: 0,
  rateNormal: 0,
  rate45: 0,
  rate100: 0,
  rate300: 0,
  rate500: 0,
  status: 'OPEN',
  remarks: '',
};

function AirScheduleRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const formRef = useRef<HTMLDivElement>(null);
  useEnterNavigation({ containerRef: formRef as React.RefObject<HTMLElement> });


  // useScreenClose 훅
  const {
    showModal: showCloseModal,
    handleCloseClick,
    handleModalClose,
    handleDiscard: handleDiscardChanges,
  } = useScreenClose({
    hasChanges: false,  // 이 페이지는 변경사항 추적 없음
    listPath: LIST_PATHS.SCHEDULE_AIR,
  });

  const [formData, setFormData] = useState<AirScheduleFormData>(initialFormData);
  const [isNewMode, setIsNewMode] = useState(true); // 신규 입력 모드 (신규버튼 비활성화 제어)
  const [isLoading, setIsLoading] = useState(false);

  // 수정 모드: 데이터 로드
  useEffect(() => {
    if (!editId) return;
    const fetchSchedule = async () => {
      try {
        const res = await fetch(`/api/schedule/air?scheduleId=${editId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data && !data.error) {
          setFormData({
            scheduleNo: String(data.id || '자동생성'),
            airline: data.carrierName || '',
            flightNo: data.flightNo || '',
            aircraftType: data.aircraftType || '',
            origin: data.origin || 'ICN',
            destination: data.destination || '',
            via: '',
            etd: data.etd ? data.etd.substring(0, 10) : '',
            etdTime: data.etd && data.etd.length > 10 ? data.etd.substring(11, 16) : '',
            eta: data.eta ? data.eta.substring(0, 10) : '',
            etaTime: data.eta && data.eta.length > 10 ? data.eta.substring(11, 16) : '',
            transitTime: data.transitHours ? `${data.transitHours}h` : '',
            frequency: data.frequency || '',
            cutOffDate: '',
            cutOffTime: '18:00',
            spaceKg: 0,
            spaceCbm: 0,
            rateMin: 0,
            rateNormal: 0,
            rate45: 0,
            rate100: 0,
            rate300: 0,
            rate500: 0,
            status: data.status || 'OPEN',
            remarks: data.remark || '',
          });
          setIsNewMode(false);
        }
      } catch (error) {
        console.error('항공 스케줄 데이터 조회 실패:', error);
      }
    };
    fetchSchedule();
  }, [editId]);

  // 코드/위치 검색 팝업 상태
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showAirlineModal, setShowAirlineModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentField, setCurrentField] = useState<string>('');
  const [currentCodeType, setCurrentCodeType] = useState<CodeType>('customer');

  const handleChange = (field: keyof AirScheduleFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  
  // 코드 검색 버튼 클릭
  const handleCodeSearch = (field: string, codeType: CodeType) => {
    setCurrentField(field);
    setCurrentCodeType(codeType);
    setShowCodeModal(true);
  };

  // 코드 선택 완료
  const handleCodeSelect = (item: CodeItem) => {
    if (currentField === 'airline') {
      setFormData(prev => ({ ...prev, airline: item.code }));
    }
    setShowCodeModal(false);
  };

  // 항공사 검색 버튼 클릭
  const handleAirlineSearch = () => {
    setShowAirlineModal(true);
  };

  // 항공사 선택 완료
  const handleAirlineSelect = (item: AirlineItem) => {
    setFormData(prev => ({ ...prev, airline: item.code }));
    setShowAirlineModal(false);
  };

  // 위치 검색 버튼 클릭
  const handleLocationSearch = (field: string) => {
    setCurrentField(field);
    setShowLocationModal(true);
  };

  // 위치 선택 완료
  const handleLocationSelect = (item: LocationItem) => {
    setFormData(prev => ({ ...prev, [currentField]: item.code, [currentField + 'Name']: item.nameEn || item.nameKr || '' }));
    setShowLocationModal(false);
  };

  const handleSubmit = async () => {
    if (!formData.airline) { alert('항공사를 선택하세요.'); return; }
    if (!formData.flightNo) { alert('편명을 입력하세요.'); return; }
    if (!formData.etd) { alert('ETD를 입력하세요.'); return; }

    setIsLoading(true);
    try {
      const etdDateTime = formData.etd && formData.etdTime
        ? `${formData.etd} ${formData.etdTime}`
        : formData.etd || null;
      const etaDateTime = formData.eta && formData.etaTime
        ? `${formData.eta} ${formData.etaTime}`
        : formData.eta || null;

      const isEdit = !!editId;
      const response = await fetch('/api/schedule/air', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isEdit ? { id: parseInt(editId) } : {}),
          carrierId: null,
          flightNo: formData.flightNo,
          origin: formData.origin,
          originTerminal: '',
          destination: formData.destination,
          destTerminal: '',
          etd: etdDateTime,
          eta: etaDateTime,
          aircraftType: formData.aircraftType,
          transitHours: parseFloat(formData.transitTime) || 0,
          frequency: formData.frequency || 'DAILY',
          status: formData.status,
          remark: formData.remarks,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsNewMode(false);
        alert(isEdit ? '항공 스케줄이 수정되었습니다.' : '항공 스케줄이 등록되었습니다.');
        router.push('/logis/schedule/air');
      } else {
        alert(`${isEdit ? '수정' : '등록'} 실패: ${result.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (!confirm('입력한 내용을 모두 초기화하시겠습니까?')) return;
    setFormData(initialFormData);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header title="스케줄 등록 (항공)" subtitle="Logis > 스케줄관리 > 스케줄 등록 (항공)" onClose={handleCloseClick} />
      <main ref={formRef} className="p-6">
          <div className="sticky top-0 z-20 bg-white py-2 -mx-6 px-6 border-b border-gray-200 flex justify-end items-center mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => { setFormData(initialFormData); setIsNewMode(true); }}
                disabled={isNewMode}
                className={`px-4 py-2 rounded-lg ${isNewMode ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-gray-50 text-gray-900 hover:bg-gray-100'}`}
              >신규</button>
              <button onClick={handleReset} className="px-4 py-2 bg-gray-50 text-gray-900 rounded-lg hover:bg-gray-100">초기화</button>
              <button onClick={handleSubmit} disabled={isLoading} className="px-6 py-2 bg-gray-50 text-gray-900 font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-50">{isLoading ? '저장 중...' : '저장'}</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-gray-200">기본 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-gray-900">스케줄 번호</label><input type="text" value={formData.scheduleNo} disabled className="w-full h-[38px] px-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500" /></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">상태</label><select value={formData.status} onChange={e => handleChange('status', e.target.value)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg"><option value="OPEN">부킹가능</option><option value="LIMITED">잔여공간</option><option value="FULL">만석</option><option value="CLOSED">마감</option></select></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">항공사 *</label><div className="flex gap-2"><input type="text" value={formData.airline} onChange={e => handleChange('airline', e.target.value)} className="flex-1 h-[38px] px-3 bg-white border border-gray-200 rounded-lg" placeholder="KE, OZ..." /><SearchIconButton onClick={handleAirlineSearch} /></div></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">편명 *</label><input type="text" value={formData.flightNo} onChange={e => handleChange('flightNo', e.target.value)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" placeholder="KE001" /></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">기종</label><input type="text" value={formData.aircraftType} onChange={e => handleChange('aircraftType', e.target.value)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" placeholder="B747-8F" /></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">운항주기</label><input type="text" value={formData.frequency} onChange={e => handleChange('frequency', e.target.value)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" placeholder="매일, 월수금 등" /></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-gray-200">구간/일정 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-gray-900">출발지 (Origin)</label><div className="flex gap-1"><input type="text" value={formData.origin} onChange={e => handleChange('origin', e.target.value)} className="w-[80px] h-[38px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" /><SearchIconButton onClick={() => handleLocationSearch('origin')} /><input type="text" value={formData.originName} readOnly className="flex-1 h-[38px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500" placeholder="이름" /></div></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">도착지 (Destination)</label><div className="flex gap-1"><input type="text" value={formData.destination} onChange={e => handleChange('destination', e.target.value)} className="w-[80px] h-[38px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" /><SearchIconButton onClick={() => handleLocationSearch('destination')} /><input type="text" value={formData.destinationName} readOnly className="flex-1 h-[38px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500" placeholder="이름" /></div></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-gray-900">경유지 (Via)</label><div className="flex gap-1"><input type="text" value={formData.via} onChange={e => handleChange('via', e.target.value)} className="w-[80px] h-[38px] px-2 bg-white border border-gray-300 rounded text-sm" placeholder="코드" /><SearchIconButton onClick={() => handleLocationSearch('via')} /><input type="text" value={formData.viaName} readOnly className="flex-1 h-[38px] px-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-500" placeholder="이름" /></div></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">ETD 일자 *</label><input type="date" value={formData.etd} onChange={e => handleChange('etd', e.target.value)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">ETD 시간</label><input type="time" value={formData.etdTime} onChange={e => handleChange('etdTime', e.target.value)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">ETA 일자</label><input type="date" value={formData.eta} onChange={e => handleChange('eta', e.target.value)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">ETA 시간</label><input type="time" value={formData.etaTime} onChange={e => handleChange('etaTime', e.target.value)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">Transit Time</label><input type="text" value={formData.transitTime} onChange={e => handleChange('transitTime', e.target.value)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" placeholder="10h 30m" /></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">Cut-Off 일자</label><input type="date" value={formData.cutOffDate} onChange={e => handleChange('cutOffDate', e.target.value)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" /></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-gray-200">Space 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-gray-900">가용 중량 (KG)</label><input type="number" value={formData.spaceKg} onChange={e => handleChange('spaceKg', parseInt(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">가용 용적 (CBM)</label><input type="number" value={formData.spaceCbm} onChange={e => handleChange('spaceCbm', parseInt(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-gray-900">비고</label><input type="text" value={formData.remarks} onChange={e => handleChange('remarks', e.target.value)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" placeholder="특이사항" /></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-gray-200">운임 정보 ($/KG)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-gray-900">Minimum</label><input type="number" step="0.01" value={formData.rateMin} onChange={e => handleChange('rateMin', parseFloat(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">Normal</label><input type="number" step="0.01" value={formData.rateNormal} onChange={e => handleChange('rateNormal', parseFloat(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">+45KG</label><input type="number" step="0.01" value={formData.rate45} onChange={e => handleChange('rate45', parseFloat(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">+100KG</label><input type="number" step="0.01" value={formData.rate100} onChange={e => handleChange('rate100', parseFloat(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">+300KG</label><input type="number" step="0.01" value={formData.rate300} onChange={e => handleChange('rate300', parseFloat(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">+500KG</label><input type="number" step="0.01" value={formData.rate500} onChange={e => handleChange('rate500', parseFloat(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" /></div>
              </div>
            </div>
          </div>
        </main>
      {/* 코드 검색 모달 */}
      <CodeSearchModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        onSelect={handleCodeSelect}
        codeType={currentCodeType}
      />

      {/* 항공사 검색 모달 */}
      <AirlineCodeModal
        isOpen={showAirlineModal}
        onClose={() => setShowAirlineModal(false)}
        onSelect={handleAirlineSelect}
      />

      {/* 위치 검색 모달 */}
      <LocationCodeModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelect={handleLocationSelect}
        type="airport"
      />

    </div>
  );
}

export default function AirScheduleRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
      <AirScheduleRegisterContent />
    </Suspense>
  );
}
