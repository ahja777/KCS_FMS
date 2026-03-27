'use client';

import { useState, useEffect } from 'react';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (emailData: EmailData) => void;
  defaultSubject?: string;
  defaultBody?: string;
  documentType?: 'quote' | 'bl' | 'booking' | 'invoice' | 'sr' | 'awb';
  documentNo?: string;
}

interface EmailData {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  attachments: string[];
}

// 샘플 이메일 템플릿
const emailTemplates = {
  quote: {
    subject: '[견적서] {documentNo} - 인터지스 물류',
    body: `안녕하세요.

인터지스 물류입니다.
요청하신 견적서를 송부드립니다.

견적서 번호: {documentNo}
유효기간: {validDate}

상세 내용은 첨부파일을 확인해 주시기 바랍니다.
문의사항이 있으시면 언제든지 연락 주시기 바랍니다.

감사합니다.

---
인터지스 물류
Tel: 02-1234-5678
Email: logistics@intergis.co.kr`
  },
  bl: {
    subject: '[B/L] {documentNo} - 선적 서류 송부',
    body: `안녕하세요.

인터지스 물류입니다.
선적 서류(B/L)를 송부드립니다.

B/L 번호: {documentNo}

상세 내용은 첨부파일을 확인해 주시기 바랍니다.

감사합니다.

---
인터지스 물류`
  },
  booking: {
    subject: '[Booking 확인] {documentNo}',
    body: `안녕하세요.

Booking 확인서를 송부드립니다.

Booking No: {documentNo}

감사합니다.`
  },
  invoice: {
    subject: '[Invoice] {documentNo} - 청구서',
    body: `안녕하세요.

청구서를 송부드립니다.

Invoice No: {documentNo}

감사합니다.`
  },
  sr: {
    subject: '[S/R] {documentNo} - 선적요청서',
    body: `안녕하세요.

인터지스 물류입니다.
선적요청서(S/R)를 송부드립니다.

S/R No: {documentNo}

상세 내용은 첨부파일을 확인해 주시기 바랍니다.

감사합니다.

---
인터지스 물류`
  },
  awb: {
    subject: '[AWB] {documentNo} - 항공화물운송장',
    body: `안녕하세요.

인터지스 물류입니다.
항공화물운송장(AWB)을 송부드립니다.

AWB No: {documentNo}

상세 내용은 첨부파일을 확인해 주시기 바랍니다.

감사합니다.

---
인터지스 물류`
  }
};

