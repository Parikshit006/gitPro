/* ============================================================
   GitPro — Report Download Utility

   Handles fetching binary/text blobs for reports, creating
   ObjectURLs, and triggering browser downloads.

   Backend routes (report.routes.ts):
     GET /api/v1/reports/executive       (also /reports/executive)
     GET /api/v1/reports/repository/:id
     GET /api/v1/reports/developer/:id
     GET /api/v1/reports/organization
     GET /api/v1/reports/weekly
     GET /api/v1/reports/monthly

   IMPORTANT: report routes use lowercase route segments.
   The ReportClassification type values ('EXECUTIVE', etc.) must
   be lowercased when building the URL path.
   ============================================================ */

import { useState } from 'react';
import { apiRaw } from '../lib/api';
import type { ReportClassification, ReportFormat } from '../lib/types';

const CLASSIFICATION_TO_PATH: Record<ReportClassification, string> = {
  EXECUTIVE: 'executive',
  REPOSITORY: 'repository',
  DEVELOPER: 'developer',
  ORGANIZATION: 'organization',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

export function useReportDownload() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadReport = async (
    classification: ReportClassification,
    format: ReportFormat,
    repositoryId?: string,
    action: 'download' | 'preview' = 'download'
  ): Promise<string | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Build path — classification must be lowercase for backend routes
      const pathSegment = CLASSIFICATION_TO_PATH[classification] || classification.toLowerCase();

      // Repository and Developer reports require an ID in the path
      const needsId = classification === 'REPOSITORY' || classification === 'DEVELOPER';
      const path = needsId && repositoryId
        ? `/reports/${pathSegment}/${repositoryId}`
        : `/reports/${pathSegment}`;

      const response = await apiRaw.get(path, {
        params: { format },
        responseType: format === 'pdf' ? 'blob' : 'text',
        withCredentials: true,
      });

      const mimeTypes: Record<ReportFormat, string> = {
        pdf: 'application/pdf',
        html: 'text/html',
        markdown: 'text/markdown',
        json: 'application/json',
      };

      const extensions: Record<ReportFormat, string> = {
        pdf: 'pdf',
        html: 'html',
        markdown: 'md',
        json: 'json',
      };

      let blobData = response.data;
      if (typeof blobData === 'string' && format === 'json') {
        try {
          blobData = JSON.stringify(JSON.parse(blobData), null, 2);
        } catch (_e) {
          // keep as-is if parse fails
        }
      }

      const blob = new Blob([blobData], { type: mimeTypes[format] });
      const objectUrl = window.URL.createObjectURL(blob);

      if (action === 'download') {
        const link = document.createElement('a');
        link.href = objectUrl;
        const repoSuffix = repositoryId ? `-${repositoryId.slice(0, 8)}` : '';
        link.download = `GitPro-${pathSegment}${repoSuffix}.${extensions[format]}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
        return null;
      } else {
        // Return object URL for preview modal or iframe
        return objectUrl;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate report.';
      setError(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { downloadReport, isGenerating, error };
}
