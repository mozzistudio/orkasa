'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Send, Paperclip, Smile, Mic } from 'lucide-react';
import ImagePreview from './ImagePreview';

interface ChatInputProps {
  onSend: (message: string, images: string[]) => void;
  disabled?: boolean;
  initialMessage?: string;
}

export default function ChatInput({ onSend, disabled, initialMessage }: ChatInputProps) {
  const [message, setMessage] = useState(initialMessage || '');
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = async (file: File, maxWidth = 1024, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };

      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const MAX_SIZE = 5 * 1024 * 1024;
    const validFiles = Array.from(files).filter((file) => {
      if (file.size > MAX_SIZE) {
        alert(`${file.name} es muy grande. Máximo 5MB.`);
        return false;
      }
      return true;
    });

    const imagePromises = validFiles.map((file) => compressImage(file, 1024, 0.7));
    const newImages = await Promise.all(imagePromises);
    setImages((prev) => [...prev, ...newImages]);

    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (!message.trim() && images.length === 0) return;

    onSend(message.trim(), images);
    setMessage('');
    setImages([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasContent = message.trim() || images.length > 0;

  return (
    <div className="bg-wa-panel-header border-t border-wa-border px-4 py-[10px] shrink-0">
      {/* Image preview */}
      {images.length > 0 && (
        <div className="mb-3 bg-white rounded-lg p-2">
          <ImagePreview images={images} onRemove={handleRemoveImage} size="small" />
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        <button
          disabled={disabled}
          className="p-2 text-wa-text-secondary hover:text-wa-text transition-colors disabled:opacity-50"
        >
          <Smile className="w-6 h-6" />
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="p-2 text-wa-text-secondary hover:text-wa-text transition-colors disabled:opacity-50"
        >
          <Paperclip className="w-6 h-6 rotate-45" />
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
        />

        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            placeholder="Escribe un mensaje"
            className="w-full px-4 py-[9px] bg-white border border-wa-border rounded-lg resize-none focus:outline-none disabled:opacity-50 text-[15px] text-wa-text placeholder:text-wa-text-secondary transition-colors"
            rows={1}
            style={{
              minHeight: '42px',
              maxHeight: '120px',
            }}
          />
        </div>

        {hasContent ? (
          <button
            onClick={handleSend}
            disabled={disabled}
            className="p-2 text-wa-text-secondary hover:text-wa-text transition-colors disabled:opacity-50"
          >
            <Send className="w-6 h-6 text-wa-text-secondary" />
          </button>
        ) : (
          <button
            disabled={disabled}
            className="p-2 text-wa-text-secondary hover:text-wa-text transition-colors disabled:opacity-50"
          >
            <Mic className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}
