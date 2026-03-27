const fs = require('fs');
const path = 'src/app/logis/booking/sea/register/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Interface에 새 필드 추가
content = content.replace(
  'grossWeight: number;              // Gross Weight(KGS)*\n\n  // Container Pick up Information',
  `grossWeight: number;              // Gross Weight(KGS)*
  volumeCbm: number;                // Volume(CBM)

  // Container Information
  cntr20gpQty: number;
  cntr40gpQty: number;
  cntr40hcQty: number;
  cntr45hcQty: number;
  cntrReeferQty: number;
  cntrOtQty: number;
  cntrFrQty: number;
  totalCntrQty: number;

  // Cut-Off Information
  closingDate: string;
  closingTime: string;
  cargoCutOffDate: string;
  cargoCutOffTime: string;

  // Container Pick up Information`
);

// 2. Initial form data에 새 필드 추가
content = content.replace(
  'grossWeight: 0,\n\n  // Container Pick up Information',
  `grossWeight: 0,
  volumeCbm: 0,

  // Container Information
  cntr20gpQty: 0,
  cntr40gpQty: 0,
  cntr40hcQty: 0,
  cntr45hcQty: 0,
  cntrReeferQty: 0,
  cntrOtQty: 0,
  cntrFrQty: 0,
  totalCntrQty: 0,

  // Cut-Off Information
  closingDate: '',
  closingTime: '17:00',
  cargoCutOffDate: '',
  cargoCutOffTime: '12:00',

  // Container Pick up Information`
);

// 3. handleSave에 새 필드 추가
content = content.replace(
  `commodityDesc: formData.commodity,
          grossWeight: formData.grossWeight,`,
  `commodityDesc: formData.commodity,
          grossWeight: formData.grossWeight,
          volume: formData.volumeCbm,
          cntr20gpQty: formData.cntr20gpQty || 0,
          cntr40gpQty: formData.cntr40gpQty || 0,
          cntr40hcQty: formData.cntr40hcQty || 0,
          totalCntrQty: formData.totalCntrQty || 0,
          closingDate: formData.closingDate || null,
          closingTime: formData.closingTime || null,`
);

// 4. Cargo 섹션 끝 + Container/CutOff 섹션 추가
const cargoSectionEnd = `                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Container Pick up Information`;

const replacementWithNewSections = `                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Volume(CBM)</label>
                <input
                  type="number"
                  value={formData.volumeCbm || ''}
                  onChange={(e) => handleInputChange('volumeCbm', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-right"
                  placeholder="0"
                  min="0"
                  step="0.001"
                />
              </div>
            </div>
          </div>

          {/* Container Information 섹션 */}
          <div className="card mb-6">
            <div className="section-header">
              <h3 className="font-bold text-white">Container Information</h3>
            </div>
            <div className="p-4 grid grid-cols-8 gap-4">
              {[
                { label: '20GP', field: 'cntr20gpQty' },
                { label: '40GP', field: 'cntr40gpQty' },
                { label: '40HC', field: 'cntr40hcQty' },
                { label: '45HC', field: 'cntr45hcQty' },
                { label: 'Reefer', field: 'cntrReeferQty' },
                { label: 'O/T', field: 'cntrOtQty' },
                { label: 'F/R', field: 'cntrFrQty' },
              ].map(({ label, field }) => (
                <div key={field}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <input
                    type="number"
                    value={(formData as any)[field] || ''}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      handleInputChange(field as keyof BookingFormData, v);
                      const fields = ['cntr20gpQty','cntr40gpQty','cntr40hcQty','cntr45hcQty','cntrReeferQty','cntrOtQty','cntrFrQty'];
                      const total = fields.reduce((s, f) => s + (f === field ? v : ((formData as any)[f] || 0)), 0);
                      handleInputChange('totalCntrQty', total);
                    }}
                    className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg text-right"
                    placeholder="0"
                    min="0"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium mb-1 font-bold">합계</label>
                <input
                  type="number"
                  value={formData.totalCntrQty || 0}
                  disabled
                  className="w-full px-3 py-2 bg-[var(--surface-100)] border border-[var(--border)] rounded-lg text-right font-bold"
                />
              </div>
            </div>
          </div>

          {/* Cut-Off Information 섹션 */}
          <div className="card mb-6">
            <div className="section-header">
              <h3 className="font-bold text-white">Cut-Off Information</h3>
            </div>
            <div className="p-4 grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">서류마감일 (Doc Cut-Off)</label>
                <input type="date" value={formData.closingDate} onChange={(e) => handleInputChange('closingDate', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">서류마감시간</label>
                <input type="time" value={formData.closingTime} onChange={(e) => handleInputChange('closingTime', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">화물반입마감일 (Cargo Cut-Off)</label>
                <input type="date" value={formData.cargoCutOffDate} onChange={(e) => handleInputChange('cargoCutOffDate', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">화물반입마감시간</label>
                <input type="time" value={formData.cargoCutOffTime} onChange={(e) => handleInputChange('cargoCutOffTime', e.target.value)} className="w-full px-3 py-2 bg-[var(--surface-50)] border border-[var(--border)] rounded-lg" />
              </div>
            </div>
          </div>

          {/* Container Pick up Information`;

content = content.replace(cargoSectionEnd, replacementWithNewSections);

fs.writeFileSync(path, content);
console.log('Patched successfully. Lines:', content.split('\n').length);
