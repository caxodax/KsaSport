'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Medal, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
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
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b border-transparent",
          isScrolled 
            ? "bg-white/80 backdrop-blur-md border-gray-200/50 shadow-sm py-3" 
            : "bg-kasa-vinotinto py-4 sm:py-5"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group relative z-50">
            <Medal className={cn(
              "w-8 h-8 transition-colors", 
              isScrolled ? "text-kasa-vinotinto" : "text-kasa-dorado"
            )} />
            <span className={cn(
              "text-xl font-extrabold tracking-wider transition-colors",
              isScrolled ? "text-gray-900" : "text-white"
            )}>
              KASA SPORTS
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <div className={cn(
              "flex gap-6 font-semibold text-sm transition-colors",
              isScrolled ? "text-gray-600" : "text-white/90"
            )}>
              <a href="#eventos" className="hover:text-kasa-dorado transition-colors">Ligas Activas</a>
              <a href="#tryouts" className="hover:text-kasa-dorado transition-colors">Scouting</a>
              <a href="#tecnologia" className="hover:text-kasa-dorado transition-colors">Plataforma</a>
            </div>
            
            <div className="flex items-center gap-3">
              <Link 
                href="/portal" 
                className={cn(
                  "text-sm font-bold px-5 py-2.5 rounded-full transition-all border",
                  isScrolled 
                    ? "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                    : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                )}
              >
                Soy Atleta
              </Link>
              <Link 
                href="/admin" 
                className="text-sm font-bold bg-kasa-dorado text-kasa-vinotinto hover:bg-yellow-400 px-5 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                Admin
              </Link>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden relative z-50 p-2 -mr-2"
          >
            {mobileMenuOpen ? (
              <X className={cn("w-6 h-6", isScrolled || mobileMenuOpen ? "text-gray-900" : "text-white")} />
            ) : (
              <Menu className={cn("w-6 h-6", isScrolled ? "text-gray-900" : "text-white")} />
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
              <a href="#eventos" onClick={() => setMobileMenuOpen(false)} className="border-b border-gray-100 pb-4">Ligas Activas</a>
              <a href="#tryouts" onClick={() => setMobileMenuOpen(false)} className="border-b border-gray-100 pb-4">Scouting y Tryouts</a>
              <a href="#tecnologia" onClick={() => setMobileMenuOpen(false)} className="border-b border-gray-100 pb-4">Tecnología</a>
            </div>
            
            <div className="mt-auto mb-12 flex flex-col gap-4">
              <Link 
                href="/portal" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-4 rounded-xl font-bold bg-gray-50 text-gray-900 border border-gray-200"
              >
                Ingresar al Portal
              </Link>
              <Link 
                href="/admin" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-4 rounded-xl font-bold bg-kasa-dorado text-kasa-vinotinto shadow-md"
              >
                Acceso Administrativo
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
