'use client';

import { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useTranslations } from 'next-intl';

/* ─── message definitions ─── */

interface ChatMsg {
  id: number;
  type: 'bot' | 'user';
  content: ReactNode;
  time: string;
  delay: number; // ms from start of cycle when this message appears
}

/* Typing indicator appears before certain bot messages */
const TYPING_SCHEDULE = [
  { showAt: 3500, hideAt: 5000 },    // before msg 3
  { showAt: 8500, hideAt: 10000 },    // before msg 5
  { showAt: 12500, hideAt: 14000 },   // before msg 6
  { showAt: 18000, hideAt: 20000 },   // before msg 8
];

const CYCLE_DURATION = 25000; // 25s total, then reset

/* ─── typing dots component ─── */

function TypingDots() {
  return (
    <div className="flex gap-1.5 items-end animate-msg-enter">
      <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
        <img src="/dona-obra-logo.png" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="bg-white rounded-xl rounded-bl-sm px-3 py-2.5 shadow-sm">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-muted/60 rounded-full animate-bounce-dot" style={{ animationDelay: '0s' }} />
          <span className="w-1.5 h-1.5 bg-muted/60 rounded-full animate-bounce-dot" style={{ animationDelay: '0.15s' }} />
          <span className="w-1.5 h-1.5 bg-muted/60 rounded-full animate-bounce-dot" style={{ animationDelay: '0.3s' }} />
        </div>
      </div>
    </div>
  );
}

/* ─── helper to build translated messages ─── */

function buildMessages(t: (key: string) => string): ChatMsg[] {
  return [
    {
      id: 1,
      type: 'bot',
      content: t('msg1'),
      time: '3:27 p.m.',
      delay: 0,
    },
    {
      id: 2,
      type: 'user',
      content: t('msg2'),
      time: '3:27 p.m.',
      delay: 2000,
    },
    {
      id: 3,
      type: 'bot',
      content: t('msg3'),
      time: '3:27 p.m.',
      delay: 5000,
    },
    {
      id: 4,
      type: 'user',
      content: t('msg4'),
      time: '3:28 p.m.',
      delay: 7000,
    },
    {
      id: 5,
      type: 'bot',
      content: (
        <>
          {t('msg5Text')}
          <span className="block mt-1.5">
            <span className="block bg-sand rounded-lg px-2 py-1.5 space-y-0.5">
              <span className="block text-[10px] text-charcoal font-semibold">{t('msg5Service')}</span>
              <span className="block text-[10px] text-jungle font-bold">{t('msg5Price')}</span>
              <span className="block text-[10px] text-muted">{t('msg5Complexity')}</span>
            </span>
          </span>
        </>
      ),
      time: '3:28 p.m.',
      delay: 10000,
    },
    {
      id: 6,
      type: 'bot',
      content: (
        <>
          {t('msg6Text')}
          <span className="block mt-1.5">
            <span className="flex items-center gap-2 bg-sand rounded-lg px-2 py-1.5">
              <span className="w-7 h-7 bg-coral/20 rounded-full flex items-center justify-center shrink-0">
                <span className="text-[10px]">⭐</span>
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-bold text-charcoal truncate">{t('msg6Name')}</span>
                <span className="block text-[9px] text-jungle font-semibold">{t('msg6Rating')}</span>
              </span>
            </span>
          </span>
        </>
      ),
      time: '3:28 p.m.',
      delay: 14000,
    },
    {
      id: 7,
      type: 'user',
      content: t('msg7'),
      time: '3:29 p.m.',
      delay: 16500,
    },
    {
      id: 8,
      type: 'bot',
      content: (
        <>
          <span className="block mt-1">
            <span className="block bg-jungle/10 border border-jungle/20 rounded-lg px-2.5 py-2 space-y-1">
              <span className="flex items-center gap-1.5">
                <span className="text-[12px]">✅</span>
                <span className="block text-[10px] text-jungle font-bold">{t('msg8Status')}</span>
              </span>
              <span className="block text-[9px] text-charcoal/70 leading-snug">
                {t('msg8Detail')}
              </span>
              <span className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px]">📱</span>
                <span className="block text-[9px] text-jungle font-semibold">{t('msg8Contact')}</span>
              </span>
            </span>
          </span>
        </>
      ),
      time: '3:29 p.m.',
      delay: 20000,
    },
  ];
}

/* ─── main component ─── */

