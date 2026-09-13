'use client';

import { useState } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { exportPaymentsToExcel, PaymentsExportData } from '@/lib/exportExcel';

export default function ExportPaymentsButton({ data }: { data: PaymentsExportData }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportPaymentsToExcel(data);
    } catch (err: any) {
      console.error('Error al exportar Finanzas y Pagos a Excel:', err);
      alert('Ocurrió un error al generar el archivo Excel.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      title="Descargar reporte completo de Finanzas y Pagos en Excel (.xlsx)"
    >
      {exporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Generando Excel...</span>
        </>
      ) : (
        <>
          <FileSpreadsheet className="w-4 h-4" />
          <span>Exportar Excel</span>
        </>
      )}
    </button>
  );
}

