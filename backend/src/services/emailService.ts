// backend/src/services/emailService.ts

import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import handlebars from 'handlebars';
import path from 'path';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

interface EmailTemplate {
  subject: string;
  text: (data: any) => string;
  html: (data: any) => string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private templates: Map<string, EmailTemplate>;
  private readonly templateDir: string;

  constructor(config: EmailConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
      }
    });

    this.templates = new Map();
    this.templateDir = path.join(__dirname, '../templates/email');
    this.loadTemplates();
  }

  private loadTemplates(): void {
    const templateList = {
      'verification': 'email-verification',
      'password-reset': 'password-reset',
      'welcome': 'welcome-email',
      'audit-complete': 'audit-complete'
    };

    for (const [key, fileName] of Object.entries(templateList)) {
      try {
        const htmlTemplate = readFileSync(
          path.join(this.templateDir, `${fileName}.html`),
          'utf-8'
        );
        const textTemplate = readFileSync(
          path.join(this.templateDir, `${fileName}.txt`),
          'utf-8'
        );
        const configFile = require(path.join(this.templateDir, `${fileName}.json`));

        const compiledHtml = handlebars.compile(htmlTemplate);
        const compiledText = handlebars.compile(textTemplate);

        this.templates.set(key, {
          subject: configFile.subject,
          html: compiledHtml,
          text: compiledText
        });
      } catch (error) {
        console.error(`Failed to load template ${key}:`, error);
        throw new EmailError(`Email template ${key} could not be loaded`);
      }
    }
  }

  public async sendVerificationEmail({
    to,
    token,
    name
  }: {
    to: string;
    token: string;
    name: string;
  }): Promise<void> {
    const template = this.templates.get('verification');
    if (!template) {
      throw new EmailError('Verification email template not found');
    }

    const data = {
      name,
      verificationLink: `${process.env.APP_URL}/verify-email/${token}`,
      expiryHours: 24,
      year: new Date().getFullYear()
    };

    await this.sendEmail({
      to,
      template: 'verification',
      data
    });
  }

  public async sendPasswordResetEmail({
    to,
    token
  }: {
    to: string;
    token: string;
  }): Promise<void> {
    const template = this.templates.get('password-reset');
    if (!template) {
      throw new EmailError('Password reset template not found');
    }

    const data = {
      resetLink: `${process.env.APP_URL}/reset-password/${token}`,
      expiryHours: 1,
      year: new Date().getFullYear()
    };

    await this.sendEmail({
      to,
      template: 'password-reset',
      data
    });
  }

  private async sendEmail({
    to,
    template: templateName,
    data
  }: {
    to: string;
    template: string;
    data: Record<string, any>;
  }): Promise<void> {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new EmailError(`Email template ${templateName} not found`);
    }

    try {
      const html = template.html(data);
      const text = template.text(data);
      const subject = handlebars.compile(template.subject)(data);

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        text,
        html,
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High'
        }
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new EmailError('Failed to send email');
    }
  }

  public async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service verification failed:', error);
      return false;
    }
  }
}

export class EmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailError';
  }
}

const emailConfig: EmailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  },
  from: process.env.EMAIL_FROM || 'noreply@example.com'
};

export const emailService = new EmailService(emailConfig);