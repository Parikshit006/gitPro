/* ============================================================
   GitPro — Notification Mutation Hook
   
   TanStack Query hook for dispatching reports/alerts via 
   Email, Slack, or Webhook.
   ============================================================ */

import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { NotificationRequest, NotificationResult, NotificationChannel } from '../lib/types';

export function useSendNotification() {
  return useMutation<NotificationResult, Error, { channel: NotificationChannel; data: NotificationRequest }>({
    mutationFn: ({ channel, data }) => 
      api.post(`/notifications/${channel}`, data) as Promise<NotificationResult>,
  });
}
