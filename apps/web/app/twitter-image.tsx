import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'KinetixFitt — entrenamiento, progreso y coaching';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#09090B',
          padding: 40,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: '#D6FF2A',
            fontSize: 14,
            fontWeight: 900,
            letterSpacing: '0.14em',
          }}
        >
          KINETIXFITT · TRAINING · PROGRESS · COACHING
        </div>
        <div style={{ marginTop: 16, fontSize: 54, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
          Transforma tu Cuerpo
        </div>
        <div style={{ fontSize: 54, fontWeight: 900, color: '#D6FF2A', lineHeight: 1 }}>
          Domina tu Mente
        </div>
        <div style={{ marginTop: 12, fontSize: 15, color: '#A1A1AA' }}>
          kinetixfitt.com — Plataforma IA + Ciencia + Comunidad
        </div>
      </div>
    ),
    { ...size }
  );
}
