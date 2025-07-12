import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const useWebSocket = () => {
  const url = process.env.REACT_APP_WS_URL || 'http://localhost:3000';
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const reconnectInterval = useRef(null);

  useEffect(() => {
    const newSocket = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setReconnectAttempts(0);
      toast.success('Kết nối real-time thành công');
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      toast.error('Mất kết nối real-time');
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
      
      if (reconnectAttempts < maxReconnectAttempts) {
        setReconnectAttempts(prev => prev + 1);
        toast.error(`Lỗi kết nối (${reconnectAttempts + 1}/${maxReconnectAttempts})`);
      } else {
        toast.error('Không thể kết nối real-time');
      }
    });

    // Pong response for connection health
    newSocket.on('pong', () => {
      console.log('WebSocket connection is healthy');
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      if (reconnectInterval.current) {
        clearInterval(reconnectInterval.current);
      }
      newSocket.close();
    };
  }, [url, reconnectAttempts]);

  // Ping server periodically to check connection health
  useEffect(() => {
    if (socket && isConnected) {
      const pingInterval = setInterval(() => {
        socket.emit('ping');
      }, 30000); // Ping every 30 seconds

      return () => clearInterval(pingInterval);
    }
  }, [socket, isConnected]);

  const subscribe = (channel) => {
    if (socket && isConnected) {
      socket.emit(`subscribe:${channel}`);
      console.log(`Subscribed to ${channel}`);
    }
  };

  const unsubscribe = (channel) => {
    if (socket && isConnected) {
      socket.emit('unsubscribe', channel);
      console.log(`Unsubscribed from ${channel}`);
    }
  };

  const emit = (event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  };

  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  return {
    socket,
    isConnected,
    reconnectAttempts,
    subscribe,
    unsubscribe,
    emit,
    on,
    off
  };
};

export default useWebSocket; 