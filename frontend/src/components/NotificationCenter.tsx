import { useState } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Send, RotateCcw, Check, Trash2 } from 'lucide-react';
import { Badge } from './ui/Badge';
import { useSendNotification } from '../hooks/useNotifications';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  channel: 'email' | 'slack' | 'webhook';
  recipient: string;
  status: 'DELIVERED' | 'FAILED' | 'PENDING';
  timestamp: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Weekly Executive Report Delivered',
    message: 'Automated weekly PDF scorecard dispatched successfully.',
    channel: 'email',
    recipient: 'exec-team@gitpro.io',
    status: 'DELIVERED',
    timestamp: '10 mins ago',
  },
  {
    id: 'notif-2',
    title: 'Critical Bus Factor Alert',
    message: 'Maintainer concentration detected in src/payments (Bus Factor ≤ 1).',
    channel: 'slack',
    recipient: '#eng-architecture-alerts',
    status: 'DELIVERED',
    timestamp: '2 hours ago',
  },
  {
    id: 'notif-3',
    title: 'Webhook Sync Notification Failed',
    message: 'Endpoint timeout while publishing commit velocity event payload.',
    channel: 'webhook',
    recipient: 'https://api.internal.dev/webhook',
    status: 'FAILED',
    timestamp: '5 hours ago',
  },
];

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const { mutate: retryNotification, isPending: isRetrying } = useSendNotification();

  const unreadCount = notifications.filter((n) => n.status === 'FAILED').length || 1;

  const handleRetry = (item: NotificationItem) => {
    retryNotification(
      {
        channel: item.channel,
        data: {
          recipient: item.recipient,
          subject: `[RETRY] ${item.title}`,
          metadata: { originalNotificationId: item.id },
        },
      },
      {
        onSuccess: () => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === item.id ? { ...n, status: 'DELIVERED', timestamp: 'Just now' } : n))
          );
        },
      }
    );
  };

  const handleClear = () => {
    setNotifications([]);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text)] hover:bg-[var(--bg-hover)] transition-all flex items-center justify-center"
        title="Notification Center"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--risk)] animate-pulse border-2 border-[var(--bg)]" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] shadow-2xl z-50 overflow-hidden animate-fade-in flex flex-col">
            
            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-sm text-[var(--text)]">Notification Center</span>
                <Badge variant="neutral">{notifications.length}</Badge>
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={handleClear}
                  className="text-xs text-muted hover:text-[var(--risk)] transition-colors flex items-center gap-1 font-mono"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear All
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border-subtle)] p-1">
              {notifications.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center justify-center text-muted">
                  <Check className="w-8 h-8 text-[var(--healthy)] opacity-50 mb-2" />
                  <span className="text-sm font-medium">All caught up!</span>
                  <span className="text-xs text-muted/60 mt-0.5">No recent automated report or risk alerts.</span>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className="p-3 rounded-xl hover:bg-[var(--bg-hover)] transition-colors flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {notif.status === 'DELIVERED' ? (
                          <CheckCircle2 className="w-4 h-4 text-[var(--healthy)] shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-[var(--risk)] shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-[var(--text)] truncate">{notif.title}</span>
                      </div>
                      <span className="text-[10px] font-mono text-muted shrink-0">{notif.timestamp}</span>
                    </div>

                    <p className="text-xs text-muted leading-relaxed pl-6">{notif.message}</p>

                    <div className="flex items-center justify-between pl-6 pt-1">
                      <span className="text-[10px] font-mono uppercase text-muted/70 bg-[var(--bg)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                        {notif.channel} → {notif.recipient}
                      </span>

                      {notif.status === 'FAILED' && (
                        <button
                          onClick={() => handleRetry(notif)}
                          disabled={isRetrying}
                          className="text-[11px] font-mono font-medium text-[var(--text)] hover:text-[var(--healthy)] flex items-center gap-1 transition-colors"
                        >
                          <RotateCcw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} /> Retry
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-[var(--border-subtle)] bg-[var(--bg)] text-center">
              <a href="/reports" className="text-xs font-medium text-[var(--healthy)] hover:underline flex items-center justify-center gap-1">
                <Send className="w-3 h-3" /> Manage automated delivery schedules
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