export default function AnimatedPhoneMockup() {
  const t = useTranslations('phoneMockup');
  const messages = useRef<ChatMsg[]>(buildMessages(t));

  // Rebuild messages when translations change (locale switch)
  useEffect(() => {
    messages.current = buildMessages(t);
  }, [t]);

  const [visibleIds, setVisibleIds] = useState<number[]>([]);
  const [showTyping, setShowTyping] = useState(false);
  const [fading, setFading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pausedRef = useRef(false);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const startCycle = useCallback(() => {
    clearTimers();
    setVisibleIds([]);
    setShowTyping(false);
    setFading(false);

    // Schedule each message
    messages.current.forEach((msg) => {
      const t = setTimeout(() => {
        if (pausedRef.current) return;
        setVisibleIds((prev) => [...prev, msg.id]);
      }, msg.delay);
      timersRef.current.push(t);
    });

    // Schedule typing indicators
    TYPING_SCHEDULE.forEach(({ showAt, hideAt }) => {
      const tShow = setTimeout(() => {
        if (pausedRef.current) return;
        setShowTyping(true);
      }, showAt);
      const tHide = setTimeout(() => {
        if (pausedRef.current) return;
        setShowTyping(false);
      }, hideAt);
      timersRef.current.push(tShow, tHide);
    });

    // Schedule fade-out before reset
    const tFade = setTimeout(() => {
      if (pausedRef.current) return;
      setFading(true);
    }, CYCLE_DURATION - 800);
    timersRef.current.push(tFade);

    // Schedule reset
    const tReset = setTimeout(() => {
      if (pausedRef.current) return;
      startCycle();
    }, CYCLE_DURATION);
    timersRef.current.push(tReset);
  }, [clearTimers]);

  useEffect(() => {
    startCycle();
    return clearTimers;
  }, [startCycle, clearTimers]);

  // Auto-scroll when messages change (double RAF ensures DOM has painted after React commit)
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }
      });
    });
  }, [visibleIds, showTyping]);

  const visibleMessages = messages.current.filter((m) => visibleIds.includes(m.id));

  return (
    <div
      className="relative mx-auto w-[280px] sm:w-[300px]"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      {/* Phone frame */}
      <div className="relative bg-charcoal rounded-[2.5rem] p-2 shadow-2xl shadow-black/30">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-charcoal rounded-b-2xl z-10" />

        {/* Screen */}
        <div className="relative bg-cream rounded-[2rem] overflow-hidden">
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[10px] text-charcoal/60 font-medium">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21z" />
              </svg>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
              </svg>
              <div className="w-5 h-2.5 border border-charcoal/60 rounded-sm relative">
                <div className="absolute inset-[1px] right-[2px] bg-jungle rounded-[1px]" />
              </div>
            </div>
          </div>

          {/* Chat header */}
          <div className="bg-white border-b border-black/5 px-3 py-2 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
              <img src="/dona-obra-logo.png" alt="Doña Obra" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-charcoal leading-tight">Doña Obra</p>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-jungle rounded-full" />
                <p className="text-[10px] text-jungle">{t('online')}</p>
              </div>
            </div>
          </div>

          {/* Chat messages — animated */}
          <div
            ref={scrollRef}
            className={`px-2.5 py-3 space-y-2.5 min-h-[320px] max-h-[360px] overflow-y-auto transition-opacity duration-700 ${fading ? 'opacity-0' : 'opacity-100'}`}
            style={{ scrollbarWidth: 'none' }}
          >
            {visibleMessages.map((msg) =>
              msg.type === 'bot' ? (
                <div key={msg.id} className="flex gap-1.5 items-end animate-msg-enter">
                  <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
                    <img src="/dona-obra-logo.png" alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="bg-white rounded-xl rounded-bl-sm px-2.5 py-2 shadow-sm max-w-[85%]">
                    <p className="text-[11px] text-charcoal leading-relaxed">{msg.content}</p>
                    <p className="text-[8px] text-muted text-right mt-0.5">{msg.time}</p>
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex justify-end animate-msg-enter">
                  <div className="bg-coral rounded-xl rounded-br-sm px-2.5 py-2 shadow-sm max-w-[80%]">
                    <p className="text-[11px] text-white leading-relaxed">{msg.content}</p>
                    <p className="text-[8px] text-white/60 text-right mt-0.5">{msg.time}</p>
                  </div>
                </div>
              )
            )}

            {showTyping && <TypingDots />}
          </div>

          {/* Input bar */}
          <div className="bg-white border-t border-black/5 px-2.5 py-2 flex items-center gap-2">
            <div className="flex-1 bg-cream rounded-full px-3 py-1.5">
              <p className="text-[10px] text-muted">{t('writeYourMessage')}</p>
            </div>
            <div className="w-7 h-7 bg-coral rounded-full flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <div className="absolute -top-3 -right-6 bg-white rounded-xl shadow-lg px-3 py-1.5 border border-black/5 z-20">
        <span className="text-xs font-semibold text-jungle">4.8 ⭐</span>
      </div>
      <div className="absolute -bottom-3 -left-6 bg-white rounded-xl shadow-lg px-3 py-1.5 border border-black/5 z-20">
        <span className="text-xs font-semibold text-coral">{t('professionals')}</span>
      </div>
    </div>
  );
}
