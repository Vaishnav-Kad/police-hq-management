import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeBolo, setActiveBolo] = useState({
    id: 1,
    alert_message: 'Munna Qureshi (Munna Supari) sighted near Dadar TT. Approach with caution.',
    severity: 'High',
    created_at: new Date().toISOString(),
  });
  const [alertsList, setAlertsList] = useState([]);

  useEffect(() => {
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5000` : 'http://localhost:5000');
    const socketInstance = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket.io] Connected to Police HQ Gateway:', socketInstance.id);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('[Socket.io] Disconnected from Police HQ Gateway');
    });

    // Listen for high-priority real-time BOLO broadcasts
    socketInstance.on('priority_alert', (newAlert) => {
      console.log('[Socket.io] New Priority BOLO Broadcast received:', newAlert);
      setActiveBolo(newAlert);
      setAlertsList((prev) => [newAlert, ...prev]);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token, user]);

  const dismissBolo = () => {
    setActiveBolo(null);
  };

  const value = {
    socket,
    isConnected,
    activeBolo,
    alertsList,
    dismissBolo,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
