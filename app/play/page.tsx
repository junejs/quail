'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useSocket } from '@/components/socket-provider';
import { useGameStore } from '@/lib/store';
import { audioManager } from '@/lib/audio-manager';

export default function PlayPage() {
  const router = useRouter();
  const { socket } = useSocket();
  const { pin, nickname, avatar, isHost, gameState, setGameState, score, setScore, streak, setStreak, selectedQuiz } = useGameStore();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
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
    
    setHasAnswered(true);
    const question = selectedQuiz!.questions[currentQuestionIndex];
    
    // Check correctness
    let isCorrect = false;
    if (question.type === 'multiple') {
      const correctSet = new Set(question.correctAnswerIndexes);
      const selectedSet = new Set(indexes);
      isCorrect = correctSet.size === selectedSet.size && [...correctSet].every(i => selectedSet.has(i));
    } else {
      isCorrect = question.correctAnswerIndexes.includes(indexes[0]);
    }
    
    socket.emit('submit_answer', {
      pin,
      answerIndexes: indexes,
      isCorrect,
      timeLimit: question.timeLimit
    });
  };

  if (isHost || !selectedQuiz) return null;

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col font-sans">
      <AnimatePresence mode="wait">
        {gameState === 'lobby' && (
          <motion.div 
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-8 text-center"
          >
            <h1 className="text-4xl font-black text-zinc-800 mb-4">You&apos;re in!</h1>
            <p className="text-2xl font-bold text-zinc-500">See your nickname on screen</p>
            <div className="mt-12 flex flex-col items-center gap-4">
              <div className="text-8xl animate-bounce">{avatar}</div>
              <div className="text-3xl font-black text-indigo-600 bg-white px-8 py-4 rounded-2xl shadow-sm">
                {nickname}
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'question' && !hasAnswered && currentQuestionIndex >= 0 && selectedQuiz && (
          <motion.div 
            key="question"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col p-2"
          >
            <div className={`flex-1 grid gap-2 ${selectedQuiz.questions[currentQuestionIndex].type === 'true_false' ? 'grid-cols-1 grid-rows-2' : 'grid-cols-2 grid-rows-2'}`}>
              {selectedQuiz.questions[currentQuestionIndex].options.map((opt: any, i: number) => (
                <button
                  key={opt.id}
                  onClick={() => toggleSelection(i)}
                  className={`${opt.color} rounded-xl shadow-sm flex items-center justify-center active:scale-95 transition-all relative overflow-hidden ${selectedIndexes.includes(i) ? 'ring-8 ring-white/50 scale-95' : ''}`}
                >
                  <div className="flex flex-col items-center gap-4">
                    {opt.shape === 'triangle' && <div className="w-0 h-0 border-l-[40px] border-r-[40px] border-b-[68px] border-l-transparent border-r-transparent border-b-white" />}
                    {opt.shape === 'diamond' && <div className="w-20 h-20 bg-white rotate-45" />}
                    {opt.shape === 'circle' && <div className="w-24 h-24 bg-white rounded-full" />}
                    {opt.shape === 'square' && <div className="w-24 h-24 bg-white" />}
                    {selectedQuiz.questions[currentQuestionIndex].type === 'multiple' && selectedIndexes.includes(i) && (
                      <div className="absolute top-4 right-4 bg-white text-indigo-600 rounded-full p-1">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            {selectedQuiz.questions[currentQuestionIndex].type === 'multiple' && (
              <button
                onClick={() => handleAnswer(selectedIndexes)}
                disabled={selectedIndexes.length === 0}
                className="mt-4 bg-zinc-900 text-white font-black text-2xl py-6 rounded-2xl shadow-lg active:scale-95 transition-transform disabled:opacity-50"
              >
                Submit
              </button>
            )}
          </motion.div>
        )}

        {gameState === 'question' && hasAnswered && !answerResult && (
          <motion.div 
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center bg-indigo-600 text-white p-8 text-center"
          >
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-8" />
            <h1 className="text-4xl font-black">Waiting for others...</h1>
          </motion.div>
        )}

        {gameState === 'question' && hasAnswered && answerResult && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`flex-1 flex flex-col items-center justify-center p-8 text-center text-white ${answerResult.isCorrect ? 'bg-green-500' : 'bg-red-500'}`}
          >
            <h1 className="text-6xl font-black mb-4">
              {answerResult.isCorrect ? 'Correct!' : 'Incorrect'}
            </h1>
            
            <div className="text-6xl mb-6">{avatar}</div>
            
            <div className="bg-black/20 px-8 py-4 rounded-2xl mb-4 w-full max-w-xs">
              <p className="text-xl font-bold opacity-80 mb-1">Total Score</p>
              <p className="text-5xl font-black">{answerResult.score}</p>
            </div>

            {answerResult.isCorrect && answerResult.lastPointsEarned !== undefined && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col gap-2"
              >
                <div className="text-2xl font-black bg-white/20 px-6 py-2 rounded-xl">
                  +{answerResult.lastPointsEarned} points!
                </div>
                {answerResult.streak >= 2 && (
                  <div className="bg-orange-500 text-white px-6 py-2 rounded-full font-bold text-lg shadow-lg flex items-center justify-center gap-2 animate-bounce">
                    <span>🔥</span> {answerResult.streak} Answer Streak!
                  </div>
                )}
              </motion.div>
            )}

            {!answerResult.isCorrect && (
              <p className="text-2xl font-bold mt-8 opacity-90">
                Don&apos;t give up!
              </p>
            )}
          </motion.div>
        )}

        {gameState === 'leaderboard' && (
          <motion.div 
            key="leaderboard-wait"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center bg-indigo-600 text-white p-8 text-center"
          >
            <h1 className="text-4xl font-black mb-8">You&apos;re in {score > 0 ? 'the game' : 'the lobby'}!</h1>
            <div className="text-6xl mb-6">{avatar}</div>
            <div className="bg-black/20 px-8 py-4 rounded-2xl">
              <p className="text-xl font-bold opacity-80 mb-1">Current Score</p>
              <p className="text-4xl font-black">{score}</p>
            </div>
            <p className="text-xl font-bold mt-12 opacity-80">Look at the big screen</p>
          </motion.div>
        )}

        {gameState === 'podium' && (
          <motion.div 
            key="podium-result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center bg-indigo-600 text-white p-8 text-center"
          >
            <h1 className="text-5xl font-black mb-4">Game Over!</h1>
            
            <div className="text-7xl mb-4">{avatar}</div>

            <div className="bg-white text-indigo-600 px-12 py-8 rounded-3xl shadow-xl my-8">
              <p className="text-2xl font-bold opacity-80 mb-2">You placed</p>
              <p className="text-8xl font-black">
                {finalRank}
                <span className="text-4xl">{finalRank === 1 ? 'st' : finalRank === 2 ? 'nd' : finalRank === 3 ? 'rd' : 'th'}</span>
              </p>
            </div>

            <div className="bg-black/20 px-8 py-4 rounded-2xl">
              <p className="text-xl font-bold opacity-80 mb-1">Final Score</p>
              <p className="text-4xl font-black">{score}</p>
            </div>

            <button 
              onClick={() => router.push('/')}
              className="mt-12 bg-white/20 hover:bg-white/30 px-8 py-4 rounded-xl font-bold text-xl transition-colors"
            >
              Play Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
