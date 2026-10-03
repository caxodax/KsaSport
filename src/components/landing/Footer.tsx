'use client'

import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import BrandLogo from '@/components/ui/BrandLogo';

interface FooterProps {
  settings?: {
    logo_url?: string | null;
    instagram_url?: string | null;
    facebook_url?: string | null;
    whatsapp_number?: string | null;
  } | null;
}

export default function Footer({ settings }: FooterProps) {
  const instagramUrl = settings?.instagram_url?.trim() || null;
  const facebookUrl = settings?.facebook_url?.trim() || null;
  const rawWhatsapp = settings?.whatsapp_number?.replace(/[^0-9]/g, '') || null;
  const whatsappUrl = rawWhatsapp ? `https://wa.me/${rawWhatsapp}?text=${encodeURIComponent('Hola KsaSport, deseo realizar una consulta.')}` : null;

  return (
    <footer className="bg-gray-900 pt-20 pb-10 border-t border-gray-800 overflow-hidden w-full max-w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-6 group">
              <BrandLogo 
                src={settings?.logo_url} 
                size="sm" 
                variant="badge" 
                className="group-hover:scale-105 transition-transform" 
              />
              <span className="text-xl font-extrabold tracking-wider text-white">
                KASA SPORTS
              </span>
            </Link>
            <p className="text-gray-400 max-w-sm mb-6 leading-relaxed text-sm">
              El ecosistema deportivo inteligente diseñado para potenciar el talento, 
              optimizar la gestión de ligas y simplificar la experiencia de atletas, delegados y fanáticos.
            </p>

            {/* Redes Sociales Oficiales */}
            <div className="flex items-center gap-3">
              {/* Instagram */}
              {instagramUrl ? (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram de KsaSport"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-gradient-to-tr hover:from-amber-500 hover:via-pink-500 hover:to-purple-600 text-white flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-110"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              ) : null}

              {/* Facebook */}
              {facebookUrl ? (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook de KsaSport"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#1877F2] text-white flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-110"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              ) : null}

              {/* WhatsApp Oficial */}
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp Oficial de KsaSport"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-emerald-600 text-white flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-110"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
              ) : null}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Ecosistema</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/calendario" className="text-gray-400 hover:text-white transition-colors">
                  Ligas Activas & Calendario
                </Link>
              </li>
              <li>
                <Link href="/demo-carnet" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors flex items-center gap-1.5">
                  <span>Simulador de Carnet QR</span>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-bold uppercase">Demo</span>
                </Link>
              </li>
              <li>
                <a href="#tryouts" className="text-gray-400 hover:text-white transition-colors">
                  Scouting & Pruebas
                </a>
              </li>
              <li>
                <Link href="/portal" className="text-gray-400 hover:text-white transition-colors">
                  Portal de Atletas
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Contact */}
          <div>
            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Atención & Contacto</h4>
            <ul className="space-y-3 text-sm">
              {whatsappUrl ? (
                <li>
                  <a 
                    href={whatsappUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Contacto por WhatsApp</span>
                  </a>
                </li>
              ) : null}
              <li>
                <Link href="/calendario" className="text-gray-400 hover:text-white transition-colors">
                  Fixture & Sedes Oficiales
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
                  Iniciar Sesión
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>
            © {new Date().getFullYear()} Foxbyte. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-1">
            <span>Desarrollado para alta competencia</span>
          </div>
        </div>
        
      </div>
    </footer>
  );
}
