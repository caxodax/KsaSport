'use client'

import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';

export default function QRCodeDisplay({ athleteId, status }: { athleteId: string, status: string }) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    // Generate absolute URL dynamically based on the window location
    setUrl(`${window.location.origin}/portal/verify/${athleteId}`);
  }, [athleteId]);

  if (!url) return <div className="w-48 h-48 bg-gray-100 animate-pulse rounded-xl"></div>;

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 inline-block relative">
      <QRCodeSVG 
        value={url} 
        size={180} 
        level="H"
        fgColor={status === 'Solvente' ? '#0f5132' : '#842029'}
      />
      {/* Decorative corners */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-gray-300 rounded-tl-sm"></div>
      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-gray-300 rounded-tr-sm"></div>
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-gray-300 rounded-bl-sm"></div>
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-gray-300 rounded-br-sm"></div>
    </div>
  );
}
