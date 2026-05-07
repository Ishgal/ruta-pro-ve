// hooks/useRealtimeMessages.ts
import { useEffect, useState, useCallback } from 'react';
import { getMessages } from '@/app/teacher-dashboard/actions';

interface Message {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string | null;
  content: string;
  createdAt: Date;
  isRead: boolean;
}

interface UseRealtimeMessagesProps {
  onNewMessage?: (message: Message) => void;
  onMessageRead?: (messageId: string) => void;
  pollingInterval?: number;
}

export function useRealtimeMessages({ 
  onNewMessage, 
  onMessageRead, 
  pollingInterval = 5000 
}: UseRealtimeMessagesProps = {}) {
  const [isConnected, setIsConnected] = useState(true);
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [knownMessageIds, setKnownMessageIds] = useState<Set<string>>(new Set());

  const fetchMessages = useCallback(async () => {
    try {
      const messages = await getMessages();
      
      // Detectar nuevos mensajes (los que no conocemos)
      const newMessages = messages.filter((message: Message) => !knownMessageIds.has(message.id));
      
      // Procesar cada mensaje nuevo
      for (const message of newMessages) {
        // Agregar a la lista de mensajes conocidos
        setKnownMessageIds((prev: Set<string>) => new Set([...prev, message.id]));
        
        // Notificar sobre nuevos mensajes no leídos
        if (!message.isRead) {
          setLastMessage(message);
          onNewMessage?.(message);
        }
      }
      
      // Detectar mensajes que cambiaron a leídos
      const currentUnreadIds = new Set(
        messages.filter((message: Message) => !message.isRead).map((message: Message) => message.id)
      );
      
      const previouslyUnreadIds = Array.from(knownMessageIds).filter(
        (id: string) => !currentUnreadIds.has(id)
      );
      
      for (const id of previouslyUnreadIds) {
        onMessageRead?.(id);
      }
      
      setIsConnected(true);
    } catch (error) {
      console.error('Error polling messages:', error);
      setIsConnected(false);
    }
  }, [knownMessageIds, onNewMessage, onMessageRead]);

  // Cargar mensajes iniciales para poblar knownMessageIds
  useEffect(() => {
    const init = async () => {
      const messages = await getMessages();
      const ids = new Set(messages.map((message: Message) => message.id));
      setKnownMessageIds(ids);
    };
    init();
  }, []);

  // Configurar polling
  useEffect(() => {
    const interval = setInterval(fetchMessages, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchMessages, pollingInterval]);

  return { 
    isConnected, 
    lastMessage, 
    refreshMessages: fetchMessages 
  };
}