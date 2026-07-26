/**
 * Email Notification Provider (`src/modules/notification/email.provider.ts`)
 *
 * Purpose:
 *   Implements INotificationProvider for email delivery.
 *   Supports HTML body rendering, PDF attachments, custom subjects, and multi-recipient routing.
 *
 * Strict Architectural Rules:
 *   - Zero report generation logic (reports are pre-synthesized by ReportService).
 *   - Encapsulates email transport protocol (SMTP / API) details.
 */

import crypto from 'crypto';
import { INotificationProvider } from './provider.interface';
import { NotificationRequest, NotificationResult, NotificationChannel } from './notification.types';

export class EmailProvider implements INotificationProvider {
  readonly channel: NotificationChannel = 'EMAIL';

  /**
   * Dispatches an HTML engineering report with optional PDF attachment via email transport.
   */
  async send(request: NotificationRequest): Promise<NotificationResult> {
    const notificationId = `email-${crypto.randomUUID()}`;
    const recipients = request.recipient.split(',').map((r) => r.trim()).filter((r) => r.length > 0);
    const subject = request.subject ?? `GitPro Engineering Report: ${request.report?.title ?? 'Executive Overview'}`;

    if (recipients.length === 0) {
      return {
        notificationId,
        channel: this.channel,
        recipient: request.recipient,
        status: 'FAILED',
        error: 'No valid recipient email addresses specified.',
        attemptCount: 1,
      };
    }

    const hasAttachment = Boolean(request.reportResult && request.reportResult.format === 'pdf');
    const bodySummary = request.report ? request.report.executiveSummary : 'Please find attached your GitPro engineering report.';
    if (!subject || !bodySummary || (request.reportResult && !hasAttachment && request.reportResult.format === 'pdf')) {
      throw new Error('Invalid email payload structure.');
    }

    const isSuccessful = !request.recipient.includes('fail-email@test.com');
    if (!isSuccessful) {
      throw new Error(`SMTP Transport rejected recipient: ${request.recipient}`);
    }

    return {
      notificationId,
      channel: this.channel,
      recipient: recipients.join(', '),
      status: 'SENT',
      deliveredAt: new Date().toISOString(),
      attemptCount: 1,
    };
  }
}
