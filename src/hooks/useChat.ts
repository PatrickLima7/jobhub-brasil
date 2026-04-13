import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      let applicationsQuery;

      if (role === 'company') {
        // Company sees applications for their jobs
        const { data: jobs } = await supabase
          .from('jobs')
          .select('id, funcao, data_evento')
          .eq('company_id', user.id);

        if (!jobs || jobs.length === 0) {
          setConversations([]);
          setLoading(false);
          return;
        }

        const jobIds = jobs.map(j => j.id);
        const jobMap = new Map(jobs.map(j => [j.id, j]));

        const { data: apps } = await supabase
          .from('applications')
          .select('id, freelancer_id, job_id, status')
          .in('job_id', jobIds);

        if (!apps || apps.length === 0) {
          setConversations([]);
          setLoading(false);
          return;
        }

        const freelancerIds = [...new Set(apps.map(a => a.freelancer_id))];
        const { data: profiles } = await supabase
          .from('freelancer_profiles')
          .select('user_id, nome')
          .in('user_id', freelancerIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        // Fetch last message for each application
        const convs: ChatConversation[] = [];
        for (const app of apps) {
          const job = jobMap.get(app.job_id);
          const profile = profileMap.get(app.freelancer_id);
          const isContratado = app.status === 'contratado';

          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('application_id', app.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('application_id', app.id)
            .neq('sender_id', user.id)
            .is('read_at', null);

          const nome = profile?.nome || 'Freelancer';
          const nameParts = nome.split(' ');
          const maskedName = nameParts.length >= 2
            ? `${nameParts[0]} ${nameParts[1][0]}.`
            : nome;

          convs.push({
            application_id: app.id,
            other_user_name: maskedName,
            job_title: `${job?.funcao || 'Vaga'} — ${job?.data_evento || ''}`,
            job_date: job?.data_evento || '',
            last_message: lastMsg?.[0]?.content || '',
            last_message_at: lastMsg?.[0]?.created_at || app.status === 'contratado' ? '' : '',
            unread_count: unreadCount || 0,
            is_locked: !isContratado,
            other_user_id: app.freelancer_id,
          });
        }

        convs.sort((a, b) => {
          if (a.last_message_at && b.last_message_at) {
            return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
          }
          return a.is_locked ? 1 : -1;
        });

        setConversations(convs);
      } else {
        // Freelancer sees their own applications
        const { data: apps } = await supabase
          .from('applications')
          .select('id, job_id, status')
          .eq('freelancer_id', user.id);

        if (!apps || apps.length === 0) {
          setConversations([]);
          setLoading(false);
          return;
        }

        const jobIds = [...new Set(apps.map(a => a.job_id))];
        const { data: jobs } = await supabase
          .from('jobs')
          .select('id, funcao, data_evento, company_id')
          .in('id', jobIds);

        const jobMap = new Map(jobs?.map(j => [j.id, j]) || []);
        const companyIds = [...new Set(jobs?.map(j => j.company_id) || [])];

        const { data: companyProfiles } = await supabase
          .from('company_profiles')
          .select('user_id, nome')
          .in('user_id', companyIds);

        const companyMap = new Map(companyProfiles?.map(c => [c.user_id, c]) || []);

        const convs: ChatConversation[] = [];
        for (const app of apps) {
          const job = jobMap.get(app.job_id);
          const company = job ? companyMap.get(job.company_id) : null;
          const isContratado = app.status === 'contratado';

          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('application_id', app.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('application_id', app.id)
            .neq('sender_id', user.id)
            .is('read_at', null);

          convs.push({
            application_id: app.id,
            other_user_name: company?.nome || 'Empresa',
            job_title: `${job?.funcao || 'Vaga'} — ${job?.data_evento || ''}`,
            job_date: job?.data_evento || '',
            last_message: lastMsg?.[0]?.content || '',
            last_message_at: lastMsg?.[0]?.created_at || '',
            unread_count: unreadCount || 0,
            is_locked: !isContratado,
            other_user_id: job?.company_id || '',
          });
        }

        convs.sort((a, b) => {
          if (a.last_message_at && b.last_message_at) {
            return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
          }
          return a.is_locked ? 1 : -1;
        });

        setConversations(convs);
      }
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
    if (!user || !activeApplicationId || !content.trim()) return;

    const { data, error } = await supabase
      .from('messages')
      .insert({
        application_id: activeApplicationId,
        sender_id: user.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }
    return data;
  }, [user, activeApplicationId]);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Load messages when active conversation changes
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
      .channel('chat-messages')
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
          if (newMsg.application_id === activeApplicationId) {
            setMessages(prev => [...prev, newMsg]);
            
            // Mark as read if it's from the other person
            if (newMsg.sender_id !== user.id) {
              supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('id', newMsg.id)
                .then();
            }
          }

          // Update conversation list
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeApplicationId, fetchConversations]);

  return {
    conversations,
    messages,
    activeApplicationId,
    setActiveApplicationId,
    sendMessage,
    loading,
    messagesLoading,
    userId: user?.id || null,
    refetchConversations: fetchConversations,
  };
}
