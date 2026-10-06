import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const MESSAGE_MAX_LENGTH = 1000;

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read_at: string | null;
  application_id: string;
}

interface ChatConversation {
  application_id: string;
  other_user_name: string;
  job_title: string;
  job_date: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  is_locked: boolean;
  other_user_id: string;
}

export function useChat() {
  const { user, role } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeApplicationId, setActiveApplicationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const activeAppIdRef = useRef<string | null>(null);

  // Keep a ref in sync so the realtime callback can access it without stale closure
  useEffect(() => {
    activeAppIdRef.current = activeApplicationId;
  }, [activeApplicationId]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      let convs: ChatConversation[] = [];

      if (role === 'company') {
        // 1. Get all jobs for this company
        const { data: jobs } = await supabase
          .from('jobs')
          .select('id, funcao, data_evento')
          .eq('company_id', user.id);

        if (!jobs || jobs.length === 0) {
          setConversations([]);
          return;
        }

        const jobIds = jobs.map(j => j.id);
        const jobMap = new Map(jobs.map(j => [j.id, j]));

        // 2. Get all applications for those jobs
        const { data: apps } = await supabase
          .from('applications')
          .select('id, freelancer_id, job_id, status')
          .in('job_id', jobIds);

        if (!apps || apps.length === 0) {
          setConversations([]);
          return;
        }

        // 3. Batch fetch all freelancer profiles
        const freelancerIds = [...new Set(apps.map(a => a.freelancer_id))];
        const { data: profiles } = await supabase
          .from('freelancer_profiles')
          .select('user_id, nome')
          .in('user_id', freelancerIds);

        const profileMap = new Map((profiles ?? []).map(p => [p.user_id, p]));

        // 4. Batch fetch last message per application
        const appIds = apps.map(a => a.id);
        const { data: allMessages } = await supabase
          .from('messages')
          .select('application_id, content, created_at')
          .in('application_id', appIds)
          .order('created_at', { ascending: false });

        // Build a map of last message per application
        const lastMsgMap = new Map<string, { content: string; created_at: string }>();
        (allMessages ?? []).forEach(msg => {
          if (!lastMsgMap.has(msg.application_id)) {
            lastMsgMap.set(msg.application_id, { content: msg.content, created_at: msg.created_at });
          }
        });

        // 5. Batch fetch unread counts
        const { data: unreadMessages } = await supabase
          .from('messages')
          .select('application_id')
          .in('application_id', appIds)
          .neq('sender_id', user.id)
          .is('read_at', null);

        const unreadCountMap = new Map<string, number>();
        (unreadMessages ?? []).forEach(msg => {
          unreadCountMap.set(msg.application_id, (unreadCountMap.get(msg.application_id) ?? 0) + 1);
        });

        convs = apps.map(app => {
          const job = jobMap.get(app.job_id);
          const profile = profileMap.get(app.freelancer_id);
          const lastMsg = lastMsgMap.get(app.id);
          const nome = profile?.nome ?? 'Freelancer';
          const nameParts = nome.split(' ');
          const maskedName = nameParts.length >= 2
            ? `${nameParts[0]} ${nameParts[1][0]}.`
            : nome;

          return {
            application_id: app.id,
            other_user_name: maskedName,
            job_title: `${job?.funcao ?? 'Vaga'} — ${job?.data_evento ?? ''}`,
            job_date: job?.data_evento ?? '',
            last_message: lastMsg?.content ?? '',
            last_message_at: lastMsg?.created_at ?? '',
            unread_count: unreadCountMap.get(app.id) ?? 0,
            is_locked: app.status !== 'contratado',
            other_user_id: app.freelancer_id,
          };
        });

      } else {
        // Freelancer: get their applications
        const { data: apps } = await supabase
          .from('applications')
          .select('id, job_id, status')
          .eq('freelancer_id', user.id);

        if (!apps || apps.length === 0) {
          setConversations([]);
          return;
        }

        // Batch fetch jobs
        const jobIds = [...new Set(apps.map(a => a.job_id))];
        const { data: jobs } = await supabase
          .from('jobs')
          .select('id, funcao, data_evento, company_id')
          .in('id', jobIds);

        const jobMap = new Map((jobs ?? []).map(j => [j.id, j]));

        // Batch fetch company profiles
        const companyIds = [...new Set((jobs ?? []).map(j => j.company_id))];
        const { data: companies } = companyIds.length > 0
          ? await supabase
              .from('company_profiles')
              .select('user_id, nome')
              .in('user_id', companyIds)
          : { data: [] };

        const companyMap = new Map((companies ?? []).map(c => [c.user_id, c]));

        // Batch fetch last messages
        const appIds = apps.map(a => a.id);
        const { data: allMessages } = await supabase
          .from('messages')
          .select('application_id, content, created_at')
          .in('application_id', appIds)
          .order('created_at', { ascending: false });

        const lastMsgMap = new Map<string, { content: string; created_at: string }>();
        (allMessages ?? []).forEach(msg => {
          if (!lastMsgMap.has(msg.application_id)) {
            lastMsgMap.set(msg.application_id, { content: msg.content, created_at: msg.created_at });
          }
        });

        // Batch fetch unread counts
        const { data: unreadMessages } = await supabase
          .from('messages')
          .select('application_id')
          .in('application_id', appIds)
          .neq('sender_id', user.id)
          .is('read_at', null);

        const unreadCountMap = new Map<string, number>();
        (unreadMessages ?? []).forEach(msg => {
          unreadCountMap.set(msg.application_id, (unreadCountMap.get(msg.application_id) ?? 0) + 1);
        });

        convs = apps.map(app => {
          const job = jobMap.get(app.job_id);
          const company = job ? companyMap.get(job.company_id) : null;
          const lastMsg = lastMsgMap.get(app.id);

          return {
            application_id: app.id,
            other_user_name: company?.nome ?? 'Empresa',
            job_title: `${job?.funcao ?? 'Vaga'} — ${job?.data_evento ?? ''}`,
            job_date: job?.data_evento ?? '',
            last_message: lastMsg?.content ?? '',
            last_message_at: lastMsg?.created_at ?? '',
            unread_count: unreadCountMap.get(app.id) ?? 0,
            is_locked: app.status !== 'contratado',
            other_user_id: job?.company_id ?? '',
          };
        });
      }

      convs.sort((a, b) => {
        if (a.last_message_at && b.last_message_at) {
          return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
        }
        return a.is_locked ? 1 : -1;
      });

      setConversations(convs);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [user, role]);

  const fetchMessages = useCallback(async (applicationId: string) => {
    setMessagesLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark unread messages as read
      if (user) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('application_id', applicationId)
          .neq('sender_id', user.id)
          .is('read_at', null);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  }, [user]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !activeApplicationId || !content.trim()) return null;

    // Enforce message length limit
    const trimmed = content.trim().slice(0, MESSAGE_MAX_LENGTH);

    const { data, error } = await supabase
      .from('messages')
      .insert({
        application_id: activeApplicationId,
        sender_id: user.id,
        content: trimmed,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }
    return data;
  }, [user, activeApplicationId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (activeApplicationId) {
      fetchMessages(activeApplicationId);
    } else {
      setMessages([]);
    }
  }, [activeApplicationId, fetchMessages]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`chat-messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;

          // If the message is for the active conversation, add it
          if (newMsg.application_id === activeAppIdRef.current) {
            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });

            // Mark as read if it's from the other person
            if (newMsg.sender_id !== user.id) {
              supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('id', newMsg.id)
                .then();
            }
          }

          // Refresh conversation list (unread counts, last message)
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  return {
    conversations,
    messages,
    activeApplicationId,
    setActiveApplicationId,
    sendMessage,
    loading,
    messagesLoading,
    userId: user?.id ?? null,
    refetchConversations: fetchConversations,
    MESSAGE_MAX_LENGTH,
  };
}
