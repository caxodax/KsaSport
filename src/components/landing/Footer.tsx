'use client'

import Link from 'next/link';
import BrandLogo from '@/components/ui/BrandLogo';
import { InstagramIcon, TikTokIcon, FacebookIcon, WhatsAppIcon } from '@/components/ui/SocialIcons';

interface FooterProps {
  settings?: {
    logo_url?: string | null;
    instagram_url?: string | null;
    tiktok_url?: string | null;
    facebook_url?: string | null;
    whatsapp_number?: string | null;
  } | null;
}

export default function Footer({ settings }: FooterProps) {
  const instagramUrl = settings?.instagram_url?.trim() || null;
  const tiktokUrl = settings?.tiktok_url?.trim() || 'https://www.tiktok.com/@kasasports';
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

            {/* Redes Sociales Oficiales con SVGs y colores de marca */}
            <div className="flex items-center gap-3">
              {/* Instagram */}
              {instagramUrl ? (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram oficial de KsaSport"
                  title="Instagram oficial de KsaSport"
                  className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-pink-500/30 hover:shadow-md hover:scale-110 active:scale-95"
                >
                  <InstagramIcon className="w-5 h-5 fill-current" />
                </a>
              ) : null}

              {/* TikTok */}
              {tiktokUrl ? (
                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok oficial de KsaSport"
                  title="TikTok oficial de KsaSport"
                  className="w-10 h-10 rounded-full bg-black border border-white/20 text-white flex items-center justify-center transition-all duration-300 shadow-sm hover:border-[#25F4EE] hover:shadow-[0_0_14px_rgba(37,244,238,0.35)] hover:scale-110 active:scale-95"
                >
                  <TikTokIcon className="w-5 h-5" />
                </a>
              ) : null}

              {/* Facebook */}
              {facebookUrl ? (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook oficial de KsaSport"
                  title="Facebook oficial de KsaSport"
                  className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-blue-500/30 hover:shadow-md hover:scale-110 active:scale-95"
                >
                  <FacebookIcon className="w-5 h-5 fill-current" />
                </a>
              ) : null}

              {/* WhatsApp Oficial */}
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp oficial de KsaSport"
                  title="WhatsApp oficial de KsaSport"
                  className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-emerald-500/30 hover:shadow-md hover:scale-110 active:scale-95"
                >
                  <WhatsAppIcon className="w-5 h-5 fill-current" />
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
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 transition-transform">
                      <WhatsAppIcon className="w-3 h-3 fill-current" />
                    </span>
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
