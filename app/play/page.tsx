'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useSocket } from '@/components/socket-provider';
import { useGameStore } from '@/lib/store';
import { audioManager } from '@/lib/audio-manager';
import { AVATARS, AVATAR_GROUPS } from '@/lib/constants';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PlayPage() {
  const router = useRouter();
  const { socket } = useSocket();
  const { pin, nickname, avatar, setAvatar, isHost, gameState, setGameState, score, setScore, streak, setStreak, selectedQuiz, resetGame } = useGameStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [activeGroupId, setActiveGroupId] = useState(() => {
    if (typeof window !== 'undefined' && avatar) {
      const group = AVATAR_GROUPS.find(g => g.avatars.includes(avatar));
      return group ? group.id : AVATAR_GROUPS[0].id;
    }
    return AVATAR_GROUPS[0].id;
  });
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState<{
    isCorrect: boolean,
    score: number,
    streak: number,
    pointsEarned?: number,
    lastPointsEarned?: number
  } | null>(null);

  const [finalRank, setFinalRank] = useState<number | null>(null);

  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [isAudioBlocked, setIsAudioBlocked] = useState(false);

  useEffect(() => {
    const checkAudio = () => {
      if (audioManager && !audioManager.getIsUnlocked()) {
        setIsAudioBlocked(true);
      } else {
        setIsAudioBlocked(false);
      }
    };
    checkAudio();
    window.addEventListener('click', checkAudio);
    return () => window.removeEventListener('click', checkAudio);
  }, []);

  useEffect(() => {
    if (gameState === 'lobby' && scrollRef.current && avatar) {
      const activeItem = scrollRef.current.querySelector(`[data-avatar="${avatar}"]`) as HTMLElement;
      if (activeItem) {
        scrollRef.current.scrollLeft = activeItem.offsetLeft - scrollRef.current.offsetWidth / 2 + activeItem.offsetWidth / 2;
      }
    }
  }, [gameState, avatar, activeGroupId]); // Add activeGroupId to re-scroll when switching tabs

  useEffect(() => {
    if (isHost || !pin || !nickname || !socket || !selectedQuiz) {
      router.push('/');
      return;
    }

    const onQuestionStarted = (index: number) => {
      setCurrentQuestionIndex(index);
      setGameState('question');
      setHasAnswered(false);
      setAnswerResult(null);
      setSelectedIndexes([]);
    };

    const onAnswerResult = (result: any) => {
      setAnswerResult(result);
      setScore(result.score);
      setStreak(result.streak);

      if (result.isCorrect) {
        audioManager?.playSfx('correct');
      } else {
        audioManager?.playSfx('incorrect');
      }
    };

    const onLeaderboardUpdated = () => {
      setGameState('leaderboard');
    };

    const onGameEnded = (finalStandings: any[]) => {
      const rank = finalStandings.findIndex(p => p.nickname === nickname) + 1;
      setFinalRank(rank);
      setGameState('podium');
    };

    socket.on('question_started', onQuestionStarted);
    socket.on('answer_result', onAnswerResult);
    socket.on('leaderboard_updated', onLeaderboardUpdated);
    socket.on('game_ended', onGameEnded);

    return () => {
      socket.off('question_started', onQuestionStarted);
      socket.off('answer_result', onAnswerResult);
      socket.off('leaderboard_updated', onLeaderboardUpdated);
      socket.off('game_ended', onGameEnded);
    };
  }, [socket, isHost, pin, nickname, router, setGameState, setScore, setStreak, selectedQuiz]);

  const toggleSelection = (index: number) => {
    if (hasAnswered) return;

    const question = selectedQuiz!.questions[currentQuestionIndex];
    if (question.type === 'multiple') {
      if (selectedIndexes.includes(index)) {
        setSelectedIndexes(selectedIndexes.filter(i => i !== index));
      } else {
        setSelectedIndexes([...selectedIndexes, index]);
      }
    } else {
      handleAnswer([index]);
    }
  };

  const handleAnswer = (indexes: number[]) => {
    if (hasAnswered || !socket || !selectedQuiz || indexes.length === 0) return;

    audioManager?.unlock();
    setHasAnswered(true);

    socket.emit('submit_answer', {
      pin,
      answerIndexes: indexes
    });
  };

  const handleAvatarChange = (newAvatar: string) => {
    if (!socket || !pin) return;
    setAvatar(newAvatar);
    socket.emit('change_avatar', { pin, avatar: newAvatar });

    // Scroll to center the newly selected avatar
    if (scrollRef.current) {
      const activeItem = scrollRef.current.querySelector(`[data-avatar="${newAvatar}"]`) as HTMLElement;
      if (activeItem) {
        scrollRef.current.scrollTo({
          left: activeItem.offsetLeft - scrollRef.current.offsetWidth / 2 + activeItem.offsetWidth / 2,
          behavior: 'smooth'
        });
      }
    }
  };

  if (isHost || !selectedQuiz) return null;

  return (
    <div className="min-h-screen flex flex-col font-sans relative overflow-hidden">
      <AnimatePresence mode="wait">
        {gameState === 'lobby' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex-1 flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="bg-white/10 backdrop-blur-xl p-12 rounded-[3rem] border border-white/20 shadow-2xl w-full max-w-lg"
            >
              <h1 className="text-5xl font-black text-white mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">You&apos;re in!</h1>
              <p className="text-xl font-bold text-white/50 uppercase tracking-widest mb-8">Pick your character</p>

              {/* Avatar Groups Tabs */}
              <div className="flex overflow-x-auto gap-2 mb-8 bg-black/20 p-1.5 rounded-2xl no-scrollbar snap-x">
                {AVATAR_GROUPS.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setActiveGroupId(group.id)}
                    className={`flex-shrink-0 py-2 px-6 rounded-xl text-sm font-black transition-all uppercase tracking-tighter snap-center ${activeGroupId === group.id
                      ? 'bg-white text-indigo-900 shadow-lg'
                      : 'text-white/40 hover:text-white/70'
                      }`}
                  >
                    {group.name}
                  </button>
                ))}
              </div>

              <div className="relative group mb-12">
                <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#1e1b4b] to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#1e1b4b] to-transparent z-10 pointer-events-none" />

                <div className="flex overflow-x-auto gap-6 px-32 py-4 no-scrollbar snap-x snap-mandatory scroll-smooth"
                  ref={scrollRef}
                >
                  {(AVATAR_GROUPS.find(g => g.id === activeGroupId)?.avatars || []).map((a) => (
                    <motion.button
                      key={a}
                      data-avatar={a}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleAvatarChange(a)}
                      className={`text-8xl flex-shrink-0 snap-center transition-all duration-300 ${avatar === a ? 'scale-125 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'opacity-20 grayscale scale-90 hover:opacity-50'}`}
                    >
                      {a}
                    </motion.button>
                  ))}
                </div>

                <div className="absolute -left-4 top-1/2 -translate-y-1/2 text-white/20 animate-pulse">
                  <ChevronLeft size={40} />
                </div>
                <div className="absolute -right-4 top-1/2 -translate-y-1/2 text-white/20 animate-pulse">
                  <ChevronRight size={40} />
                </div>
              </div>

              <div className="text-4xl font-black text-indigo-400 bg-white/5 border border-white/10 px-10 py-5 rounded-3xl shadow-xl inline-block">
                {nickname}
              </div>
            </motion.div>
          </motion.div>
        )}

        {gameState === 'question' && !hasAnswered && currentQuestionIndex >= 0 && selectedQuiz && (
          <motion.div
            key="question"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col p-4 gap-4"
          >
            <div className={`flex-1 grid gap-4 ${selectedQuiz.questions[currentQuestionIndex].type === 'true_false' ? 'grid-cols-1 grid-rows-2' : 'grid-cols-2 grid-rows-2'}`}>
              {selectedQuiz.questions[currentQuestionIndex].options.map((opt: any, i: number) => (
                <motion.button
                  key={opt.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleSelection(i)}
                  className={`${opt.color} rounded-3xl shadow-xl flex items-center justify-center transition-all relative overflow-hidden group border-4 ${selectedIndexes.includes(i) ? 'border-white scale-95 shadow-[0_0_30px_rgba(255,255,255,0.5)]' : 'border-transparent'}`}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="transform group-hover:scale-110 transition-transform">
                      {opt.shape === 'triangle' && <div className="w-0 h-0 border-l-[40px] border-r-[40px] border-b-[68px] border-l-transparent border-r-transparent border-b-white drop-shadow-lg" />}
                      {opt.shape === 'diamond' && <div className="w-20 h-20 bg-white rotate-45 shadow-lg" />}
                      {opt.shape === 'circle' && <div className="w-24 h-24 bg-white rounded-full shadow-lg" />}
                      {opt.shape === 'square' && <div className="w-24 h-24 bg-white shadow-lg" />}
                    </div>
                    {selectedQuiz.questions[currentQuestionIndex].type === 'multiple' && selectedIndexes.includes(i) && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-6 right-6 bg-white text-indigo-600 rounded-full p-2 shadow-xl"
                      >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    )}
                  </div>
                  {/* Decorative inner glow */}
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              ))}
            </div>
            {selectedQuiz.questions[currentQuestionIndex].type === 'multiple' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAnswer(selectedIndexes)}
                disabled={selectedIndexes.length === 0}
                className="bg-white text-indigo-600 font-black text-3xl py-8 rounded-[2rem] shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50 uppercase tracking-widest"
              >
                Submit Answer
              </motion.button>
            )}
          </motion.div>
        )}

        {gameState === 'question' && hasAnswered && !answerResult && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="relative">
              <div className="w-24 h-24 border-8 border-white/10 border-t-indigo-500 rounded-full animate-spin mb-10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
              </div>
            </div>
            <h1 className="text-4xl font-black text-white mb-2">Waiting for others...</h1>
            <p className="text-white/40 font-bold uppercase tracking-widest text-xs">The tension is building!</p>
          </motion.div>
        )}

        {gameState === 'question' && hasAnswered && answerResult && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className={`flex-1 flex flex-col items-center justify-center p-8 text-center text-white relative ${answerResult.isCorrect ? 'bg-emerald-600' : 'bg-rose-600'}`}
          >
            {/* Feedback Loops */}
            {answerResult.isCorrect && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            )}
            {!answerResult.isCorrect && (
              <motion.div
                animate={{ x: [-10, 10, -10, 10, 0] }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 pointer-events-none bg-black/20"
              />
            )}

            <motion.h1
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-7xl font-black mb-6 drop-shadow-2xl"
            >
              {answerResult.isCorrect ? 'CORRECT!' : 'INCORRECT'}
            </motion.h1>

            <motion.div
              animate={{ rotate: answerResult.isCorrect ? [0, 10, -10, 0] : [0, -5, 5, 0] }}
              transition={{ duration: 0.5 }}
              className="text-9xl mb-10 drop-shadow-2xl"
            >
              {avatar}
            </motion.div>

            <div className="bg-black/30 backdrop-blur-md border border-white/10 px-10 py-6 rounded-[2.5rem] mb-6 w-full max-w-xs shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.3em] opacity-50 mb-2">Total Score</p>
              <p className="text-6xl font-black">{answerResult.score}</p>
            </div>

            {answerResult.isCorrect && answerResult.lastPointsEarned !== undefined && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col gap-4"
              >
                <div className="text-3xl font-black bg-white/20 backdrop-blur-sm px-8 py-3 rounded-2xl border border-white/20">
                  +{answerResult.lastPointsEarned}
                </div>
                {answerResult.streak >= 2 && (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="bg-orange-500 text-white px-8 py-3 rounded-full font-black text-xl shadow-[0_0_20px_rgba(249,115,22,0.5)] flex items-center justify-center gap-3"
                  >
                    <span>🔥</span> {answerResult.streak} STREAK!
                  </motion.div>
                )}
              </motion.div>
            )}

            {!answerResult.isCorrect && (
              <p className="text-2xl font-black mt-8 opacity-60 uppercase tracking-widest">
                Keep going!
              </p>
            )}
          </motion.div>
        )}

        {gameState === 'leaderboard' && (
          <motion.div
            key="leaderboard-wait"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="bg-white/10 backdrop-blur-xl p-12 rounded-[3rem] border border-white/20 shadow-2xl w-full max-w-sm">
              <h1 className="text-4xl font-black text-white mb-8">
                {score > 0 ? 'You&apos;re climbing!' : 'Ready for next?'}
              </h1>
              <div className="text-8xl mb-10 drop-shadow-2xl animate-bounce">{avatar}</div>
              <div className="bg-white/5 border border-white/10 px-10 py-6 rounded-3xl mb-8">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Current Score</p>
                <p className="text-5xl font-black text-white">{score}</p>
              </div>
              <p className="text-xs font-black uppercase tracking-[0.4em] text-indigo-400 animate-pulse">Look at the big screen</p>
            </div>
          </motion.div>
        )}

        {gameState === 'podium' && (
          <motion.div
            key="podium-result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="bg-white/10 backdrop-blur-xl p-12 rounded-[3.5rem] border border-white/20 shadow-2xl w-full max-w-md relative overflow-hidden">
              {/* Decorative inner glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/30 blur-3xl rounded-full pointer-events-none" />

              <h1 className="text-5xl font-black text-white mb-4 uppercase tracking-tighter">Game Over!</h1>

              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="text-9xl mb-8 drop-shadow-2xl"
              >
                {avatar}
              </motion.div>

              <div className="bg-white text-indigo-900 px-12 py-10 rounded-[2.5rem] shadow-2xl my-8 transform hover:scale-105 transition-transform">
                <p className="text-sm font-black uppercase tracking-[0.3em] opacity-40 mb-2">Final Rank</p>
                <p className="text-9xl font-black leading-none">
                  {finalRank}
                  <span className="text-4xl align-top ml-1">
                    {finalRank === 1 ? 'st' : finalRank === 2 ? 'nd' : finalRank === 3 ? 'rd' : 'th'}
                  </span>
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 px-10 py-6 rounded-3xl mb-10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">Final Score</p>
                <p className="text-5xl font-black text-white">{score}</p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  resetGame();
                  router.push('/');
                }}
                className="w-full bg-indigo-600 text-white px-10 py-6 rounded-2xl font-black text-2xl shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:bg-indigo-500 transition-all uppercase tracking-widest"
              >
                Play Again
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio Blocked Indicator */}
      <AnimatePresence>
        {isAudioBlocked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="bg-indigo-600/80 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
              <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
              <span className="text-white font-black text-xs uppercase tracking-widest">Click anywhere to enable sound</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
