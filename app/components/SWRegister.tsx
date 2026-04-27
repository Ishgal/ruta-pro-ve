'use client';
import { useEffect } from 'react';

export default function SWRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('✅ Service Worker registrado:', reg))
        .catch(err => console.error('❌ Error al registrar SW:', err));
    }
  }, []);
  return null;
}