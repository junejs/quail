'use client';

import { useEffect, useState, useRef, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useSocket } from '@/components/socket-provider';
import { useGameStore } from '@/lib/store';
import confetti from 'canvas-confetti';
import { audioManager } from '@/lib/audio-manager';
import { Volume2, VolumeX } from 'lucide-react';
import AuthGuard from '@/components/auth-guard';
import HostLeaderboard from '@/components/HostLeaderboard';
import HostLobby from '@/components/HostLobby';
import HostPodium from '@/components/HostPodium';
import HostQuestion from '@/components/HostQuestion';
import HostQuestionResult from '@/components/HostQuestionResult';
import { useTranslation } from '@/lib/translations';
import { useI18nStore } from '@/lib/i18n';

function useStore<T>(store: { getState: () => T; subscribe: (listener: () => void) => () => void }, selector: (state: T) => any) {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState())
  );
}

export default function HostPage() {
  const router = useRouter();
  const { socket } = useSocket();
  const { pin, isHost, gameState, setGameState, players, setPlayers, selectedQuiz, resetGame } = useGameStore();
  const { t } = useTranslation();
  const locale = useStore(useI18nStore, (state) => state.locale);

  // Initialize locale
  useEffect(() => {
    const { initLocale } = require('@/lib/i18n');
    initLocale();
  }, []);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answersCount, setAnswersCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [podium, setPodium] = useState<any[]>([]);
  const [answerCounts, setAnswerCounts] = useState<Record<number, number>>({});
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioBlocked, setIsAudioBlocked] = useState(false);
  const [showQR, setShowQR] = useState(false);

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

  const prevGameStateRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip if gameState hasn't actually changed
    if (prevGameStateRef.current === gameState) return;
    prevGameStateRef.current = gameState;

    if (gameState === 'lobby') {
      audioManager?.playBgm('lobby');
    } else if (gameState === 'podium') {
      audioManager?.playBgm('podium');
    } else if (gameState === 'question' || gameState === 'question_result' || gameState === 'leaderboard') {
      // Play question music throughout the entire answer process (question, result, leaderboard)
      audioManager?.playBgm('question');
    } else if (gameState !== 'idle') {
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

  const handleStartGame = async () => {
    // Unlock audio context before starting game
    await audioManager?.unlock();
    audioManager?.playSfx('join');
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

  const handleToggleChart = () => {
    setShowChart((prev) => !prev);
  };

  const handleBackToHome = () => {
    resetGame();
    router.push('/');
  };

  const toggleMute = () => {
    const muted = audioManager?.toggleMute();
    setIsMuted(!!muted);
  };

  if (!isHost || !selectedQuiz || !pin) return null;

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col font-sans overflow-hidden relative">
        {/* 固定音量和音频阻止提示 */}
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          {isAudioBlocked && (
            <button
              onClick={() => audioManager?.unlock()}
              className="px-4 py-2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-sm font-bold animate-pulse"
            >
              🔓 {t('host.enableAudio')}
            </button>
          )}
          <button
            onClick={toggleMute}
            className="p-4 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 transition-all"
            title={isMuted ? t('host.unmute') : t('host.mute')}
          >
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
        </div>
        <AnimatePresence mode="wait">
          {gameState === 'lobby' && (
            <HostLobby
              pin={pin}
              players={players}
              selectedQuiz={selectedQuiz}
              showQR={showQR}
              setShowQR={setShowQR}
              joinUrl={joinUrl}
              onStartGame={handleStartGame}
              t={t}
            />
          )}

          {gameState === 'question' && currentQuestionIndex >= 0 && selectedQuiz && (
            <HostQuestion
              selectedQuiz={selectedQuiz}
              currentQuestionIndex={currentQuestionIndex}
              timeLeft={timeLeft}
              answersCount={answersCount}
              players={players}
              t={t}
            />
          )}

          {gameState === 'question_result' && currentQuestionIndex >= 0 && selectedQuiz && (
            <HostQuestionResult
              selectedQuiz={selectedQuiz}
              currentQuestionIndex={currentQuestionIndex}
              answerCounts={answerCounts}
              onShowLeaderboard={handleShowLeaderboard}
              t={t}
            />
          )}

          {gameState === 'leaderboard' && selectedQuiz && (
            <HostLeaderboard
              leaderboard={leaderboard}
              selectedQuiz={selectedQuiz}
              currentQuestionIndex={currentQuestionIndex}
              onNextQuestion={handleNextQuestion}
              t={t}
            />
          )}

          {gameState === 'podium' && (
            <HostPodium
              podium={podium}
              selectedQuiz={selectedQuiz}
              showChart={showChart}
              onToggleChart={handleToggleChart}
              onBackToHome={handleBackToHome}
              t={t}
            />
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
    </AuthGuard>
  );
}
