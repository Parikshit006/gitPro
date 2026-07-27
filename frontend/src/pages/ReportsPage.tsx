/* ============================================================
   GitPro — Reports & Notifications Page
   ============================================================ */

import React, { useState } from 'react';
import { FileText, Send, Download, Mail, MessageSquare, Webhook, Eye } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ReportPreviewModal } from '../components/ReportPreviewModal';
import { useReportDownload } from '../hooks/useReports';
import { useSendNotification } from '../hooks/useNotifications';
import type { ReportClassification, ReportFormat, NotificationChannel } from '../lib/types';
import './ReportsPage.css';

export default function ReportsPage() {
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>('pdf');
  const [previewData, setPreviewData] = useState<{ url: string | null; title: string } | null>(null);
  
  // Notification Form State
  const [notifyChannel, setNotifyChannel] = useState<NotificationChannel>('email');
  const [notifyRecipient, setNotifyRecipient] = useState('');
  const [notifyType, setNotifyType] = useState<ReportClassification>('EXECUTIVE');

  const { downloadReport, isGenerating } = useReportDownload();
  const sendNotification = useSendNotification();

  const reportTypes: { id: ReportClassification; title: string; description: string }[] = [
    { id: 'EXECUTIVE', title: 'Executive Summary', description: 'High-level aggregation of all repositories, focused on risk and velocity.' },
    { id: 'ORGANIZATION', title: 'Organization Health', description: 'Deep dive into structural engineering health across the organization.' },
    { id: 'DEVELOPER', title: 'Developer Activity', description: 'Insights into knowledge distribution and key contributor metrics.' },
  ];

  const handleDownload = async (type: ReportClassification) => {
    await downloadReport(type, selectedFormat, undefined, 'download');
  };

  const handlePreview = async (type: ReportClassification, title: string) => {
    // Open modal with loading state immediately
    setPreviewData({ url: null, title });
    
    const url = await downloadReport(type, selectedFormat, undefined, 'preview');
    if (url) {
      setPreviewData({ url, title });
    } else {
      setPreviewData(null); // Close on error
    }
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyRecipient) return;

    sendNotification.mutate({
      channel: notifyChannel,
      data: {
        recipient: notifyRecipient,
        subject: `GitPro ${notifyType} Report`,
        metadata: { reportType: notifyType, format: selectedFormat }
      }
    });
  };

  return (
    <div className="reports-page flex flex-col gap-8">
      <PageHeader 
        title="Reports & Notifications" 
        description="Generate point-in-time snapshots and automate delivery of engineering intelligence."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Report Generation */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-xl">Generate Reports</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted">Format:</span>
              <select 
                className="bg-[var(--bg-surface)] border border-[var(--border)] rounded px-3 py-1.5 text-sm font-body text-[var(--text)] outline-none focus:border-[var(--healthy)]"
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as ReportFormat)}
              >
                <option value="pdf">PDF</option>
                <option value="markdown">Markdown</option>
                <option value="html">HTML</option>
                <option value="json">JSON (Data Only)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTypes.map(report => (
              <Card key={report.id} className="flex flex-col h-full justify-between">
                <div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[var(--bg-hover)] rounded-md border border-[var(--border-subtle)]">
                        <FileText className="w-5 h-5 text-muted" />
                      </div>
                      <CardTitle>{report.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{report.description}</p>
                  </CardContent>
                </div>
                
                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[var(--border-subtle)]">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => handlePreview(report.id, report.title)}
                    disabled={isGenerating}
                  >
                    <Eye className="w-4 h-4" /> Preview
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => handleDownload(report.id)}
                    disabled={isGenerating}
                  >
                    <Download className="w-4 h-4" /> Export
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Col: Notifications Setup */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <h3 className="font-display text-xl mb-2">Automated Delivery</h3>
          
          <Card>
            <form onSubmit={handleSendNotification} className="flex flex-col gap-5">
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[var(--text)]">Delivery Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'email', icon: Mail, label: 'Email' },
                    { id: 'slack', icon: MessageSquare, label: 'Slack' },
                    { id: 'webhook', icon: Webhook, label: 'Webhook' }
                  ].map(ch => {
                    const Icon = ch.icon;
                    const isActive = notifyChannel === ch.id;
                    return (
                      <div 
                        key={ch.id}
                        onClick={() => setNotifyChannel(ch.id as NotificationChannel)}
                        className={`
                          flex flex-col items-center justify-center gap-2 p-3 rounded-md cursor-pointer border transition-colors
                          ${isActive 
                            ? 'bg-[var(--bg-hover)] border-[var(--healthy)] text-[var(--healthy)]' 
                            : 'bg-[var(--bg-surface)] border-[var(--border)] text-muted hover:border-[rgba(255,255,255,0.2)]'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{ch.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[var(--text)]">Report Type</label>
                <select 
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded px-3 py-2 text-sm font-body text-[var(--text)] outline-none focus:border-[var(--healthy)]"
                  value={notifyType}
                  onChange={(e) => setNotifyType(e.target.value as ReportClassification)}
                >
                  {reportTypes.map(rt => (
                    <option key={rt.id} value={rt.id}>{rt.title}</option>
                  ))}
                </select>
              </div>

              <Input
                label={notifyChannel === 'email' ? 'Email Address' : notifyChannel === 'slack' ? 'Slack Webhook URL' : 'Endpoint URL'}
                placeholder={notifyChannel === 'email' ? 'eng-leadership@company.com' : 'https://...'}
                value={notifyRecipient}
                onChange={(e) => setNotifyRecipient(e.target.value)}
                required
              />

              <Button 
                type="submit" 
                className="w-full mt-2" 
                isLoading={sendNotification.isPending}
              >
                <Send className="w-4 h-4" />
                Send Now
              </Button>

              {sendNotification.isSuccess && (
                <div className="p-3 bg-[var(--healthy-bg)] text-[var(--healthy)] text-sm rounded-md text-center border border-[rgba(45,212,191,0.2)]">
                  Notification queued successfully!
                </div>
              )}
              {sendNotification.isError && (
                <div className="p-3 bg-[var(--critical-bg)] text-[var(--critical)] text-sm rounded-md text-center border border-[rgba(242,84,91,0.2)]">
                  {sendNotification.error.message || 'Failed to queue notification'}
                </div>
              )}
            </form>
          </Card>
        </div>

      </div>

      <ReportPreviewModal 
        isOpen={!!previewData}
        onClose={() => setPreviewData(null)}
        title={previewData?.title || 'Report Preview'}
        objectUrl={previewData?.url || null}
        format={selectedFormat}
      />
    </div>
  );
}
