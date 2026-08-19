'use client'

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X } from 'lucide-react';
import { useState } from 'react';

export default function DashboardFilters({ 
  teams, 
  categories,
  basePath = '/admin',
  hideStatus = false,
  showRole = false
}: { 
  teams: { id: string, name: string }[], 
  categories: { name: string }[],
  basePath?: string,
  hideStatus?: boolean,
  showRole?: boolean
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [team, setTeam] = useState(searchParams.get('team') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [role, setRole] = useState(searchParams.get('role') || '');

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (team) params.set('team', team);
    if (category) params.set('category', category);
    if (status && !hideStatus) params.set('status', status);
    if (role && showRole) params.set('role', role);
    params.set('page', '1'); // Reset to page 1 on new filter
    
    router.push(`${basePath}?${params.toString()}`);
  };

  const clearFilters = () => {
    setQuery(''); setTeam(''); setCategory(''); setStatus(''); setRole('');
    router.push(basePath);
  }

  const hasActiveFilters = query || team || category || (status && !hideStatus) || (role && showRole);

  return (
    <form onSubmit={handleFilter} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 mb-6 flex flex-col lg:flex-row gap-3 items-center">
      
      <div className="flex-1 w-full relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 rounded-md border border-gray-300 px-3 py-1.5 bg-white text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
          placeholder="Buscar atleta..."
        />
      </div>

      <div className="w-full lg:w-48">
        <select 
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 bg-white text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
        >
          <option value="">Todos los equipos</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="w-full lg:w-48">
        <select 
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 bg-white text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
        >
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      {showRole && (
        <div className="w-full lg:w-40">
          <select 
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 bg-white text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
          >
            <option value="">Todos (Rol)</option>
            <option value="Mánager">Mánager</option>
            <option value="Entrenador">Entrenador</option>
            <option value="Asistente Técnico">Asistente Técnico</option>
            <option value="Preparador Físico">Preparador Físico</option>
            <option value="Delegado">Delegado</option>
            <option value="Kinesiólogo">Kinesiólogo</option>
          </select>
        </div>
      )}

      {!hideStatus && (
        <div className="w-full lg:w-40">
          <select 
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 bg-white text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto"
          >
            <option value="">Todos (Estatus)</option>
            <option value="Solvente">Solvente</option>
            <option value="Moroso">Moroso</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>
      )}

      <div className="flex gap-2 w-full lg:w-auto shrink-0">
        <button type="submit" className="bg-kasa-vinotinto hover:bg-red-900 text-white font-bold py-1.5 px-4 rounded-md transition-colors text-sm w-full lg:w-auto flex items-center justify-center gap-1">
          <Filter className="w-4 h-4" /> Filtrar
        </button>
        {hasActiveFilters && (
          <button type="button" onClick={clearFilters} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium text-gray-600 transition-colors flex items-center justify-center gap-1" title="Limpiar filtros">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </form>
  )
}
