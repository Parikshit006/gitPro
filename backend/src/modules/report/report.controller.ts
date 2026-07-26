/**
 * Report Controller (HTTP Transport Boundary)
 *
 * Purpose:
 *   Converts HTTP requests into ReportService calls and formats responses
 *   with appropriate MIME content types and attachment headers.
 *
 * Strict Architectural Rules:
 *   - Zero business logic, zero data retrieval, zero formatting.
 *   - Strictly HTTP transport and header negotiation.
 */

import { Request, Response, NextFunction } from 'express';
import { ReportService } from './report.service';
import { ReportFormat, ReportResult } from './report.types';
import { ApiResponse } from '../../utils/ApiResponse';

export class ReportController {
  private readonly reportService: ReportService;

  constructor(reportService?: ReportService) {
    this.reportService = reportService ?? new ReportService();
  }

  /**
   * Helper to parse and validate format query parameter.
   */
  private getFormat(req: Request): ReportFormat {
    const fmt = req.query.format ? String(req.query.format).toLowerCase() : 'json';
    if (fmt === 'pdf' || fmt === 'html' || fmt === 'markdown' || fmt === 'json') {
      return fmt as ReportFormat;
    }
    return 'json';
  }

  /**
   * Helper to send ReportResult with appropriate content types and headers.
   */
  private sendResult(res: Response, result: ReportResult): void {
    if (result.format === 'json') {
      const payload = typeof result.content === 'string' ? JSON.parse(result.content) : result.content;
      ApiResponse.success(res, 'Report generated successfully', payload);
      return;
    }

    res.setHeader('Content-Type', result.contentType);
    if (result.format === 'pdf') {
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    } else {
      res.setHeader('Content-Disposition', `inline; filename="${result.filename}"`);
    }
    res.status(200).send(result.content);
  }

  /**
   * GET /reports/executive?format=...
   */
  getExecutiveReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const format = this.getFormat(req);
      const result = await this.reportService.generateExecutiveReport(format);
      this.sendResult(res, result);
    } catch (error: unknown) {
      next(error);
    }
  };

  /**
   * GET /reports/repository/:id?format=...
   */
  getRepositoryReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const format = this.getFormat(req);
      const id = String(req.params.id || '');
      const result = await this.reportService.generateRepositoryReport(id, format);
      this.sendResult(res, result);
    } catch (error: unknown) {
      next(error);
    }
  };

  /**
   * GET /reports/developer/:id?format=...
   */
  getDeveloperReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const format = this.getFormat(req);
      const id = String(req.params.id || '');
      const result = await this.reportService.generateDeveloperReport(id, format);
      this.sendResult(res, result);
    } catch (error: unknown) {
      next(error);
    }
  };

  /**
   * GET /reports/organization?format=...
   */
  getOrganizationReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const format = this.getFormat(req);
      const result = await this.reportService.generateOrganizationReport(format);
      this.sendResult(res, result);
    } catch (error: unknown) {
      next(error);
    }
  };

  /**
   * GET /reports/weekly?format=...
   */
  getWeeklyReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const format = this.getFormat(req);
      const result = await this.reportService.generateWeeklyReport(format);
      this.sendResult(res, result);
    } catch (error: unknown) {
      next(error);
    }
  };

  /**
   * GET /reports/monthly?format=...
   */
  getMonthlyReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const format = this.getFormat(req);
      const result = await this.reportService.generateMonthlyReport(format);
      this.sendResult(res, result);
    } catch (error: unknown) {
      next(error);
    }
  };
}
