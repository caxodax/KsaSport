'use client'

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function CallToAction() {
  return (
    <section className="relative py-24 bg-kasa-vinotinto overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBMMTQgMTRMMjggME0wIDI4TDE0IDE0TDI4IDI4IiBzdHJva2U9IiNmZmYiIGZpbGw9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC4wNSIvPgo8L3N2Zz4=')] bg-repeat opacity-20"></div>
      
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-full bg-kasa-dorado/20 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-extrabold text-white mb-6"
        >
          ¿Lista para salir al campo?
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-xl text-white/80 mb-10 max-w-2xl mx-auto"
        >
          Únete a la plataforma que está cambiando la forma de jugar. 
          Estadísticas profesionales, autogestión y la mejor comunidad deportiva.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link 
            href="/portal" 
            className="w-full sm:w-auto bg-kasa-dorado text-kasa-vinotinto px-8 py-4 rounded-xl text-lg font-bold hover:bg-yellow-400 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all transform hover:-translate-y-1"
          >
            Ingresar a mi Perfil
          </Link>
          <Link 
            href="#tryouts" 
            className="w-full sm:w-auto bg-transparent border border-white/30 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-white/10 transition-all"
          >
            Ver Fechas de Tryouts
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
