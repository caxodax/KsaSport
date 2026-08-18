'use client'

import { useState } from 'react';
import { linkProfile, logout } from '../actions';
import { UserCheck, AlertCircle } from 'lucide-react';

export default function LinkProfilePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError('');
    
    const result = await linkProfile(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-kasa-dorado/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <UserCheck className="w-8 h-8 text-kasa-vinotinto" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Cuenta creada con éxito!
        </h2>
        <p className="text-gray-500 mb-8 text-sm">
          Ahora vincularemos tu nueva cuenta con tu perfil deportivo en Kasa Sports. Ingresa tu número de cédula exacto tal cual se lo diste a la administración.
        </p>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-left rounded-r-md">
            <p className="text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </p>
          </div>
        )}

        <form action={handleSubmit} className="space-y-6">
          <div className="text-left">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tu Cédula de Identidad</label>
            <input 
              type="text" 
              name="cedula" 
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-kasa-vinotinto transition-shadow text-center font-bold tracking-wider"
              placeholder="Ej: 26123456"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-kasa-vinotinto hover:bg-red-900 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Buscando perfil...' : 'Vincular y Entrar al Portal'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <form action={logout}>
            <button type="submit" className="text-sm text-gray-500 hover:text-red-600 transition-colors font-medium">
              Cerrar sesión e intentar con otra cuenta
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