export default function EmailModal({
  isOpen,
  onClose,
  onSend,
  defaultSubject = '',
  defaultBody = '',
  documentType = 'quote',
  documentNo = '',
}: EmailModalProps) {
  const [toInput, setToInput] = useState('');
  const [toEmails, setToEmails] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState('');
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [bccInput, setBccInput] = useState('');
  const [bccEmails, setBccEmails] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 템플릿 적용
  useEffect(() => {
    if (isOpen) {
      const template = emailTemplates[documentType];
      if (template && !defaultSubject) {
        setSubject(template.subject.replace('{documentNo}', documentNo || 'N/A'));
        setBody(template.body
          .replace(/{documentNo}/g, documentNo || 'N/A')
          .replace('{validDate}', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR'))
        );
      } else {
        setSubject(defaultSubject);
        setBody(defaultBody);
      }

      // 기본 첨부파일 설정
      if (documentNo) {
        setAttachments([`${documentType.toUpperCase()}_${documentNo}.pdf`]);
      }
    }
  }, [isOpen, documentType, documentNo, defaultSubject, defaultBody]);

  // 이메일 유효성 검사
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 이메일 추가 핸들러
  const handleAddEmail = (type: 'to' | 'cc' | 'bcc') => {
    const inputMap = { to: toInput, cc: ccInput, bcc: bccInput };
    const setInputMap = { to: setToInput, cc: setCcInput, bcc: setBccInput };
    const emailsMap = { to: toEmails, cc: ccEmails, bcc: bccEmails };
    const setEmailsMap = { to: setToEmails, cc: setCcEmails, bcc: setBccEmails };

    const input = inputMap[type].trim();
    if (!input) return;

    // 여러 이메일 처리 (쉼표, 세미콜론으로 구분)
    const emails = input.split(/[,;]/).map(e => e.trim()).filter(e => e);
    const validEmails: string[] = [];
    const invalidEmails: string[] = [];

    emails.forEach(email => {
      if (isValidEmail(email) && !emailsMap[type].includes(email)) {
        validEmails.push(email);
      } else if (!isValidEmail(email)) {
        invalidEmails.push(email);
      }
    });

    if (invalidEmails.length > 0) {
      setErrors(prev => ({ ...prev, [type]: `잘못된 이메일 형식: ${invalidEmails.join(', ')}` }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[type];
        return newErrors;
      });
    }

    if (validEmails.length > 0) {
      setEmailsMap[type]([...emailsMap[type], ...validEmails]);
      setInputMap[type]('');
    }
  };

  // 이메일 삭제 핸들러
  const handleRemoveEmail = (type: 'to' | 'cc' | 'bcc', email: string) => {
    const setEmailsMap = { to: setToEmails, cc: setCcEmails, bcc: setBccEmails };
    const emailsMap = { to: toEmails, cc: ccEmails, bcc: bccEmails };
    setEmailsMap[type](emailsMap[type].filter(e => e !== email));
  };

  // 첨부파일 추가
  const handleAddAttachment = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        const newAttachments = Array.from(files).map(f => f.name);
        setAttachments(prev => [...prev, ...newAttachments]);
      }
    };
    input.click();
  };

  // 첨부파일 삭제
  const handleRemoveAttachment = (filename: string) => {
    setAttachments(prev => prev.filter(a => a !== filename));
  };

  // 이메일 발송
  const handleSend = async () => {
    // 유효성 검사
    const newErrors: Record<string, string> = {};
    if (toEmails.length === 0) {
      newErrors.to = '받는 사람을 입력해주세요.';
    }
    if (!subject.trim()) {
      newErrors.subject = '제목을 입력해주세요.';
    }
    if (!body.trim()) {
      newErrors.body = '내용을 입력해주세요.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSending(true);

    // 이메일 데이터 전송 (실제로는 API 호출)
    setTimeout(() => {
      onSend({
        to: toEmails,
        cc: ccEmails,
        bcc: bccEmails,
        subject,
        body,
        attachments,
      });
      setIsSending(false);

      // 초기화
      setToEmails([]);
      setCcEmails([]);
      setBccEmails([]);
      setToInput('');
      setCcInput('');
      setBccInput('');
      setSubject('');
      setBody('');
      setAttachments([]);
      setErrors({});

      onClose();
    }, 1000);
  };

  // Enter 키 처리
  const handleKeyDown = (e: React.KeyboardEvent, type: 'to' | 'cc' | 'bcc') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail(type);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[700px] max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            이메일 발송
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* 받는 사람 */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="text-sm font-medium text-gray-900">받는 사람 (To)</label>
              {!showCc && (
                <button
                  onClick={() => setShowCc(true)}
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  + 참조 추가
                </button>
              )}
              {!showBcc && (
                <button
                  onClick={() => setShowBcc(true)}
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  + 숨은참조 추가
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1 p-2 bg-gray-50 rounded-lg border border-gray-200 min-h-[42px]">
              {toEmails.map(email => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm"
                >
                  {email}
                  <button onClick={() => handleRemoveEmail('to', email)} className="hover:text-blue-200">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={toInput}
                onChange={(e) => setToInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'to')}
                onBlur={() => handleAddEmail('to')}
                placeholder="이메일 주소 입력 후 Enter"
                className="flex-1 min-w-[200px] bg-transparent border-none outline-none text-sm text-gray-900"
              />
            </div>
            {errors.to && <p className="text-red-400 text-xs mt-1">{errors.to}</p>}
          </div>

          {/* 참조 (CC) */}
          {showCc && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">참조 (CC)</label>
              <div className="flex flex-wrap gap-1 p-2 bg-gray-50 rounded-lg border border-gray-200 min-h-[42px]">
                {ccEmails.map(email => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm"
                  >
                    {email}
                    <button onClick={() => handleRemoveEmail('cc', email)} className="hover:text-green-200">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={ccInput}
                  onChange={(e) => setCcInput(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'cc')}
                  onBlur={() => handleAddEmail('cc')}
                  placeholder="이메일 주소 입력"
                  className="flex-1 min-w-[200px] bg-transparent border-none outline-none text-sm text-gray-900"
                />
              </div>
            </div>
          )}

          {/* 숨은참조 (BCC) */}
          {showBcc && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">숨은참조 (BCC)</label>
              <div className="flex flex-wrap gap-1 p-2 bg-gray-50 rounded-lg border border-gray-200 min-h-[42px]">
                {bccEmails.map(email => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-sm"
                  >
                    {email}
                    <button onClick={() => handleRemoveEmail('bcc', email)} className="hover:text-purple-200">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={bccInput}
                  onChange={(e) => setBccInput(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'bcc')}
                  onBlur={() => handleAddEmail('bcc')}
                  placeholder="이메일 주소 입력"
                  className="flex-1 min-w-[200px] bg-transparent border-none outline-none text-sm text-gray-900"
                />
              </div>
            </div>
          )}

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">제목</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.subject && <p className="text-red-400 text-xs mt-1">{errors.subject}</p>}
          </div>

          {/* 첨부파일 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-900">첨부파일</label>
              <button
                onClick={handleAddAttachment}
                className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                파일 추가
              </button>
            </div>
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                {attachments.map(file => (
                  <span
                    key={file}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm text-gray-900"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    {file}
                    <button onClick={() => handleRemoveAttachment(file)} className="hover:text-red-400">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">내용</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
            />
            {errors.body && <p className="text-red-400 text-xs mt-1">{errors.body}</p>}
          </div>
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSend}
            disabled={isSending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSending ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                발송 중...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                발송
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
