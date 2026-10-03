'use client'

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, CheckCircle2, ShieldCheck, QrCode, 
  Sparkles, Calendar, RotateCcw, Volume2, Trophy,
  UserCheck, ExternalLink, Zap
} from 'lucide-react';
import BrandLogo from '@/components/ui/BrandLogo';

export default function DemoCarnetPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [scanTimestamp, setScanTimestamp] = useState<string | null>(null);

  // Reproductor acústico nativo con Web Audio API (Ponytail: 0 KB de librerías)
  const playVerificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Doble tono confirmatorio estilo árbitro/POS deportivo (880Hz -> 1320Hz)
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1320, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // AudioContext no soportado o bloqueado por política de autoplay
    }
  };

  const handleSimulateScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setIsVerified(false);

    // Animación de haz láser de barrido
    setTimeout(() => {
      playVerificationChime();
      setIsScanning(false);
      setIsVerified(true);
      setScanTimestamp(new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 900);
  };

  const handleReset = () => {
    setIsScanning(false);
    setIsVerified(false);
    setScanTimestamp(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#160205] via-[#24040C] to-[#0F0103] text-white flex flex-col font-sans selection:bg-kasa-dorado selection:text-kasa-vinotinto w-full max-w-full overflow-x-clip">
      
      {/* Background Decor - Stadium Lights */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[42rem] h-[42rem] bg-gradient-to-b from-amber-300/15 via-kasa-dorado/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-red-950/40 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      {/* Header Superior de Navegación */}
      <header className="sticky top-0 z-40 bg-[#160205]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <BrandLogo size="sm" variant="badge" className="group-hover:scale-105 transition-transform" />
            <span className="text-xl font-extrabold tracking-wider text-white">
              KASA SPORTS
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/calendario"
              className="text-xs sm:text-sm font-bold text-gray-300 hover:text-kasa-dorado transition-colors hidden sm:flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>Ver Calendario</span>
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-300 hover:text-white bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-lg border border-white/15 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full relative z-10">
        
        {/* Título de la Sección */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-kasa-dorado text-xs font-bold mb-4 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mesa Técnica Digital • Demostración en Vivo</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white tracking-wider uppercase leading-none mb-3">
            SIMULADOR DE ESCANEO QR
          </h1>

          <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
            Descubre cómo árbitros, comisionados y delegados validan en segundos la solvencia administrativa y habilitación técnica del atleta antes de entrar al line-up del partido.
          </p>
        </div>

        {/* Zona Interactiva: Carnet + Panel de Verificación */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-4xl mx-auto">
          
          {/* ===============================================================
              CARNET DIGITAL DEL ATLETA (COLUMNA IZQUIERDA / CENTRAL)
              =============================================================== */}
          <div className="lg:col-span-7 flex justify-center">
            <div className={`relative w-full max-w-[340px] sm:max-w-[370px] bg-gradient-to-b from-[#2A050E] via-[#1B0309] to-black rounded-3xl p-6 sm:p-7 border-2 transition-all duration-500 shadow-2xl overflow-hidden ${
              isVerified 
                ? 'border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.4)]' 
                : 'border-amber-400/40 shadow-[0_0_40px_rgba(212,175,55,0.2)]'
            }`}>
              
              {/* Reflejo metálico holográfico */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-bl from-white/10 via-kasa-dorado/15 to-transparent rounded-full blur-2xl pointer-events-none" />

              {/* Header del Carnet */}
              <div className="flex items-center justify-between pb-4 border-b border-white/15 mb-5 relative z-10">
                <div className="flex items-center gap-2">
                  <BrandLogo size="xs" variant="badge" />
                  <div>
                    <div className="text-[10px] font-mono tracking-widest uppercase text-amber-300 font-bold">
                      KsaSport League
                    </div>
                    <div className="text-xs font-black tracking-wide text-white">
                      PASE OFICIAL DE ATLETA
                    </div>
                  </div>
                </div>

                <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border transition-colors ${
                  isVerified 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' 
                    : 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isVerified ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span>{isVerified ? 'Apta para Juego' : '2026 Oficial'}</span>
                </div>
              </div>

              {/* Perfil del Atleta */}
              <div className="flex items-center gap-4 mb-5 relative z-10">
                {/* Foto / Avatar Deportivo */}
                <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-400/30 via-red-950 to-amber-200/20 p-1 border border-amber-400/40 shadow-md shrink-0 flex items-center justify-center">
                  <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center text-3xl font-display text-kasa-dorado">
                    #14
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-amber-400 text-kasa-vinotinto text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                    PRO
                  </div>
                </div>

                {/* Datos */}
                <div className="min-w-0">
                  <h3 className="font-display text-2xl sm:text-3xl text-white tracking-wide leading-none truncate">
                    VALERIA MORALES
                  </h3>
                  <div className="text-kasa-dorado font-bold text-xs uppercase tracking-wider mt-0.5">
                    Águilas de Caracas BBC
                  </div>
                  <div className="text-gray-300 text-[11px] font-medium mt-1 flex items-center gap-2">
                    <span className="bg-white/10 px-2 py-0.5 rounded text-[10px]">Shortstop</span>
                    <span className="text-gray-400">Sóftbol Libre</span>
                  </div>
                </div>
              </div>

              {/* Zona del Código QR con Animación Láser */}
              <div className="relative bg-white rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shadow-inner my-2">
                
                {/* Código QR Ilustrativo SVG de Alta Fidelidad */}
                <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center">
                  <svg className="w-full h-full text-slate-950" viewBox="0 0 100 100" fill="currentColor">
                    {/* Marcadores de posición en las esquinas */}
                    <rect x="0" y="0" width="28" height="28" rx="4" fill="currentColor" />
                    <rect x="4" y="4" width="20" height="20" rx="2" fill="white" />
                    <rect x="8" y="8" width="12" height="12" rx="1" fill="currentColor" />

                    <rect x="72" y="0" width="28" height="28" rx="4" fill="currentColor" />
                    <rect x="76" y="4" width="20" height="20" rx="2" fill="white" />
                    <rect x="80" y="8" width="12" height="12" rx="1" fill="currentColor" />

                    <rect x="0" y="72" width="28" height="28" rx="4" fill="currentColor" />
                    <rect x="4" y="76" width="20" height="20" rx="2" fill="white" />
                    <rect x="8" y="80" width="12" height="12" rx="1" fill="currentColor" />

                    {/* Matriz simulada de datos QR */}
                    <rect x="36" y="8" width="6" height="6" />
                    <rect x="48" y="8" width="6" height="6" />
                    <rect x="58" y="8" width="6" height="6" />
                    <rect x="36" y="20" width="6" height="6" />
                    <rect x="44" y="24" width="8" height="6" />
                    
                    <rect x="8" y="36" width="6" height="6" />
                    <rect x="20" y="36" width="6" height="6" />
                    <rect x="8" y="48" width="6" height="6" />
                    <rect x="18" y="56" width="6" height="6" />

                    {/* Centro con logo deportivo */}
                    <rect x="34" y="34" width="32" height="32" rx="6" fill="#5A0F1D" />
                    <circle cx="50" cy="50" r="10" fill="#D4AF37" />
                    
                    {/* Cuadrante inferior derecho */}
                    <rect x="36" y="74" width="6" height="6" />
                    <rect x="46" y="82" width="6" height="6" />
                    <rect x="58" y="74" width="6" height="6" />
                    <rect x="74" y="44" width="6" height="6" />
                    <rect x="86" y="40" width="6" height="6" />
                    <rect x="74" y="58" width="8" height="6" />
                    <rect x="86" y="60" width="6" height="6" />
                    <rect x="74" y="74" width="6" height="6" />
                    <rect x="86" y="82" width="6" height="6" />
                  </svg>

                  {/* Haz Láser Animado al Escanear */}
                  {isScanning && (
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_4px_rgba(52,211,153,0.9)] animate-bounce" />
                  )}
                </div>

                {/* Subtítulo del QR */}
                <span className="text-[10px] font-mono text-gray-500 font-bold uppercase tracking-widest mt-2">
                  ID: KSA-2026-VAL-14
                </span>
              </div>

              {/* Footer del Carnet: Estado Dinámico */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-gray-400 text-[11px]">Válido hasta:</span>
                <span className="text-amber-200 font-mono font-bold text-[11px]">Diciembre 2026</span>
              </div>

            </div>
          </div>

          {/* ===============================================================
              PANEL DE CONTROL DE MESA TÉCNICA (COLUMNA DERECHA)
              =============================================================== */}
          <div className="lg:col-span-5 flex flex-col justify-center gap-5">
            
            {/* Tarjeta de Acción */}
            <div className="bg-white/5 border border-white/15 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
              <div className="flex items-center gap-2 text-xs font-bold text-kasa-dorado uppercase tracking-wider mb-2">
                <Zap className="w-4 h-4" />
                <span>Interacción en Tiempo Real</span>
              </div>
              
              <h2 className="font-display text-2xl sm:text-3xl text-white tracking-wide mb-2 uppercase">
                {isVerified ? '¡ATLETA AUTORIZADA!' : 'TERMINAL DE CONTROL'}
              </h2>

              <p className="text-gray-300 text-xs sm:text-sm mb-6 leading-relaxed">
                {isVerified 
                  ? 'La mesa técnica ha registrado la presencia del jugador y su estatus administrativo está solvente para competir en el partido oficial.'
                  : 'Pulsa el botón para simular la lectura óptica del QR desde la terminal del comisionado o árbitro en el terreno de juego.'}
              </p>

              {/* Botón Principal de Simulación */}
              {!isVerified ? (
                <button
                  type="button"
                  onClick={handleSimulateScan}
                  disabled={isScanning}
                  className="w-full group relative flex items-center justify-center gap-3 bg-gradient-to-r from-kasa-dorado via-yellow-400 to-amber-500 text-kasa-vinotinto py-4 px-6 rounded-2xl font-black text-base transition-all hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] active:scale-95 disabled:opacity-70 cursor-pointer"
                >
                  <QrCode className={`w-5 h-5 ${isScanning ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
                  <span>{isScanning ? 'Escaneando Código QR...' : 'Simular Escaneo de Mesa'}</span>
                </button>
              ) : (
                <div className="space-y-4">
                  {/* Badge de Aprobación */}
                  <div className="bg-emerald-500/15 border border-emerald-400/40 rounded-2xl p-4 flex items-center gap-3.5 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-emerald-300 font-black text-sm uppercase tracking-wide">
                        ¡Atleta Verificada!
                      </div>
                      <div className="text-gray-200 text-xs mt-0.5">
                        Apta para el line-up del partido • {scanTimestamp}
                      </div>
                    </div>
                  </div>

                  {/* Checklist de Verificación */}
                  <div className="bg-black/40 rounded-2xl p-4 border border-white/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-gray-300">
                      <span>• Roster Oficial de Águilas BBC:</span>
                      <span className="text-emerald-400 font-bold">Activo ✓</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-300">
                      <span>• Solvencia Administrativa 2026:</span>
                      <span className="text-emerald-400 font-bold">Solvente ✓</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-300">
                      <span>• Ficha Médica y Seguro:</span>
                      <span className="text-emerald-400 font-bold">Vigente ✓</span>
                    </div>
                  </div>

                  {/* Botón Reiniciar */}
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white py-3 px-4 rounded-xl font-bold text-xs sm:text-sm border border-white/15 transition-all cursor-pointer active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4 text-gray-400" />
                    <span>Reiniciar Simulación</span>
                  </button>
                </div>
              )}
            </div>

            {/* Llamada a la Acción para Jugadores */}
            <div className="bg-gradient-to-r from-amber-400/10 via-white/5 to-transparent border border-amber-400/20 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-white font-extrabold text-sm sm:text-base">
                  ¿Quieres tu propio Carnet Oficial?
                </h4>
                <p className="text-gray-300 text-xs mt-0.5">
                  Regístrate como atleta o ingresa a tu portal deportivo.
                </p>
              </div>

              <Link
                href="/login?tab=signup"
                className="shrink-0 bg-kasa-dorado hover:bg-yellow-400 text-kasa-vinotinto font-black text-xs py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span>Crear Cuenta</span>
                <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
              </Link>
            </div>

          </div>

        </div>

      </main>

      {/* Footer Mínimo */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-gray-400 relative z-10">
        <p>© {new Date().getFullYear()} Kasa Sports. Sistema Oficial de Conciliación y Mesa Técnica.</p>
      </footer>

    </div>
  );
}
