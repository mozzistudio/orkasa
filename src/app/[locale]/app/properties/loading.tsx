export default function Loading() {
  return (
    <div className="max-w-[1380px] animate-pulse">
      {/* Header */}
      <div className="mb-[22px] flex items-end justify-between gap-6">
        <div className="min-w-0 space-y-3">
          <div className="h-[10px] w-20 rounded-sm bg-bone" />
          <div className="h-[28px] w-48 rounded-sm bg-bone" />
          <div className="h-[14px] w-[420px] rounded-sm bg-bone-soft" />
        </div>
        <div className="flex gap-2">
          <div className="h-[32px] w-[88px] rounded-[4px] bg-bone-soft" />
          <div className="h-[32px] w-[140px] rounded-[4px] bg-bone" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="mb-6 grid grid-cols-1 overflow-hidden rounded-[8px] border border-bone bg-paper md:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="border-b border-bone px-[18px] py-[14px] last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 lg:border-r"
          >
            <div className="mb-[6px] h-[9px] w-20 rounded-sm bg-bone-soft" />
            <div className="mb-1 h-[20px] w-24 rounded-sm bg-bone" />
            <div className="h-[11px] w-32 rounded-sm bg-bone-soft" />
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[28px] w-16 rounded-[5px] bg-bone-soft" />
          ))}
        </div>
        <div className="flex gap-2">
          <div className="h-[28px] w-[200px] rounded-[5px] bg-bone-soft" />
          <div className="h-[28px] w-[80px] rounded-[5px] bg-bone-soft" />
          <div className="h-[28px] w-[120px] rounded-[5px] bg-bone-soft" />
        </div>
      </div>

      {/* Section header */}
      <div className="mb-3 mt-7 h-[14px] w-44 rounded-sm bg-bone-soft" />

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-[10px] border border-bone bg-paper"
          >
            <div className="h-[150px] bg-bone" />
            <div className="space-y-3 p-4">
              <div className="flex justify-between">
                <div className="space-y-1.5">
                  <div className="h-[14px] w-32 rounded-sm bg-bone" />
                  <div className="h-[11px] w-24 rounded-sm bg-bone-soft" />
                </div>
                <div className="h-[14px] w-14 rounded-sm bg-bone" />
              </div>
              <div className="my-2 grid grid-cols-3 gap-2 border-y border-bone py-[10px]">
                {[0, 1, 2].map((j) => (
                  <div key={j} className="space-y-1 text-center">
                    <div className="mx-auto h-[14px] w-8 rounded-sm bg-bone" />
                    <div className="mx-auto h-[10px] w-12 rounded-sm bg-bone-soft" />
                  </div>
                ))}
              </div>
              <div className="h-[36px] rounded-[5px] bg-bone-soft" />
              <div className="flex gap-1.5">
                <div className="h-[30px] flex-1 rounded-[5px] bg-bone" />
                <div className="h-[30px] w-[30px] rounded-[5px] bg-bone-soft" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
