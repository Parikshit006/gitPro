/**
 * Notification Domain Contracts (`src/modules/notification/notification.types.ts`)
 *
 * Purpose:
 *   Defines immutable, provider-agnostic DTOs, delivery channels, and execution status
 *   envelopes for GitPro's multi-channel notification platform.
 *
 * Strict Architectural Rules:
 *   - Zero report generation logic (reports must be pre-synthesized by ReportService).
 *   - Zero Prisma / ORM imports (@prisma/client is forbidden).
 *   - Zero HTTP controller / Express dependencies.
 *   - All interfaces must be strictly readonly, immutable, and JSON serializable.
 */

import { ReportDTO, ReportResult } from '../report/report.types';

/**
 * Supported notification delivery channels.
 */
export type NotificationChannel = 'EMAIL' | 'SLACK' | 'WEBHOOK';

/**
 * Execution status tracking for notification dispatch and retry loops.
 */
export type DeliveryStatus = 'PENDING' | 'SENT' | 'FAILED' | 'RETRYING';

/**
 * Request DTO submitted to NotificationService to dispatch an engineering report.
 */
export interface NotificationRequest {
  readonly channel: NotificationChannel;
  readonly recipient: string;
  readonly subject?: string;
  readonly report?: ReportDTO;
  readonly reportResult?: ReportResult;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Detailed delivery audit record returned after provider dispatch or fallback.
 */
export interface NotificationResult {
  readonly notificationId: string;
  readonly channel: NotificationChannel;
  readonly recipient: string;
  readonly status: DeliveryStatus;
  readonly deliveredAt?: string;
  readonly error?: string;
  readonly attemptCount: number;
}

/**
 * API response envelope for Notification endpoints.
 */
export interface NotificationResponse {
  readonly success: boolean;
  readonly message: string;
  readonly result: NotificationResult;
}
