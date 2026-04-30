import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Orkasa — CRM inmobiliario con IA para LATAM'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          background: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          padding: 80,
          fontFamily: 'sans-serif',
          color: '#0A0A0A',
        }}
      >
        {/* Top bar with logo + signal */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
          }}
        >
          {/* Cadastral parcel mark */}
          <svg width="56" height="56" viewBox="0 0 200 200">
            <path
              d="M40 44 L160 56 L156 156 L46 164 Z"
              fill="none"
              stroke="#0A0A0A"
              strokeWidth="10"
            />
            <rect x="86" y="94" width="36" height="36" fill="#FF3B00" />
          </svg>
          <span
            style={{
              fontSize: 44,
              fontWeight: 500,
              letterSpacing: -2,
            }}
          >
            orkasa
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 'auto',
            marginBottom: 'auto',
          }}
        >
          <p
            style={{
              fontSize: 18,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: '#767676',
              margin: 0,
            }}
          >
            Real estate OS · LATAM
          </p>
          <h1
            style={{
              fontSize: 88,
              fontWeight: 500,
              lineHeight: 1.05,
              letterSpacing: -3,
              margin: '24px 0 0 0',
              maxWidth: 980,
            }}
          >
            Vendé más propiedades. En menos tiempo.
          </h1>
        </div>

        {/* Bottom strip */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '2px solid #E5E5E5',
            paddingTop: 24,
            fontSize: 18,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: '#0A0A0A',
          }}
        >
          <span>orkasa.io</span>
          <span style={{ color: '#FF3B00' }}>IA · Multi-publicación · Compliance</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
