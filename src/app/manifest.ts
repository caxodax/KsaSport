import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kasa Sports',
    short_name: 'KsaSport',
    description: 'Ecosistema Inteligente de Gestión Deportiva y Ligas Activas',
    start_url: '/',
    display: 'standalone',
    background_color: '#5A0F1D',
    theme_color: '#5A0F1D',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
