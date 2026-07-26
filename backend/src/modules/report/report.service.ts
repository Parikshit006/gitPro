/**
 * Report Service (Orchestration Engine)
 *
 * Purpose:
 *   Orchestrates data gathering across Dashboard, Insight, AI, and Search domains.
 *   Delegates DTO transformation to ReportMapper and format rendering to export generators.
 *
 * Strict Architectural Rules:
 *   - Only orchestration: zero PDF logic, zero HTML templates, zero Markdown formatting.
 *   - Delegates everything. Never access Git or Graph directly.
 */

import { ReportRepository } from './report.repository';
import { ReportMapper } from './report.mapper';
import { ReportDTO, ReportFormat, ReportResult } from './report.types';
import { PDFGenerator } from './pdf.generator';
import { HTMLGenerator } from './html.generator';
import { MarkdownGenerator } from './markdown.generator';
import { JSONGenerator } from './json.generator';
import { InsightService } from '../insights/insight.service';
import { AIService } from '../ai/ai.service';
import { SearchService } from '../search/search.service';
import { ContextBuilder } from '../ai/context.builder';
import { AppError } from '../../errors/AppError';
import { HTTP_STATUS } from '../../constants/httpStatus';

export class ReportService {
  private readonly reportRepo: ReportRepository;
  private readonly insightService: InsightService;
  private readonly aiService: AIService;
  private readonly searchService: SearchService;

  constructor(
    reportRepo?: ReportRepository,
    insightService?: InsightService,
    aiService?: AIService,
    searchService?: SearchService,
  ) {
    this.reportRepo = reportRepo ?? new ReportRepository();
    this.insightService = insightService ?? new InsightService();
    this.aiService = aiService ?? new AIService();
    this.searchService = searchService ?? new SearchService();
  }

  /**
   * Delegates DTO formatting to the requested export generator.
   */
  private exportReport(dto: ReportDTO, format: ReportFormat): ReportResult {
    switch (format.toLowerCase() as ReportFormat) {
      case 'pdf':
        return PDFGenerator.generate(dto);
      case 'html':
        return HTMLGenerator.generate(dto);
      case 'markdown':
        return MarkdownGenerator.generate(dto);
      case 'json':
      default:
        return JSONGenerator.generate(dto);
    }
  }

  /**
   * Generates a high-level executive report across tracked workspaces.
   */
  async generateExecutiveReport(format: ReportFormat = 'json'): Promise<ReportResult> {
    const execSummary = await this.insightService.getExecutiveSummary();
    const context = ContextBuilder.fromExecutiveSummary(execSummary);
    const aiResponse = await this.aiService.summarize(context).catch(() => undefined);
    const searchData = await this.searchService.search({ filter: { entityType: 'ALL' } });

    const dto = ReportMapper.toReportDTO({
      reportId: `exec-${Date.now()}`,
      reportType: 'EXECUTIVE',
      title: 'GitPro Executive Engineering Report',
      subtitle: `Organization Health Evaluation across ${execSummary.totalRepositoriesCount} workspace(s)`,
      executiveSummary: execSummary,
      aiResponse,
      searchData,
    });

    return this.exportReport(dto, format);
  }

  /**
   * Generates a comprehensive engineering report for a single repository.
   */
  async generateRepositoryReport(repositoryId: string, format: ReportFormat = 'json'): Promise<ReportResult> {
    const repo = await this.reportRepo.getRepositoryById(repositoryId);
    if (!repo) {
      throw new AppError(`Repository with id '${repositoryId}' not found.`, HTTP_STATUS.NOT_FOUND, true);
    }

    const insights = await this.insightService.getRepositoryInsights(repositoryId);
    const context = ContextBuilder.fromRepositoryInsight(insights);
    const aiResponse = await this.aiService.summarize(context).catch(() => undefined);

    const dto = ReportMapper.toReportDTO({
      reportId: `repo-${repositoryId}-${Date.now()}`,
      reportType: 'REPOSITORY',
      title: `Repository Intelligence Report: ${repo.fullName}`,
      subtitle: `Health Index: ${insights.overallHealthScore}/100 (${insights.overallRiskLevel})`,
      insights: [insights],
      aiResponse,
    });

    return this.exportReport(dto, format);
  }

