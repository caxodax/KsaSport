'use client'

import { motion } from 'framer-motion';

export default function SocialProof() {
  const stats = [
    { label: "Atletas Activas", value: "+500" },
    { label: "Ligas de Béisbol y Sóftbol", value: "3" },
    { label: "Equipos Formados", value: "24" },
    { label: "Autogestión Digital", value: "100%" }
  ];

  return (
    <section className="bg-white border-b border-gray-100 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-sm font-bold tracking-widest text-gray-400 uppercase">La familia Kasa Sports sigue creciendo</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x-0 md:divide-x divide-gray-100">
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center justify-center text-center p-4"
            >
              <div className="text-4xl md:text-5xl font-extrabold text-kasa-vinotinto mb-2">
                {stat.value}
              </div>
              <div className="text-sm md:text-base font-medium text-gray-500">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
