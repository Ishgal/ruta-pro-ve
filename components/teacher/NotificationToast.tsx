// components/teacher/NotificationToast.tsx
'use client';

import { useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  studentId: string;
  studentName: string;
  timestamp: Date;
}

interface NotificationToastProps {
  notifications: Notification[];
  onClose: (id: string) => void;
  onOpenChat: (studentId: string) => void;
}

function NotificationItem({ notification, onClose, onOpenChat }: { 
  notification: Notification; 
  onClose: (id: string) => void;
  onOpenChat: (studentId: string) => void;
}) {
  useEffect(() => {
    // Auto-cerrar después de 5 segundos
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  return (
    <div 
      className="bg-white rounded-lg shadow-lg border border-gray-100 p-4 mb-3 animate-slide-in cursor-pointer hover:shadow-xl transition-shadow"
      onClick={() => onOpenChat(notification.studentId)}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900">
              {notification.title}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(notification.id);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(notification.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function NotificationToast({ notifications, onClose, onOpenChat }: NotificationToastProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 space-y-2">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={onClose}
          onOpenChat={onOpenChat}
        />
      ))}
    </div>
  );
}