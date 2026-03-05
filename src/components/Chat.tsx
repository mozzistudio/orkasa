'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from 'ai/react';
import { ChatMessage, Brief, Estimation, ChatBrief, Provider } from '@/lib/types';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import { createConversation, saveMessage, getConversationMessages } from '@/lib/conversations';
import { validateAndFetchProviders } from '@/lib/providers';
import { RotateCcw, Menu, Home } from 'lucide-react';
import Link from 'next/link';

const WELCOME_MESSAGE = `¡Ey, dimelo! 👷‍♀️ Soy Doña Obra, tu vecina de confianza pa' todo lo que es reparaciones y servicios del hogar. Yo conozco a todos los buenos maestros de la ciudad 💪

Cuéntame qué necesitas — mándame texto, fotos, lo que sea — y yo te digo cuánto te va a salir y quién te lo puede resolver. ¡Vamos al grano! 🔧`;

function parseBrief(content: string): { textPart: string; chatBrief: ChatBrief } | null {
  const delimiterIndex = content.indexOf('%%%BRIEF%%%');
  if (delimiterIndex === -1) return null;

  const textPart = content.substring(0, delimiterIndex).trim();
  const jsonPart = content.substring(delimiterIndex + '%%%BRIEF%%%'.length).trim();
  const cleanJson = jsonPart.replace(/```json?\n?/g, '').replace(/```/g, '').trim();

  try {
    const parsed = JSON.parse(cleanJson);
    if (parsed.brief && parsed.estimation) {
      return { textPart, chatBrief: parsed as ChatBrief };
    }
  } catch {
    // Not valid JSON
  }
  return null;
}

interface ChatProps {
  conversationId: string | null;
  onConversationCreated?: (id: string) => void;
  onMessageUpdate?: (conversationId: string, lastMessage: string) => void;
  onToggleSidebar?: () => void;
  initialCategory?: string | null;
}

