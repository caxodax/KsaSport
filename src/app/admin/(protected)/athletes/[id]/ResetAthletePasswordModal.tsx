'use client';

import { useState } from 'react';
import { KeyRound, Eye, EyeOff, Sparkles, Copy, Check, Loader2, X, AlertCircle } from 'lucide-react';
import { updateAthletePassword } from './actions';
import { toast } from 'sonner';

interface ResetAthletePasswordModalProps {
  athleteId: string;
  athleteName: string;
  userEmail: string | null;
  hasAccount: boolean;
}

export default function ResetAthletePasswordModal({
  athleteId,
  athleteName,
  userEmail,
  hasAccount,
}: ResetAthletePasswordModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedPassword, setSavedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!hasAccount) {
    return null;
  }

  const generateSuggestedPassword = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const suggested = `Ksa${randomDigits}*`;
    setPassword(suggested);
    setError(null);
  };

  const handleOpen = () => {
    generateSuggestedPassword();
    setSavedPassword(null);
    setCopied(false);
    setError(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setPassword('');
    setSavedPassword(null);
    setError(null);
    setCopied(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await updateAthletePassword(athleteId, password);

    if (res?.error) {
      setError(res.error);
      setLoading(false);
      toast.error(res.error);
    } else {
      setSavedPassword(password);
      setLoading(false);
      toast.success('¡Contraseña actualizada exitosamente!');
    }
  };

  const handleCopyWhatsApp = () => {
    const pass = savedPassword || password;
    const text = `Hola ${athleteName}, tu contraseña de acceso a la App KsaSport ha sido actualizada por la administración.\n\n📧 Correo: ${userEmail || 'Tu correo registrado'}\n🔑 Contraseña temporal: ${pass}\n\nPuedes ingresar directamente aquí:\nhttps://www.kasasportsagency.com/login\n\n(Te recomendamos cambiarla luego de ingresar si lo deseas).`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('¡Mensaje para WhatsApp copiado al portapapeles!');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <>
      {/* Botón Disparador */}
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
        title="Cambiar contraseña de la cuenta móvil de esta atleta en 5 segundos"
      >
        <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
        <span>Cambiar Clave</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex items-start justify-between p-5 border-b border-gray-100 bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100/80 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-200/60">
                  <KeyRound className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 tracking-tight leading-tight">
                    Cambiar Contraseña
                  </h3>
                  <p className="text-xs text-slate-500 font-medium truncate max-w-[240px]">
                    {athleteName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-5 sm:p-6 space-y-4">
              {/* Información de la cuenta */}
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100/80 flex items-center justify-between text-xs">
                <span className="text-indigo-900 font-medium">Cuenta vinculada:</span>
                <span className="font-mono font-bold text-indigo-800 truncate max-w-[200px]" title={userEmail || ''}>
                  {userEmail || 'Atleta Vinculada'}
                </span>
              </div>

              {/* Estado de Éxito con botón WhatsApp */}
              {savedPassword ? (
                <div className="space-y-4 py-2">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                      <Check className="w-6 h-6 stroke-[3]" />
                    </div>
                    <h4 className="font-black text-emerald-950 text-sm">
                      ¡Contraseña Actualizada!
                    </h4>
                    <p className="text-xs text-emerald-800">
                      La nueva contraseña ya está activa en la app.
                    </p>
                    <div className="pt-2">
                      <span className="inline-block px-4 py-2 bg-white rounded-xl font-mono text-base font-black text-emerald-900 border border-emerald-200 shadow-2xs tracking-wider">
                        {savedPassword}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCopyWhatsApp}
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>¡Copiado al Portapapeles!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copiar Mensaje para WhatsApp</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleClose}
                      className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Listo, Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                /* Formulario de Asignación */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-gray-700">
                        Nueva Contraseña *
                      </label>
                      <button
                        type="button"
                        onClick={generateSuggestedPassword}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                        <span>Sugerir otra</span>
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full pl-3 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono font-bold text-gray-900 outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Mínimo 6 caracteres. Puedes dictarle esta clave o copiársela por WhatsApp.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading || password.length < 6}
                      className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <span>Guardar Contraseña</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
