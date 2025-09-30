import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Clock In HQ',
    short_name: 'Clock In',
    description: 'Location-aware timekeeping for distributed teams.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#1e293b',
    lang: 'en-US',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
