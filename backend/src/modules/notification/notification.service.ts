/**
 * Notification Service (Delivery Orchestration & Retry/Fallback Engine)
 *
 * Purpose:
 *   Orchestrates report delivery across Email, Slack, and Webhook channels.
 *   Implements provider selection, execution timeouts, automatic retry on temporary
 *   failures, provider fallback, and audit logging via NotificationRepository.
 *
 * Strict Architectural Rules:
 *   - Zero report generation logic (reports must be pre-formed by ReportService).
 *   - Delegates transport delivery strictly to INotificationProvider implementations.
 */

import { NotificationRepository } from './notification.repository';
import { INotificationProvider } from './provider.interface';
import { EmailProvider } from './email.provider';
import { SlackProvider } from './slack.provider';
import { WebhookProvider } from './webhook.provider';
import { NotificationRequest, NotificationResult, NotificationChannel } from './notification.types';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

export class NotificationService {
  private readonly notificationRepo: NotificationRepository;
  private readonly providers: Map<NotificationChannel, INotificationProvider>;

  constructor(
    notificationRepo?: NotificationRepository,
    emailProvider?: INotificationProvider,
    slackProvider?: INotificationProvider,
    webhookProvider?: INotificationProvider,
  ) {
    this.notificationRepo = notificationRepo ?? new NotificationRepository();
    this.providers = new Map<NotificationChannel, INotificationProvider>();
    this.providers.set('EMAIL', emailProvider ?? new EmailProvider());
    this.providers.set('SLACK', slackProvider ?? new SlackProvider());
    this.providers.set('WEBHOOK', webhookProvider ?? new WebhookProvider());
  }

  /**
   * Resolves the target provider implementation by channel type.
   */
  private getProvider(channel: NotificationChannel): INotificationProvider {
    const provider = this.providers.get(channel.toUpperCase() as NotificationChannel);
    if (!provider) {
      throw new AppError(`Unsupported notification channel: '${channel}'`, HTTP_STATUS.BAD_REQUEST, true);
    }
    return provider;
  }

  /**
   * Wraps provider execution with a strict timeout boundary.
   */
  private async executeWithTimeout<T>(promise: Promise<T>, timeoutMs = 5000): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Provider delivery timed out after ${timeoutMs}ms`)), timeoutMs);
    });
    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timer!);
    }
  }

  /**
   * Attempts provider delivery with automatic retry on temporary failures.
   */
  private async attemptSend(
    provider: INotificationProvider,
    request: NotificationRequest,
    maxRetries = 2,
    timeoutMs = 5000,
  ): Promise<NotificationResult> {
    let attempt = 0;
    let lastError = '';

    while (attempt <= maxRetries) {
      attempt++;
      try {
        const res = await this.executeWithTimeout(provider.send(request), timeoutMs);
        return { ...res, attemptCount: attempt };
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : String(err);
        if (attempt <= maxRetries) {
          // Linear backoff delay before retry
          await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
        }
      }
    }

    return {
      notificationId: `${provider.channel.toLowerCase()}-${Date.now()}`,
      channel: provider.channel,
      recipient: request.recipient,
      status: 'FAILED',
      error: lastError,
      attemptCount: attempt,
    };
  }

  /**
   * Dispatches a report notification via the specified channel with optional fallback support.
   */
  async sendNotification(
    request: NotificationRequest,
    fallbackChannel?: NotificationChannel,
    maxRetries = 2,
    timeoutMs = 5000,
  ): Promise<NotificationResult> {
    const primaryProvider = this.getProvider(request.channel);
    const primaryResult = await this.attemptSend(primaryProvider, request, maxRetries, timeoutMs);

    if (primaryResult.status === 'SENT') {
      await this.notificationRepo.saveNotificationResult(primaryResult);
      return primaryResult;
    }

    // Check if fallback execution is configured
    const fallback = fallbackChannel ?? (request.metadata?.fallbackChannel as NotificationChannel | undefined);
    if (fallback && fallback !== request.channel) {
      try {
        const fallbackProvider = this.getProvider(fallback);
        const fallbackRecipient = (request.metadata?.fallbackRecipient as string) ?? request.recipient;
        const fallbackReq: NotificationRequest = { ...request, channel: fallback, recipient: fallbackRecipient };
        const fallbackResult = await this.attemptSend(fallbackProvider, fallbackReq, 1, timeoutMs);

        const combinedResult: NotificationResult = {
          ...fallbackResult,
          error: `Primary channel ${request.channel} failed (${primaryResult.error}). Fallback ${fallback} status: ${fallbackResult.status}`,
          attemptCount: primaryResult.attemptCount + fallbackResult.attemptCount,
        };
        await this.notificationRepo.saveNotificationResult(combinedResult);
        return combinedResult;
      } catch {
        // If fallback provider resolution fails, log and return original error
      }
    }

    await this.notificationRepo.saveNotificationResult(primaryResult);
    return primaryResult;
  }

  /**
   * Helper to dispatch report via Email.
   */
  async sendEmail(request: Omit<NotificationRequest, 'channel'>): Promise<NotificationResult> {
    return this.sendNotification({ ...request, channel: 'EMAIL' });
  }

  /**
   * Helper to dispatch report via Slack.
   */
  async sendSlack(request: Omit<NotificationRequest, 'channel'>): Promise<NotificationResult> {
    return this.sendNotification({ ...request, channel: 'SLACK' });
  }

  /**
   * Helper to dispatch report via Webhook.
   */
  async sendWebhook(request: Omit<NotificationRequest, 'channel'>): Promise<NotificationResult> {
    return this.sendNotification({ ...request, channel: 'WEBHOOK' });
  }

  /**
   * Retrieves audit log history of dispatched notifications.
   */
  async getAuditLog(notificationId?: string): Promise<NotificationResult[]> {
    if (notificationId) {
      const res = await this.notificationRepo.getNotificationResult(notificationId);
      return res ? [res] : [];
    }
    return this.notificationRepo.getAllNotificationResults();
  }
}
