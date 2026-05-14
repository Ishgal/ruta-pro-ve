'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, MessageSquare } from 'lucide-react';
import { useRealtimeMessages, type RealtimeMessage } from '@/hooks/useRealtimeMessages';
import { getAllRecentMessages } from '@/app/teacher-dashboard/actions';

interface Notification {
  id: string;
  studentId: string;
  studentName: string;
  content: string;
  timestamp: Date;
}

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const refreshCount = useCallback(async () => {
    try {
      const messages = await getAllRecentMessages();
      const unread = messages.filter(m => !m.isRead);
      setUnreadCount(unread.length);
      setNotifications(
        unread.slice(0, 5).map(m => ({
          id: m.id,
          studentId: m.studentId,
          studentName: m.studentName,
          content: m.content,
          timestamp: new Date(m.createdAt),
        }))
      );
    } catch {
      // silent
    }
  }, []);

  // Load initial count once on mount
  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  // Update tab title when unread count changes
  useEffect(() => {
    document.title = unreadCount > 0
      ? `(${unreadCount}) Ruta Pro-VE - Docente`
      : 'Ruta Pro-VE - Docente';
  }, [unreadCount]);

  // Request browser notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const { isConnected } = useRealtimeMessages({
    onNewMessage: useCallback((message: RealtimeMessage) => {
      setUnreadCount(prev => prev + 1);
      setNotifications(prev => [
        {
          id: message.id,
          studentId: message.studentId,
          studentName: message.studentName,
          content: message.content,
          timestamp: new Date(),
        },
        ...prev,
      ].slice(0, 5));

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Nuevo mensaje de ${message.studentName}`, {
          body: message.content,
          icon: '/favicon.ico',
        });
      }
    }, []),
    onMessageRead: useCallback(() => {
      refreshCount();
    }, [refreshCount]),
  });

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(v => !v)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        <span
          className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">Notificaciones</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {isConnected ? 'Conectado en tiempo real' : 'Reconectando...'}
              </p>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                  <MessageSquare className="w-7 h-7 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Sin notificaciones nuevas</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <button
                    key={notif.id}
                    className="w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      window.location.href = `/teacher-dashboard/messages?student=${notif.studentId}`;
                      setShowDropdown(false);
                    }}
                  >
                    <p className="text-sm font-medium text-gray-900">{notif.studentName}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{notif.content}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(notif.timestamp).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </button>
                ))
              )}
            </div>

            <div className="px-3 py-2 border-t border-gray-100">
              <button
                onClick={() => {
                  window.location.href = '/teacher-dashboard/messages';
                  setShowDropdown(false);
                }}
                className="w-full text-center text-xs text-[#1B4F8C] hover:text-[#163e6e] py-1 font-medium"
              >
                Ver todos los mensajes
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
