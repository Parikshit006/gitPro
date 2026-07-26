/**
 * Notification Repository (Data Access & Audit Logging Boundary)
 *
 * Purpose:
 *   Owns all persistence interactions required by the notification platform.
 *   Uses existing domain repositories (RepositoryRepository, InsightRepository)
 *   to retrieve contact metadata and maintains an audit log of delivery attempts.
 *
 * Strict Architectural Rules:
 *   - Only persistence retrieval and audit logging: zero delivery logic, zero report generation.
 *   - Uses existing repositories where possible.
 */

import { RepositoryRepository } from '../repository/repository.repository';
import { InsightRepository } from '../insights/insight.repository';
import { NotificationResult } from './notification.types';
import { Repository as DomainRepository } from '../repository/repository.types';
import { Developer } from '@prisma/client';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

export class NotificationRepository {
  private readonly repositoryRepo: RepositoryRepository;
  private readonly insightRepo: InsightRepository;
  private readonly auditLog: Map<string, NotificationResult>;

  constructor(repositoryRepo?: RepositoryRepository, insightRepo?: InsightRepository) {
    this.repositoryRepo = repositoryRepo ?? new RepositoryRepository();
    this.insightRepo = insightRepo ?? new InsightRepository();
    this.auditLog = new Map<string, NotificationResult>();
  }

  /**
   * Persists a notification delivery audit record.
   */
  async saveNotificationResult(result: NotificationResult): Promise<NotificationResult> {
    try {
      this.auditLog.set(result.notificationId, result);
      return result;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new AppError(`Failed to persist notification audit log: ${err.message}`, HTTP_STATUS.INTERNAL_SERVER_ERROR, true);
    }
  }

  /**
   * Retrieves a notification audit record by ID.
   */
  async getNotificationResult(notificationId: string): Promise<NotificationResult | undefined> {
    return this.auditLog.get(notificationId);
  }

  /**
   * Retrieves all logged notification audit records.
   */
  async getAllNotificationResults(): Promise<NotificationResult[]> {
    return Array.from(this.auditLog.values());
  }

  /**
   * Retrieves repository metadata for recipient resolution.
   */
  async getRepository(repositoryId: string): Promise<DomainRepository | null> {
    try {
      return await this.repositoryRepo.findById(repositoryId);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new AppError(`Notification repository lookup failed: ${err.message}`, HTTP_STATUS.INTERNAL_SERVER_ERROR, true);
    }
  }

  /**
   * Retrieves developer contact information from existing Insight repository.
   */
  async getDevelopers(repositoryId?: string): Promise<Developer[]> {
    try {
      return await this.insightRepo.findDevelopers(repositoryId);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new AppError(`Notification developer lookup failed: ${err.message}`, HTTP_STATUS.INTERNAL_SERVER_ERROR, true);
    }
  }
}
