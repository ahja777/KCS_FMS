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
  LocationCodeModal,
  type CodeItem,
  type CodeType,
  type LocationItem,
} from '@/components/popup';
import SearchIconButton from '@/components/SearchIconButton';

interface Carrier {
  carrier_id: number;
  carrier_cd: string;
  carrier_name: string;
  carrier_type: string;
}

interface ScheduleFormData {
  scheduleNo: string;
  carrierId: number | null;
  carrier: string;
  vessel: string;
  voyage: string;
  callSign: string;
  pol: string;
  polName: string;
  polTerminal: string;
  pod: string;
  podName: string;
  podTerminal: string;
  etd: string;
  eta: string;
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
  status: string;
  remarks: string;
}

const initialFormData: ScheduleFormData = {
  scheduleNo: '자동생성',
  carrierId: null,
  carrier: '',
  vessel: '',
  voyage: '',
  callSign: '',
  pol: 'KRPUS',
  polName: '',
  polTerminal: '',
  pod: '',
  podName: '',
  podTerminal: '',
  etd: getToday(),
  eta: '',
  transitTime: 0,
  cutOffDate: getToday(),
  cutOffTime: '17:00',
  docCutOffDate: getToday(),
  docCutOffTime: '12:00',
  vgmCutOff: '',
  serviceType: 'DIRECT',
  space20: 0,
  space40: 0,
  space40hc: 0,
  spaceRF: 0,
  status: 'OPEN',
  remarks: '',
};

