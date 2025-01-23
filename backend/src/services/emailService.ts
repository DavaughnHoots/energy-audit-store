// src/services/emailService.ts

import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import handlebars from 'handlebars';
import path from 'path';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

export interface EmailOptions {
  to: string;
  template: string;
  data: Record<string, any>;
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
      auth: config.auth
    });

    this.templates = new Map();
    this.templateDir = path.join(__dirname, '../templates/email');
    this.loadTemplates();
  }

  private loadTemplates(): void {
    // Define available templates and their files
    const templateList = {
      'verification': 'email-verification',
      'password-reset': 'password-reset',
      'welcome': 'welcome-email',
      'audit-complete': 'audit-complete'
    };

    for (const [key, fileName] of Object.entries(templateList)) {
      try {
        // Load template files
        const htmlTemplate = readFileSync(
          path.join(this.templateDir, `${fileName}.html`),
          'utf-8'
        );
        const textTemplate = readFileSync(
          path.join(this.templateDir, `${fileName}.txt`),
          'utf-8'
        );
        const configFile = require(path.join(this.templateDir, `${fileName}.json`));

        // Compile templates
        const compiledHtml = handlebars.compile(htmlTemplate);
        const compiledText = handlebars.compile(textTemplate);

        this.templates.set(key, {
          subject: configFile.subject,
          html: compiledHtml,
          text: compiledText
        });
      } catch (error) {
        console.error(`Failed to load template ${key}:`, error);
        throw new Error(`Email template ${key} could not be loaded`);
      }
    }
  }

  public async sendVerificationEmail(email: string, token: string, name: string): Promise<void> {
    const template = this.templates.get('verification');
    if (!template) {
      throw new Error('Verification email template not found');
    }

    const data = {
      name,
      verificationLink: `${process.env.APP_URL}/verify-email/${token}`,
      expiryHours: 24
    };

    await this.sendEmail({
      to: email,
      template: 'verification',
      data
    });
  }

  public async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const template = this.templates.get('password-reset');
    if (!template) {
      throw new Error('Password reset email template not found');
    }

    const data = {
      resetLink: `${process.env.APP_URL}/reset-password/${token}`,
      expiryHours: 1
    };

    await this.sendEmail({
      to: email,
      template: 'password-reset',
      data
    });
  }

  public async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const template = this.templates.get('welcome');
    if (!template) {
      throw new Error('Welcome email template not found');
    }

    const data = {
      name,
      loginUrl: `${process.env.APP_URL}/login`,
      supportEmail: process.env.SUPPORT_EMAIL
    };

    await this.sendEmail({
      to: email,
      template: 'welcome',
      data
    });
  }

  public async sendAuditCompleteEmail(email: string, auditId: string, recommendations: any[]): Promise<void> {
    const template = this.templates.get('audit-complete');
    if (!template) {
      throw new Error('Audit complete email template not found');
    }

    const data = {
      auditUrl: `${process.env.APP_URL}/audits/${auditId}`,
      recommendations,
      supportEmail: process.env.SUPPORT_EMAIL
    };

    await this.sendEmail({
      to: email,
      template: 'audit-complete',
      data
    });
  }

  private async sendEmail(options: EmailOptions): Promise<void> {
    const template = this.templates.get(options.template);
    if (!template) {
      throw new Error(`Email template ${options.template} not found`);
    }

    try {
      // Apply template data
      const html = template.html(options.data);
      const text = template.text(options.data);
      const subject = handlebars.compile(template.subject)(options.data);

      // Send email
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: options.to,
        subject,
        text,
        html
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
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

// Error handling class
export class EmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailError';
  }
}

// Create and export singleton instance
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