  /**
   * Generates a contributor and developer productivity report.
   */
  async generateDeveloperReport(developerId: string, format: ReportFormat = 'json'): Promise<ReportResult> {
    const devs = await this.reportRepo.getDevelopers();
    const targetDev = devs.find((d) => d.id === developerId || d.email === developerId);
    if (!targetDev) {
      throw new AppError(`Developer '${developerId}' not found.`, HTTP_STATUS.NOT_FOUND, true);
    }

    const searchData = await this.searchService.search({
      query: targetDev.email,
      filter: { authorEmail: targetDev.email },
    });

    const prompt = `Synthesize an executive briefing on contributor ${targetDev.email} who has authored code across ${searchData.ownership.length} tracked modules.`;
    const aiResponse = await this.aiService.generateResponse(prompt).catch(() => undefined);

    const dto = ReportMapper.toReportDTO({
      reportId: `dev-${developerId}-${Date.now()}`,
      reportType: 'DEVELOPER',
      title: `Developer Impact Report: ${targetDev.name ?? targetDev.email}`,
      subtitle: `Contributor Evaluation & Ownership Distribution`,
      aiResponse,
      searchData,
    });

    return this.exportReport(dto, format);
  }

  /**
   * Generates an organization-wide report combining all repositories and metrics.
   */
  async generateOrganizationReport(format: ReportFormat = 'json'): Promise<ReportResult> {
    const repos = await this.reportRepo.getRepositories(0, 100);
    const insightsList = await Promise.all(
      repos.map((r) => this.insightService.getRepositoryInsights(r.id).catch(() => null)),
    );
    const validInsights = insightsList.filter((i): i is NonNullable<typeof i> => i !== null);

    const execSummary = await this.insightService.getExecutiveSummary();
    const context = ContextBuilder.fromExecutiveSummary(execSummary);
    const aiResponse = await this.aiService.summarize(context).catch(() => undefined);

    const dto = ReportMapper.toReportDTO({
      reportId: `org-${Date.now()}`,
      reportType: 'ORGANIZATION',
      title: 'GitPro Organization Intelligence Report',
      subtitle: `Comprehensive Evaluation across ${validInsights.length} Active Repositories`,
      insights: validInsights,
      executiveSummary: execSummary,
      aiResponse,
    });

    return this.exportReport(dto, format);
  }

  /**
   * Generates a weekly engineering digest.
   */
  async generateWeeklyReport(format: ReportFormat = 'json'): Promise<ReportResult> {
    const execSummary = await this.insightService.getExecutiveSummary();
    const aiResponse = await this.aiService.generateResponse('Summarize organizational engineering health for our weekly executive briefing. Focus on churn hotspots and peer review bottleneck mitigation.').catch(() => undefined);
    const searchData = await this.searchService.search({ filter: { entityType: 'ALL' } });

    const dto = ReportMapper.toReportDTO({
      reportId: `weekly-${Date.now()}`,
      reportType: 'WEEKLY',
      title: 'GitPro Weekly Engineering Digest',
      subtitle: `7-Day Engineering Health & Churn Evaluation`,
      executiveSummary: execSummary,
      aiResponse,
      searchData,
    });

    return this.exportReport(dto, format);
  }

  /**
   * Generates a monthly engineering review report.
   */
  async generateMonthlyReport(format: ReportFormat = 'json'): Promise<ReportResult> {
    const execSummary = await this.insightService.getExecutiveSummary();
    const aiResponse = await this.aiService.generateResponse('Summarize organizational engineering health for our monthly strategic review. Focus on maintainer bus factor redundancy and code ownership distribution.').catch(() => undefined);
    const searchData = await this.searchService.search({ filter: { entityType: 'ALL' } });

    const dto = ReportMapper.toReportDTO({
      reportId: `monthly-${Date.now()}`,
      reportType: 'MONTHLY',
      title: 'GitPro Monthly Strategic Review',
      subtitle: `30-Day Maintainer Redundancy & Risk Report`,
      executiveSummary: execSummary,
      aiResponse,
      searchData,
    });

    return this.exportReport(dto, format);
  }
}
