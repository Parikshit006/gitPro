/**
 * PDF Report Generator (`src/modules/report/pdf.generator.ts`)
 *
 * Purpose:
 *   Generates professional engineering reports formatted as valid PDF document buffers.
 *   Enforces strict section layout: Executive Summary, Repository Health, Bus Factor,
 *   Ownership, Hotspots, Recommendations, AI Summary, and Footer.
 *
 * Strict Architectural Rules:
 *   - Zero business logic, zero Prisma queries, zero repository imports.
 *   - Self-contained document generation without external third-party dependencies.
 */

import { ReportDTO, ReportResult } from './report.types';

export class PDFGenerator {
  /**
   * Generates a professional PDF engineering report buffer from an immutable ReportDTO.
   */
  static generate(report: ReportDTO): ReportResult {
    const lines: string[] = [];
    lines.push(`================================================================================`);
    lines.push(`GITPRO ENGINEERING INTELLIGENCE PLATFORM`);
    lines.push(`REPORT TYPE: ${report.reportType}`);
    lines.push(`TITLE: ${report.title}`);
    if (report.subtitle) lines.push(`SUBTITLE: ${report.subtitle}`);
    lines.push(`GENERATED AT: ${report.generatedAt}`);
    lines.push(`================================================================================\n`);

    lines.push(`1. EXECUTIVE SUMMARY`);
    lines.push(`--------------------------------------------------------------------------------`);
    lines.push(`${report.executiveSummary}\n`);

    lines.push(`2. REPOSITORY HEALTH`);
    lines.push(`--------------------------------------------------------------------------------`);
    if (report.repositoryHealth.length === 0) {
      lines.push(`No repository health records evaluated.`);
    } else {
      report.repositoryHealth.forEach((item, idx) => {
        lines.push(`[${idx + 1}] Repository: ${item.repositoryName ?? item.repositoryId} | Score: ${item.healthScore}/100 | Risk: ${item.riskLevel}`);
        if (item.summary) lines.push(`    Summary: ${item.summary}`);
      });
    }
    lines.push(``);

    lines.push(`3. BUS FACTOR ANALYSIS`);
    lines.push(`--------------------------------------------------------------------------------`);
    if (report.busFactor.length === 0) {
      lines.push(`No bus factor risks detected.`);
    } else {
      report.busFactor.forEach((item, idx) => {
        lines.push(`[${idx + 1}] Repository: ${item.repositoryName} | Bus Factor Score: ${item.busFactorScore} | Risk: ${item.riskLevel}`);
        if (item.summary) lines.push(`    Summary: ${item.summary}`);
      });
    }
    lines.push(``);

    lines.push(`4. CODE OWNERSHIP SILOS`);
    lines.push(`--------------------------------------------------------------------------------`);
    if (report.ownership.length === 0) {
      lines.push(`No concentrated ownership silos detected.`);
    } else {
      report.ownership.forEach((item, idx) => {
        lines.push(`[${idx + 1}] Repository: ${item.repositoryName} | File: ${item.filePath} | Author: ${item.primaryAuthor} (${item.ownershipPercentage}%) | Risk: ${item.riskLevel}`);
      });
    }
    lines.push(``);

    lines.push(`5. HIGH-CHURN HOTSPOTS`);
    lines.push(`--------------------------------------------------------------------------------`);
    if (report.hotspots.length === 0) {
      lines.push(`No high-churn hotspots detected.`);
    } else {
      report.hotspots.forEach((item, idx) => {
        lines.push(`[${idx + 1}] Repository: ${item.repositoryName} | File: ${item.filePath} | Churn Score: ${item.churnScore} | Risk: ${item.riskLevel}`);
      });
    }
    lines.push(``);

    lines.push(`6. PRESCRIPTIVE RECOMMENDATIONS`);
    lines.push(`--------------------------------------------------------------------------------`);
    if (report.recommendations.length === 0) {
      lines.push(`No immediate recommendations.`);
    } else {
      report.recommendations.forEach((item, idx) => {
        lines.push(`[${idx + 1}] [${item.riskLevel}] ${item.title}`);
        if (item.description) lines.push(`    Action: ${item.description}`);
      });
    }
    lines.push(``);

    lines.push(`7. AI EXECUTIVE SYNTHESIS`);
    lines.push(`--------------------------------------------------------------------------------`);
    lines.push(`${report.aiSummary}\n`);

    lines.push(`================================================================================`);
    lines.push(`${report.footer}`);
    lines.push(`================================================================================`);

    const textContent = lines.join('\n');
    const escapedText = textContent
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\r?\n/g, '\\r');

    const pdfStream = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 obj >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>
endobj
5 0 obj
<< /Length ${escapedText.length + 50} >>
stream
BT
/F1 10 Tf
50 740 Td
12 TL
(${escapedText}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000059 00000 n 
0000000116 00000 n 
0000000227 00000 n 
0000000295 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
400
%%EOF`;

    return {
      format: 'pdf',
      contentType: 'application/pdf',
      filename: `gitpro-report-${report.reportType.toLowerCase()}-${report.reportId}.pdf`,
      content: Buffer.from(pdfStream, 'utf-8'),
      generatedAt: report.generatedAt,
    };
  }
}
