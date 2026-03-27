# -*- coding: utf-8 -*-
import re

# 1. import-bl/sea/arrival - ANSearchModal 연동
arrival_sea_path = 'src/app/logis/import-bl/sea/arrival/page.tsx'
with open(arrival_sea_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Import 추가
if 'ANSearchModal' not in content:
    old_import = "import { useEnterNavigation } from '@/hooks/useEnterNavigation';"
    new_import = """import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { ANSearchModal, type ANItem } from '@/components/popup';"""
    content = content.replace(old_import, new_import)
    
    # State 추가
    old_state = "const [data] = useState<ArrivalData[]>(mockData);"
    new_state = """const [data] = useState<ArrivalData[]>(mockData);
  const [showANModal, setShowANModal] = useState(false);"""
    content = content.replace(old_state, new_state)
    
    # 핸들러 추가
    old_handler = "const handleSearch = () => setAppliedFilters(filters);"
    new_handler = """const handleANSelect = (item: ANItem) => {
    setFilters(prev => ({ ...prev, blNo: item.blNo }));
    setShowANModal(false);
  };

  const handleSearch = () => setAppliedFilters(filters);"""
    content = content.replace(old_handler, new_handler)
    
    # B/L No 입력 필드에 찾기 버튼 추가
    old_bl_field = '''<label className="block text-sm font-medium mb-1 text-[var(--muted)]">B/L No.</label>
                <input type="text" value={filters.blNo} onChange={e => setFilters(prev => ({ ...prev, blNo: e.target.value }))} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="HDMU1234567" />'''
    new_bl_field = '''<label className="block text-sm font-medium mb-1 text-[var(--muted)]">B/L No.</label>
                <div className="flex gap-2">
                  <input type="text" value={filters.blNo} onChange={e => setFilters(prev => ({ ...prev, blNo: e.target.value }))} className="flex-1 px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" placeholder="HDMU1234567" />
                  <button type="button" onClick={() => setShowANModal(true)} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">찾기</button>
                </div>'''
    content = content.replace(old_bl_field, new_bl_field)
    
    # Modal 컴포넌트 추가
    old_closing = '''</main>
      </div>
    </div>
  );
}'''
    new_closing = '''</main>
      </div>

      <ANSearchModal
        isOpen={showANModal}
        onClose={() => setShowANModal(false)}
        onSelect={handleANSelect}
        type="sea"
      />
    </div>
  );
}'''
    content = content.replace(old_closing, new_closing)
    
    with open(arrival_sea_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'✓ {arrival_sea_path} - ANSearchModal 연동 완료')

# 2. console/bl-import - HBLConsoleModal 연동
console_path = 'src/app/logis/console/bl-import/page.tsx'
with open(console_path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'HBLConsoleModal' not in content:
    old_import = "import Header from '@/components/Header';"
    new_import = """import Header from '@/components/Header';
import { HBLConsoleModal, type HBLConsoleItem } from '@/components/popup';"""
    content = content.replace(old_import, new_import)
    
    # State 추가
    old_state = "const [searchMessage, setSearchMessage] = useState<string>('');"
    new_state = """const [searchMessage, setSearchMessage] = useState<string>('');
  const [showHBLModal, setShowHBLModal] = useState(false);"""
    content = content.replace(old_state, new_state)
    
    # 핸들러 추가
    old_handler = "const handleFilterChange = (field: keyof SearchFilters, value: string) => {"
    new_handler = """const handleHBLSelect = (items: HBLConsoleItem[]) => {
    alert(`${items.length}건의 HBL이 선택되었습니다.\n합계 CBM: ${items.reduce((s, i) => s + i.cbm, 0).toFixed(2)}`);
    setShowHBLModal(false);
  };

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {"""
    content = content.replace(old_handler, new_handler)
    
    # HBL 추가 버튼에 onClick 추가
    old_btn = '''<button className="px-4 py-2 bg-[#7C3AED] text-white rounded-lg hover:bg-[#6D28D9]">HBL 추가</button>'''
    new_btn = '''<button onClick={() => setShowHBLModal(true)} className="px-4 py-2 bg-[#7C3AED] text-white rounded-lg hover:bg-[#6D28D9]">HBL 추가</button>'''
    content = content.replace(old_btn, new_btn)
    
    # Modal 컴포넌트 추가
    old_closing = '''</main>
      </div>
    </div>
  );
}'''
    new_closing = '''</main>
      </div>

      <HBLConsoleModal
        isOpen={showHBLModal}
        onClose={() => setShowHBLModal(false)}
        onSelect={handleHBLSelect}
      />
    </div>
  );
}'''
    content = content.replace(old_closing, new_closing)
    
    with open(console_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'✓ {console_path} - HBLConsoleModal 연동 완료')

print('\n팝업 연동 스크립트 완료')
