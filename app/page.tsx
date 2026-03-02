'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { useSocket } from '@/components/socket-provider';
import { useGameStore } from '@/lib/store';
import { sampleQuiz } from '@/lib/quiz-data';
import { PlusCircle, Play, Settings, Volume2, VolumeX, History } from 'lucide-react';
import { audioManager } from '@/lib/audio-manager';

export default function Home() {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const { 
    setPin, setNickname, setAvatar, setIsHost, setGameState, 
    quizzes, addQuiz, fetchQuizzes, selectedQuiz, setSelectedQuiz 
  } = useGameStore();
  
  const [inputPin, setInputPin] = useState('');
  const [inputNickname, setInputNickname] = useState('');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showHostOptions, setShowHostOptions] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const init = async () => {
      await fetchQuizzes();
    };
    init();
  }, [fetchQuizzes]);

  useEffect(() => {
    // Initialize with sample quiz if no quizzes exist after fetching
    if (quizzes.length === 0) {
      addQuiz(sampleQuiz);
    }
  }, [quizzes.length, addQuiz]);

  useEffect(() => {
    if (!socket) return;

    const onJoinedRoom = ({ pin, player, quiz }: { pin: string, player: any, quiz: any }) => {
      setPin(pin);
      setNickname(player.nickname);
      setAvatar(player.avatar);
      setIsHost(false);
      setGameState('lobby');
      setSelectedQuiz(quiz);
      router.push('/play');
    };

    const onError = (msg: string) => {
      setError(msg);
      setIsJoining(false);
    };

    socket.on('joined_room', onJoinedRoom);
    socket.on('error', onError);

    return () => {
      socket.off('joined_room', onJoinedRoom);
      socket.off('error', onError);
    };
  }, [socket, router, setPin, setNickname, setAvatar, setIsHost, setGameState, setSelectedQuiz]);

  const handleHostGame = () => {
    if (!socket) return;
    audioManager?.playSfx('join'); // Unlock audio
    const quizToUse = selectedQuiz || quizzes[0];
    if (!quizToUse) return;

    setSelectedQuiz(quizToUse);
    setIsHost(true);
    socket.emit('create_room', quizToUse);
    socket.once('room_created', (pin: string) => {
      setPin(pin);
      setGameState('lobby');
      router.push('/host');
    });
  };

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket) return;
    audioManager?.playSfx('join'); // Unlock audio
    if (!inputPin || !inputNickname) {
      setError('Please enter both PIN and Nickname');
      return;
    }
    
    setIsJoining(true);
    setError('');
    
    socket.emit('join_room', { pin: inputPin, nickname: inputNickname });
  };

  const toggleMute = () => {
    const muted = audioManager?.toggleMute();
    setIsMuted(!!muted);
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="absolute top-4 right-4">
        <button 
          onClick={toggleMute}
          className="p-3 rounded-full bg-white shadow-md text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
      </div>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center"
      >
        <h1 className="text-5xl font-black tracking-tighter text-indigo-600 mb-8">
          quail
        </h1>

        {!showHostOptions ? (
          <>
            <form onSubmit={handleJoinGame} className="space-y-4 mb-8">
              <div>
                <input
                  type="text"
                  placeholder="Game PIN"
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value)}
                  className="w-full text-center text-2xl font-bold p-4 bg-zinc-50 border-2 border-zinc-100 rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                  maxLength={6}
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Nickname"
                  value={inputNickname}
                  onChange={(e) => setInputNickname(e.target.value)}
                  className="w-full text-center text-xl font-medium p-4 bg-zinc-50 border-2 border-zinc-100 rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                  maxLength={15}
                />
              </div>
              
              {error && <p className="text-red-500 font-medium">{error}</p>}
              
              <button
                type="submit"
                disabled={!isConnected || isJoining}
                className="w-full bg-zinc-900 text-white font-bold text-xl p-4 rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 shadow-lg"
              >
                {isJoining ? 'Joining...' : 'Enter'}
              </button>
            </form>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-zinc-500 font-medium uppercase tracking-widest">Host Mode</span>
              </div>
            </div>

            <button
              onClick={() => setShowHostOptions(true)}
              disabled={!isConnected}
              className="w-full mt-4 bg-indigo-100 text-indigo-700 font-bold text-lg p-4 rounded-xl hover:bg-indigo-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Settings size={20} />
              Host Options
            </button>
          </>
        ) : (
          <div className="space-y-6">
            <div className="text-left">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Select Quiz</label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {quizzes.map((quiz) => (
                  <button
                    key={quiz.id}
                    onClick={() => setSelectedQuiz(quiz)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center ${
                      selectedQuiz?.id === quiz.id 
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                        : 'border-zinc-100 bg-zinc-50 text-zinc-600 hover:border-zinc-200'
                    }`}
                  >
                    <span className="font-bold truncate">{quiz.title}</span>
                    <span className="text-xs opacity-60">{quiz.questions.length} Qs</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => router.push('/create')}
                className="flex flex-col items-center gap-2 p-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl text-zinc-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
              >
                <PlusCircle size={24} />
                <span className="font-bold text-sm">Create Quiz</span>
              </button>
              <button
                onClick={() => router.push('/history')}
                className="flex flex-col items-center gap-2 p-4 bg-zinc-50 border-2 border-zinc-100 rounded-2xl text-zinc-600 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 transition-all"
              >
                <History size={24} />
                <span className="font-bold text-sm">History</span>
              </button>
            </div>

            <button
              onClick={handleHostGame}
              disabled={!selectedQuiz}
              className="w-full flex items-center justify-center gap-2 p-4 bg-indigo-600 rounded-2xl text-white hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50"
            >
              <Play size={24} />
              <span className="font-bold text-lg">Start Lobby</span>
            </button>

            <button
              onClick={() => setShowHostOptions(false)}
              className="text-zinc-400 font-bold text-sm hover:text-zinc-600 transition-colors"
            >
              Back to Player Join
            </button>
          </div>
        )}
        
        {!isConnected && (
          <p className="mt-4 text-sm text-zinc-500 flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-zinc-300 rounded-full animate-pulse"></span>
            Connecting to server...
          </p>
        )}
      </motion.div>
    </div>
  );
}
