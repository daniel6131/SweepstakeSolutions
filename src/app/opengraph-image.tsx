import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'World Cup Sweepstake 2026';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#002629',
        fontFamily: 'sans-serif',
      }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '4px',
            textTransform: 'uppercase',
            color: 'rgba(148,255,228,0.5)',
          }}>
          World Cup 2026
        </div>
        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            textTransform: 'uppercase',
            color: '#94ffe4',
            lineHeight: 0.85,
            letterSpacing: '-2px',
            textAlign: 'center',
          }}>
          Sweepstake
        </div>
        <div
          style={{
            fontSize: 22,
            color: 'rgba(251,251,251,0.6)',
            marginTop: 8,
          }}>
          USA · Mexico · Canada
        </div>
      </div>
    </div>,
    { ...size }
  );
}
