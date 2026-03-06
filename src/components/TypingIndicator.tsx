export default function TypingIndicator() {
  return (
    <div className="flex justify-start mb-[2px]">
      <div className="relative bg-wa-bubble-in rounded-lg wa-bubble-in rounded-tl-none shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] mt-2">
        <div className="px-[12px] py-[8px] flex items-center gap-1.5">
          <div className="flex gap-[3px]">
            <div className="w-[7px] h-[7px] bg-[#8696A0] rounded-full animate-bounce-dot" style={{ animationDelay: '0ms' }} />
            <div className="w-[7px] h-[7px] bg-[#8696A0] rounded-full animate-bounce-dot" style={{ animationDelay: '200ms' }} />
            <div className="w-[7px] h-[7px] bg-[#8696A0] rounded-full animate-bounce-dot" style={{ animationDelay: '400ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
