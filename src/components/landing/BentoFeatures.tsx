'use client'

import { motion } from 'framer-motion';
import { QrCode, Activity, Wallet, ShieldCheck, TrendingUp } from 'lucide-react';

export default function BentoFeatures() {
  return (
    <section id="tecnologia" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight"
          >
            Tecnología deportiva al <br />
            <span className="text-kasa-vinotinto">siguiente nivel.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600"
          >
            Olvídate de los mensajes de WhatsApp para saber si puedes jugar. Kasa Sports integra tu estatus financiero y rendimiento deportivo en un solo lugar.
          </motion.p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          
          {/* Bento Box 1: Carnet Digital (Large) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="md:col-span-2 relative rounded-3xl bg-white border border-gray-200 p-8 overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-500 group"
          >
            <div className="relative z-10 w-2/3">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 border border-gray-100">
                <QrCode className="w-6 h-6 text-kasa-vinotinto" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Carnet Digital QR</h3>
              <p className="text-gray-600">
                Tu identidad deportiva en tu bolsillo. La mesa técnica escanea tu código antes del juego para validar tu estatus en milisegundos.
              </p>
            </div>
            
            {/* Visual Abstraction */}
            <div className="absolute right-[-10%] bottom-[-10%] w-64 h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl border border-gray-200 transform rotate-12 group-hover:rotate-6 transition-transform duration-500 flex items-center justify-center shadow-lg">
              <div className="w-32 h-32 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
                <QrCode className="w-16 h-16 text-gray-300" />
              </div>
            </div>
          </motion.div>

          {/* Bento Box 2: Finanzas (Small) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="rounded-3xl bg-kasa-vinotinto p-8 text-white relative overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-500 group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-900/50 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110 duration-500"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                <ShieldCheck className="w-6 h-6 text-kasa-dorado" />
              </div>
              <h3 className="text-xl font-bold mb-3">Autogestión de Pagos</h3>
              <p className="text-white/80 text-sm">
                Sube tus comprobantes directamente. El sistema verifica tu solvencia y habilita tu código automáticamente.
              </p>
            </div>
          </motion.div>

          {/* Bento Box 3: Estadisticas (Small) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="rounded-3xl bg-white border border-gray-200 p-8 shadow-sm hover:shadow-xl transition-shadow duration-500 group"
          >
            <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center mb-6 border border-yellow-100">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Estadísticas Pro</h3>
            <p className="text-gray-600 text-sm">
              Sigue tu desempeño partido a partido. Líderes de bateo, outs y efectividad actualizados en vivo por la mesa técnica.
            </p>
          </motion.div>

          {/* Bento Box 4: Alineaciones (Wide) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="md:col-span-2 rounded-3xl bg-gray-900 p-8 text-white relative overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-500 group"
          >
            {/* Field Background Abstraction */}
            <div className="absolute inset-y-0 right-0 w-1/2 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBMMTQgMTRMMjggME0wIDI4TDE0IDE0TDI4IDI4IiBzdHJva2U9IiNmZmYiIGZpbGw9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC4yIi8+Cjwvc3ZnPg==')] bg-repeat"></div>
            
            <div className="relative z-10 w-2/3 md:w-1/2">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Alineación Interactiva</h3>
              <p className="text-gray-400">
                Managers arman su estrategia con 13 posiciones y validan de un vistazo qué jugadoras están aptas financieramente para entrar al diamante.
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
