'use client'

import { motion } from 'framer-motion';
import { CalendarDays, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function EventShowcase() {
  return (
    <section id="eventos" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight"
          >
            Tu momento de brillar.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600"
          >
            Ya sea que busques entrar a un equipo competitivo o quieras seguir los resultados de tu liga favorita.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Card 1: Ligas Activas */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="group relative rounded-3xl overflow-hidden bg-gray-50 border border-gray-200"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50 opacity-50 transition-opacity group-hover:opacity-100"></div>
            
            <div className="relative p-10 flex flex-col h-full min-h-[400px]">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-8">
                <CalendarDays className="w-8 h-8 text-kasa-vinotinto" />
              </div>
              
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Ligas Activas</h3>
              <p className="text-gray-600 text-lg mb-8 max-w-md">
                Consulta el calendario oficial de partidos, resultados de la jornada y tabla de posiciones de todos los torneos en curso.
              </p>
              
              <div className="mt-auto">
                <Link 
                  href="/portal" 
                  className="inline-flex items-center gap-2 text-kasa-vinotinto font-bold text-lg group-hover:gap-4 transition-all"
                >
                  Explorar Calendario <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Decorative Abstract Element */}
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white rounded-full border-8 border-gray-100 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
            </div>
          </motion.div>

          {/* Card 2: Tryouts */}
          <motion.div 
            id="tryouts"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="group relative rounded-3xl overflow-hidden bg-kasa-vinotinto text-white"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBMMTQgMTRMMjggME0wIDI4TDE0IDE0TDI4IDI4IiBzdHJva2U9IiNmZmYiIGZpbGw9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC4wNSIvPgo8L3N2Zz4=')] bg-repeat opacity-20"></div>
            
            <div className="relative p-10 flex flex-col h-full min-h-[400px]">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 mb-8">
                <Users className="w-8 h-8 text-kasa-dorado" />
              </div>
              
              <h3 className="text-3xl font-bold mb-4">Scouting y Tryouts</h3>
              <p className="text-white/80 text-lg mb-8 max-w-md">
                ¿Tienes talento para el Béisbol o Kickingball? Regístrate en nuestras próximas pruebas y forma parte de nuestros equipos.
              </p>
              
              <div className="mt-auto">
                <Link 
                  href="#registro" 
                  className="inline-flex items-center gap-2 text-kasa-dorado font-bold text-lg group-hover:gap-4 transition-all"
                >
                  Ver Fechas Disponibles <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Decorative Abstract Element */}
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-red-900 rounded-full blur-3xl opacity-50 group-hover:bg-kasa-dorado transition-colors duration-700"></div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
