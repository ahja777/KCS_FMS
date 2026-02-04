import nodemailer from 'nodemailer';

// SMTP 설정 (환경 변수에서 가져오거나 기본값 사용)
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

// 개발/테스트용 Ethereal 메일 설정
let testAccount: nodemailer.TestAccount | null = null;

export interface MailOptions {
  from?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
}

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  error?: string;
}

// 트랜스포터 생성
async function createTransporter() {
  // 프로덕션 환경이고 SMTP 설정이 있는 경우
  if (SMTP_CONFIG.auth.user && SMTP_CONFIG.auth.pass) {
    return nodemailer.createTransport(SMTP_CONFIG);
  }

  // 개발/테스트 환경: Ethereal 메일 사용 (가짜 SMTP 서버)
  if (!testAccount) {
    testAccount = await nodemailer.createTestAccount();
  }

  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

// 메일 발송 함수
export async function sendMail(options: MailOptions): Promise<SendMailResult> {
  try {
    const transporter = await createTransporter();

    // 메일 옵션 설정
    const mailOptions = {
      from: options.from || `"FMS Logistics" <${SMTP_CONFIG.auth.user || 'noreply@fms-logistics.com'}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text?.replace(/\n/g, '<br>'),
      attachments: options.attachments,
    };

    // 메일 발송
    const info = await transporter.sendMail(mailOptions);

    // Ethereal 메일인 경우 미리보기 URL 생성
    const previewUrl = testAccount ? nodemailer.getTestMessageUrl(info) : undefined;

    console.log('메일 발송 성공:', {
      messageId: info.messageId,
      previewUrl,
    });

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl || undefined,
    };
  } catch (error) {
    console.error('메일 발송 오류:', error);
    return {
      success: false,
      error: String(error),
    };
  }
}

// Pre-Alert 메일 HTML 템플릿 생성
export function generatePreAlertHtml(data: {
  docNo: string;
  mawbNo?: string;
  flightNo?: string;
  origin?: string;
  destination?: string;
  etd?: string;
  eta?: string;
  shipper?: string;
  consignee?: string;
  pieces?: number;
  weight?: number;
  commodity?: string;
  customBody?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f8f9fa; padding: 20px; border: 1px solid #e9ecef; }
    .info-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .info-table th { background: #e9ecef; padding: 10px; text-align: left; width: 150px; border: 1px solid #dee2e6; }
    .info-table td { padding: 10px; background: white; border: 1px solid #dee2e6; }
    .footer { background: #e9ecef; padding: 15px; text-align: center; font-size: 12px; color: #6c757d; border-radius: 0 0 8px 8px; }
    .highlight { color: #6366f1; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Pre-Alert Notification</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">Air Export Shipment</p>
    </div>
    <div class="content">
      <p>Dear Partner,</p>
      <p>Please find below the Pre-Alert information for the upcoming shipment.</p>

      <table class="info-table">
        <tr>
          <th>Document No.</th>
          <td class="highlight">${data.docNo}</td>
        </tr>
        ${data.mawbNo ? `<tr><th>MAWB No.</th><td>${data.mawbNo}</td></tr>` : ''}
        ${data.flightNo ? `<tr><th>Flight No.</th><td>${data.flightNo}</td></tr>` : ''}
        <tr>
          <th>Route</th>
          <td>${data.origin || 'N/A'} → ${data.destination || 'N/A'}</td>
        </tr>
        ${data.etd ? `<tr><th>ETD</th><td>${data.etd}</td></tr>` : ''}
        ${data.eta ? `<tr><th>ETA</th><td>${data.eta}</td></tr>` : ''}
        ${data.shipper ? `<tr><th>Shipper</th><td>${data.shipper}</td></tr>` : ''}
        ${data.consignee ? `<tr><th>Consignee</th><td>${data.consignee}</td></tr>` : ''}
        ${data.pieces ? `<tr><th>Pieces</th><td>${data.pieces} PCS</td></tr>` : ''}
        ${data.weight ? `<tr><th>Gross Weight</th><td>${data.weight} KG</td></tr>` : ''}
        ${data.commodity ? `<tr><th>Commodity</th><td>${data.commodity}</td></tr>` : ''}
      </table>

      ${data.customBody ? `<div style="margin-top: 20px; padding: 15px; background: white; border-radius: 4px; white-space: pre-wrap;">${data.customBody}</div>` : ''}

      <p style="margin-top: 20px;">If you have any questions, please do not hesitate to contact us.</p>
      <p>Best regards,<br><strong>FMS Logistics Team</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated message from FMS Logistics Platform.</p>
      <p>© 2026 KCS Forwarding. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
