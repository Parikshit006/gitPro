/**
 * Report Domain Contracts (`src/modules/report/report.types.ts`)
 *
 * Purpose:
 *   Defines immutable, frontend-facing and generator-agnostic Data Transfer Objects (DTOs),
 *   report classification types, export formats, and result envelopes for GitPro's reporting platform.
 *
 * Strict Architectural Rules:
 *   - Zero Prisma / ORM imports (@prisma/client is forbidden).
 *   - Zero Express / HTTP controller imports.
 *   - Zero delivery/notification provider concerns (Email and Slack are forbidden here).
 *   - All interfaces must be strictly readonly, immutable, and JSON serializable.
 */

/**
 * Categorization of supported engineering reports.
 */
export type ReportType =
  | 'EXECUTIVE'
  | 'REPOSITORY'
  | 'DEVELOPER'
  | 'ORGANIZATION'
  | 'WEEKLY'
  | 'MONTHLY';

/**
 * Supported report export file formats.
 */
export type ReportFormat = 'pdf' | 'html' | 'markdown' | 'json';

/**
 * Generic section structure within a report DTO.
 */
export interface ReportSection {
  readonly title: string;
  readonly content: string;
  readonly items?: ReadonlyArray<Record<string, unknown>>;
}

/**
 * Immutable DTO representing a complete, domain-agnostic engineering report payload.
 * Assembled by ReportMapper from Dashboard DTOs, Insight DTOs, AI summaries, and Search DTOs.
 */
export interface ReportDTO {
  readonly reportId: string;
  readonly reportType: ReportType;
  readonly title: string;
  readonly subtitle?: string;
  readonly generatedAt: string;
  readonly executiveSummary: string;
  readonly repositoryHealth: ReadonlyArray<Record<string, unknown>>;
  readonly busFactor: ReadonlyArray<Record<string, unknown>>;
  readonly ownership: ReadonlyArray<Record<string, unknown>>;
  readonly hotspots: ReadonlyArray<Record<string, unknown>>;
  readonly recommendations: ReadonlyArray<Record<string, unknown>>;
  readonly aiSummary: string;
  readonly footer: string;
}

/**
 * Standardized output envelope returned by ReportService and export generators.
 */
export interface ReportResult {
  readonly format: ReportFormat;
  readonly contentType: string;
  readonly filename: string;
  readonly content: string | Buffer;
  readonly generatedAt: string;
}
