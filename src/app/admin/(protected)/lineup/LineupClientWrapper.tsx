'use client'

import { useState } from 'react';
import { Shield, Target } from 'lucide-react';
import LineupField from './LineupField';
import BattingOrderView from './BattingOrderView';

export default function LineupClientWrapper({ athletes }: { athletes: any[] }) {
  const [activeTab, setActiveTab] = useState<'defensiva' | 'ofensiva'>('defensiva');

  return (
    <div className="flex-1 flex flex-col h-full w-full relative">
      {/* Tabs Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-3 flex gap-2 overflow-x-auto hide-scrollbar z-40 shadow-sm relative">
        <button
          onClick={() => setActiveTab('defensiva')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap
            ${activeTab === 'defensiva' 
              ? 'bg-kasa-vinotinto text-white' 
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
        >
          <Shield className="w-4 h-4" />
          Defensiva (Campo)
        </button>
        <button
          onClick={() => setActiveTab('ofensiva')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap
            ${activeTab === 'ofensiva' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
        >
          <Target className="w-4 h-4" />
          Ofensiva (Bateo)
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden bg-gray-50 h-full w-full min-h-[600px]">
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'defensiva' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <LineupField athletes={athletes} />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'ofensiva' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <BattingOrderView athletes={athletes} />
        </div>
      </div>
    </div>
  );
}
