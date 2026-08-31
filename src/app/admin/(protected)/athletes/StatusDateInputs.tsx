'use client';

import { useState } from 'react';

export default function StatusDateInputs({ 
  initialStatus = 'Solvente', 
  initialDate = '' 
}: { 
  initialStatus?: string; 
  initialDate?: string;
}) {
  const [status, setStatus] = useState(initialStatus);

  let dateLabel = 'Solvente hasta';
  if (status === 'Moroso') {
    dateLabel = 'Moroso desde';
  } else if (status === 'Inactivo') {
    dateLabel = 'Inactivo desde';
  }

  return (
    <>
      <div className="w-full md:w-32">
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Estatus</label>
        <select 
          id="status" 
          name="status" 
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto bg-white"
        >
          <option value="Solvente">Solvente</option>
          <option value="Moroso">Moroso</option>
          <option value="Inactivo">Inactivo</option>
        </select>
      </div>
      <div className="w-full md:w-40">
        <label htmlFor="paid_until" className="block text-sm font-medium text-gray-700 mb-1">{dateLabel}</label>
        <input 
          type="date" 
          id="paid_until" 
          name="paid_until" 
          defaultValue={initialDate}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-kasa-vinotinto bg-white"
        />
      </div>
    </>
  );
}