function ScheduleRegisterContent() {
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
    listPath: LIST_PATHS.SCHEDULE_SEA,
  });

  const [formData, setFormData] = useState<ScheduleFormData>(initialFormData);
  const [isNewMode, setIsNewMode] = useState(true); // 신규 입력 모드 (신규버튼 비활성화 제어)
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  // 선사 목록 로드
  useEffect(() => {
    const fetchCarriers = async () => {
      try {
        const response = await fetch('/api/carriers');
        if (response.ok) {
          const data = await response.json();
          // 해상 선사만 필터링
          setCarriers(data.filter((c: Carrier) => c.carrier_type === 'SEA'));
        }
      } catch (error) {
        console.error('Failed to fetch carriers:', error);
      }
    };
    fetchCarriers();
  }, []);

  // 수정 모드: 데이터 로드
  useEffect(() => {
    if (!editId) return;
    const fetchSchedule = async () => {
      try {
        const res = await fetch(`/api/schedule/sea?scheduleId=${editId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data && !data.error) {
          setFormData({
            scheduleNo: String(data.id || '자동생성'),
            carrierId: data.carrierId ? parseInt(data.carrierId) : null,
            carrier: data.carrierName || '',
            vessel: data.vesselName || '',
            voyage: data.voyageNo || '',
            callSign: data.callSign || '',
            pol: data.pol || 'KRPUS',
            polName: data.polName || '',
            polTerminal: data.polTerminal || '',
            pod: data.pod || '',
            podName: data.podName || '',
            podTerminal: data.podTerminal || '',
            etd: data.etd ? data.etd.substring(0, 10) : '',
            eta: data.eta ? data.eta.substring(0, 10) : '',
            transitTime: data.transitDays || 0,
            cutOffDate: data.cutOff ? data.cutOff.substring(0, 10) : '',
            cutOffTime: data.cutOff ? data.cutOff.substring(11, 16) : '17:00',
            docCutOffDate: data.cargoCutOff ? data.cargoCutOff.substring(0, 10) : '',
            docCutOffTime: data.cargoCutOff ? data.cargoCutOff.substring(11, 16) : '12:00',
            vgmCutOff: '',
            serviceType: data.frequency || 'DIRECT',
            space20: 0,
            space40: 0,
            space40hc: 0,
            spaceRF: 0,
            status: data.status || 'OPEN',
            remarks: data.remark || '',
          });
          setIsNewMode(false);
        }
      } catch (error) {
        console.error('스케줄 데이터 조회 실패:', error);
      }
    };
    fetchSchedule();
  }, [editId]);

  // 코드/위치 검색 팝업 상태
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentField, setCurrentField] = useState<string>('');
  const [currentCodeType, setCurrentCodeType] = useState<CodeType>('customer');

  const handleChange = (field: keyof ScheduleFormData, value: string | number) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'etd' && newData.eta) {
        const etd = new Date(newData.etd);
        const eta = new Date(newData.eta);
        newData.transitTime = Math.ceil((eta.getTime() - etd.getTime()) / (1000 * 60 * 60 * 24));
      }
      return newData;
    });
  };

  
  // 코드 검색 버튼 클릭
  const handleCodeSearch = (field: string, codeType: CodeType) => {
    setCurrentField(field);
    setCurrentCodeType(codeType);
    setShowCodeModal(true);
  };

  // 코드 선택 완료
  const handleCodeSelect = (item: CodeItem) => {
    setFormData(prev => ({ ...prev, [currentField]: item.code }));
    setShowCodeModal(false);
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
    // 필수값 검증
    const errors: Record<string, boolean> = {};
    if (!formData.carrierId) errors.carrierId = true;
    if (!formData.vessel) errors.vessel = true;
    if (!formData.etd) errors.etd = true;

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      const errorMessages: string[] = [];
      if (errors.carrierId) errorMessages.push('선사');
      if (errors.vessel) errorMessages.push('선명');
      if (errors.etd) errorMessages.push('ETD');
      alert('필수 입력 항목을 확인하세요: ' + errorMessages.join(', '));
      return;
    }

    setIsLoading(true);
    try {
      const cutOffDateTime = formData.cutOffDate && formData.cutOffTime
        ? `${formData.cutOffDate} ${formData.cutOffTime}`
        : null;
      const docCutOffDateTime = formData.docCutOffDate && formData.docCutOffTime
        ? `${formData.docCutOffDate} ${formData.docCutOffTime}`
        : null;

      const isEdit = !!editId;
      const response = await fetch('/api/schedule/sea', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isEdit ? { id: parseInt(editId) } : {}),
          carrierId: formData.carrierId,
          vesselName: formData.vessel,
          voyageNo: formData.voyage,
          pol: formData.pol,
          polTerminal: formData.polTerminal,
          pod: formData.pod,
          podTerminal: formData.podTerminal,
          etd: formData.etd || null,
          eta: formData.eta || null,
          cutOff: cutOffDateTime,
          cargoCutOff: docCutOffDateTime,
          transitDays: formData.transitTime,
          frequency: 'WEEKLY',
          status: formData.status,
          remark: formData.remarks,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsNewMode(false);
        alert(isEdit ? '스케줄이 수정되었습니다.' : '스케줄이 등록되었습니다.');
        router.push('/logis/schedule/sea');
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
      <Header title="스케줄 등록 (해상)" subtitle="Logis > 스케줄관리 > 스케줄 등록 (해상)" onClose={handleCloseClick} />
      <main ref={formRef} className="p-6">
          <div className="sticky top-0 z-20 bg-white py-2 border-b border-gray-200 flex justify-end items-center mb-6">
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
                <div><label className="block text-sm font-medium mb-1 text-gray-900">선사 <span className="text-red-500">*</span></label><select value={formData.carrierId || ''} onChange={e => {
                  const selectedId = e.target.value ? parseInt(e.target.value) : null;
                  const selectedCarrier = carriers.find(c => c.carrier_id === selectedId);
                  setFormData(prev => ({
                    ...prev,
                    carrierId: selectedId,
                    carrier: selectedCarrier?.carrier_name || ''
                  }));
                  setValidationErrors(prev => ({ ...prev, carrierId: false }));
                }} className={`w-full h-[38px] px-3 bg-white border rounded-lg ${validationErrors.carrierId ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'}`}><option value="">선택</option>{carriers.map(c => (<option key={c.carrier_id} value={c.carrier_id}>{c.carrier_name}</option>))}</select></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">서비스 타입</label><select value={formData.serviceType} onChange={e => handleChange('serviceType', e.target.value)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg"><option value="DIRECT">DIRECT</option><option value="T/S">T/S (환적)</option><option value="FEEDER">FEEDER</option></select></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">선명 <span className="text-red-500">*</span></label><input type="text" value={formData.vessel} onChange={e => { handleChange('vessel', e.target.value); setValidationErrors(prev => ({ ...prev, vessel: false })); }} className={`w-full h-[38px] px-3 bg-white border rounded-lg ${validationErrors.vessel ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'}`} placeholder="선박명" /></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">항차</label><input type="text" value={formData.voyage} onChange={e => handleChange('voyage', e.target.value)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" placeholder="001E" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-gray-900">호출부호 (Call Sign)</label><input type="text" value={formData.callSign} onChange={e => handleChange('callSign', e.target.value)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" placeholder="H9HM" /></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-gray-200">구간/일정 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-gray-900">선적항 (POL)</label><div className="flex gap-1"><input type="text" value={formData.pol} onChange={e => handleChange('pol', e.target.value)} className="w-[80px] h-[38px] px-2 bg-white border border-gray-200 rounded text-sm" placeholder="코드" /><SearchIconButton onClick={() => handleLocationSearch('pol')} /><input type="text" value={formData.polName} readOnly className="flex-1 h-[38px] px-2 bg-gray-100 border border-gray-200 rounded text-sm text-gray-500" placeholder="이름" /></div></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">선적터미널</label><input type="text" value={formData.polTerminal} onChange={e => handleChange('polTerminal', e.target.value)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" placeholder="HPNT" /></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">양하항 (POD)</label><div className="flex gap-1"><input type="text" value={formData.pod} onChange={e => handleChange('pod', e.target.value)} className="w-[80px] h-[38px] px-2 bg-white border border-gray-200 rounded text-sm" placeholder="코드" /><SearchIconButton onClick={() => handleLocationSearch('pod')} /><input type="text" value={formData.podName} readOnly className="flex-1 h-[38px] px-2 bg-gray-100 border border-gray-200 rounded text-sm text-gray-500" placeholder="이름" /></div></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">양하터미널</label><input type="text" value={formData.podTerminal} onChange={e => handleChange('podTerminal', e.target.value)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" placeholder="APL" /></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">ETD <span className="text-red-500">*</span></label><input type="date" value={formData.etd} onChange={e => { handleChange('etd', e.target.value); setValidationErrors(prev => ({ ...prev, etd: false })); }} className={`w-full h-[38px] px-3 bg-white border rounded-lg ${validationErrors.etd ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'}`} /></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">ETA</label><input type="date" value={formData.eta} onChange={e => handleChange('eta', e.target.value)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-gray-900">Transit Time (일)</label><input type="number" value={formData.transitTime} onChange={e => handleChange('transitTime', parseInt(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" /></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-gray-200">Cut-Off 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-gray-900">Cargo Cut-Off 일자</label><input type="date" value={formData.cutOffDate} onChange={e => handleChange('cutOffDate', e.target.value)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">Cargo Cut-Off 시간</label><input type="time" value={formData.cutOffTime} onChange={e => handleChange('cutOffTime', e.target.value)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">Doc Cut-Off 일자</label><input type="date" value={formData.docCutOffDate} onChange={e => handleChange('docCutOffDate', e.target.value)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">Doc Cut-Off 시간</label><input type="time" value={formData.docCutOffTime} onChange={e => handleChange('docCutOffTime', e.target.value)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-gray-900">VGM Cut-Off</label><input type="date" value={formData.vgmCutOff} onChange={e => handleChange('vgmCutOff', e.target.value)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" /></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-lg mb-4 pb-2 border-b border-gray-200">Space 정보 (TEU)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 text-gray-900">20GP</label><input type="number" value={formData.space20} onChange={e => handleChange('space20', parseInt(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">40GP</label><input type="number" value={formData.space40} onChange={e => handleChange('space40', parseInt(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">40HC</label><input type="number" value={formData.space40hc} onChange={e => handleChange('space40hc', parseInt(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1 text-gray-900">RF (냉동)</label><input type="number" value={formData.spaceRF} onChange={e => handleChange('spaceRF', parseInt(e.target.value) || 0)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium mb-1 text-gray-900">비고</label><input type="text" value={formData.remarks} onChange={e => handleChange('remarks', e.target.value)} className="w-full h-[38px] px-3 bg-white border border-gray-200 rounded-lg" placeholder="특이사항" /></div>
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

      {/* 위치 검색 모달 */}
      <LocationCodeModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelect={handleLocationSelect}
        type="seaport"
      />

    </div>
  );
}

export default function ScheduleRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
      <ScheduleRegisterContent />
    </Suspense>
  );
}
