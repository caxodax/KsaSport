'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from '@/components/ui/BrandLogo';

interface NavbarProps {
  settings?: {
    logo_url?: string | null;
  } | null;
}

export default function Navbar({ settings }: NavbarProps = {}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b ${
          isScrolled 
            ? "bg-white/80 backdrop-blur-md border-gray-200/50 shadow-sm py-3" 
            : "border-transparent bg-kasa-vinotinto py-4 sm:py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group relative z-50">
            <BrandLogo
              src={settings?.logo_url}
              size="sm"
              variant={isScrolled ? "plain" : "badge"}
              className="group-hover:scale-105 transition-transform"
            />
            <span className={`text-xl font-extrabold tracking-wider transition-colors ${
              isScrolled ? "text-gray-900" : "text-white"
            }`}>
              KASA SPORTS
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <div className={`flex gap-6 font-semibold text-sm transition-colors ${
              isScrolled ? "text-gray-600" : "text-white/90"
            }`}>
              <Link href="/calendario" className={`transition-colors ${isScrolled ? "hover:text-kasa-dorado-dark" : "hover:text-kasa-dorado"}`}>Ligas Activas</Link>
              <a href="#tryouts" className={`transition-colors ${isScrolled ? "hover:text-kasa-dorado-dark" : "hover:text-kasa-dorado"}`}>Scouting</a>
              <a href="#tecnologia" className={`transition-colors ${isScrolled ? "hover:text-kasa-dorado-dark" : "hover:text-kasa-dorado"}`}>Plataforma</a>
            </div>
            
            <div className="flex items-center gap-3">
              <Link 
                href="/login" 
                className="text-sm font-black bg-kasa-dorado text-kasa-vinotinto hover:bg-yellow-400 px-6 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
              >
                <span>Ingresar</span>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden relative z-50 p-2 -mr-2"
          >
            {mobileMenuOpen ? (
              <X className={`w-6 h-6 ${isScrolled || mobileMenuOpen ? "text-gray-900" : "text-white"}`} />
            ) : (
              <Menu className={`w-6 h-6 ${isScrolled ? "text-gray-900" : "text-white"}`} />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-white pt-24 px-6 md:hidden flex flex-col"
          >
            <div className="flex flex-col gap-6 text-xl font-bold text-gray-900">
              <Link href="/calendario" onClick={() => setMobileMenuOpen(false)} className="border-b border-gray-100 pb-4">Ligas Activas & Calendario</Link>
              <a href="#tryouts" onClick={() => setMobileMenuOpen(false)} className="border-b border-gray-100 pb-4">Scouting y Tryouts</a>
              <a href="#tecnologia" onClick={() => setMobileMenuOpen(false)} className="border-b border-gray-100 pb-4">Tecnología</a>
            </div>
            
            <div className="mt-auto mb-12 flex flex-col gap-3">
              <Link 
                href="/login" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-4 rounded-2xl font-black bg-kasa-vinotinto text-white shadow-lg active:scale-95 transition-all text-base"
              >
                Ingresar al Ecosistema
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
