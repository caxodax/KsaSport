'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import { updatePassword } from './actions';

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setHasSession(true);
        } else {
          // Si Supabase envía el token en el hash (#access_token=...)
          const hash = window.location.hash;
          if (hash && hash.includes('access_token')) {
            setHasSession(true);
          } else {
            setHasSession(false);
          }
        }
      } catch (err) {
        console.error('Error verifying recovery session:', err);
      } finally {
        setCheckingSession(false);
      }
    }

    checkAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor verifica.');
      return;
    }

    setLoading(true);

    try {
      // 1. Intentar actualizar directamente con el cliente del navegador
      const supabase = createBrowserClient();
      const { error: clientError } = await supabase.auth.updateUser({ password });

      if (!clientError) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login?reset=success');
        }, 1500);
        return;
      }

      // 2. Fallback a Server Action
      const formData = new FormData();
      formData.append('password', password);
      formData.append('confirmPassword', confirmPassword);
      const res = await updatePassword(formData);

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar contraseña.');
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-md flex flex-col items-center justify-center min-h-[250px] text-center">
        <Loader2 className="w-8 h-8 animate-spin text-kasa-vinotinto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Verificando enlace seguro...</p>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Enlace no válido o expirado</h2>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          El enlace para restablecer tu contraseña ya fue utilizado o ha caducado por motivos de seguridad. Por favor, solicita uno nuevo.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full py-3 px-4 rounded-2xl bg-kasa-vinotinto hover:bg-red-950 text-white font-bold text-xs sm:text-sm transition-all shadow-md"
        >
          Volver a Iniciar Sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.1)] border border-gray-100 p-6 sm:p-8">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-amber-50 text-kasa-dorado rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
          <Lock className="w-7 h-7 text-kasa-vinotinto" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">
          Nueva Contraseña
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          Crea una nueva contraseña segura para tu cuenta en KsaSport.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-3.5 rounded-2xl mb-5 flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 font-semibold leading-relaxed">{error}</p>
        </div>
      )}

      {success ? (
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-center space-y-2 animate-in fade-in">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <p className="text-sm font-bold text-emerald-800">¡Contraseña actualizada con éxito!</p>
          <p className="text-xs text-emerald-600">Redirigiendo a la pantalla de acceso...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">
              Nueva Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-11 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium outline-none focus:bg-white focus:border-kasa-vinotinto focus:ring-4 focus:ring-kasa-vinotinto/10 transition-all text-gray-900 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Repite tu nueva contraseña"
                className="w-full pl-10 pr-11 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium outline-none focus:bg-white focus:border-kasa-vinotinto focus:ring-4 focus:ring-kasa-vinotinto/10 transition-all text-gray-900 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3.5 px-4 rounded-2xl bg-kasa-vinotinto hover:bg-red-950 text-white font-black text-xs sm:text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Actualizando contraseña...</span>
              </>
            ) : (
              <>
                <span>Guardar y Entrar</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <Link
              href="/login"
              className="text-xs text-slate-500 hover:text-kasa-vinotinto font-medium transition-colors"
            >
              Cancelar y volver al inicio
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
