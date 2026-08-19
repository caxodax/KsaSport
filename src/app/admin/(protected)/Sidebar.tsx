'use client'

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Medal, LayoutDashboard, Users, Shield, Trophy, Menu, Tags, X, ShoppingBag, Wallet, Settings, LogOut } from 'lucide-react';
import { logoutAdmin } from '../login/actions';

export default function Sidebar({ permissions }: { permissions: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const navLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/teams', label: 'Equipos', icon: Trophy },
    { href: '/admin/categories', label: 'Categorías', icon: Tags },
    { href: '/admin/athletes', label: 'Roster / Atletas', icon: Users, permission: 'view_roster' },
    { href: '/admin/staff', label: 'Staff Técnico', icon: Shield },
    { href: '/admin/products', label: 'Catálogo de Tienda', icon: ShoppingBag, permission: 'manage_catalog' },
    { href: '/admin/payments', label: 'Finanzas y Pagos', icon: Wallet, permission: 'view_finances' },
    { href: '/admin/settings', label: 'Configuración', icon: Settings, permission: 'manage_settings' },
  ].filter(link => !link.permission || permissions.includes(link.permission));

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-kasa-vinotinto text-white p-4 flex justify-between items-center shadow-md z-20 relative">
        <div className="flex items-center gap-2">
          <Medal className="w-6 h-6 text-kasa-dorado" />
          <h1 className="font-bold tracking-tight text-lg">Kasa Sports</h1>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden" 
          onClick={closeMenu}
        />
      )}

      {/* Sidebar Content (Desktop & Mobile Drawer) */}
      <aside className={`
        fixed md:sticky top-0 inset-y-0 left-0 z-30 w-64 bg-kasa-vinotinto text-white flex flex-col h-screen transform transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 hidden md:flex items-center gap-3 border-b border-white/10">
          <div className="p-2 bg-white/10 rounded-lg">
            <Medal className="w-6 h-6 text-kasa-dorado" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Kasa Sports</h1>
          </div>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto mt-4 md:mt-0">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4 px-3">Gestión</p>
          <nav className="space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  onClick={closeMenu}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-colors ${
                    isActive ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-kasa-dorado' : 'text-gray-400 group-hover:text-white'}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-white/10 mt-auto flex justify-between items-center">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-kasa-dorado flex items-center justify-center text-kasa-vinotinto font-bold text-sm shrink-0">
              AD
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold truncate max-w-[100px]">Admin</span>
            </div>
          </div>
          <button 
            onClick={() => logoutAdmin()} 
            className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>
    </>
  );
}
