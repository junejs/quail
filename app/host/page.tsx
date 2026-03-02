'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useSocket } from '@/components/socket-provider';
import { useGameStore } from '@/lib/store';
import confetti from 'canvas-confetti';
import { audioManager } from '@/lib/audio-manager';
import { Volume2, VolumeX } from 'lucide-react';

export default function HostPage() {
  const router = useRouter();
  const { socket } = useSocket();
  const { pin, isHost, gameState, setGameState, players, setPlayers, selectedQuiz, resetGame } = useGameStore();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answersCount, setAnswersCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [podium, setPodium] = useState<any[]>([]);
  const [answerCounts, setAnswerCounts] = useState<Record<number, number>>({});
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!isHost || !pin || !socket || !selectedQuiz) {
      router.push('/');
      return;
    }

    const onPlayerJoined = (newPlayers: any[]) => {
      setPlayers(newPlayers);
      audioManager?.playSfx('join');
    };

    const onPlayerLeft = (newPlayers: any[]) => {
      setPlayers(newPlayers);
    };

    const onQuestionStarted = (index: number) => {
      setCurrentQuestionIndex(index);
      setGameState('question');
      if (selectedQuiz) {
        setTimeLeft(selectedQuiz.questions[index].timeLimit);
      }
      setAnswersCount(0);
      setAnswerCounts({});
    };

    const onPlayerAnswered = ({ totalAnswers }: { totalAnswers: number }) => {
      setAnswersCount(totalAnswers);
    };

    const onAllAnswered = () => {
      // Automatically show question result when everyone answers
      socket.emit('show_question_result', pin);
    };

    const onQuestionResultShown = (counts: Record<number, number>) => {
      setAnswerCounts(counts);
      setGameState('question_result');
    };

    const onLeaderboardUpdated = (newLeaderboard: any[]) => {
      setLeaderboard(newLeaderboard);
      setGameState('leaderboard');
    };

    const onGameEnded = (finalStandings: any[]) => {
      setPodium(finalStandings);
      setGameState('podium');
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
    };

    socket.on('player_joined', onPlayerJoined);
    socket.on('player_left', onPlayerLeft);
    socket.on('question_started', onQuestionStarted);
    socket.on('player_answered', onPlayerAnswered);
    socket.on('all_answered', onAllAnswered);
    socket.on('question_result_shown', onQuestionResultShown);
    socket.on('leaderboard_updated', onLeaderboardUpdated);
    socket.on('game_ended', onGameEnded);

    // Initial BGM
    if (gameState === 'lobby') {
      audioManager?.playBgm('lobby');
    }

    return () => {
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
      socket.off('question_started', onQuestionStarted);
      socket.off('player_answered', onPlayerAnswered);
      socket.off('all_answered', onAllAnswered);
      socket.off('question_result_shown', onQuestionResultShown);
      socket.off('leaderboard_updated', onLeaderboardUpdated);
      socket.off('game_ended', onGameEnded);
    };
  }, [socket, isHost, pin, router, setPlayers, setGameState, selectedQuiz, gameState]);

  useEffect(() => {
    if (gameState === 'lobby') {
      audioManager?.playBgm('lobby');
    } else if (gameState === 'question') {
      audioManager?.playBgm('question');
    } else if (gameState === 'podium') {
      audioManager?.playBgm('podium');
    } else {
      audioManager?.stopBgm();
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'question' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'question' && timeLeft === 0) {
      socket?.emit('show_question_result', pin);
    }
  }, [gameState, timeLeft, socket, pin]);

  const handleStartGame = () => {
    audioManager?.playSfx('join'); // Trigger to unlock audio context
    socket?.emit('start_game', pin);
  };

  const handleShowLeaderboard = () => {
    socket?.emit('show_leaderboard', pin);
  };

  const handleNextQuestion = () => {
    if (selectedQuiz && currentQuestionIndex < selectedQuiz.questions.length - 1) {
      socket?.emit('next_question', pin);
    } else {
      socket?.emit('end_game', pin);
    }
  };

  const toggleMute = () => {
    const muted = audioManager?.toggleMute();
    setIsMuted(!!muted);
  };

  if (!isHost || !selectedQuiz) return null;

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col font-sans overflow-hidden">
      <AnimatePresence mode="wait">
        {gameState === 'lobby' && (
          <motion.div 
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="bg-white p-8 shadow-sm flex justify-between items-center">
              <div className="flex items-center gap-8">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-500">Join at the App with Game PIN:</h2>
                  <h1 className="text-7xl font-black tracking-tighter text-indigo-600 mt-2">{pin}</h1>
                  <p className="mt-4 text-xl font-bold text-zinc-400">Quiz: {selectedQuiz.title}</p>
                </div>
                <button 
                  onClick={toggleMute}
                  className="p-4 rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors"
                >
                  {isMuted ? <VolumeX size={32} /> : <Volume2 size={32} />}
                </button>
              </div>
              <button 
                onClick={handleStartGame}
                disabled={players.length === 0}
                className="bg-indigo-600 text-white px-12 py-6 rounded-2xl text-3xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                Start
              </button>
            </div>
            <div className="flex-1 p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-bold text-zinc-800">Players ({players.length})</h3>
              </div>
              <div className="flex flex-wrap gap-4">
                {players.map((p) => (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={p.id} 
                    className={`bg-white px-6 py-3 rounded-xl shadow-sm text-xl font-bold flex items-center gap-3 border-2 transition-colors ${
                      p.isDisconnected ? 'border-red-200 text-zinc-400 grayscale' : 'border-transparent text-zinc-800'
                    }`}
                  >
                    <span className="text-2xl">{p.avatar}</span>
                    {p.nickname}
                    {p.isDisconnected && <span className="text-xs font-black text-red-400 uppercase tracking-widest ml-2">Offline</span>}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'question' && currentQuestionIndex >= 0 && selectedQuiz && (
          <motion.div 
            key="question"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col p-8"
          >
            <div className="bg-white rounded-3xl p-12 shadow-sm text-center mb-8 relative overflow-hidden">
              <h1 className="text-5xl font-bold text-zinc-800 relative z-10">
                {selectedQuiz.questions[currentQuestionIndex].text}
              </h1>
              {selectedQuiz.questions[currentQuestionIndex].type === 'multiple' && (
                <div className="mt-4 text-indigo-600 font-bold uppercase tracking-widest text-sm">
                  Multiple Choice - Select all that apply
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center mb-8 px-4">
              <motion.div 
                animate={{ 
                  scale: timeLeft <= 5 ? [1, 1.2, 1] : 1,
                  color: timeLeft <= 5 ? ['#4f46e5', '#ef4444', '#4f46e5'] : '#4f46e5'
                }}
                transition={{ duration: 0.5, repeat: timeLeft <= 5 ? Infinity : 0 }}
                className="w-32 h-32 rounded-full bg-white border-8 border-indigo-600 flex items-center justify-center text-5xl font-black shadow-xl"
              >
                {timeLeft}
              </motion.div>
              <div className="text-3xl font-bold text-zinc-500 bg-white px-8 py-4 rounded-2xl shadow-sm">
                Answers: <span className="text-indigo-600">{answersCount}</span> / {players.length}
              </div>
            </div>

            <div className={`grid gap-6 flex-1 ${selectedQuiz.questions[currentQuestionIndex].type === 'true_false' ? 'grid-cols-2' : 'grid-cols-2'}`}>
              {selectedQuiz.questions[currentQuestionIndex].options.map((opt: any) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={opt.id} 
                  className={`${opt.color} rounded-2xl shadow-sm flex items-center p-8 text-white relative overflow-hidden group`}
                >
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mr-6 group-hover:scale-110 transition-transform">
                    {opt.shape === 'triangle' && <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-b-[34px] border-l-transparent border-r-transparent border-b-white" />}
                    {opt.shape === 'diamond' && <div className="w-10 h-10 bg-white rotate-45" />}
                    {opt.shape === 'circle' && <div className="w-12 h-12 bg-white rounded-full" />}
                    {opt.shape === 'square' && <div className="w-12 h-12 bg-white" />}
                  </div>
                  <span className="text-4xl font-bold">{opt.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {gameState === 'question_result' && currentQuestionIndex >= 0 && selectedQuiz && (
          <motion.div 
            key="question_result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col p-8 items-center"
          >
            <div className="w-full max-w-4xl flex justify-between items-center mb-12">
              <h1 className="text-5xl font-black text-zinc-800">Results</h1>
              <button 
                onClick={handleShowLeaderboard}
                className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg"
              >
                Next
              </button>
            </div>

            <div className="bg-white rounded-3xl p-12 shadow-sm text-center mb-12 w-full max-w-4xl">
              <h1 className="text-4xl font-bold text-zinc-800">
                {selectedQuiz.questions[currentQuestionIndex].text}
              </h1>
            </div>

            <div className="flex items-end justify-center gap-8 h-64 w-full max-w-4xl">
              {selectedQuiz.questions[currentQuestionIndex].options.map((opt: any, i: number) => {
                const count = answerCounts[i] || 0;
                const total = Math.max(1, Object.values(answerCounts).reduce((a, b) => a + b, 0));
                const heightPercentage = (count / total) * 100;
                const isCorrect = selectedQuiz.questions[currentQuestionIndex].correctAnswerIndexes.includes(i);

                return (
                  <div key={opt.id} className="flex flex-col items-center gap-4 flex-1">
                    <span className="text-3xl font-black text-zinc-800">{count}</span>
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(5, heightPercentage)}%` }}
                      className={`w-full rounded-t-xl relative ${isCorrect ? 'bg-green-500' : opt.color} ${!isCorrect && 'opacity-50'}`}
                    >
                      {isCorrect && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-green-500">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </motion.div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${opt.color}`}>
                      {opt.shape === 'triangle' && <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-white" />}
                      {opt.shape === 'diamond' && <div className="w-6 h-6 bg-white rotate-45" />}
                      {opt.shape === 'circle' && <div className="w-8 h-8 bg-white rounded-full" />}
                      {opt.shape === 'square' && <div className="w-8 h-8 bg-white" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedQuiz.questions[currentQuestionIndex].explanation && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-12 w-full max-w-4xl bg-indigo-50 border-2 border-indigo-100 p-8 rounded-3xl"
              >
                <h3 className="text-indigo-600 font-black uppercase tracking-widest text-sm mb-2">Explanation</h3>
                <p className="text-xl font-bold text-zinc-800 leading-relaxed">
                  {selectedQuiz.questions[currentQuestionIndex].explanation}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {gameState === 'leaderboard' && selectedQuiz && (
          <motion.div 
            key="leaderboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col p-8 items-center"
          >
            <div className="w-full max-w-4xl flex justify-between items-center mb-12">
              <h1 className="text-5xl font-black text-zinc-800">Leaderboard</h1>
              <button 
                onClick={handleNextQuestion}
                className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-2xl font-bold hover:bg-indigo-700 transition-colors"
              >
                {currentQuestionIndex < selectedQuiz.questions.length - 1 ? 'Next' : 'End Game'}
              </button>
            </div>
            
            <div className="w-full max-w-4xl space-y-4">
              {leaderboard.map((p, index) => (
                <motion.div 
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  key={p.id} 
                  className="bg-white p-6 rounded-2xl shadow-sm flex justify-between items-center"
                >
                  <div className="flex items-center gap-6">
                    <span className="text-3xl font-black text-zinc-400 w-8">{index + 1}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{p.avatar}</span>
                      <span className="text-3xl font-bold text-zinc-800">{p.nickname}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {p.streak >= 3 && (
                      <span className="text-2xl" title={`${p.streak} answer streak!`}>🔥 {p.streak}</span>
                    )}
                    <span className="text-3xl font-black text-indigo-600">{p.score}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {gameState === 'podium' && (
          <motion.div 
            key="podium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-end pb-24"
          >
            <h1 className="text-6xl font-black text-zinc-800 mb-24 absolute top-16">Podium</h1>
            
            <div className="flex items-end gap-4 h-96">
              {/* 2nd Place */}
              {podium[1] && (
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: '60%' }}
                  className="w-48 bg-indigo-400 rounded-t-2xl flex flex-col items-center justify-start pt-8 relative"
                >
                  <div className="absolute -top-16 text-2xl font-bold text-zinc-800 bg-white px-4 py-2 rounded-full shadow-md flex items-center gap-2">
                    <span>{podium[1].avatar}</span>
                    {podium[1].nickname}
                  </div>
                  <span className="text-6xl font-black text-white/50">2</span>
                  <span className="text-xl font-bold text-white mt-4">{podium[1].score}</span>
                </motion.div>
              )}
              
              {/* 1st Place */}
              {podium[0] && (
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: '100%' }}
                  className="w-48 bg-indigo-600 rounded-t-2xl flex flex-col items-center justify-start pt-8 relative"
                >
                  <div className="absolute -top-20 text-3xl font-black text-zinc-800 bg-white px-6 py-3 rounded-full shadow-lg border-4 border-yellow-400 flex items-center gap-3">
                    <span>{podium[0].avatar}</span>
                    {podium[0].nickname}
                  </div>
                  <span className="text-8xl font-black text-white/50">1</span>
                  <span className="text-2xl font-bold text-white mt-4">{podium[0].score}</span>
                </motion.div>
              )}

              {/* 3rd Place */}
              {podium[2] && (
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: '40%' }}
                  className="w-48 bg-indigo-300 rounded-t-2xl flex flex-col items-center justify-start pt-8 relative"
                >
                  <div className="absolute -top-16 text-xl font-bold text-zinc-800 bg-white px-4 py-2 rounded-full shadow-md flex items-center gap-2">
                    <span>{podium[2].avatar}</span>
                    {podium[2].nickname}
                  </div>
                  <span className="text-5xl font-black text-white/50">3</span>
                  <span className="text-lg font-bold text-white mt-4">{podium[2].score}</span>
                </motion.div>
              )}
            </div>
            
            <button 
              onClick={() => {
                resetGame();
                router.push('/');
              }}
              className="mt-24 text-zinc-500 font-bold hover:text-zinc-800 underline"
            >
              Back to Home
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
