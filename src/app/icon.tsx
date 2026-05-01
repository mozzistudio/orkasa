import { ImageResponse } from 'next/og'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#FFFFFF',
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M40 44 L160 56 L156 156 L46 164 Z"
            fill="none"
            stroke="#0A0A0A"
            strokeWidth="14"
          />
          <rect x="86" y="94" width="36" height="36" fill="#FF3B00" />
        </svg>
      </div>
    ),
    { ...size },
  )
}
