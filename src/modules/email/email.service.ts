import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;
  private readonly frontendUrl: string;
  private readonly mailFrom: string;

  constructor(private readonly configService: ConfigService) {
    this.frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'https://2de4f283b81d.ngrok-free.app',
    );
    this.mailFrom = this.configService.get<string>(
      'MAIL_FROM',
      'no-reply@casha.app',
    );

    this.initializeTransporter();
  }

  private initializeTransporter() {
    const mailHost = this.configService.get<string>('MAIL_HOST', 'localhost');
    const mailPort = this.configService.get<number>('MAIL_PORT', 1025);
    const mailUser = this.configService.get<string>('MAIL_USER');
    const mailPass = this.configService.get<string>('MAIL_PASS');
    const mailSecure = this.configService.get<boolean>('MAIL_SECURE', false);
    const mailIgnoreTLS = this.configService.get<boolean>(
      'MAIL_IGNORE_TLS',
      true,
    );

    try {
      this.transporter = nodemailer.createTransport({
        host: mailHost,
        port: mailPort,
        secure: mailSecure,
        ignoreTLS: mailIgnoreTLS,
        auth:
          mailUser && mailPass ? { user: mailUser, pass: mailPass } : undefined,
        connectionTimeout: 10000, // 10 seconds timeout
        greetingTimeout: 10000,
        socketTimeout: 10000,
      } as SMTPTransport.Options);

      // Verify connection configuration
      this.verifyConnection();
    } catch (error) {
      this.logger.error('Failed to initialize email transporter', error.stack);
      throw new InternalServerErrorException(
        'Email service configuration failed',
      );
    }
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      this.logger.log('✅ Email transporter connection verified successfully');
    } catch (error) {
      this.logger.warn(
        '⚠️ Email transporter connection verification failed',
        error.message,
      );
      // Don't throw here - allow the service to start but log the warning
    }
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ) {
    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from: this.mailFrom,
        to,
        subject,
        html,
        ...(text && { text }), // Include plain text version if provided
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`✅ Email sent successfully to ${to}`, info.messageId);
      return info;
    } catch (error) {
      this.logger.error(
        `❌ Email sending failed to ${to}`,
        error.message,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to send email');
    }
  }

  private generatePlainTextFromHtml(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<style[^>]*>.*<\/style>/gms, '')
      .replace(/<script[^>]*>.*<\/script>/gms, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  async sendVerificationEmail(email: string, token: string, name?: string) {
    const verificationUrl = `${this.frontendUrl}/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Email Verification</h2>
        <p>Hello ${name || 'there'},</p>
        <p>Please click the button below to verify your email address:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Verify Email
          </a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">
          ${verificationUrl}
        </p>
        
        <p style="color: #666; font-size: 14px;">
          This link will expire in 24 hours. If you didn't create an account with Casha, please ignore this email.
        </p>
      </div>
    `;

    return this.sendEmail(
      email,
      'Verify Your Email Address - Casha',
      htmlContent,
      this.generatePlainTextFromHtml(htmlContent),
    );
  }

  async sendWelcomeEmail(email: string, name: string) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Casha, ${name}!</h2>
        <p>Your account has been successfully verified and you're ready to start using our app.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">What's next?</h3>
          <ul style="color: #555;">
            <li>Complete your profile setup</li>
            <li>Explore our features</li>
            <li>Start managing your finances</li>
          </ul>
        </div>
        
        <p>Thank you for joining us! If you have any questions, feel free to reach out to our support team.</p>
      </div>
    `;

    return this.sendEmail(
      email,
      'Welcome to Casha!',
      htmlContent,
      this.generatePlainTextFromHtml(htmlContent),
    );
  }

  async sendPasswordResetEmail(email: string, token: string, name?: string) {
    const resetUrl = `${this.frontendUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello ${name || 'there'},</p>
        <p>You requested to reset your password. Click the button below to proceed:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Reset Password
          </a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">
          ${resetUrl}
        </p>
        
        <p style="color: #666; font-size: 14px;">
          This link will expire in 1 hour for security reasons. If you didn't request this password reset, 
          please ignore this email and your account will remain secure.
        </p>
      </div>
    `;

    return this.sendEmail(
      email,
      'Reset Your Password - Casha',
      htmlContent,
      this.generatePlainTextFromHtml(htmlContent),
    );
  }

  async sendPasswordChangedEmail(email: string, name: string) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Updated Successfully</h2>
        <p>Hello ${name},</p>
        <p>Your password has been successfully changed.</p>
        
        <div style="background-color: #d4edda; color: #155724; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <strong>Security Alert:</strong> If you didn't make this change, please contact our support team immediately.
        </div>
        
        <p>Thank you for keeping your Casha account secure!</p>
      </div>
    `;

    return this.sendEmail(
      email,
      'Password Changed Successfully - Casha',
      htmlContent,
      this.generatePlainTextFromHtml(htmlContent),
    );
  }

  async sendTestEmail(to: string = 'test@example.com') {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Test Email Successful! 🎉</h2>
        <p>This is a test email from your Casha application.</p>
        <p>If you're receiving this, your email configuration is working correctly.</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
      </div>
    `;

    return this.sendEmail(
      to,
      'Test Email from Casha',
      htmlContent,
      this.generatePlainTextFromHtml(htmlContent),
    );
  }

  // New method for better error handling and retries
  async sendEmailWithRetry(
    to: string,
    subject: string,
    html: string,
    maxRetries: number = 2,
    retryDelay: number = 1000,
  ) {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.sendEmail(to, subject, html);
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Email send attempt ${attempt} failed`, error.message);

        if (attempt < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * attempt),
          );
        }
      }
    }

    if (lastError) {
      throw lastError;
    }

    throw new InternalServerErrorException(
      'Failed to send email after retries',
    );
  }
}
