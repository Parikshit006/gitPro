/* ============================================================
   GitPro — Report Preview Modal
   ============================================================ */

import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Download } from 'lucide-react';
import type { ReportFormat } from '../lib/types';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  objectUrl: string | null;
  format: ReportFormat;
}

export function ReportPreviewModal({ isOpen, onClose, title, objectUrl, format }: ReportPreviewModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="900px">
      <div className="flex flex-col gap-4">
        <div className="bg-[var(--bg)] border border-[var(--border)] rounded-md overflow-hidden min-h-[500px] flex items-center justify-center">
          {!objectUrl ? (
            <span className="text-muted font-body">Generating preview...</span>
          ) : format === 'pdf' || format === 'html' ? (
            <iframe 
              src={objectUrl} 
              title="Report Preview" 
              className="w-full h-[600px] border-none bg-white" 
            />
          ) : (
            <iframe 
              src={objectUrl} 
              title="Report Preview Text" 
              className="w-full h-[600px] border-none" 
            />
          )}
        </div>

        <div className="flex justify-between items-center mt-2">
          <p className="text-sm text-muted">
            Previewing {format.toUpperCase()} format. Some elements may look different when downloaded.
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            {objectUrl && (
              <Button 
                variant="primary" 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = objectUrl;
                  link.download = `GitPro-${title.replace(/\s+/g, '-')}.${format}`;
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                }}
              >
                <Download className="w-4 h-4" />
                Download File
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
