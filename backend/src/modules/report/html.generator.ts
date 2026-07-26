/**
 * HTML Report Generator (`src/modules/report/html.generator.ts`)
 *
 * Purpose:
 *   Generates responsive HTML engineering reports from immutable ReportDTOs.
 *
 * Strict Architectural Rules:
 *   - Zero inline business logic, zero Prisma queries, zero repository imports.
 *   - Strictly presentation formatting.
 */

import { ReportDTO, ReportResult } from './report.types';

export class HTMLGenerator {
  /**
   * Generates a responsive HTML report string from an immutable ReportDTO.
   */
  static generate(report: ReportDTO): ReportResult {
    const renderTable = (items: ReadonlyArray<Record<string, unknown>>): string => {
      if (items.length === 0) return `<p class="empty-state">No records evaluated.</p>`;
      const keys = Object.keys(items[0]);
      const headers = keys.map((k) => `<th>${k}</th>`).join('');
      const rows = items
        .map((row) => {
          const cells = keys
            .map((k) => {
              const val = row[k];
              return `<td>${val !== undefined && val !== null ? String(val) : '-'}</td>`;
            })
            .join('');
          return `<tr>${cells}</tr>`;
        })
        .join('');
      return `<div class="table-wrapper"><table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
    };

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.title} - GitPro Report</title>
  <style>
    :root { --primary: #2563eb; --bg: #f8fafc; --card: #ffffff; --text: #0f172a; --border: #e2e8f0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; margin: 0; padding: 40px 20px; }
    .container { max-width: 1000px; margin: 0 auto; background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    header { border-bottom: 2px solid var(--primary); padding-bottom: 20px; margin-bottom: 30px; }
    h1 { margin: 0 0 10px 0; color: var(--primary); }
    .meta { font-size: 0.9em; color: #64748b; }
    section { margin-bottom: 40px; }
    h2 { border-bottom: 1px solid var(--border); padding-bottom: 8px; color: #1e293b; }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid var(--border); }
    th { background: #f1f5f9; font-weight: 600; }
    .empty-state { font-style: italic; color: #64748b; }
    .ai-box { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; border-radius: 4px; }
    footer { text-align: center; font-size: 0.85em; color: #64748b; border-top: 1px solid var(--border); padding-top: 20px; margin-top: 50px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${report.title}</h1>
      ${report.subtitle ? `<p class="subtitle">${report.subtitle}</p>` : ''}
      <div class="meta">
        <strong>Report Type:</strong> ${report.reportType} | <strong>Generated:</strong> ${report.generatedAt}
      </div>
    </header>
    <section>
      <h2>Executive Summary</h2>
      <p>${report.executiveSummary}</p>
    </section>
    <section>
      <h2>Repository Health</h2>
      ${renderTable(report.repositoryHealth)}
    </section>
    <section>
      <h2>Bus Factor Analysis</h2>
      ${renderTable(report.busFactor)}
    </section>
    <section>
      <h2>Code Ownership Silos</h2>
      ${renderTable(report.ownership)}
    </section>
    <section>
      <h2>High-Churn Hotspots</h2>
      ${renderTable(report.hotspots)}
    </section>
    <section>
      <h2>Prescriptive Recommendations</h2>
      ${renderTable(report.recommendations)}
    </section>
    <section>
      <h2>AI Executive Synthesis</h2>
      <div class="ai-box"><p>${report.aiSummary}</p></div>
    </section>
    <footer>
      ${report.footer}
    </footer>
  </div>
</body>
</html>`;

    return {
      format: 'html',
      contentType: 'text/html; charset=utf-8',
      filename: `gitpro-report-${report.reportType.toLowerCase()}-${report.reportId}.html`,
      content: html,
      generatedAt: report.generatedAt,
    };
  }
}
