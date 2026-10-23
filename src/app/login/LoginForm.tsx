'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Lock, Mail, ArrowRight, ShieldCheck, 
  Sparkles, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2,
  KeyRound, ArrowLeft 
} from 'lucide-react';
import { login, signup, requestPasswordReset, type AuthResult } from './actions';

export default function LoginForm() {
  const searchParams = useSearchParams();
  const initialIsSignup = searchParams.get('tab') === 'signup';
  const initialResetSuccess = searchParams.get('reset') === 'success';
  const initialErrorParam = searchParams.get('error') === 'enlace_invalido_o_expirado';

  const [isLogin, setIsLogin] = useState(!initialIsSignup);
  const [isForgot, setIsForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(
    initialErrorParam ? 'El enlace para restablecer la contraseña no es válido o ha expirado. Por favor solicita uno nuevo.' : ''
  );
  const [successMessage, setSuccessMessage] = useState(
    initialResetSuccess ? '¡Tu contraseña ha sido actualizada exitosamente! Ya puedes iniciar sesión con tu nueva contraseña.' : ''
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    const formData = new FormData(e.currentTarget);
    
    let result: AuthResult | undefined;

    if (isForgot) {
      result = await requestPasswordReset(formData);
    } else if (isLogin) {
      result = await login(formData);
    } else {
      result = await signup(formData);
    }

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.successMessage) {
      setSuccessMessage(result.successMessage);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.1)] border border-gray-100 p-6 sm:p-8">
      {/* Vista de Recuperar Contraseña */}
      {isForgot ? (
        <div>
          <button
            type="button"
            onClick={() => { setIsForgot(false); setError(''); setSuccessMessage(''); }}
            className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-kasa-vinotinto mb-4 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver a Iniciar Sesión
          </button>

          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-red-50 text-kasa-vinotinto rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
              <KeyRound className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Recuperar Contraseña
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Ingresa el correo registrado de tu cuenta (Atleta, Mánager o Staff) y te enviaremos un enlace seguro para restablecerla.
            </p>
          </div>

          {/* Alerta de Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-3.5 rounded-2xl mb-5 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-semibold leading-relaxed">{error}</p>
            </div>
          )}

          {/* Alerta de Éxito */}
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl mb-5 text-center space-y-2 animate-in fade-in">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <p className="text-xs text-emerald-800 font-semibold leading-relaxed">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium outline-none focus:bg-white focus:border-kasa-vinotinto focus:ring-4 focus:ring-kasa-vinotinto/10 transition-all text-gray-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-kasa-vinotinto hover:bg-red-950 text-white font-black text-xs sm:text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando enlace seguro...</span>
                </>
              ) : (
                <>
                  <span>Enviar Enlace de Recuperación</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* Vistas de Login y Registro */
        <div>
          {/* Selector de Pestañas (Login / Registro) */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); setSuccessMessage(''); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                isLogin 
                  ? 'bg-white text-kasa-vinotinto shadow-sm font-black' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(''); setSuccessMessage(''); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                !isLogin 
                  ? 'bg-white text-kasa-vinotinto shadow-sm font-black' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Crear Cuenta (Atleta)
            </button>
          </div>

          {/* Encabezado descriptivo */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              {isLogin ? 'Bienvenido a KsaSport' : 'Registro de Atletas'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {isLogin
                ? 'Acceso único para Atletas, Mánagers y Personal Técnico.'
                : 'Crea tu cuenta de atleta para consultar estados de cuenta, calendario y pagos.'}
            </p>
          </div>

          {/* Alerta de Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-3.5 rounded-2xl mb-5 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-semibold leading-relaxed">{error}</p>
            </div>
          )}

          {/* Alerta de Éxito */}
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl mb-5 flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-700 font-semibold leading-relaxed">{successMessage}</p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium outline-none focus:bg-white focus:border-kasa-vinotinto focus:ring-4 focus:ring-kasa-vinotinto/10 transition-all text-gray-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label className="block text-xs font-bold text-slate-700">
                  Contraseña
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => { setIsForgot(true); setError(''); setSuccessMessage(''); }}
                    className="text-[11px] font-bold text-kasa-vinotinto hover:text-red-950 transition-colors cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-11 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium outline-none focus:bg-white focus:border-kasa-vinotinto focus:ring-4 focus:ring-kasa-vinotinto/10 transition-all text-gray-900 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-kasa-vinotinto hover:bg-red-950 text-white font-black text-xs sm:text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando credenciales...</span>
                </>
              ) : isLogin ? (
                <>
                  <span>Ingresar a la Plataforma</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-kasa-dorado" />
                  <span>Crear mi Cuenta</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Nota de Enrutamiento Inteligente */}
      <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500 text-center">
        <ShieldCheck className="w-4 h-4 text-kasa-vinotinto shrink-0" />
        <span>Enrutamiento seguro y automático según tus permisos.</span>
      </div>
    </div>
  );
}
