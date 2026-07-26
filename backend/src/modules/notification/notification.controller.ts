/**
 * Notification Controller (HTTP Transport Boundary)
 *
 * Purpose:
 *   Converts HTTP requests into NotificationService delivery commands.
 *
 * Strict Architectural Rules:
 *   - Zero business logic, zero formatting, zero delivery implementation.
 *   - Strictly HTTP transport payload parsing and response serialization.
 */

import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';
import { NotificationChannel, NotificationRequest } from './notification.types';
import { ApiResponse } from '../../utils/ApiResponse';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

export class NotificationController {
  private readonly notificationService: NotificationService;

  constructor(notificationService?: NotificationService) {
    this.notificationService = notificationService ?? new NotificationService();
  }

  /**
   * Helper to parse and validate request body for notification dispatch.
   */
  private parseRequest(req: Request, channel: NotificationChannel): { request: NotificationRequest; fallback?: NotificationChannel } {
    const { recipient, subject, report, reportResult, metadata, fallbackChannel } = req.body || {};

    if (!recipient || typeof recipient !== 'string' || recipient.trim() === '') {
      throw new AppError(`Missing required 'recipient' in notification payload.`, HTTP_STATUS.BAD_REQUEST, true);
    }

    const request: NotificationRequest = {
      channel,
      recipient: recipient.trim(),
      subject: typeof subject === 'string' ? subject : undefined,
      report,
      reportResult,
      metadata: typeof metadata === 'object' && metadata !== null ? metadata : undefined,
    };

    let fallback: NotificationChannel | undefined;
    if (fallbackChannel && typeof fallbackChannel === 'string') {
      const upper = fallbackChannel.toUpperCase();
      if (upper === 'EMAIL' || upper === 'SLACK' || upper === 'WEBHOOK') {
        fallback = upper as NotificationChannel;
      }
    }

    return { request, fallback };
  }

  /**
   * POST /notifications/email
   */
  sendEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { request, fallback } = this.parseRequest(req, 'EMAIL');
      const result = await this.notificationService.sendNotification(request, fallback);
      ApiResponse.success(res, 'Email notification processed', result);
    } catch (error: unknown) {
      next(error);
    }
  };

  /**
   * POST /notifications/slack
   */
  sendSlack = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { request, fallback } = this.parseRequest(req, 'SLACK');
      const result = await this.notificationService.sendNotification(request, fallback);
      ApiResponse.success(res, 'Slack notification processed', result);
    } catch (error: unknown) {
      next(error);
    }
  };

  /**
   * POST /notifications/webhook
   */
  sendWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { request, fallback } = this.parseRequest(req, 'WEBHOOK');
      const result = await this.notificationService.sendNotification(request, fallback);
      ApiResponse.success(res, 'Webhook notification processed', result);
    } catch (error: unknown) {
      next(error);
    }
  };
}
