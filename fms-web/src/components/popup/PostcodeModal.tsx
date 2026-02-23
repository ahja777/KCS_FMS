'use client';

import { useState, useMemo } from 'react';

export interface PostcodeItem {
  zipCode: string;
  sido: string;
  sigungu: string;
  roadName: string;
  buildingNo: string;
  address: string;
  addressEn?: string;
}

interface PostcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: PostcodeItem) => void;
}

// 샘플 우편번호 데이터
const samplePostcodes: PostcodeItem[] = [
  { zipCode: '06164', sido: '서울특별시', sigungu: '강남구', roadName: '테헤란로', buildingNo: '152', address: '서울특별시 강남구 테헤란로 152', addressEn: '152, Teheran-ro, Gangnam-gu, Seoul' },
  { zipCode: '06134', sido: '서울특별시', sigungu: '강남구', roadName: '역삼로', buildingNo: '233', address: '서울특별시 강남구 역삼로 233', addressEn: '233, Yeoksam-ro, Gangnam-gu, Seoul' },
  { zipCode: '04522', sido: '서울특별시', sigungu: '중구', roadName: '세종대로', buildingNo: '110', address: '서울특별시 중구 세종대로 110', addressEn: '110, Sejong-daero, Jung-gu, Seoul' },
  { zipCode: '48060', sido: '부산광역시', sigungu: '해운대구', roadName: '센텀중앙로', buildingNo: '97', address: '부산광역시 해운대구 센텀중앙로 97', addressEn: '97, Centum jungang-ro, Haeundae-gu, Busan' },
  { zipCode: '21999', sido: '인천광역시', sigungu: '연수구', roadName: '갯벌로', buildingNo: '12', address: '인천광역시 연수구 갯벌로 12', addressEn: '12, Gaetbeol-ro, Yeonsu-gu, Incheon' },
  { zipCode: '22376', sido: '인천광역시', sigungu: '중구', roadName: '영종대로', buildingNo: '396', address: '인천광역시 중구 영종대로 396', addressEn: '396, Yeongjong-daero, Jung-gu, Incheon' },
  { zipCode: '16677', sido: '경기도', sigungu: '수원시 영통구', roadName: '삼성로', buildingNo: '129', address: '경기도 수원시 영통구 삼성로 129', addressEn: '129, Samsung-ro, Yeongtong-gu, Suwon-si, Gyeonggi-do' },
  { zipCode: '13529', sido: '경기도', sigungu: '성남시 분당구', roadName: '판교역로', buildingNo: '235', address: '경기도 성남시 분당구 판교역로 235', addressEn: '235, Pangyoyeok-ro, Bundang-gu, Seongnam-si, Gyeonggi-do' },
  { zipCode: '41516', sido: '대구광역시', sigungu: '북구', roadName: '호암로', buildingNo: '51', address: '대구광역시 북구 호암로 51', addressEn: '51, Hoam-ro, Buk-gu, Daegu' },
  { zipCode: '61956', sido: '광주광역시', sigungu: '서구', roadName: '상무중앙로', buildingNo: '110', address: '광주광역시 서구 상무중앙로 110', addressEn: '110, Sangmu jungang-ro, Seo-gu, Gwangju' },
];

export default function PostcodeModal({
  isOpen,
  onClose,
  onSelect,
}: PostcodeModalProps) {
  const [sido, setSido] = useState('');
  const [sigungu, setSigungu] = useState('');
  const [roadName, setRoadName] = useState('');
  const [selectedItem, setSelectedItem] = useState<PostcodeItem | null>(null);

  const filteredData = useMemo(() => {
    return samplePostcodes.filter(item => {
      if (sido && !item.sido.includes(sido)) return false;
      if (sigungu && !item.sigungu.includes(sigungu)) return false;
      if (roadName && !item.roadName.includes(roadName) && !item.address.includes(roadName)) return false;
      return true;
    });
  }, [sido, sigungu, roadName]);

  const handleSelect = () => {
    if (selectedItem) {
      onSelect(selectedItem);
      onClose();
    }
  };

  const handleReset = () => {
    setSido('');
    setSigungu('');
    setRoadName('');
    setSelectedItem(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--surface-100)] rounded-lg shadow-xl w-[750px] max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[#1A2744] rounded-t-lg">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            우편번호 조회
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 검색 조건 */}
        <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-100)]">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">시/도</label>
              <input
                type="text"
                value={sido}
                onChange={(e) => setSido(e.target.value)}
                placeholder="예: 서울특별시"
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">시/군/구</label>
              <input
                type="text"
                value={sigungu}
                onChange={(e) => setSigungu(e.target.value)}
                placeholder="예: 강남구"
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">도로명+건물번호</label>
              <input
                type="text"
                value={roadName}
                onChange={(e) => setRoadName(e.target.value)}
                placeholder="예: 테헤란로"
                className="w-full px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--border)] rounded-lg"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={() => {}}
                className="px-4 py-2 text-sm bg-[#1A2744] text-white rounded-lg hover:bg-[#243354]"
              >
                조회
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm bg-[var(--surface-50)] text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-200)]"
              >
                초기화
              </button>
            </div>
          </div>
        </div>

        {/* 목록 */}
        <div className="flex-1 overflow-auto p-4">
          <div className="text-sm text-[var(--muted)] mb-2">
            검색 결과: {filteredData.length}건
          </div>
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-100)]">
                <tr>
                  <th className="p-2 text-center font-medium w-24">우편번호</th>
                  <th className="p-2 text-left font-medium">주소</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="p-8 text-center text-[var(--muted)]">
                      조회된 주소가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr
                      key={item.zipCode + item.address}
                      className={`border-t border-[var(--border)] cursor-pointer ${
                        selectedItem?.zipCode === item.zipCode && selectedItem?.address === item.address ? 'bg-blue-100' : 'bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedItem(item)}
                      onDoubleClick={() => { onSelect(item); onClose(); }}
                    >
                      <td className="p-2 text-center font-mono font-medium text-blue-600">{item.zipCode}</td>
                      <td className="p-2">
                        <div className="font-medium">{item.address}</div>
                        {item.addressEn && (
                          <div className="text-xs text-[var(--muted)]">{item.addressEn}</div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="p-4 border-t border-[var(--border)] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--surface-100)] text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-200)]"
          >
            닫기
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedItem}
            className="px-4 py-2 bg-[#E8A838] text-[#0C1222] font-semibold rounded-lg hover:bg-[#D4943A] disabled:opacity-50"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
