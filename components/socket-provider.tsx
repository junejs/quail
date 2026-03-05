'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '@/lib/store';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { hydrate, pin, sessionId, isHost, setGameState, setCurrentQuestion, setPlayers, setScore, setStreak } = useGameStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    console.log('Initializing socket connection at origin:', typeof window !== 'undefined' ? window.location.origin : 'unknown');
    const socketInstance = io({
      path: '/socket.io',
      transports: ['polling', 'websocket'],
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);

      // Attempt to rejoin if we have session data
      const storedPin = localStorage.getItem('quail_pin');
      const storedSessionId = localStorage.getItem('quail_sessionId');
      const storedIsHost = localStorage.getItem('quail_isHost') === 'true';

      if (storedPin && storedSessionId && !storedIsHost) {
        console.log('Attempting to rejoin room:', storedPin);
        socketInstance.emit('rejoin_room', { pin: storedPin, sessionId: storedSessionId });
      }
    });

    socketInstance.on('rejoined_room', ({ player, gameState, currentQuestionIndex, quiz }) => {
      console.log('Successfully rejoined room');
      setGameState(gameState);
      if (player) {
        setScore(player.score);
        setStreak(player.streak);
      }
      if (currentQuestionIndex !== undefined && currentQuestionIndex >= 0 && quiz) {
        setCurrentQuestion(quiz.questions[currentQuestionIndex]);
      }
    });

    socketInstance.on('rejoin_failed', (reason) => {
      console.warn('Rejoin failed:', reason);
      // Clear session if rejoin failed
      localStorage.removeItem('quail_pin');
      localStorage.removeItem('quail_sessionId');
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [hydrate, setGameState, setScore, setStreak, setCurrentQuestion]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
