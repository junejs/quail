'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '@/lib/store';
import { handleSocketError } from '@/lib/error-handler';

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
  const { hydrate, setGameState, setCurrentQuestion, setScore, setStreak } = useGameStore();

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

    socketInstance.on('connect_error', (err) => {
      handleSocketError(err as Error, 'Connection');
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
