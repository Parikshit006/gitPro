/**
 * Markdown Report Generator (`src/modules/report/markdown.generator.ts`)
 *
 * Purpose:
 *   Generates GitHub-compatible Markdown engineering reports from immutable ReportDTOs.
 *
 * Strict Architectural Rules:
 *   - Zero business logic, zero Prisma queries, zero repository imports.
 */

import { ReportDTO, ReportResult } from './report.types';

export class MarkdownGenerator {
  /**
   * Generates a GitHub-compatible Markdown report string from an immutable ReportDTO.
   */
  static generate(report: ReportDTO): ReportResult {
    const renderMarkdownTable = (items: ReadonlyArray<Record<string, unknown>>): string => {
      if (items.length === 0) return `*No records evaluated.*\n`;
      const keys = Object.keys(items[0]);
      const headerRow = `| ${keys.join(' | ')} |`;
      const separatorRow = `| ${keys.map(() => '---').join(' | ')} |`;
      const dataRows = items.map((row) => {
        const cells = keys.map((k) => {
          const val = row[k];
          return val !== undefined && val !== null ? String(val).replace(/\|/g, '\\|') : '-';
        });
        return `| ${cells.join(' | ')} |`;
      });
      return [headerRow, separatorRow, ...dataRows, ''].join('\n');
    };

    const lines: string[] = [];
    lines.push(`# ${report.title}`);
    if (report.subtitle) lines.push(`**${report.subtitle}**\n`);
    lines.push(`> **Report Type:** \`${report.reportType}\` | **Generated At:** \`${report.generatedAt}\`\n`);

    lines.push(`## 1. Executive Summary\n`);
    lines.push(`${report.executiveSummary}\n`);

    lines.push(`## 2. Repository Health\n`);
    lines.push(renderMarkdownTable(report.repositoryHealth));

    lines.push(`## 3. Bus Factor Analysis\n`);
    lines.push(renderMarkdownTable(report.busFactor));

    lines.push(`## 4. Code Ownership Silos\n`);
    lines.push(renderMarkdownTable(report.ownership));

    lines.push(`## 5. High-Churn Hotspots\n`);
    lines.push(renderMarkdownTable(report.hotspots));

    lines.push(`## 6. Prescriptive Recommendations\n`);
    lines.push(renderMarkdownTable(report.recommendations));

    lines.push(`## 7. AI Executive Synthesis\n`);
    lines.push(`> [!NOTE]`);
    lines.push(`> ${report.aiSummary.replace(/\n/g, '\n> ')}\n`);

    lines.push(`---`);
    lines.push(`*${report.footer}*`);

    return {
      format: 'markdown',
      contentType: 'text/markdown; charset=utf-8',
      filename: `gitpro-report-${report.reportType.toLowerCase()}-${report.reportId}.md`,
      content: lines.join('\n'),
      generatedAt: report.generatedAt,
    };
  }
}
