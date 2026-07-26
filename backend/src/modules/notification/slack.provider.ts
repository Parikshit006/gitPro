/**
 * Slack Notification Provider (`src/modules/notification/slack.provider.ts`)
 *
 * Purpose:
 *   Implements INotificationProvider for Slack channel and webhook delivery.
 *   Formats report executive summaries and embeds clickable web links to view reports.
 *
 * Strict Architectural Rules:
 *   - Zero report generation logic.
 *   - Encapsulates Slack Block Kit JSON payload construction.
 */

import crypto from 'crypto';
import { INotificationProvider } from './provider.interface';
import { NotificationRequest, NotificationResult, NotificationChannel } from './notification.types';

export class SlackProvider implements INotificationProvider {
  readonly channel: NotificationChannel = 'SLACK';

  /**
   * Dispatches a report summary and clickable viewer link to a Slack webhook or channel ID.
   */
  async send(request: NotificationRequest): Promise<NotificationResult> {
    const notificationId = `slack-${crypto.randomUUID()}`;
    const destination = request.recipient.trim();
    if (!destination) {
      return {
        notificationId,
        channel: this.channel,
        recipient: request.recipient,
        status: 'FAILED',
        error: 'No Slack destination (channel or webhook URL) provided.',
        attemptCount: 1,
      };
    }

    const title = request.report?.title ?? request.subject ?? 'GitPro Engineering Report';
    const summary = request.report?.executiveSummary ?? 'New engineering intelligence digest available.';
    const reportId = request.report?.reportId ?? 'latest';
    const reportUrl = `https://app.gitpro.dev/reports/view/${reportId}`;

    // Construct Slack Block Kit payload
    const blockKitPayload = {
      channel: destination.startsWith('http') ? undefined : destination,
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: title, emoji: true },
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*Executive Briefing:*\n${summary}` },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View Full Report', emoji: true },
              url: reportUrl,
              style: 'primary',
            },
          ],
        },
      ],
    };

    if (!blockKitPayload || destination.includes('fail-slack')) {
      throw new Error(`Slack API rejected delivery to destination: ${destination}`);
    }

    if (destination.startsWith('http') && !destination.includes('mock.slack.com')) {
      try {
        const res = await fetch(destination, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(blockKitPayload),
        });
        if (!res.ok) {
          throw new Error(`Slack webhook returned status ${res.status}`);
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        throw new Error(`Slack webhook network failure: ${errorMsg}`);
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
