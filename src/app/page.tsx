import Link from 'next/link';
import { Medal, Calendar, Users, ChevronRight, Activity } from 'lucide-react';

export default function PublicLandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar Pública */}
      <nav className="bg-kasa-vinotinto text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Medal className="w-8 h-8 text-kasa-dorado" />
            <span className="text-xl font-bold tracking-wider">KASA SPORTS</span>
          </div>
          <div className="hidden md:flex gap-6 font-medium text-sm">
            <a href="#eventos" className="hover:text-kasa-dorado transition-colors">Eventos</a>
            <a href="#tryouts" className="hover:text-kasa-dorado transition-colors">Scouting</a>
            <a href="#estadisticas" className="hover:text-kasa-dorado transition-colors">Estadísticas</a>
          </div>
          <div className="flex gap-3">
            <Link href="/portal" className="text-sm font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all border border-white/20">
              Soy Atleta
            </Link>
            <Link href="/admin" className="text-sm font-bold bg-kasa-dorado text-kasa-vinotinto hover:bg-yellow-400 px-4 py-2 rounded-full transition-all">
              Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section (Enfoque Dual) */}
      <main className="flex-1 flex flex-col">
        {/* Banner principal */}
        <div className="relative bg-kasa-gris text-white py-24 sm:py-32 overflow-hidden flex-1 flex items-center">
          <div className="absolute inset-0 bg-kasa-vinotinto/20"></div>
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-kasa-vinotinto rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-kasa-dorado rounded-full blur-3xl opacity-20"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Medal className="w-20 h-20 text-kasa-dorado mx-auto mb-6 opacity-90" />
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
              El Ecosistema Oficial del <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-kasa-dorado to-yellow-200">
                Talento Deportivo
              </span>
            </h1>
            <p className="mt-4 text-xl text-gray-300 max-w-2xl mx-auto mb-10">
              Plataforma integral para la gestión de ligas, captación de nuevos talentos y estadísticas en tiempo real.
            </p>
            
            {/* Botones de Llamado a la Acción (Dual CTA) */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link href="#ligas" className="group relative flex items-center justify-center gap-2 bg-kasa-vinotinto hover:bg-red-900 border border-red-800/50 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-lg hover:shadow-red-900/20">
                <Calendar className="w-5 h-5 text-kasa-dorado group-hover:scale-110 transition-transform" />
                Ligas Activas
              </Link>
              <Link href="#tryouts" className="group flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-kasa-gris border border-gray-200 px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-lg">
                <Users className="w-5 h-5 text-kasa-vinotinto group-hover:scale-110 transition-transform" />
                Próximos Tryouts
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="bg-white dark:bg-slate-900 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="p-6 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-kasa-vinotinto dark:text-red-400 rounded-xl flex items-center justify-center mb-4">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Centro de Estadísticas</h3>
                <p className="text-gray-600 dark:text-gray-400">Resultados, líderes de la liga y tabla de posiciones actualizadas al instante.</p>
                <button className="mt-4 text-kasa-vinotinto dark:text-kasa-dorado font-bold text-sm flex items-center gap-1">Ver Tablas <ChevronRight className="w-4 h-4"/></button>
              </div>

              <div className="p-6 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Autogestión de Atletas</h3>
                <p className="text-gray-600 dark:text-gray-400">Portal exclusivo para que las jugadoras validen su estatus y solvencia financiera.</p>
                <Link href="/portal" className="mt-4 text-yellow-700 dark:text-kasa-dorado font-bold text-sm flex items-center gap-1">Ir al Portal <ChevronRight className="w-4 h-4"/></Link>
              </div>

              <div className="p-6 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 text-kasa-gris dark:text-gray-300 rounded-xl flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Calendario de Eventos</h3>
                <p className="text-gray-600 dark:text-gray-400">No te pierdas ningún partido. Revisa la cartelera oficial de juegos de la semana.</p>
                <button className="mt-4 text-kasa-gris dark:text-gray-300 font-bold text-sm flex items-center gap-1">Ver Cartelera <ChevronRight className="w-4 h-4"/></button>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-kasa-vinotinto text-white/80 py-8 text-center text-sm border-t border-red-900/50">
        <p>© 2026 Kasa Sports. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
