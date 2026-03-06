'use client';

import { ConversationMeta } from '@/lib/types';
import { MessageSquarePlus, Search, X } from 'lucide-react';
import { useState } from 'react';

interface ConversationSidebarProps {
  conversations: ConversationMeta[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('es-PA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) {
    return date.toLocaleDateString('es-PA', { weekday: 'short' });
  }
  return date.toLocaleDateString('es-PA', {
    day: '2-digit',
    month: '2-digit',
  });
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

export default function ConversationSidebar({
  conversations,
  activeId,
  onSelectConversation,
  onNewConversation,
  isOpen,
  onToggle,
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = searchQuery
    ? conversations.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed md:relative z-40 md:z-auto
          h-full bg-wa-sidebar border-r border-wa-border
          flex flex-col
          transition-all duration-300 ease-in-out
          md:w-[420px] md:translate-x-0 md:shrink-0
          ${isOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full'}
          overflow-hidden
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-wa-panel-header shrink-0">
          <h2 className="font-bold text-wa-text text-xl">Chats</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={onNewConversation}
              className="p-2 hover:bg-wa-hover rounded-full transition-colors"
              title="Nueva conversación"
            >
              <MessageSquarePlus className="w-5 h-5 text-wa-text-secondary" />
            </button>
            <button
              onClick={onToggle}
              className="p-2 hover:bg-wa-hover rounded-full transition-colors md:hidden"
            >
              <X className="w-5 h-5 text-wa-text-secondary" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-3 py-2 bg-wa-sidebar shrink-0">
          <div className="flex items-center gap-3 bg-wa-input-bg rounded-lg px-3 py-1.5">
            <Search className="w-4 h-4 text-wa-text-secondary shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar o empezar un nuevo chat"
              className="flex-1 bg-transparent text-sm text-wa-text placeholder:text-wa-text-secondary outline-none py-1"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="p-6 text-center text-wa-text-secondary text-sm">
              No hay conversaciones
            </div>
          )}

          {filtered.map((conv) => {
            const isActive = conv.id === activeId;
            const isProvider = conv.type === 'provider';

            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`
                  w-full text-left px-3 py-3 flex items-center gap-3
                  transition-colors cursor-pointer
                  ${isActive ? 'bg-wa-active' : 'hover:bg-wa-hover'}
                `}
              >
                {/* Avatar */}
                <div className="w-[49px] h-[49px] rounded-full shrink-0 overflow-hidden bg-gray-200">
                  {conv.userAvatar ? (
                    <img
                      src={conv.userAvatar}
                      alt={conv.userName || conv.title}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : isProvider && conv.providerAvatar ? (
                    <img
                      src={conv.providerAvatar}
                      alt={conv.providerName || ''}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <img
                      src="/dona-obra-logo.png"
                      alt="Doña Obra"
                      className="w-full h-full rounded-full object-cover"
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 border-b border-wa-border/50 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-normal text-[17px] text-wa-text truncate">
                      {conv.title}
                    </span>
                    <span className="text-xs text-wa-text-secondary shrink-0">
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <p className="text-[14px] text-wa-text-secondary truncate mt-0.5 leading-snug">
                    {truncate(conv.lastMessage, 55)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
