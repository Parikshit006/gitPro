/* ============================================================
   GitPro — Report Download Utility
   
   Handles fetching binary/text blobs for reports, creating
   ObjectURLs, and triggering browser downloads.
   ============================================================ */

import { useState } from 'react';
import { apiRaw } from '../lib/api';
import type { ReportClassification, ReportFormat } from '../lib/types';

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
      const response = await apiRaw.get(`/reports/${classification}`, {
        params: { format, repositoryId },
        responseType: format === 'pdf' ? 'blob' : 'text',
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
          // ensure JSON is formatted nicely for string blob
          try {
             blobData = JSON.stringify(JSON.parse(blobData), null, 2);
          } catch(e) {
             // do nothing
          }
      }

      const blob = new Blob([blobData], { type: mimeTypes[format] });
      const objectUrl = window.URL.createObjectURL(blob);

      if (action === 'download') {
        const link = document.createElement('a');
        link.href = objectUrl;
        const repoSuffix = repositoryId ? `-${repositoryId.slice(0,8)}` : '';
        link.download = `GitPro-${classification}${repoSuffix}.${extensions[format]}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
        return null;
      } else {
        // Return object URL for preview modal or iframe
        return objectUrl;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate report.');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { downloadReport, isGenerating, error };
}
