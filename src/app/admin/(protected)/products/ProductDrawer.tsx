'use client'

import { useState, useEffect } from 'react';
import { 
  X, ShoppingBag, DollarSign, Calendar, Tag, FileText, 
  Check, AlertCircle, Loader2, Layers, CheckCircle2 
} from 'lucide-react';
import { createProduct, updateProduct } from './actions';

export interface ProductData {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  is_active: boolean;
  categories: string[];
  allows_installments: boolean;
  requires_opt_in: boolean;
  start_date?: string | null;
  end_date?: string | null;
}

export interface CategoryOption {
  id?: string;
  name: string;
}

export default function ProductDrawer({
  isOpen,
  onClose,
  product = null,
  categories = [],
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  product?: ProductData | null;
  categories: CategoryOption[];
  onSuccess?: () => void;
}) {
  const isEditing = Boolean(product);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [allowsInstallments, setAllowsInstallments] = useState(false);
  const [requiresOptIn, setRequiresOptIn] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Global']);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setPrice(product.price ? String(product.price) : '');
      setStartDate(product.start_date ? new Date(product.start_date).toISOString().split('T')[0] : '');
      setEndDate(product.end_date ? new Date(product.end_date).toISOString().split('T')[0] : '');
      setDescription(product.description || '');
      setAllowsInstallments(Boolean(product.allows_installments));
      setRequiresOptIn(Boolean(product.requires_opt_in));
      
      if (!product.categories || product.categories.length === 0 || product.categories.includes('Global')) {
        setSelectedCategories(['Global']);
      } else {
        setSelectedCategories(product.categories);
      }
    } else {
      // Valores por defecto para nuevo producto
      setName('');
      setPrice('');
      
      // Fecha de inicio: Hoy
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      
      // Fecha de fin: Último día del mes actual
      const now = new Date();
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString().split('T')[0];
      setEndDate(lastDayOfMonth);

      setDescription('');
      setAllowsInstallments(false);
      setRequiresOptIn(false);
      setSelectedCategories(['Global']);
    }
    setErrorMsg(null);
  }, [product, isOpen]);

  if (!isOpen) return null;

  // Toggle de categoría interactivo (sin Ctrl/Cmd)
  const handleToggleCategory = (catName: string) => {
    if (catName === 'Global') {
      setSelectedCategories(['Global']);
      return;
    }

    let updated = selectedCategories.filter(c => c !== 'Global');
    if (updated.includes(catName)) {
      updated = updated.filter(c => c !== catName);
    } else {
      updated.push(catName);
    }

    if (updated.length === 0) {
      setSelectedCategories(['Global']);
    } else {
      setSelectedCategories(updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMsg('El nombre del producto es obligatorio.');
      return;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      setErrorMsg('Ingresa un precio válido mayor o igual a 0.');
      return;
    }

    if (!startDate || !endDate) {
      setErrorMsg('Debes establecer una fecha de inicio y de fin.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      setErrorMsg('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    if (isEditing && product) {
      formData.append('id', product.id);
    }
    formData.append('name', name.trim());
    formData.append('price', String(numericPrice));
    formData.append('start_date', startDate);
    formData.append('end_date', endDate);
    formData.append('description', description.trim());
    
    if (allowsInstallments) {
      formData.append('allows_installments', 'true');
    }
    if (requiresOptIn) {
      formData.append('requires_opt_in', 'true');
    }

    selectedCategories.forEach(cat => {
      formData.append('categories', cat);
    });

    const res = isEditing ? await updateProduct(formData) : await createProduct(formData);

    setLoading(false);

    if (res?.error) {
      setErrorMsg(res.error);
    } else {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop con Blur */}
      <div 
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col border-l border-slate-200/90 animate-in slide-in-from-right duration-300">
          
          {/* Cabecera del Drawer */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-kasa-vinotinto flex items-center justify-center border border-red-100 shadow-2xs shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 leading-tight">
                  {isEditing ? 'Editar Producto / Servicio' : 'Nuevo Producto / Servicio'}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {isEditing ? 'Modifica los parámetros comerciales y cuotas.' : 'Crea un artículo, mensualidad o cuota para cobro.'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all shadow-2xs"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Mensaje de Error */}
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/90 text-rose-800 text-xs font-semibold flex items-center gap-3 shadow-2xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Nombre y Precio */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1.5">
                  Nombre del Producto o Servicio *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Mensualidad Septiembre, Tryout, Uniforme"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-300 text-sm font-bold text-gray-900 placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-kasa-vinotinto/20 focus:border-kasa-vinotinto transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1.5">
                  Precio Base ($ USD) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="30.00"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-300 text-sm font-mono font-black text-gray-900 placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-kasa-vinotinto/20 focus:border-kasa-vinotinto transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Rango de Vigencia */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-kasa-vinotinto" />
                <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  Vigencia de Cobro *
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Al vencer la fecha de fin, el producto se inactivará automáticamente del portal de atletas.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Desde
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-kasa-vinotinto/20 focus:border-kasa-vinotinto transition-all shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-kasa-vinotinto/20 focus:border-kasa-vinotinto transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Categorías (Chips Interactivos Táctiles) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider">
                  Aplica para Categorías
                </label>
                <span className="text-[10px] font-bold text-slate-400">
                  {selectedCategories.includes('Global') ? 'Aplica a todas' : `${selectedCategories.length} seleccionada(s)`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mb-2.5">
                Toca las disciplinas que deben abonar esta cuota o selecciona Global para toda la academia.
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleCategory('Global')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs ${
                    selectedCategories.includes('Global')
                      ? 'bg-kasa-vinotinto text-white border border-kasa-vinotinto shadow-xs ring-2 ring-kasa-vinotinto/20'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Global (Todas)</span>
                  {selectedCategories.includes('Global') && <CheckCircle2 className="w-3.5 h-3.5 text-white/90" />}
                </button>

                {categories.map((c) => {
                  const isSelected = selectedCategories.includes(c.name);
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => handleToggleCategory(c.name)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs ${
                        isSelected
                          ? 'bg-kasa-vinotinto text-white border border-kasa-vinotinto shadow-xs ring-2 ring-kasa-vinotinto/20'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>{c.name}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white/90" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Switches de Políticas Comerciales (iOS style) */}
            <div className="space-y-3 pt-2">
              <span className="block text-xs font-black uppercase text-slate-500 tracking-wider">
                Condiciones Especiales
              </span>

              {/* Permite Abonos */}
              <label 
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer shadow-2xs ${
                  allowsInstallments 
                    ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-200' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="pr-3">
                  <p className="text-xs font-black text-gray-900">
                    Permite Abonos Parciales
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
                    Las atletas pueden reportar pagos en cuotas fraccionadas hasta completar el total.
                  </p>
                </div>
                <div className="relative inline-flex items-center shrink-0">
                  <input
                    type="checkbox"
                    checked={allowsInstallments}
                    onChange={(e) => setAllowsInstallments(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 shadow-inner"></div>
                </div>
              </label>

              {/* Requiere Confirmación (Opt-in) */}
              <label 
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer shadow-2xs ${
                  requiresOptIn 
                    ? 'bg-amber-50/70 border-amber-400 ring-1 ring-amber-300' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="pr-3">
                  <p className="text-xs font-black text-gray-900">
                    Requiere Confirmación (Opt-in)
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
                    Ideal para Torneos o Ligas donde la jugadora debe inscribirse antes de generar la obligación.
                  </p>
                </div>
                <div className="relative inline-flex items-center shrink-0">
                  <input
                    type="checkbox"
                    checked={requiresOptIn}
                    onChange={(e) => setRequiresOptIn(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-kasa-dorado shadow-inner"></div>
                </div>
              </label>
            </div>

            {/* Descripción Opcional */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-1.5">
                Descripción (Opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Ej: Pago de cuota de mantenimiento de sede correspondiente al mes en curso."
                className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 text-xs font-medium text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-kasa-vinotinto/20 focus:border-kasa-vinotinto transition-all shadow-2xs resize-none"
              />
            </div>

          </form>

          {/* Botones de Pie */}
          <div className="p-4 sm:p-6 bg-slate-50/90 border-t border-slate-200/80 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-black text-slate-700 hover:bg-slate-100 transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-kasa-vinotinto to-red-900 hover:from-red-900 hover:to-kasa-vinotinto text-white text-xs font-black transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEditing ? 'Guardar Cambios' : 'Crear Producto'}</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

