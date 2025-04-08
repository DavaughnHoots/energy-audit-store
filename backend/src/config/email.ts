// backend/src/config/email.ts

import { createTransport, Transporter } from 'nodemailer';
import { readFileSync } from 'fs';
import handlebars from 'handlebars';
import path from 'path';

// Email configuration interface
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  replyTo?: string;
}

// Email template interface
export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

// Email service configuration class
export class EmailConfiguration {
  private transporter: Transporter;
  private templates: Map<string, EmailTemplate>;
  private readonly templateDir: string;
  private readonly defaultFrom: string;
  private readonly defaultReplyTo: string;

  constructor(config: EmailConfig) {
    // Initialize nodemailer transporter
    this.transporter = createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      pool: true, // Use pooled connections
      maxConnections: 5,
      maxMessages: 100,
      // TLS configuration for security
      tls: {
        rejectUnauthorized: true, // Reject unauthorized TLS/SSL certificates
        minVersion: 'TLSv1.2'
      }
    });

    this.templates = new Map();
    this.templateDir = path.join(__dirname, '../templates/email');
    this.defaultFrom = config.from;
    this.defaultReplyTo = config.replyTo || config.from;

    // Load email templates on initialization
    this.loadTemplates();
  }

  // Load and compile email templates
  private loadTemplates(): void {
    const templateList = {
      'verification': 'email-verification',
      'password-reset': 'password-reset',
      'welcome': 'welcome-email',
      'audit-complete': 'audit-complete',
      'recommendation': 'recommendation',
      'savings-milestone': 'savings-milestone'
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

        // Compile templates with Handlebars
        const compiledHtml = handlebars.compile(htmlTemplate);
        const compiledText = handlebars.compile(textTemplate);

        this.templates.set(key, {
          subject: configFile.subject,
          html: compiledHtml({}),  // Initialize with empty context
          text: compiledText({})   // Initialize with empty context
        });
      } catch (error) {
        console.error(`Failed to load email template ${key}:`, error);
        throw new Error(`Email template ${key} could not be loaded`);
      }
    }
  }

  // Get email transport configuration
  public getTransporter(): Transporter {
    return this.transporter;
  }

  // Get compiled template by name
  public getTemplate(name: string): EmailTemplate | undefined {
    return this.templates.get(name);
  }

  // Verify email configuration
  public async verifyConfiguration(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email configuration verification failed:', error);
      return false;
    }
  }

  // Get default sender address
  public getDefaultFrom(): string {
    return this.defaultFrom;
  }

  // Get default reply-to address
  public getDefaultReplyTo(): string {
    return this.defaultReplyTo;
  }
}

// Create and export singleton instance with environment variables
const emailConfig: EmailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  },
  from: process.env.EMAIL_FROM || 'noreply@energyefficientstore.com',
  replyTo: process.env.EMAIL_REPLY_TO
};

export const emailConfiguration = new EmailConfiguration(emailConfig);

// Custom error class for email-related errors
export class EmailConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailConfigError';
  }
}