export default function Chat({
  conversationId: externalConversationId,
  onConversationCreated,
  onMessageUpdate,
  onToggleSidebar,
  initialCategory,
}: ChatProps) {
  const [conversationId, setConversationId] = useState<string | null>(externalConversationId);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [lastBrief, setLastBrief] = useState<Brief | null>(null);
  const [lastEstimation, setLastEstimation] = useState<Estimation | null>(null);
  const [briefReceived, setBriefReceived] = useState(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const relanceFiredRef = useRef(false);

  const cancelInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  const startInactivityTimer = useCallback(() => {
    if (relanceFiredRef.current || briefReceived) return;
    cancelInactivityTimer();
    inactivityTimerRef.current = setTimeout(() => {
      if (!relanceFiredRef.current) {
        relanceFiredRef.current = true;
        const relanceMsg: ChatMessage = {
          id: `relance-${Date.now()}`,
          role: 'assistant',
          content: '¿Sigues ahí? Cuéntame más para poder ayudarte mejor 😊',
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, relanceMsg]);
      }
    }, 120000);
  }, [cancelInactivityTimer, briefReceived]);

  const { append, isLoading } = useChat({
    api: '/api/chat',
    body: { conversationId },
    onFinish: async (message) => {
      // Start inactivity timer after each AI message
      startInactivityTimer();

      const result = parseBrief(message.content);

      if (result) {
        const { textPart, chatBrief } = result;
        setLastBrief(chatBrief.brief);
        setLastEstimation(chatBrief.estimation);
        setBriefReceived(true);
        cancelInactivityTimer();

        const providers = await validateAndFetchProviders(
          [],
          chatBrief.brief.category
        );

        // Message 1: Summary with estimation details
        const intro = textPart || chatBrief.brief.problem_summary;
        const estimationText = `${intro}\n\n🔧 ${chatBrief.brief.problem_summary}\n📍 ${chatBrief.brief.location}\n💰 B/. ${chatBrief.estimation.range_low} — ${chatBrief.estimation.range_high}\n⏱️ ${chatBrief.estimation.duration_estimate}\n📊 Confianza: ${chatBrief.estimation.confidence}`;
        const summaryMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: estimationText,
          brief: chatBrief.brief,
          estimation: chatBrief.estimation,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, summaryMessage]);

        // Message 2: Provider cards
        if (providers.length > 0) {
          const providerMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `Te encontré ${providers.length} profesionales de confianza 💪`,
            providers,
            brief: chatBrief.brief,
            estimation: chatBrief.estimation,
            timestamp: new Date(),
          };
          setChatMessages((prev) => [...prev, providerMessage]);
          onMessageUpdate?.(conversationId!, `Te encontré ${providers.length} profesionales de confianza`);
        }
      } else {
        // Regular message (no brief delimiter)
        addAssistantMessage(message.content);
        onMessageUpdate?.(conversationId!, message.content);
      }
    },
  });

  const addAssistantMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, newMessage]);
  };

  // Initialize conversation
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    async function init() {
      if (externalConversationId) {
        setConversationId(externalConversationId);
        const dbMessages = await getConversationMessages(externalConversationId);

        if (dbMessages.length > 0) {
          const chatMsgs: ChatMessage[] = [];

          for (const m of dbMessages) {
            // Check for %%%BRIEF%%% delimiter (new format)
            const briefResult = parseBrief(m.content);
            if (briefResult && m.role === 'assistant') {
              const { textPart, chatBrief } = briefResult;
              setLastBrief(chatBrief.brief);
              setLastEstimation(chatBrief.estimation);
              setBriefReceived(true);

              const providers = await validateAndFetchProviders(
                [],
                chatBrief.brief.category
              );

              const intro = textPart || chatBrief.brief.problem_summary;
              const estimationText = `${intro}\n\n🔧 ${chatBrief.brief.problem_summary}\n📍 ${chatBrief.brief.location}\n💰 B/. ${chatBrief.estimation.range_low} — ${chatBrief.estimation.range_high}\n⏱️ ${chatBrief.estimation.duration_estimate}\n📊 Confianza: ${chatBrief.estimation.confidence}`;
              chatMsgs.push({
                id: m.id,
                role: 'assistant',
                content: estimationText,
                brief: chatBrief.brief,
                estimation: chatBrief.estimation,
                timestamp: new Date(m.created_at),
              });

              if (providers.length > 0) {
                chatMsgs.push({
                  id: m.id + '-providers',
                  role: 'assistant',
                  content: `Te encontré ${providers.length} profesionales de confianza 💪`,
                  providers,
                  brief: chatBrief.brief,
                  estimation: chatBrief.estimation,
                  timestamp: new Date(m.created_at),
                });
              }
              continue;
            }

            // Legacy: check for %%%ESTIMATION%%% delimiter (old format)
            const legacyDelimIdx = m.content.indexOf('%%%ESTIMATION%%%');
            if (legacyDelimIdx !== -1 && m.role === 'assistant') {
              // Skip legacy estimation messages - show text part only
              const textPart = m.content.substring(0, legacyDelimIdx).trim();
              if (textPart) {
                chatMsgs.push({
                  id: m.id,
                  role: 'assistant',
                  content: textPart,
                  timestamp: new Date(m.created_at),
                });
              }
              continue;
            }

            chatMsgs.push({
              id: m.id,
              role: m.role,
              content: m.content,
              images: m.image_urls || undefined,
              timestamp: new Date(m.created_at),
            });
          }

          setChatMessages(chatMsgs);
          setShowWelcomeScreen(false);
          return;
        }
      }

      // Create new conversation — show welcome screen instead of auto-message
      const newId = await createConversation();
      if (newId) {
        setConversationId(newId);
        onConversationCreated?.(newId);
      }
      setShowWelcomeScreen(true);
    }

    init();
  }, [externalConversationId]);

  // Cleanup inactivity timer on unmount
  useEffect(() => {
    return () => cancelInactivityTimer();
  }, [cancelInactivityTimer]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isLoading]);

  const handleStartChat = useCallback(() => {
    setShowWelcomeScreen(false);
    // Add welcome message when user starts
    const welcomeMsg: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: WELCOME_MESSAGE,
      timestamp: new Date(),
    };
    setChatMessages([welcomeMsg]);
    if (conversationId) {
      saveMessage(conversationId, 'assistant', WELCOME_MESSAGE);
    }
  }, [conversationId]);

  const handleSendMessage = async (text: string, images: string[]) => {
    if (!conversationId) return;

    // Hide welcome screen on first message
    if (showWelcomeScreen) {
      handleStartChat();
    }

    // Cancel inactivity timer on user input
    cancelInactivityTimer();

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      images: images.length > 0 ? images : undefined,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    onMessageUpdate?.(conversationId, text);

    await saveMessage(conversationId, 'user', text, images.length > 0 ? images : undefined);

    let messageContent: any;
    if (images.length > 0) {
      const parts = [];
      if (text) {
        parts.push({ type: 'text', text });
      }
      images.forEach((image) => {
        parts.push({ type: 'image', image });
      });
      messageContent = parts;
    } else {
      messageContent = text;
    }

    await append({ role: 'user', content: messageContent });
  };

  const handleWhatsAppSent = useCallback((providerName: string) => {
    const confirmMsg: ChatMessage = {
      id: `wa-confirm-${Date.now()}`,
      role: 'assistant',
      content: `✅ Solicitud enviada a ${providerName}. Te contactarán por WhatsApp pronto.`,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, confirmMsg]);
  }, []);

  return (
    <div className="flex flex-col flex-1 h-full bg-cream min-w-0">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-sand px-4 py-3 flex items-center gap-3 shadow-sm shrink-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors md:hidden"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        )}
        <img src="/dona-obra-logo.png" alt="Doña Obra" className="w-10 h-10 rounded-full object-cover shadow-lg" />
        <div className="flex-1">
          <h1 className="font-display font-black text-charcoal text-lg">Doña Obra</h1>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-jungle rounded-full"></div>
            <p className="text-sm text-jungle font-medium">En línea</p>
          </div>
        </div>
        <Link
          href="/"
          className="p-2.5 hover:bg-warm rounded-full transition-colors"
          title="Ir al inicio"
        >
          <Home className="w-5 h-5 text-muted" />
        </Link>
        <button
          onClick={() => {
            localStorage.removeItem('conversationId');
            window.location.reload();
          }}
          className="p-2.5 hover:bg-warm rounded-full transition-colors"
          title="Nueva consulta"
        >
          <RotateCcw className="w-5 h-5 text-muted" />
        </button>
      </div>

      {/* Collection Progress Indicator */}
      {!briefReceived && chatMessages.length > 1 && (
        <CollectionProgress messages={chatMessages} />
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {showWelcomeScreen && chatMessages.length === 0 ? (
          <WelcomeScreen onStart={handleStartChat} />
        ) : (
          <>
            {chatMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onWhatsAppSent={handleWhatsAppSent}
              />
            ))}

            {isLoading && (
              <div className="mb-4">
                <TypingIndicator />
              </div>
            )}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <ChatInput
        onSend={handleSendMessage}
        disabled={isLoading}
        initialMessage={initialCategory ? `Necesito ayuda con ${initialCategory}` : undefined}
      />
    </div>
  );
}

// Welcome Screen Component (Task 2.1)
function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <img src="/dona-obra-logo.png" alt="Doña Obra" className="w-20 h-20 rounded-full shadow-lg mb-6" />
      <h2 className="font-display text-2xl sm:text-3xl text-charcoal mb-2">
        ¡Hola! Soy Doña Obra 👷‍♀️
      </h2>
      <p className="text-muted text-base mb-8 max-w-sm">
        Tu vecina de confianza para servicios del hogar en Panamá
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-2xl">💬</span>
          <span className="text-sm font-medium text-charcoal">Describe tu problema</span>
        </div>
        <div className="hidden sm:block w-8 h-px bg-gray-300" />
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-2xl">💡</span>
          <span className="text-sm font-medium text-charcoal">Estimación en 30 seg</span>
        </div>
        <div className="hidden sm:block w-8 h-px bg-gray-300" />
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-2xl">👷</span>
          <span className="text-sm font-medium text-charcoal">Elige tu contratista</span>
        </div>
      </div>

      <button
        onClick={onStart}
        className="bg-coral hover:bg-coral-dark text-white px-8 py-3.5 rounded-full text-base font-semibold transition-all shadow-lg shadow-coral/25 hover:shadow-xl hover:shadow-coral/30 active:scale-[0.98] mb-3"
      >
        Obtener cotización →
      </button>
      <p className="text-xs text-muted">Gratis · Sin compromiso · Respuesta instantánea</p>
    </div>
  );
}

