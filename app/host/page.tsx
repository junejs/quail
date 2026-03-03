'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useSocket } from '@/components/socket-provider';
import { useGameStore } from '@/lib/store';
import confetti from 'canvas-confetti';
import { audioManager } from '@/lib/audio-manager';
import { Volume2, VolumeX, QrCode } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import AuthGuard from '@/components/auth-guard';

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
  const [showQR, setShowQR] = useState(false);
  const [showChart, setShowChart] = useState(false);

  const joinUrl = typeof window !== 'undefined' && pin ? `${window.location.origin}/?pin=${pin}` : '';

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
    <AuthGuard>
      <div className="min-h-screen flex flex-col font-sans overflow-hidden relative">
        <AnimatePresence mode="wait">
          {gameState === 'lobby' && (
            <motion.div 
              key="lobby"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              <div className="bg-white/10 backdrop-blur-xl p-8 border-b border-white/10 flex justify-between items-center shadow-2xl">
                <div className="flex items-center gap-12">
                  <div>
                    <h2 className="text-sm font-black text-white/40 uppercase tracking-[0.3em] mb-2">Join at the App with Game PIN:</h2>
                    <div className="flex items-center gap-8">
                      <motion.h1 
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-9xl font-black tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                      >
                        {pin}
                      </motion.h1>
                      <button 
                        onClick={() => setShowQR(!showQR)}
                        className={`p-5 rounded-3xl transition-all flex items-center gap-3 font-black uppercase tracking-widest text-sm border ${
                          showQR ? 'bg-white text-indigo-900 border-white shadow-[0_0_30px_rgba(255,255,255,0.4)]' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                        }`}
                        title="Show QR Code"
                      >
                        <QrCode size={24} />
                        <span>Scan to Join</span>
                      </button>
                    </div>
                    <div className="mt-6 flex items-center gap-3">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,1)]" />
                      <p className="text-lg font-bold text-white/60">Quiz: <span className="text-white">{selectedQuiz.title}</span></p>
                    </div>
                  </div>
                  <button 
                    onClick={toggleMute}
                    className="p-5 rounded-full bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all"
                  >
                    {isMuted ? <VolumeX size={32} /> : <Volume2 size={32} />}
                  </button>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStartGame}
                  disabled={players.length === 0}
                  className="bg-white text-indigo-900 px-16 py-8 rounded-[2.5rem] text-4xl font-black hover:bg-indigo-50 disabled:opacity-30 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] uppercase tracking-tighter"
                >
                  Start Game
                </motion.button>
              </div>
              <div className="flex-1 p-12 relative">
                <AnimatePresence>
                  {showQR && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0502]/60 backdrop-blur-xl p-8"
                    >
                      <div className="bg-white p-16 rounded-[4rem] shadow-[0_0_60px_rgba(255,255,255,0.2)] flex flex-col items-center text-center border-[12px] border-indigo-600">
                        <h2 className="text-5xl font-black text-zinc-900 mb-10 uppercase tracking-tighter">Scan to Join Game</h2>
                        <div className="bg-white p-8 rounded-[3rem] shadow-inner border-4 border-zinc-100">
                          <QRCodeCanvas 
                            value={joinUrl} 
                            size={400}
                            level="H"
                            includeMargin={true}
                          />
                        </div>
                        <div className="mt-10">
                          <p className="text-xl font-black text-zinc-400 uppercase tracking-widest mb-2">Game PIN</p>
                          <p className="text-8xl font-black text-indigo-600 tracking-widest">{pin}</p>
                        </div>
                        <button 
                          onClick={() => setShowQR(false)}
                          className="mt-12 bg-zinc-900 text-white px-16 py-5 rounded-3xl text-2xl font-black hover:bg-zinc-800 transition-all uppercase tracking-widest"
                        >
                          Close
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-3xl font-black text-white/80 uppercase tracking-widest">Players ({players.length})</h3>
                </div>
                <div className="flex flex-wrap gap-6">
                  <AnimatePresence>
                    {players.map((p) => (
                      <motion.div 
                        layout
                        initial={{ scale: 0, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0, opacity: 0 }}
                        key={p.id} 
                        className={`bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl shadow-xl text-2xl font-black flex items-center gap-4 border transition-all ${
                          p.isDisconnected ? 'border-rose-500/50 text-white/30 grayscale' : 'border-white/10 text-white'
                        }`}
                      >
                        <span className="text-4xl">{p.avatar}</span>
                        {p.nickname}
                        {p.isDisconnected && <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-2">Offline</span>}
                      </motion.div>
                    ))}
                  </AnimatePresence>
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
              className="flex-1 flex flex-col p-12"
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-[3rem] p-16 border border-white/20 shadow-2xl text-center mb-12 relative overflow-hidden">
                {/* Decorative inner glow */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none" />
                
                <h1 className="text-6xl font-black text-white relative z-10 leading-tight">
                  {selectedQuiz.questions[currentQuestionIndex].text}
                </h1>
                {selectedQuiz.questions[currentQuestionIndex].type === 'multiple' && (
                  <div className="mt-6 text-indigo-400 font-black uppercase tracking-[0.4em] text-sm">
                    Multiple Choice - Select all that apply
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center mb-12 px-8">
                <motion.div 
                  animate={{ 
                    scale: timeLeft <= 5 ? [1, 1.15, 1] : 1,
                    borderColor: timeLeft <= 5 ? ['rgba(255,255,255,0.2)', '#ef4444', 'rgba(255,255,255,0.2)'] : 'rgba(255,255,255,0.2)'
                  }}
                  transition={{ duration: 0.5, repeat: timeLeft <= 5 ? Infinity : 0 }}
                  className="w-40 h-40 rounded-full bg-white/5 backdrop-blur-md border-8 border-white/10 flex items-center justify-center text-7xl font-black text-white shadow-2xl"
                >
                  {timeLeft}
                </motion.div>
                <div className="text-4xl font-black text-white/40 bg-white/5 backdrop-blur-md px-12 py-6 rounded-[2rem] border border-white/10 shadow-xl">
                  Answers: <span className="text-white">{answersCount}</span> <span className="text-white/20">/</span> {players.length}
                </div>
              </div>

              <div className={`grid gap-8 flex-1 ${selectedQuiz.questions[currentQuestionIndex].type === 'true_false' ? 'grid-cols-2' : 'grid-cols-2'}`}>
                {selectedQuiz.questions[currentQuestionIndex].options.map((opt: any) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={opt.id} 
                    className={`${opt.color} rounded-[2.5rem] shadow-2xl flex items-center p-10 text-white relative overflow-hidden group border-4 border-transparent`}
                  >
                    <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mr-8 group-hover:scale-110 transition-transform shadow-lg">
                      {opt.shape === 'triangle' && <div className="w-0 h-0 border-l-[24px] border-r-[24px] border-b-[42px] border-l-transparent border-r-transparent border-b-white drop-shadow-md" />}
                      {opt.shape === 'diamond' && <div className="w-12 h-12 bg-white rotate-45 shadow-md" />}
                      {opt.shape === 'circle' && <div className="w-14 h-14 bg-white rounded-full shadow-md" />}
                      {opt.shape === 'square' && <div className="w-14 h-14 bg-white shadow-md" />}
                    </div>
                    <span className="text-5xl font-black tracking-tight">{opt.text}</span>
                    {/* Decorative inner glow */}
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
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
              className="flex-1 flex flex-col p-12 items-center"
            >
              <div className="w-full max-w-6xl flex justify-between items-center mb-16">
                <h1 className="text-6xl font-black text-white uppercase tracking-tighter">Results</h1>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShowLeaderboard}
                  className="bg-white text-indigo-900 px-12 py-6 rounded-2xl text-3xl font-black hover:bg-indigo-50 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] uppercase tracking-widest"
                >
                  Next
                </motion.button>
              </div>

              <div className="bg-white/10 backdrop-blur-xl rounded-[3rem] p-12 border border-white/20 shadow-2xl text-center mb-16 w-full max-w-6xl">
                <h1 className="text-4xl font-black text-white leading-tight">
                  {selectedQuiz.questions[currentQuestionIndex].text}
                </h1>
              </div>

              <div className="flex items-end justify-center gap-10 h-80 w-full max-w-6xl px-12">
                {selectedQuiz.questions[currentQuestionIndex].options.map((opt: any, i: number) => {
                  const count = answerCounts[i] || 0;
                  const total = Math.max(1, Object.values(answerCounts).reduce((a, b) => a + b, 0));
                  const heightPercentage = (count / total) * 100;
                  const isCorrect = selectedQuiz.questions[currentQuestionIndex].correctAnswerIndexes.includes(i);

                  return (
                    <div key={opt.id} className="flex flex-col items-center gap-6 flex-1">
                      <span className="text-4xl font-black text-white">{count}</span>
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(8, heightPercentage)}%` }}
                        className={`w-full rounded-t-3xl relative shadow-2xl ${isCorrect ? 'bg-emerald-500' : opt.color} ${!isCorrect && 'opacity-30'}`}
                      >
                        {isCorrect && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-10 left-1/2 -translate-x-1/2 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                          >
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.div>
                        )}
                      </motion.div>
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${opt.color}`}>
                        {opt.shape === 'triangle' && <div className="w-0 h-0 border-l-[16px] border-r-[16px] border-b-[28px] border-l-transparent border-r-transparent border-b-white" />}
                        {opt.shape === 'diamond' && <div className="w-8 h-8 bg-white rotate-45" />}
                        {opt.shape === 'circle' && <div className="w-10 h-10 bg-white rounded-full" />}
                        {opt.shape === 'square' && <div className="w-10 h-10 bg-white" />}
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
                  className="mt-16 w-full max-w-6xl bg-white/5 backdrop-blur-md border border-white/10 p-10 rounded-[2.5rem] shadow-2xl"
                >
                  <h3 className="text-indigo-400 font-black uppercase tracking-[0.4em] text-xs mb-3">Explanation</h3>
                  <p className="text-2xl font-bold text-white leading-relaxed">
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
              className="flex-1 flex flex-col p-12 items-center"
            >
              <div className="w-full max-w-5xl flex justify-between items-center mb-16">
                <h1 className="text-6xl font-black text-white uppercase tracking-tighter">Leaderboard</h1>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNextQuestion}
                  className="bg-white text-indigo-900 px-12 py-6 rounded-2xl text-3xl font-black hover:bg-indigo-50 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] uppercase tracking-widest"
                >
                  {currentQuestionIndex < selectedQuiz.questions.length - 1 ? 'Next Question' : 'View Podium'}
                </motion.button>
              </div>
              
              <div className="w-full max-w-5xl space-y-4">
                <AnimatePresence mode="popLayout">
                  {leaderboard.map((p, index) => (
                    <motion.div 
                      layout
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 50, opacity: 0 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                        delay: index * 0.05 
                      }}
                      key={p.id} 
                      className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-xl flex justify-between items-center group hover:bg-white/15 transition-colors"
                    >
                      <div className="flex items-center gap-8">
                        <span className="text-4xl font-black text-white/20 w-12">{index + 1}</span>
                        <div className="flex items-center gap-5">
                          <motion.span 
                            animate={{ scale: index === 0 ? [1, 1.2, 1] : 1 }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-5xl"
                          >
                            {p.avatar}
                          </motion.span>
                          <span className="text-4xl font-black text-white tracking-tight">{p.nickname}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        {p.streak >= 3 && (
                          <motion.span 
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="text-3xl bg-orange-500/20 px-4 py-2 rounded-2xl border border-orange-500/30 text-orange-400 font-black" 
                            title={`${p.streak} answer streak!`}
                          >
                            🔥 {p.streak}
                          </motion.span>
                        )}
                        <span className="text-5xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{p.score}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {gameState === 'podium' && (
            <motion.div 
              key="podium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-end pb-32"
            >
              <h1 className="text-6xl font-black text-white mb-24 absolute top-16 uppercase tracking-tighter drop-shadow-2xl">Podium</h1>
              
              <div className={`w-full max-w-6xl grid ${showChart ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-12 items-end px-12 transition-all duration-500`}>
                <div className="flex items-end gap-8 h-[30rem] justify-center">
                  {/* 2nd Place */}
                  {podium[1] && (
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: '65%' }}
                      transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.5 }}
                      className="w-48 bg-indigo-500/40 backdrop-blur-md border-t border-x border-white/20 rounded-t-[3rem] flex flex-col items-center justify-start pt-12 relative shadow-2xl"
                    >
                      <motion.div 
                        initial={{ scale: 0, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ delay: 1.2 }}
                        className="absolute -top-24 text-xl font-black text-white bg-white/10 backdrop-blur-xl px-6 py-3 rounded-[1.5rem] border border-white/20 shadow-2xl flex items-center gap-3 whitespace-nowrap"
                      >
                        <span className="text-4xl">{podium[1].avatar}</span>
                        {podium[1].nickname}
                      </motion.div>
                      <span className="text-7xl font-black text-white/20">2</span>
                      <span className="text-2xl font-black text-white mt-6">{podium[1].score}</span>
                    </motion.div>
                  )}
                  
                  {/* 1st Place */}
                  {podium[0] && (
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: '100%' }}
                      transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.8 }}
                      className="w-56 bg-indigo-600/60 backdrop-blur-md border-t border-x border-white/30 rounded-t-[3.5rem] flex flex-col items-center justify-start pt-12 relative shadow-[0_0_50px_rgba(99,102,241,0.4)]"
                    >
                      <motion.div 
                        initial={{ scale: 0, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ delay: 1.5 }}
                        className="absolute -top-32 text-2xl font-black text-white bg-white/15 backdrop-blur-xl px-8 py-5 rounded-[2rem] border-4 border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.4)] flex items-center gap-4 whitespace-nowrap"
                      >
                        <span className="text-6xl">{podium[0].avatar}</span>
                        {podium[0].nickname}
                      </motion.div>
                      <motion.div 
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-8xl font-black text-white/30"
                      >
                        1
                      </motion.div>
                      <span className="text-3xl font-black text-white mt-8">{podium[0].score}</span>
                    </motion.div>
                  )}

                  {/* 3rd Place */}
                  {podium[2] && (
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: '45%' }}
                      transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
                      className="w-48 bg-indigo-400/30 backdrop-blur-md border-t border-x border-white/10 rounded-t-[2.5rem] flex flex-col items-center justify-start pt-12 relative shadow-2xl"
                    >
                      <motion.div 
                        initial={{ scale: 0, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="absolute -top-20 text-lg font-black text-white bg-white/5 backdrop-blur-xl px-5 py-2 rounded-[1.2rem] border border-white/10 shadow-2xl flex items-center gap-2 whitespace-nowrap"
                      >
                        <span className="text-3xl">{podium[2].avatar}</span>
                        {podium[2].nickname}
                      </motion.div>
                      <span className="text-6xl font-black text-white/15">3</span>
                      <span className="text-xl font-black text-white mt-4">{podium[2].score}</span>
                    </motion.div>
                  )}
                </div>

                {/* Performance Chart */}
                <AnimatePresence>
                  {showChart && (
                    <motion.div 
                      initial={{ opacity: 0, x: 50, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 50, scale: 0.9 }}
                      transition={{ duration: 0.5 }}
                      className="bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 shadow-2xl h-[30rem] flex flex-col"
                    >
                      <h3 className="text-xl font-black text-white/40 uppercase tracking-[0.3em] mb-6">Performance over time</h3>
                      <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={Array.from({ length: (podium[0]?.scoreHistory?.length || 0) }, (_, i) => {
                              const point: any = { name: `Q${i}` };
                              podium.slice(0, 5).forEach(p => {
                                point[p.nickname] = p.scoreHistory[i];
                              });
                              return point;
                            })}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis 
                              dataKey="name" 
                              stroke="rgba(255,255,255,0.3)" 
                              fontSize={12} 
                              tickLine={false} 
                              axisLine={false}
                            />
                            <YAxis 
                              stroke="rgba(255,255,255,0.3)" 
                              fontSize={12} 
                              tickLine={false} 
                              axisLine={false}
                              tickFormatter={(val) => `${val}`}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(10, 5, 2, 0.8)', 
                                borderRadius: '1rem', 
                                border: '1px solid rgba(255,255,255,0.1)',
                                backdropFilter: 'blur(10px)',
                                color: '#fff'
                              }}
                              itemStyle={{ color: '#fff' }}
                            />
                            <Legend iconType="circle" />
                            {podium.slice(0, 5).map((p, idx) => (
                              <Line 
                                key={p.id}
                                type="monotone" 
                                dataKey={p.nickname} 
                                stroke={idx === 0 ? '#fbbf24' : idx === 1 ? '#818cf8' : idx === 2 ? '#a5b4fc' : '#6366f1'} 
                                strokeWidth={idx === 0 ? 4 : 2}
                                dot={{ r: 4, fill: '#fff', strokeWidth: 2 }}
                                activeDot={{ r: 8, strokeWidth: 0 }}
                                animationDuration={2000}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="flex gap-6 mt-32">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowChart(!showChart)}
                  className={`bg-white/10 backdrop-blur-md border border-white/20 text-white px-12 py-5 rounded-2xl font-black text-xl transition-all uppercase tracking-[0.2em] ${showChart ? 'bg-indigo-600/40 border-indigo-500/50' : 'hover:bg-white/20'}`}
                >
                  {showChart ? 'Hide Stats' : 'Show Stats'}
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    resetGame();
                    router.push('/');
                  }}
                  className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-12 py-5 rounded-2xl font-black text-xl hover:bg-white/20 transition-all uppercase tracking-[0.2em]"
                >
                  Back to Home
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthGuard>
  );
}
