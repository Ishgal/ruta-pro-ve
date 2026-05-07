// components/teacher/NotificationBell.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, MessageSquare } from 'lucide-react';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { getMessages } from '@/app/teacher-dashboard/actions';

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
  const isInitialLoad = useRef(true);

  const loadUnreadCount = useCallback(async () => {
    try {
      const messages = await getMessages();
      const unread = messages.filter(m => !m.isRead).length;
      setUnreadCount(unread);
      
      // Cargar notificaciones iniciales (últimos 5 mensajes no leídos)
      if (isInitialLoad.current) {
        const recentUnread = messages
          .filter(m => !m.isRead)
          .slice(0, 5)
          .map(m => ({
            id: m.id,
            studentId: m.studentId,
            studentName: m.studentName,
            content: m.content,
            timestamp: m.createdAt,
          }));
        setNotifications(recentUnread);
        isInitialLoad.current = false;
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }, []);

  // Usar el hook de polling
  const { isConnected } = useRealtimeMessages({
    onNewMessage: useCallback(async (message) => {
      // Actualizar contador
      setUnreadCount(prev => prev + 1);
      
      // Agregar notificación
      const newNotification: Notification = {
        id: message.id,
        studentId: message.studentId,
        studentName: message.studentName,
        content: message.content,
        timestamp: new Date(),
      };
      
      setNotifications(prev => [newNotification, ...prev].slice(0, 5));
      
      // Mostrar notificación del navegador
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Nuevo mensaje de ${message.studentName}`, {
          body: message.content,
          icon: '/favicon.ico',
        });
      }
    }, []),
    onMessageRead: useCallback(() => {
      // Actualizar contador cuando un mensaje se marca como leído
      loadUnreadCount();
    }, [loadUnreadCount]),
    pollingInterval: 5000,
  });

  // Cargar datos iniciales - usar un setTimeout para evitar la advertencia
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUnreadCount();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadUnreadCount]);

  // Solicitar permisos para notificaciones del navegador
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Actualizar badges en la UI y título de la pestaña
  useEffect(() => {
    // Actualizar badge en el título de la pestaña
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) Ruta Pro-VE - Dashboard Docente`;
    } else {
      document.title = 'Ruta Pro-VE - Dashboard Docente';
    }
    
    // Actualizar badges en la UI (para los links de mensajes en el layout)
    const updateBadges = () => {
      const messageBadge = document.getElementById('message-badge');
      const mobileBadge = document.getElementById('mobile-message-badge');
      
      if (messageBadge) {
        if (unreadCount > 0) {
          messageBadge.className = 'absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center';
          messageBadge.textContent = unreadCount > 9 ? '9+' : unreadCount.toString();
        } else {
          messageBadge.className = 'hidden';
        }
      }
      
      if (mobileBadge) {
        if (unreadCount > 0) {
          mobileBadge.className = 'absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]';
          mobileBadge.textContent = unreadCount > 9 ? '9+' : unreadCount.toString();
        } else {
          mobileBadge.className = 'hidden';
        }
      }
    };
    
    updateBadges();
  }, [unreadCount]);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {!isConnected && (
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-gray-400 rounded-full" />
        )}
        {isConnected && (
          <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Notificaciones</h3>
              <p className="text-xs text-gray-500">
                {isConnected ? 'Conectado en tiempo real' : 'Desconectado - Reconectando...'}
              </p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay notificaciones nuevas</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      window.location.href = `/teacher-dashboard?student=${notif.studentId}`;
                      setShowDropdown(false);
                    }}
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {notif.studentName}
                    </p>
                    <p className="text-xs text-gray-600 truncate">{notif.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notif.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))
              )}
            </div>
            {unreadCount > 0 && (
              <div className="p-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    window.location.href = '/teacher-dashboard/messages';
                    setShowDropdown(false);
                  }}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-700 py-1"
                >
                  Ver todos los mensajes
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}