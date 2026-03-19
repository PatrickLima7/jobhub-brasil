import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { Search, ArrowLeft, Send, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: string;
}

interface Conversation {
  id: string;
  name: string;
  jobTitle: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  locked: boolean;
  messages: Message[];
}

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    name: 'Lucas M.',
    jobTitle: 'Garçom — Evento 20/03',
    lastMessage: 'Boa tarde! Confirmo presença.',
    timestamp: '14:30',
    unread: true,
    locked: false,
    messages: [
      { id: '1a', text: 'Olá Lucas! Você foi contratado para o evento do dia 20.', sender: 'me', timestamp: '13:00' },
      { id: '1b', text: 'Que ótimo! Obrigado pela oportunidade.', sender: 'them', timestamp: '13:15' },
      { id: '1c', text: 'O horário continua sendo das 18h às 23h?', sender: 'them', timestamp: '13:16' },
      { id: '1d', text: 'Sim, exatamente. Vista roupa preta.', sender: 'me', timestamp: '13:45' },
      { id: '1e', text: 'Boa tarde! Confirmo presença.', sender: 'them', timestamp: '14:30' },
    ],
  },
  {
    id: '2',
    name: 'Ana S.',
    jobTitle: 'Bartender — Festa 25/03',
    lastMessage: 'Posso levar meu kit de bar?',
    timestamp: '10:20',
    unread: false,
    locked: false,
    messages: [
      { id: '2a', text: 'Oi Ana, bem-vinda ao time!', sender: 'me', timestamp: '09:00' },
      { id: '2b', text: 'Obrigada! Ansiosa para trabalhar.', sender: 'them', timestamp: '09:30' },
      { id: '2c', text: 'Posso levar meu kit de bar?', sender: 'them', timestamp: '10:20' },
    ],
  },
  {
    id: '3',
    name: 'Pedro R.',
    jobTitle: 'Cozinheiro — Brunch 28/03',
    lastMessage: '',
    timestamp: '',
    unread: false,
    locked: true,
    messages: [],
  },
];

function getInitials(name: string) {
  const parts = name.split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export default function ChatPage() {
  const isMobile = useIsMobile();
  const [conversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string | null>(isMobile ? null : '1');
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  const filteredConversations = conversations.filter(
    (c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConvId]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    setNewMessage('');
  };

  const renderConversationList = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Buscar conversa..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {filteredConversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => setActiveConvId(conv.id)}
            className={`w-full flex items-start gap-3 p-4 text-left transition-colors duration-100 border-b hover:bg-secondary ${
              activeConvId === conv.id ? 'bg-secondary border-l-[3px] border-l-accent' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold shrink-0">
              {getInitials(conv.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm truncate">{conv.name}</p>
                <span className="text-[12px] text-muted-foreground shrink-0">{conv.timestamp}</span>
              </div>
              <p className="text-[12px] text-muted-foreground truncate">{conv.jobTitle}</p>
              {conv.lastMessage && (
                <p className="text-[13px] text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
              )}
            </div>
            {conv.unread && <div className="w-2.5 h-2.5 rounded-full bg-accent shrink-0 mt-1.5 unread-pulse" />}
          </button>
        ))}
      </div>
    </div>
  );

  const renderChatView = () => {
    if (!activeConv) return null;

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          {isMobile && (
            <button onClick={() => setActiveConvId(null)} className="text-muted-foreground hover:text-foreground transition-colors duration-150">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold shrink-0">
            {getInitials(activeConv.name)}
          </div>
          <div>
            <p className="font-medium text-sm">{activeConv.name}</p>
            <p className="text-[12px] text-muted-foreground">{activeConv.jobTitle}</p>
          </div>
          {!activeConv.locked && <Badge variant="contratado" className="ml-auto text-[11px]">Contratado</Badge>}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {activeConv.locked ? (
            <div className="flex items-center justify-center h-full">
              <div className="border rounded-lg p-6 bg-secondary text-center max-w-xs">
                <Lock className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">O chat será liberado após a contratação</p>
              </div>
            </div>
          ) : (
            <>
              {activeConv.messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, ease: 'easeOut', delay: index * 0.03 }}
                  className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2.5 text-sm ${
                      msg.sender === 'me'
                        ? 'bg-foreground text-background rounded-xl rounded-br-none'
                        : 'bg-secondary text-foreground rounded-xl rounded-bl-none'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p className={`text-[12px] mt-1 ${msg.sender === 'me' ? 'text-background/60' : 'text-muted-foreground'}`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        {!activeConv.locked && (
          <div className="border-t p-4 flex items-end gap-3">
            <textarea
              className="flex-1 resize-none rounded-md border border-input bg-secondary px-3.5 py-2.5 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:border-foreground focus-visible:bg-background"
              placeholder="Escreva uma mensagem..."
              rows={1}
              style={{ maxHeight: '96px' }}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim()}
              className="h-10 w-10 rounded-md bg-foreground text-background flex items-center justify-center shrink-0 hover:bg-foreground/90 disabled:opacity-50 btn-press"
            >
              <Send className="h-4 w-4" />
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
          {!activeConvId ? (
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
              Selecione uma conversa
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
