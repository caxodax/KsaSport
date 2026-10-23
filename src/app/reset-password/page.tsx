import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import BrandLogo from '@/components/ui/BrandLogo';
import ResetPasswordForm from './ResetPasswordForm';
import { getServiceSupabase } from '@/lib/supabase';

export const metadata = {
  title: 'Restablecer Contraseña | KsaSport',
  description: 'Crea una nueva contraseña para acceder a KsaSport.',
};

export default async function ResetPasswordPage() {
  const supabase = getServiceSupabase();
  const { data: settings } = await supabase
    .from('club_settings')
    .select('logo_url')
    .eq('id', 1)
    .single();

  return (
    <div className="min-h-screen bg-kasa-fondo flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative selection:bg-kasa-dorado selection:text-kasa-vinotinto">
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-10">
        <Link
          href="/login"
          className="inline-flex items-center text-xs font-bold text-gray-700 hover:text-kasa-vinotinto bg-white/80 hover:bg-white px-4 py-2 rounded-full shadow-xs border border-slate-200 backdrop-blur-md transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Volver a Iniciar Sesión
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center mb-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200/90 shadow-md p-2 flex items-center justify-center mb-3.5 hover:scale-105 transition-transform duration-200">
          <BrandLogo 
            src={settings?.logo_url} 
            size="lg" 
            variant="plain" 
            alt="KSA Sports" 
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-xl font-black text-gray-900 tracking-wider">
          KSA SPORTS
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Recuperación Segura de Acceso
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md flex justify-center">
        <Suspense fallback={
          <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-md flex items-center justify-center min-h-[300px]">
            <Loader2 className="w-6 h-6 animate-spin text-kasa-vinotinto" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
