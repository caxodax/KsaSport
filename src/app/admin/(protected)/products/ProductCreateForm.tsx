'use client';
import { useState } from 'react';
import { createProduct } from './actions';

export default function ProductCreateForm({ categories }: { categories: any[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const startDate = formData.get('start_date') as string;
    const endDate = formData.get('end_date') as string;
    const name = formData.get('name') as string;

    if (!startDate || !endDate) {
      alert("Debes establecer una fecha de inicio y fin.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      alert("La fecha de inicio no puede ser posterior a la fecha de fin.");
      return;
    }

    const confirmMessage = `¿Estás seguro de que el producto "${name}" aplica ÚNICAMENTE entre ${start.toLocaleDateString()} y ${end.toLocaleDateString()}? Una vez pasada la fecha de fin, el producto se inactivará automáticamente.`;
    
    if (window.confirm(confirmMessage)) {
      setIsSubmitting(true);
      await createProduct(formData);
      setIsSubmitting(false);
      // Reset form
      (e.target as HTMLFormElement).reset();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-start">
      <div className="flex-1 w-full space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-[2]">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-kasa-vinotinto outline-none"
              placeholder="Ej: Mensualidad, Tryout, Uniforme"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Precio ($) *</label>
            <input 
              type="number" 
              id="price" 
              name="price" 
              step="0.01"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-kasa-vinotinto outline-none"
              placeholder="Ej: 30.00"
            />
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">Fecha Desde *</label>
            <input 
              type="date" 
              id="start_date" 
              name="start_date" 
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-kasa-vinotinto outline-none"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta *</label>
            <input 
              type="date" 
              id="end_date" 
              name="end_date" 
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-kasa-vinotinto outline-none"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descripción (Opcional)</label>
          <input 
            type="text" 
            id="description" 
            name="description" 
            className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-kasa-vinotinto outline-none"
            placeholder="Ej: Pago correspondiente al mes en curso."
          />
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="allows_installments" 
              name="allows_installments" 
              className="w-4 h-4 text-kasa-vinotinto focus:ring-kasa-vinotinto border-gray-300 rounded"
            />
            <label htmlFor="allows_installments" className="text-sm font-medium text-gray-700">
              Permite Abonos (Cuotas parciales)
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="requires_opt_in" 
              name="requires_opt_in" 
              className="w-4 h-4 text-kasa-dorado focus:ring-kasa-dorado border-gray-300 rounded"
            />
            <label htmlFor="requires_opt_in" className="text-sm font-medium text-gray-700">
              Requiere Confirmación (Ej: Torneos/Ligas)
            </label>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col justify-between">
        <div>
          <label htmlFor="categories" className="block text-sm font-medium text-gray-700 mb-1">Aplica para Categorías</label>
          <select 
            id="categories" 
            name="categories" 
            multiple
            className="w-full rounded-lg border border-gray-300 p-2 bg-white text-gray-900 focus:ring-2 focus:ring-kasa-vinotinto outline-none min-h-[110px]"
          >
            <option value="Global" className="font-bold text-kasa-vinotinto">Global (Todas las Categorías)</option>
            {categories?.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Mantén presionado Ctrl (Windows) o Cmd (Mac) para seleccionar varias. Si eliges "Global", se ignoran las demás.</p>
        </div>
        
        <div className="w-full md:w-auto self-end md:self-stretch flex items-end mt-4">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-kasa-vinotinto hover:bg-red-900 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg transition-colors w-full h-[42px] mb-6 md:mb-0"
          >
            {isSubmitting ? 'Creando...' : 'Crear'}
          </button>
        </div>
      </div>
    </form>
  );
}

