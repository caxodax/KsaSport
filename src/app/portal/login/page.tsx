'use client'

import { useState } from 'react';
import { login, signup } from '../actions';
import { Medal, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError('');
    
    const action = isLogin ? login : signup;
    const result = await action(formData);
    
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-8">
          <Medal className="w-16 h-16 text-kasa-vinotinto mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">
            {isLogin ? 'Bienvenida de nuevo' : 'Crea tu cuenta'}
          </h2>
          <p className="text-gray-500 mt-2">
            Portal exclusivo para atletas de Kasa Sports
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form action={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                type="email" 
                name="email" 
                required
                className="w-full pl-10 rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto transition-shadow"
                placeholder="tu@correo.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                type="password" 
                name="password" 
                required
                minLength={6}
                className="w-full pl-10 rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto transition-shadow"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-kasa-vinotinto hover:bg-red-900 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Cargando...' : (isLogin ? 'Ingresar al Portal' : 'Crear mi Cuenta')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }} 
              className="ml-2 text-kasa-vinotinto font-bold hover:underline"
            >
              {isLogin ? 'Regístrate aquí' : 'Inicia Sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
