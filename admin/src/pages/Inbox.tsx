import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Users,
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
  Send,
  MessageSquare,
  Search,
} from 'lucide-react';
import { api } from '../lib/api';
import type { ContactMessage, NewsletterSubscriber } from '../types/api';
import { formatDateTimeIST } from '../lib/format';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';

type ActiveTab = 'messages' | 'subscribers';
type MessageStatusFilter = 'all' | 'new' | 'read' | 'replied';

export const Inbox: React.FC = () => {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ActiveTab>('messages');
  const [messageStatusFilter, setMessageStatusFilter] = useState<MessageStatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch Contact Messages: GET /api/admin/crm/contact
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    isFetching: isFetchingMessages,
    refetch: refetchMessages,
  } = useQuery<{
    items: ContactMessage[];
    total: number;
  }>({
    queryKey: ['crm-contact-messages', messageStatusFilter],
    queryFn: async () => {
      const params: Record<string, any> = { limit: 100 };
      if (messageStatusFilter !== 'all') {
        params.status = messageStatusFilter;
      }
      const res = await api.get<{ items: ContactMessage[]; total: number }>(
        '/api/admin/crm/contact',
        { params }
      );
      return res;
    },
    enabled: activeTab === 'messages',
  });

  // 2. Fetch Newsletter Subscribers: GET /api/admin/crm/newsletter
  const {
    data: subscribersData,
    isLoading: isLoadingSubscribers,
    isFetching: isFetchingSubscribers,
    refetch: refetchSubscribers,
  } = useQuery<{
    items: NewsletterSubscriber[];
    total: number;
  }>({
    queryKey: ['crm-newsletter-subscribers'],
    queryFn: async () => {
      const res = await api.get<{ items: NewsletterSubscriber[]; total: number }>(
        '/api/admin/crm/newsletter',
        { params: { limit: 100 } }
      );
      return res;
    },
    enabled: activeTab === 'subscribers',
  });

  const messages = messagesData?.items || [];
  const subscribers = subscribersData?.items || [];

  const filteredMessages = messages.filter((m) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      m.name.toLowerCase().includes(term) ||
      m.email.toLowerCase().includes(term) ||
      (m.subject || '').toLowerCase().includes(term) ||
      m.message.toLowerCase().includes(term)
    );
  });

  const filteredSubscribers = subscribers.filter((s) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return s.email.toLowerCase().includes(term);
  });

  // Status update for contact messages: PATCH /api/admin/crm/contact/:id/status
  const handleUpdateMessageStatus = async (id: string, status: 'read' | 'replied') => {
    try {
      await api.patch(`/api/admin/crm/contact/${id}/status`, { status });
      toast.success(`Message marked as ${status}`);
      queryClient.invalidateQueries({ queryKey: ['crm-contact-messages'] });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update message status');
    }
  };

  // CSV Export for Messages
  const handleExportMessages = () => {
    if (messages.length === 0) {
      toast.error('No messages to export');
      return;
    }
    const headers = ['ID', 'Date (IST)', 'Customer Name', 'Email', 'Subject', 'Message', 'Status'];
    const rows = messages.map((m) => [
      `"${m._id || m.id || ''}"`,
      `"${formatDateTimeIST(m.createdAt)}"`,
      `"${(m.name || '').replace(/"/g, '""')}"`,
      `"${m.email}"`,
      `"${(m.subject || '').replace(/"/g, '""')}"`,
      `"${(m.message || '').replace(/"/g, '""')}"`,
      `"${m.status}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `offscript-contact-messages-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${messages.length} messages`);
  };

  // CSV Export for Subscribers
  const handleExportSubscribers = () => {
    if (subscribers.length === 0) {
      toast.error('No subscribers to export');
      return;
    }
    const headers = ['Email', 'Subscribed Date (IST)'];
    const rows = subscribers.map((s) => [
      `"${s.email}"`,
      `"${formatDateTimeIST(s.createdAt)}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `offscript-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${subscribers.length} subscribers`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inbox & CRM</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage inbound customer support inquiries and your newsletter audience.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              activeTab === 'messages' ? refetchMessages() : refetchSubscribers()
            }
            disabled={isFetchingMessages || isFetchingSubscribers}
            className="gap-1.5 text-xs"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                isFetchingMessages || isFetchingSubscribers ? 'animate-spin' : ''
              }`}
            />
            <span>Refresh</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={activeTab === 'messages' ? handleExportMessages : handleExportSubscribers}
            className="gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Main Mode Tabs: Messages vs Subscribers */}
      <div className="flex items-center gap-3 border-b">
        <button
          onClick={() => {
            setActiveTab('messages');
            setSearchTerm('');
          }}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'messages'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Mail className="h-4 w-4" />
          <span>Customer Messages</span>
          {messages.filter((m) => m.status === 'unread' || m.status === 'new').length > 0 && (
            <Badge variant="warning" className="text-[10px] px-1.5 py-0">
              {messages.filter((m) => m.status === 'unread' || m.status === 'new').length} new
            </Badge>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('subscribers');
            setSearchTerm('');
          }}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'subscribers'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Newsletter Subscribers</span>
          {subscribers.length > 0 && (
            <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
              {subscribers.length}
            </Badge>
          )}
        </button>
      </div>

      {/* Tab 1: Messages */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          {/* Status Sub-filter Bar & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['all', 'new', 'read', 'replied'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setMessageStatusFilter(st)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    messageStatusFilter === st
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-xs h-8"
              />
            </div>
          </div>

          {isLoadingMessages ? (
            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
              <div className="animate-spin h-7 w-7 border-2 border-primary border-t-transparent rounded-full mb-3" />
              <span className="text-xs uppercase tracking-wider font-mono">
                Loading messages...
              </span>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="border border-dashed rounded-xl p-12 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-semibold text-base">No messages</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Customer questions submitted via the contact form will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMessages.map((m) => {
                const isNew = m.status === 'unread' || m.status === 'new';
                const id = m._id || m.id || '';

                return (
                  <Card
                    key={id}
                    className={`shadow-sm transition-all ${
                      isNew ? 'border-primary/40 bg-primary/5' : ''
                    }`}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">{m.name}</span>
                          <span className="text-xs text-muted-foreground font-mono">
                            &lt;{m.email}&gt;
                          </span>
                          {isNew && (
                            <Badge variant="warning" className="text-[10px] px-1 py-0">
                              NEW
                            </Badge>
                          )}
                          {m.status === 'replied' && (
                            <Badge variant="success" className="text-[10px] px-1 py-0">
                              REPLIED
                            </Badge>
                          )}
                        </div>

                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDateTimeIST(m.createdAt)}</span>
                        </div>
                      </div>

                      {m.subject && (
                        <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                          Subject: {m.subject}
                        </h4>
                      )}

                      <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed bg-card p-3 rounded border">
                        {m.message}
                      </p>

                      <div className="flex items-center justify-between pt-2">
                        <a
                          href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(
                            m.subject || 'OFFSCRIPT Support'
                          )}`}
                          onClick={() => handleUpdateMessageStatus(id, 'replied')}
                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold"
                        >
                          <Send className="h-3 w-3" />
                          <span>Reply via Email</span>
                        </a>

                        <div className="flex items-center gap-2">
                          {isNew && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateMessageStatus(id, 'read')}
                              className="h-7 text-xs"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" /> Mark Read
                            </Button>
                          )}
                          {m.status !== 'replied' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleUpdateMessageStatus(id, 'replied')}
                              className="h-7 text-xs"
                            >
                              Mark as Replied
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Subscribers */}
      {activeTab === 'subscribers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Subscribers: <span className="font-mono text-foreground font-bold">{subscribers.length}</span>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-xs h-8"
              />
            </div>
          </div>

          {isLoadingSubscribers ? (
            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
              <div className="animate-spin h-7 w-7 border-2 border-primary border-t-transparent rounded-full mb-3" />
              <span className="text-xs uppercase tracking-wider font-mono">
                Loading subscribers...
              </span>
            </div>
          ) : filteredSubscribers.length === 0 ? (
            <div className="border border-dashed rounded-xl p-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-semibold text-base">No subscribers yet</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Customers who subscribe to the newsletter on the storefront will appear here.
              </p>
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">Subscriber Email</th>
                    <th className="p-3">Joined Date (IST)</th>
                    <th className="p-3 text-right">Quick Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredSubscribers.map((sub, idx) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono font-medium text-foreground">{sub.email}</td>
                      <td className="p-3 text-muted-foreground">
                        {formatDateTimeIST(sub.createdAt)}
                      </td>
                      <td className="p-3 text-right">
                        <a
                          href={`mailto:${sub.email}`}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Mail className="h-3 w-3" />
                          <span>Send Email</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
