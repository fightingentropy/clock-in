import { ImageResponse } from 'next/og';

export const size = {
  width: 512,
  height: 512,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at 30% 30%, #3b82f6, #0f172a)',
          color: 'white',
          fontSize: 220,
          fontWeight: 700,
          letterSpacing: '-0.05em',
        }}
      >
        CI
      </div>
    ),
    size
  );
}
