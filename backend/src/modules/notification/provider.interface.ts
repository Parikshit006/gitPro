/**
 * Notification Provider Interface (`src/modules/notification/provider.interface.ts`)
 *
 * Purpose:
 *   Defines the strict contract that all notification delivery mechanisms
 *   (Email, Slack, Webhook) must implement to ensure interchangeable delivery
 *   and seamless fallback execution.
 */

import { NotificationRequest, NotificationResult, NotificationChannel } from './notification.types';

export interface INotificationProvider {
  readonly channel: NotificationChannel;
  /**
   * Asynchronously dispatches a notification request to the target destination.
   * Must resolve with a DeliveryStatus result or reject with an error on failure.
   */
  send(request: NotificationRequest): Promise<NotificationResult>;
}
