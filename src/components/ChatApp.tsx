'use client';

import { useState, useEffect, useCallback } from 'react';
import { ConversationMeta } from '@/lib/types';
import {
  getAllConversations,
  getLastMessageForConversations,
  getConversationsMeta,
  setConversationMeta,
  updateConversationMetaLastMessage,
  deleteEmptyConversations,
} from '@/lib/conversations';
import { seedSampleConversations } from '@/lib/seed-conversations';
import ConversationSidebar from './ConversationSidebar';
import Chat from './Chat';

const ACTIVE_CONVERSATION_KEY = 'activeConversationId';

export default function ChatApp() {
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatKey, setChatKey] = useState(0);

  // Load conversations on mount
  useEffect(() => {
    async function loadConversations() {
      await deleteEmptyConversations();

      let dbConversations = await getAllConversations();

      if (dbConversations.length === 0) {
        const seeded = await seedSampleConversations();
        if (seeded.length > 0) {
          dbConversations = await getAllConversations();
        }
      }

      const meta = getConversationsMeta();

      if (dbConversations.length > 0) {
        const lastMessages = await getLastMessageForConversations(
          dbConversations.map((c) => c.id)
        );

        const merged: ConversationMeta[] = dbConversations.map((conv) => {
          const existing = meta[conv.id];
          const lastMsg = lastMessages[conv.id];

          return {
            id: conv.id,
            type: existing?.type || 'dona_obra',
            title: existing?.title || 'Doña Obra',
            lastMessage: lastMsg?.content?.slice(0, 80) || existing?.lastMessage || '',
            lastMessageAt: conv.last_message_at || conv.started_at,
            providerName: existing?.providerName,
            providerId: existing?.providerId,
            providerAvatar: existing?.providerAvatar,
          };
        });

        setConversations(merged);
        merged.forEach((m) => setConversationMeta(m));
      }

      const savedActiveId = localStorage.getItem(ACTIVE_CONVERSATION_KEY);
      if (savedActiveId && dbConversations.some((c) => c.id === savedActiveId)) {
        setActiveConversationId(savedActiveId);
      } else if (dbConversations.length > 0) {
        setActiveConversationId(dbConversations[0].id);
        localStorage.setItem(ACTIVE_CONVERSATION_KEY, dbConversations[0].id);
      }
    }

    loadConversations();
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    localStorage.setItem(ACTIVE_CONVERSATION_KEY, id);
    setChatKey((k) => k + 1);
    setSidebarOpen(false);
  }, []);

  const handleNewConversation = useCallback(() => {
    setActiveConversationId(null);
    localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
    setChatKey((k) => k + 1);
    setSidebarOpen(false);
  }, []);

  const handleConversationCreated = useCallback((id: string) => {
    setActiveConversationId(id);
    localStorage.setItem(ACTIVE_CONVERSATION_KEY, id);

    const meta: ConversationMeta = {
      id,
      type: 'dona_obra',
      title: 'Doña Obra',
      lastMessage: '¡Ey, dimelo! Soy Doña Obra...',
      lastMessageAt: new Date().toISOString(),
    };

    setConversationMeta(meta);
    setConversations((prev) => [meta, ...prev]);
  }, []);

  const handleMessageUpdate = useCallback((convId: string, lastMessage: string) => {
    updateConversationMetaLastMessage(convId, lastMessage);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? { ...c, lastMessage: lastMessage.slice(0, 80), lastMessageAt: new Date().toISOString() }
          : c
      ).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
    );
  }, []);

  return (
    <div className="flex h-screen w-full bg-cream overflow-hidden">
      <ConversationSidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <Chat
        key={chatKey}
        conversationId={activeConversationId}
        onConversationCreated={handleConversationCreated}
        onMessageUpdate={handleMessageUpdate}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
    </div>
  );
}
