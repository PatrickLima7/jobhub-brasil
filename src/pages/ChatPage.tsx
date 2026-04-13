import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { Search, ArrowLeft, Send, Lock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/hooks/useChat';
import { format } from 'date-fns';

function getInitials(name: string) {
  const parts = name.split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function formatTime(dateStr: string) {
  if (!dateStr) return '';
  try {
    return format(new Date(dateStr), 'HH:mm');
  } catch {
    return '';
  }
}

export default function ChatPage() {
  const isMobile = useIsMobile();
  const {
    conversations,
    messages,
    activeApplicationId,
    setActiveApplicationId,
    sendMessage,
    loading,
    messagesLoading,
    userId,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find(c => c.application_id === activeApplicationId);

  const filteredConversations = conversations.filter(
    c =>
      c.other_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.job_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    const text = newMessage;
    setNewMessage('');
    await sendMessage(text);
    setSending(false);
  };

  // Set default active on desktop
  useEffect(() => {
    if (!isMobile && !activeApplicationId && conversations.length > 0) {
      const firstUnlocked = conversations.find(c => !c.is_locked);
      if (firstUnlocked) setActiveApplicationId(firstUnlocked.application_id);
    }
  }, [isMobile, conversations, activeApplicationId, setActiveApplicationId]);

  const renderConversationList = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Buscar conversa..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            Nenhuma conversa encontrada
          </div>
        ) : (
          filteredConversations.map(conv => (
            <button
              key={conv.application_id}
              onClick={() => setActiveApplicationId(conv.application_id)}
              className={`w-full flex items-start gap-3 p-4 text-left transition-colors duration-100 border-b hover:bg-secondary ${
                activeApplicationId === conv.application_id ? 'bg-secondary border-l-[3px] border-l-accent' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold shrink-0">
                {getInitials(conv.other_user_name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm truncate">{conv.other_user_name}</p>
                  <span className="text-[12px] text-muted-foreground shrink-0">{formatTime(conv.last_message_at)}</span>
                </div>
                <p className="text-[12px] text-muted-foreground truncate">{conv.job_title}</p>
                {conv.last_message && (
                  <p className="text-[13px] text-muted-foreground truncate mt-0.5">{conv.last_message}</p>
                )}
              </div>
              {conv.unread_count > 0 && <div className="w-2.5 h-2.5 rounded-full bg-accent shrink-0 mt-1.5 unread-pulse" />}
            </button>
          ))
        )}
      </div>
    </div>
  );

  const renderChatView = () => {
    if (!activeConv) return null;

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 p-4 border-b">
          {isMobile && (
            <button onClick={() => setActiveApplicationId(null)} className="text-muted-foreground hover:text-foreground transition-colors duration-150">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold shrink-0">
            {getInitials(activeConv.other_user_name)}
          </div>
          <div>
            <p className="font-medium text-sm">{activeConv.other_user_name}</p>
            <p className="text-[12px] text-muted-foreground">{activeConv.job_title}</p>
          </div>
          {!activeConv.is_locked && <Badge variant="contratado" className="ml-auto text-[11px]">Contratado</Badge>}
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {activeConv.is_locked ? (
            <div className="flex items-center justify-center h-full">
              <div className="border rounded-lg p-6 bg-secondary text-center max-w-xs">
                <Lock className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">O chat será liberado após a contratação</p>
              </div>
            </div>
          ) : messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Nenhuma mensagem ainda. Diga olá!
            </div>
          ) : (
            <>
              {messages.map((msg, index) => {
                const isMe = msg.sender_id === userId;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, ease: 'easeOut', delay: index < 20 ? index * 0.03 : 0 }}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2.5 text-sm ${
                        isMe
                          ? 'bg-foreground text-background rounded-xl rounded-br-none'
                          : 'bg-secondary text-foreground rounded-xl rounded-bl-none'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className={`text-[12px] mt-1 ${isMe ? 'text-background/60' : 'text-muted-foreground'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {!activeConv.is_locked && (
          <div className="border-t p-4 flex items-end gap-3">
            <textarea
              className="flex-1 resize-none rounded-md border border-input bg-secondary px-3.5 py-2.5 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:border-foreground focus-visible:bg-background"
              placeholder="Escreva uma mensagem..."
              rows={1}
              style={{ maxHeight: '96px' }}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="h-10 w-10 rounded-md bg-foreground text-background flex items-center justify-center shrink-0 hover:bg-foreground/90 disabled:opacity-50 btn-press"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>
    );
  };

  if (isMobile) {
    return (
      <div className="h-[calc(100dvh-128px)] flex flex-col -mx-4 -mt-4 md:mx-0 md:mt-0">
        <AnimatePresence mode="wait">
          {!activeApplicationId ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="h-full"
            >
              {renderConversationList()}
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="h-full"
            >
              {renderChatView()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-display">Chat</h1>
      <div className="border rounded-lg overflow-hidden flex" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="w-[280px] border-r shrink-0">{renderConversationList()}</div>
        <div className="flex-1">
          {activeConv ? renderChatView() : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Selecione uma conversa'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
