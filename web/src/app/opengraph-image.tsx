import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'aydex.cloud — privacy-first analytics that explains why your traffic changed'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 80, background: '#0E1B17', color: '#F4F6F2' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <svg width="110" height="110" viewBox="0 0 64 64">
            <path d="M12 54L32 12L52 54" fill="none" stroke="#F4F6F2" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="32" cy="42" r="5" fill="#2DD4A0" />
          </svg>
          <div style={{ display: 'flex', marginLeft: 28, fontSize: 92, fontWeight: 700, letterSpacing: -3 }}>
            aydex<span style={{ color: '#9FB0A8', fontWeight: 400 }}>.cloud</span>
          </div>
        </div>
        <div style={{ marginTop: 48, fontSize: 56, fontWeight: 700, lineHeight: 1.15, maxWidth: 980 }}>
          Privacy-first analytics that explains why your traffic changed
        </div>
        <div style={{ marginTop: 28, fontSize: 30, color: '#9FB0A8' }}>No cookies · No recordings · REST API &amp; MCP on every plan</div>
      </div>
    ),
    size
  )
}
