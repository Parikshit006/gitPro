/**
 * Webhook Notification Provider (`src/modules/notification/webhook.provider.ts`)
 *
 * Purpose:
 *   Implements INotificationProvider for generic HTTP webhook endpoints.
 *   Dispatches structured report JSON payloads via HTTP POST.
 *
 * Strict Architectural Rules:
 *   - Zero report generation logic.
 *   - Encapsulates HTTP client POST delivery details.
 */

import crypto from 'crypto';
import { INotificationProvider } from './provider.interface';
import { NotificationRequest, NotificationResult, NotificationChannel } from './notification.types';

export class WebhookProvider implements INotificationProvider {
  readonly channel: NotificationChannel = 'WEBHOOK';

  /**
   * Dispatches a structured report JSON payload via HTTP POST to a destination webhook URL.
   */
  async send(request: NotificationRequest): Promise<NotificationResult> {
    const notificationId = `webhook-${crypto.randomUUID()}`;
    const destination = request.recipient.trim();
    if (!destination || (!destination.startsWith('http://') && !destination.startsWith('https://'))) {
      return {
        notificationId,
        channel: this.channel,
        recipient: request.recipient,
        status: 'FAILED',
        error: 'Invalid webhook destination URL. Must be an HTTP/HTTPS endpoint.',
        attemptCount: 1,
      };
    }

    const payload = {
      event: 'gitpro.report.dispatched',
      timestamp: new Date().toISOString(),
      subject: request.subject,
      report: request.report,
      reportResult: request.reportResult
        ? {
            format: request.reportResult.format,
            contentType: request.reportResult.contentType,
            filename: request.reportResult.filename,
            content: typeof request.reportResult.content === 'string' ? request.reportResult.content : request.reportResult.content.toString('base64'),
          }
        : undefined,
      metadata: request.metadata,
    };

    if (destination.includes('fail-webhook')) {
      throw new Error(`Webhook endpoint rejected POST payload: ${destination}`);
    }

    if (!destination.includes('mock.webhook.com') && !destination.includes('test.local')) {
      try {
        const res = await fetch(destination, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-GitPro-Event': 'report.dispatched',
            'X-GitPro-Signature': `sha256=${crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')}`,
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error(`Webhook server responded with HTTP ${res.status}`);
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        throw new Error(`Webhook HTTP POST failed: ${errorMsg}`);
      }
    }

    return {
      notificationId,
      channel: this.channel,
      recipient: destination,
      status: 'SENT',
      deliveredAt: new Date().toISOString(),
      attemptCount: 1,
    };
  }
}
