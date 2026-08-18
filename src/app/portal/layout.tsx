import Link from 'next/link';
import { Medal } from 'lucide-react';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-kasa-vinotinto text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Medal className="w-8 h-8 text-kasa-dorado" />
            <span className="text-xl font-bold tracking-wider">KASA SPORTS</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/" className="text-sm font-bold text-white/80 hover:text-white transition-colors">
              Volver al inicio
            </Link>
          </div>
        </div>
      </nav>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}
