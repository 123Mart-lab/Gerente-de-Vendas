import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreVertical, Paperclip, Smile, Send, Check, CheckCheck, Clock } from 'lucide-react';
import axios from 'axios';

export interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  receiver?: string;
  timestamp: string;
  isRead?: boolean;
}

interface AgentContact {
  id: string;
  name: string;
  avatarColor: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  pendingTasks?: number;
  waitingOnTasks?: number;
}

export default function AgentWhatsApp({ currentAgentId, currentAgentName }: { currentAgentId: string, currentAgentName: string }) {
  const [activeContact, setActiveContact] = useState<string>('gerente');
  const [inputMessage, setInputMessage] = useState('');
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);

  const contacts: AgentContact[] = [
    { id: 'diretoria', name: 'Marcus / CEO', avatarColor: 'bg-slate-900', unreadCount: 0, pendingTasks: 0, waitingOnTasks: 0 },
    { id: 'gerente', name: 'Gerente de Projetos', avatarColor: 'bg-emerald-500', unreadCount: 0, pendingTasks: 0, waitingOnTasks: 3 },
    { id: 'pesquisador', name: 'Pesquisador de Mercado', avatarColor: 'bg-sky-500', pendingTasks: 2, waitingOnTasks: 0 },
    { id: 'seo', name: 'Especialista SEO', avatarColor: 'bg-purple-500', pendingTasks: 1, waitingOnTasks: 1 },
    { id: 'monitor', name: 'Monitor de Concorrência', avatarColor: 'bg-orange-500', pendingTasks: 0, waitingOnTasks: 0 },
    { id: 'art', name: 'Diretor de Arte e Áudio', avatarColor: 'bg-pink-500', pendingTasks: 0, waitingOnTasks: 0 },
    { id: 'copywriter', name: 'Redator de Conteúdo', avatarColor: 'bg-blue-500', pendingTasks: 0, waitingOnTasks: 0 },
    { id: 'social', name: 'Gestor de Social Media', avatarColor: 'bg-rose-500', pendingTasks: 0, waitingOnTasks: 0 },
    { id: 'ads', name: 'Especialista em Ads', avatarColor: 'bg-yellow-500', pendingTasks: 0, waitingOnTasks: 0 },
    { id: 'merchant', name: 'Especialista Merchant Center', avatarColor: 'bg-teal-500', pendingTasks: 0, waitingOnTasks: 0 },
    { id: 'metrics', name: 'Analista de Métricas (BI)', avatarColor: 'bg-indigo-500', pendingTasks: 0, waitingOnTasks: 0 },
    { id: 'finance', name: 'Analista Financeiro', avatarColor: 'bg-lime-500', pendingTasks: 0, waitingOnTasks: 0 },
  ].filter(c => c.id !== currentAgentId); // Don't show yourself in the contact list

  if (!activeContact && contacts.length > 0) {
    setActiveContact(contacts[0].id);
  }

  // Fetch messages from Firebase via API
  const fetchMessages = async () => {
    try {
      const res = await axios.get('/api/marketing/agent-chats');
      if (res.data) {
        setAllMessages(res.data);
      }
    } catch (err) {
      console.error('Error fetching chat messages', err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  // Filter messages for the active conversation
  const activeMessages = allMessages.filter(msg => 
    (msg.sender === currentAgentId && msg.receiver === activeContact) || 
    (msg.sender === activeContact && msg.receiver === currentAgentId) ||
    // Also support broadcast messages or system messages if needed, but keeping it strict for now
    (!msg.receiver && (msg.sender === currentAgentId || msg.sender === activeContact)) 
  );

  const currentContact = contacts.find(c => c.id === activeContact);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length]);

  const toggleReadMore = (id: string) => {
    setExpandedMessages(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderMessageText = (text: string, id: string) => {
    const sentences = text.split(/([.!?]+)/);
    if (sentences.length <= 10 || expandedMessages[id]) {
      return (
        <span>
          {text}
          {sentences.length > 10 && (
             <button onClick={() => toggleReadMore(id)} className="text-sky-500 ml-2 font-medium hover:underline">
               Mostrar menos
             </button>
          )}
        </span>
      );
    }
    
    const truncated = sentences.slice(0, 10).join('') + '...';
    return (
      <span>
        {truncated}
        <button onClick={() => toggleReadMore(id)} className="text-sky-500 ml-2 font-medium hover:underline">
          Ler mais
        </button>
      </span>
    );
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const tempMsg = inputMessage;
    setInputMessage('');

    // Optimistic update
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      text: tempMsg,
      sender: currentAgentId,
      receiver: activeContact,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };
    setAllMessages(prev => [...prev, newMsg]);

    try {
      await axios.post('/api/marketing/agent-chats', {
        text: tempMsg,
        sender: currentAgentId,
        receiver: activeContact
      });
      fetchMessages(); // refresh to get real ID
    } catch (err) {
      console.error('Error sending message', err);
    }
  };

  return (
    <div className="flex h-[600px] bg-[#f0f2f5] border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Sidebar - Contacts */}
      <div className="w-[30%] sm:w-[350px] bg-white flex flex-col border-r border-slate-200 shrink-0">
        <div className="h-16 bg-[#f0f2f5] flex items-center px-4 justify-between shrink-0">
          <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 font-bold">
            {currentAgentName.charAt(0)}
          </div>
          <div className="flex gap-4 text-slate-500">
            <MoreVertical className="w-5 h-5 cursor-pointer" />
          </div>
        </div>
        
        <div className="p-2 border-b border-slate-200">
          <div className="bg-[#f0f2f5] rounded-lg flex items-center px-3 py-1.5">
            <Search className="w-4 h-4 text-slate-500 mr-3" />
            <input 
              type="text" 
              placeholder="Pesquisar ou começar uma nova conversa" 
              className="bg-transparent border-none focus:outline-none text-sm w-full placeholder-slate-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {contacts.map(contact => (
            <div 
              key={contact.id}
              onClick={() => setActiveContact(contact.id)}
              className={`flex items-center px-3 py-3 cursor-pointer hover:bg-[#f5f6f6] transition-colors border-b border-slate-100 ${activeContact === contact.id ? 'bg-[#ebebeb]' : ''}`}
            >
              <div className={`w-12 h-12 rounded-full ${contact.avatarColor} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
                {contact.name.charAt(0)}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-medium text-slate-900 truncate text-[15px]">{contact.name}</h3>
                  <span className="text-xs text-slate-500">{contact.lastMessageTime || '12:00'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-slate-500 truncate">{contact.lastMessage || 'Clique para ver as mensagens'}</p>
                  {contact.unreadCount ? (
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {contact.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-[#efeae2]">
        {/* Chat Background Pattern (WhatsApp style) */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg")', backgroundSize: 'cover' }}></div>
        
        {/* Header */}
        <div className="h-16 bg-[#f0f2f5] flex items-center px-4 justify-between shrink-0 relative z-10 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${currentContact?.avatarColor || 'bg-slate-300'} flex items-center justify-center text-white font-bold`}>
              {currentContact?.name?.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-slate-900 text-[15px]">{currentContact?.name}</span>
              <span className="text-xs text-slate-500">
                Fila: {currentContact?.pendingTasks || 0} demandas pendentes • Aguardando {currentContact?.waitingOnTasks || 0} respostas
              </span>
            </div>
          </div>
          <div>
             <Search className="w-5 h-5 text-slate-500 cursor-pointer" />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 relative z-10">
          {activeMessages.map(msg => {
            const isUser = msg.sender === currentAgentId;
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-lg p-2 shadow-sm relative ${
                  isUser ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'
                }`}>
                  <p className="text-[14.5px] text-slate-800 leading-relaxed pb-3 whitespace-pre-wrap">
                    {renderMessageText(msg.text, msg.id)}
                  </p>
                  <div className="absolute bottom-1 right-2 flex items-center gap-1">
                    <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                    {isUser && (
                      <CheckCheck className={`w-3.5 h-3.5 ${msg.isRead ? 'text-sky-500' : 'text-slate-400'}`} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="h-[62px] bg-[#f0f2f5] flex items-center px-4 gap-3 shrink-0 relative z-10">
          <Smile className="w-6 h-6 text-slate-500 cursor-pointer shrink-0" />
          <Paperclip className="w-6 h-6 text-slate-500 cursor-pointer shrink-0" />
          <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-3">
            <input 
              type="text" 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Digite uma mensagem" 
              className="flex-1 bg-white border-none rounded-lg py-2.5 px-4 focus:outline-none text-[15px]"
            />
            {inputMessage.trim() ? (
              <button type="submit" className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-600 transition-colors">
                <Send className="w-5 h-5" />
              </button>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
}
