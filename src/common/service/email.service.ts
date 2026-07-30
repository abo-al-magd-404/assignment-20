import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { BadRequestException, Injectable } from '@nestjs/common';
import Mail from 'nodemailer/lib/mailer';

@Injectable()
export class EmailService {
  private APP_EMAIL: string;
  private APP_NAME: string;
  private APP_PASSWORD: string;
  private FACEBOOK: string;
  private INSTAGRAM: string;
  private TWITTER: string;

  constructor(private readonly ConfigService: ConfigService) {
    this.APP_EMAIL = this.ConfigService.get<string>('APP_EMAIL') as string;
    this.APP_NAME = this.ConfigService.get<string>('APP_NAME') as string;
    this.APP_PASSWORD = this.ConfigService.get<string>(
      'APP_PASSWORD',
    ) as string;
    this.FACEBOOK = this.ConfigService.get<string>('FACEBOOK') as string;
    this.INSTAGRAM = this.ConfigService.get<string>('INSTAGRAM') as string;
    this.TWITTER = this.ConfigService.get<string>('TWITTER') as string;
  }

  async sendEmail({
    to,
    cc,
    bcc,
    subject,
    html,
    attachments = [],
  }: Mail.Options): Promise<void> {
    if (!to && !cc && !bcc) {
      throw new BadRequestException('Invalid Recipient');
    }

    if (!(html as string)?.length && !attachments?.length) {
      throw new BadRequestException('Invalid Mail Content');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.APP_EMAIL,
        pass: this.APP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: `"${this.APP_NAME}" <${this.APP_EMAIL}>`,
      to,
      cc,
      bcc,
      subject,
      html,
      attachments,
    });

    console.log('Message sent : ', info.messageId);
  }

  emailTemplate({
    title,
    code,
  }: {
    title: string;
    code: string | number;
  }): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style type="text/css">
        body { margin: 0; padding: 0; width: 100% !important; background-color: #f4f7f9; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        table { border-collapse: collapse; }
        .main-container { padding: 40px 0; }
        .content-card { background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.03); border: 1px solid #e1e8ed; }
        .header-gradient { background: linear-gradient(90deg, #4f46e5, #3b82f6); height: 8px; }
        .hero-section { padding: 50px 30px; text-align: center; }
        .code-display { 
            font-size: 42px; 
            font-weight: 800; 
            color: #1e293b; 
            background-color: #f1f5f9; 
            padding: 20px 40px; 
            border-radius: 12px; 
            display: inline-block; 
            letter-spacing: 10px;
            margin: 25px 0;
            border: 1px solid #e2e8f0;
        }
        .footer { padding: 30px; text-align: center; background-color: #ffffff; border-top: 1px solid #f1f5f9; }
        .social-link { text-decoration: none; margin: 0 12px; display: inline-block; }
    </style>
</head>
<body>
    <table width="100%" class="main-container" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center">
                <table width="550" class="content-card" cellpadding="0" cellspacing="0" border="0">
                    <tr><td class="header-gradient"></td></tr>
                    
                    <tr>
                        <td class="hero-section">
                            <h2 style="color: #0f172a; font-size: 28px; font-weight: 700; margin: 0 0 15px 0;">${title}</h2>
                            
                            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0;">
                                Hi! To continue with <strong>${this.APP_NAME}</strong>, <br> 
                                please enter the following verification code:
                            </p>
                            
                            <div class="code-display">${code}</div>
                            
                            <p style="color: #94a3b8; font-size: 14px; margin-top: 10px;">
                                This security code will expire shortly. Do not share it with anyone.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td class="footer">
                            <p style="color: #64748b; font-size: 14px; margin-bottom: 20px; font-weight: 500;">
                                Follow us for updates
                            </p>
                            <div style="margin-bottom: 25px;">
                                <a href="${this.FACEBOOK}" class="social-link">
                                    <img width="24" src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook">
                                </a>
                                <a href="${this.INSTAGRAM}" class="social-link">
                                    <img width="24" src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="this.Instagram">
                                </a>
                                <a href="${this.TWITTER}" class="social-link">
                                    <img width="24" src="https://cdn-icons-png.flaticon.com/512/3256/3256609.png" alt="Twitter">
                                </a>
                            </div>
                            <p style="color: #94a3b8; font-size: 11px; margin: 0; letter-spacing: 0.5px; text-transform: uppercase;">
                                &copy; ${new Date().getFullYear()} ${this.APP_NAME}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
  }
}
