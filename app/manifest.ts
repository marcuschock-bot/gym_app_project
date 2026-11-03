import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Shadow Forge',
    short_name: 'ShadowForge',
    description: 'Rise Through the Ranks — Solo Leveling Gym Tracker',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0a0b0f',
    theme_color: '#4FC3F7',
    orientation: 'portrait',
    icons: [
      { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
