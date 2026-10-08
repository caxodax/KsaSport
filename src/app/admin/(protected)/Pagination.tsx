'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ 
  currentPage, 
  totalPages, 
  searchParams,
  basePath = '/admin',
  onPageChange
}: { 
  currentPage: number; 
  totalPages: number;
  searchParams?: Record<string, string>;
  basePath?: string;
  onPageChange?: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams || {});
    params.set('page', pageNumber.toString());
    return `${basePath}?${params.toString()}`;
  };

  const isClient = Boolean(onPageChange);

  const handlePrev = () => {
    if (currentPage > 1 && onPageChange) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && onPageChange) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-xl shadow-xs w-full">
      {/* Móvil */}
      <div className="flex flex-1 justify-between sm:hidden">
        {isClient ? (
          <>
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentPage <= 1}
              className={`relative inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all min-h-[44px] ${
                currentPage <= 1 ? 'opacity-40 pointer-events-none' : 'cursor-pointer'
              }`}
            >
              Anterior
            </button>
            <span className="self-center text-xs font-bold text-gray-500">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentPage >= totalPages}
              className={`relative ml-3 inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all min-h-[44px] ${
                currentPage >= totalPages ? 'opacity-40 pointer-events-none' : 'cursor-pointer'
              }`}
            >
              Siguiente
            </button>
          </>
        ) : (
          <>
            <Link
              href={currentPage > 1 ? createPageURL(currentPage - 1) : '#'}
              className={`relative inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all min-h-[44px] ${
                currentPage <= 1 ? 'pointer-events-none opacity-40' : ''
              }`}
            >
              Anterior
            </Link>
            <span className="self-center text-xs font-bold text-gray-500">
              {currentPage} / {totalPages}
            </span>
            <Link
              href={currentPage < totalPages ? createPageURL(currentPage + 1) : '#'}
              className={`relative ml-3 inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all min-h-[44px] ${
                currentPage >= totalPages ? 'pointer-events-none opacity-40' : ''
              }`}
            >
              Siguiente
            </Link>
          </>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-gray-600 font-semibold">
            Página <span className="font-black text-gray-900">{currentPage}</span> de <span className="font-black text-gray-900">{totalPages}</span>
          </p>
        </div>
        <div>
          {isClient ? (
            <div className="isolate inline-flex -space-x-px rounded-xl shadow-xs border border-gray-200 overflow-hidden" aria-label="Pagination">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentPage <= 1}
                className={`relative inline-flex items-center px-3 py-2 text-gray-600 bg-white hover:bg-gray-50 transition-colors ${
                  currentPage <= 1 ? 'opacity-40 pointer-events-none' : 'cursor-pointer'
                }`}
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <button
                type="button"
                onClick={handleNext}
                disabled={currentPage >= totalPages}
                className={`relative inline-flex items-center px-3 py-2 text-gray-600 bg-white hover:bg-gray-50 transition-colors ${
                  currentPage >= totalPages ? 'opacity-40 pointer-events-none' : 'cursor-pointer'
                }`}
                aria-label="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <nav className="isolate inline-flex -space-x-px rounded-xl shadow-xs border border-gray-200 overflow-hidden" aria-label="Pagination">
              <Link
                href={currentPage > 1 ? createPageURL(currentPage - 1) : '#'}
                className={`relative inline-flex items-center px-3 py-2 text-gray-600 bg-white hover:bg-gray-50 transition-colors ${
                  currentPage <= 1 ? 'pointer-events-none opacity-40' : ''
                }`}
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
              
              <Link
                href={currentPage < totalPages ? createPageURL(currentPage + 1) : '#'}
                className={`relative inline-flex items-center px-3 py-2 text-gray-600 bg-white hover:bg-gray-50 transition-colors ${
                  currentPage >= totalPages ? 'pointer-events-none opacity-40' : ''
                }`}
                aria-label="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
