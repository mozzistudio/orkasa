import { ChatMessage } from '@/lib/types';
import ImagePreview from './ImagePreview';
import ProviderCarousel from './ProviderCarousel';
import { CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
  onWhatsAppSent?: (providerName: string) => void;
  showTail?: boolean;
}

export default function MessageBubble({ message, onWhatsAppSent, showTail = true }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  const time = message.timestamp.toLocaleTimeString('es-PA', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-[2px]`}>
      <div
        className={`relative max-w-[85%] sm:max-w-[65%] ${
          isUser
            ? `bg-wa-bubble-out rounded-lg ${showTail ? 'wa-bubble-out rounded-tr-none' : ''}`
            : `bg-wa-bubble-in rounded-lg ${showTail ? 'wa-bubble-in rounded-tl-none' : ''}`
        } shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${showTail ? 'mt-2' : ''}`}
      >
        <div className="px-[9px] pt-[6px] pb-[8px]">
          {message.images && message.images.length > 0 && (
            <div className="mb-1 -mx-[9px] -mt-[6px] overflow-hidden rounded-t-lg">
              <ImagePreview images={message.images} size="small" />
            </div>
          )}

          {message.content && (
            <p className="whitespace-pre-wrap text-[14.2px] leading-[19px] text-[#111B21] pb-3">
              {message.content}
            </p>
          )}

          {/* Timestamp + read receipt pinned bottom-right */}
          <div className="flex items-center justify-end gap-[3px] -mt-2 -mb-[2px]">
            <span className="text-[11px] text-[#667781] leading-none">{time}</span>
            {isUser && (
              <CheckCheck className="w-[16px] h-[16px] text-[#53BDEB] shrink-0" />
            )}
          </div>
        </div>

        {message.providers && message.providers.length > 0 && (
          <div className="px-[9px] pb-[6px]">
            <ProviderCarousel
              providers={message.providers}
              topPickId={message.topPickId}
              brief={message.brief}
              estimation={message.estimation}
              onWhatsAppSent={onWhatsAppSent}
            />
          </div>
        )}
      </div>
    </div>
  );
}
