import Link from 'next/link';
import BrandLogo from '@/components/ui/BrandLogo';
import { getServiceSupabase } from '@/lib/supabase';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = getServiceSupabase();
  const { data: settings } = await supabase
    .from('club_settings')
    .select('logo_url')
    .eq('id', 1)
    .single();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full max-w-full overflow-x-clip">
      <nav className="bg-kasa-vinotinto text-white shadow-md w-full sticky top-0 z-40 border-b border-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5 group">
            <BrandLogo 
              src={settings?.logo_url} 
              size="sm" 
              variant="badge" 
              className="group-hover:scale-105 transition-transform" 
            />
            <span className="text-xl font-bold tracking-wider">KASA SPORTS</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/" className="text-sm font-bold text-white/80 hover:text-white transition-colors">
              Volver al inicio
            </Link>
          </div>
        </div>
      </nav>
      <main className="flex-1 flex flex-col w-full max-w-full min-w-0 overflow-x-clip">
        {children}
      </main>
    </div>
  )
}
