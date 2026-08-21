import { Medal } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 pt-20 pb-10 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <Medal className="w-8 h-8 text-kasa-dorado" />
              <span className="text-xl font-extrabold tracking-wider text-white">
                KASA SPORTS
              </span>
            </Link>
            <p className="text-gray-400 max-w-sm mb-6">
              El ecosistema deportivo inteligente diseñado para potenciar el talento, 
              optimizar la gestión de ligas y simplificar la experiencia de los atletas.
            </p>
            <div className="flex gap-4">
              {/* Social Placeholders */}
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-kasa-dorado hover:text-kasa-vinotinto transition-colors cursor-pointer">
                <span className="sr-only">Instagram</span>
                Ig
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-kasa-dorado hover:text-kasa-vinotinto transition-colors cursor-pointer">
                <span className="sr-only">Facebook</span>
                Fb
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-bold mb-6">Ecosistema</h4>
            <ul className="space-y-4">
              <li><a href="#eventos" className="text-gray-400 hover:text-white transition-colors">Ligas Activas</a></li>
              <li><a href="#tryouts" className="text-gray-400 hover:text-white transition-colors">Scouting</a></li>
              <li><Link href="/portal" className="text-gray-400 hover:text-white transition-colors">Portal de Atletas</Link></li>
            </ul>
          </div>

          {/* Legal / Contact */}
          <div>
            <h4 className="text-white font-bold mb-6">Soporte</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Preguntas Frecuentes</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Términos y Condiciones</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contacto</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Kasa Sports. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            Diseñado en <span className="font-bold text-gray-400">Next.js</span>
          </div>
        </div>
        
      </div>
    </footer>
  );
}
