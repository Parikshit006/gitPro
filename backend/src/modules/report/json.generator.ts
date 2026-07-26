/**
 * JSON Report Generator (`src/modules/report/json.generator.ts`)
 *
 * Purpose:
 *   Returns a structured JSON payload representing the complete report DTO.
 *
 * Strict Architectural Rules:
 *   - Zero business logic, zero Prisma queries, zero repository imports.
 */

import { ReportDTO, ReportResult } from './report.types';

export class JSONGenerator {
  /**
   * Generates a structured JSON string representation of the immutable ReportDTO.
   */
  static generate(report: ReportDTO): ReportResult {
    return {
      format: 'json',
      contentType: 'application/json; charset=utf-8',
      filename: `gitpro-report-${report.reportType.toLowerCase()}-${report.reportId}.json`,
      content: JSON.stringify(report, null, 2),
      generatedAt: report.generatedAt,
    };
  }
}