// Collection Progress Indicator Component (Task 1.2)
interface CollectedFields {
  problem_description: boolean;
  location: boolean;
  property_type: boolean;
  urgency: boolean;
  availability: boolean;
  budget_range: boolean;
  contact_info: boolean;
}

const fieldConfig = [
  { key: 'problem_description' as const, icon: '🔧', label: 'Problema' },
  { key: 'location' as const, icon: '📍', label: 'Ubicación' },
  { key: 'property_type' as const, icon: '🏠', label: 'Propiedad' },
  { key: 'urgency' as const, icon: '⏰', label: 'Urgencia' },
  { key: 'availability' as const, icon: '🕐', label: 'Horario' },
  { key: 'budget_range' as const, icon: '💰', label: 'Presupuesto' },
  { key: 'contact_info' as const, icon: '📞', label: 'Contacto' },
];

function detectCollectedFields(messages: ChatMessage[]): CollectedFields {
  const fields: CollectedFields = {
    problem_description: false,
    location: false,
    property_type: false,
    urgency: false,
    availability: false,
    budget_range: false,
    contact_info: false,
  };

  const allText = messages
    .filter(m => m.role === 'user')
    .map(m => m.content.toLowerCase())
    .join(' ');

  const allAssistantText = messages
    .filter(m => m.role === 'assistant')
    .map(m => m.content.toLowerCase())
    .join(' ');

  // Problem: any user message after the welcome counts
  if (messages.some(m => m.role === 'user' && m.content.length > 5)) {
    fields.problem_description = true;
  }

  // Location: barrio/area names or AI confirming location
  const locationPatterns = /bella vista|san francisco|el cangrejo|paitilla|obarrio|marbella|costa del este|casco viejo|condado del rey|el dorado|pueblo nuevo|juan díaz|parque lefevre|betania|río abajo|calidonia|ancón|santa ana|chorrillo|pedregal|tocumen|las cumbres|villa lucre|arraiján|la chorrera|barrio|corregimiento|sector|zona/i;
  if (locationPatterns.test(allText) || /¿?en qué (barrio|zona|sector|área)/i.test(allAssistantText)) {
    if (locationPatterns.test(allText)) fields.location = true;
  }

  // Property type: casa/apto mentions
  const propertyPatterns = /\b(casa|apartamento|apto|piso \d|edificio|townhouse|ph|penthouse|local|oficina)\b/i;
  if (propertyPatterns.test(allText)) {
    fields.property_type = true;
  }

  // Urgency
  const urgencyPatterns = /\b(urgente|hoy|mañana|esta semana|sin prisa|cuando pueda|lo antes posible|cuanto antes|ya|ahorita|pronto)\b/i;
  if (urgencyPatterns.test(allText)) {
    fields.urgency = true;
  }

  // Availability
  const availabilityPatterns = /\b(mañana|tarde|noche|después de las|antes de las|entre|lunes|martes|miércoles|jueves|viernes|sábado|domingo|am|pm|hora|disponible|libre|cualquier hora|todo el día)\b/i;
  if (availabilityPatterns.test(allText)) {
    fields.availability = true;
  }

  // Budget
  const budgetPatterns = /\b(presupuesto|budget|\$|b\/\.|balboas?|dólares?|no sé|no se|lo que cueste|barato|caro|económico|\d{2,})\b/i;
  if (budgetPatterns.test(allText) && messages.filter(m => m.role === 'user').length >= 4) {
    fields.budget_range = true;
  }

  // Contact info
  const contactPatterns = /(\+?507|\+?1)?\s?\d{4}[-\s]?\d{4}|whatsapp|mi (nombre|número|cel|teléfono)|me llamo/i;
  if (contactPatterns.test(allText)) {
    fields.contact_info = true;
  }

  return fields;
}

function CollectionProgress({ messages }: { messages: ChatMessage[] }) {
  const fields = detectCollectedFields(messages);

  return (
    <div className="bg-white/60 backdrop-blur-sm border-b border-sand/50 px-3 py-2 shrink-0 overflow-x-auto">
      <div className="flex items-center gap-1.5 min-w-max">
        {fieldConfig.map(({ key, icon, label }) => {
          const collected = fields[key];
          return (
            <div
              key={key}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-500 ${
                collected
                  ? 'bg-jungle/10 text-jungle'
                  : 'bg-gray-100 text-gray-400 animate-pulse'
              }`}
            >
              <span>{icon}</span>
              <span className="hidden sm:inline">{label}</span>
              {collected && <span>✅</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
