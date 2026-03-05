'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'motion/react';
import { useSocket } from '@/components/socket-provider';
import { useGameStore } from '@/lib/store';
import { audioManager } from '@/lib/audio-manager';
import { AVATARS, AVATAR_GROUPS } from '@/lib/constants';
import PlayAnswerResult from '@/components/PlayAnswerResult';
import PlayAudioBlockedIndicator from '@/components/PlayAudioBlockedIndicator';
import PlayLeaderboardWait from '@/components/PlayLeaderboardWait';
import PlayLobby from '@/components/PlayLobby';
import PlayPodium from '@/components/PlayPodium';
import PlayQuestion from '@/components/PlayQuestion';
import PlayWaiting from '@/components/PlayWaiting';
import { useTranslation } from '@/lib/translations';
import { useI18nStore } from '@/lib/i18n';

function useStore<T>(store: { getState: () => T; subscribe: (listener: () => void) => () => void }, selector: (state: T) => any) {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState())
  );
}

export default function PlayPage() {
  const router = useRouter();
  const { socket } = useSocket();
  const { pin, nickname, avatar, setAvatar, isHost, gameState, setGameState, score, setScore, streak, setStreak, selectedQuiz, resetGame } = useGameStore();
  const { t } = useTranslation();
  const locale = useStore(useI18nStore, (state) => state.locale);

  useEffect(() => {
    const { initLocale } = require('@/lib/i18n');
    initLocale();
  }, []);

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

  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [isAudioBlocked, setIsAudioBlocked] = useState(false);
  const [finalRank, setFinalRank] = useState<number | null>(null);

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
    audioManager?.playSfx('join'); // Play join sfx on selection
    setAvatar(newAvatar);
    socket.emit('change_avatar', { pin, avatar: newAvatar });
  };

  const handleShuffleAvatar = () => {
    const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
    handleAvatarChange(randomAvatar);

    const group = AVATAR_GROUPS.find(g => g.avatars.includes(randomAvatar));
    if (group) setActiveGroupId(group.id);
  };

  if (isHost || !selectedQuiz) return null;

  return (
    <div className="min-h-screen flex flex-col font-sans relative overflow-hidden">
      <AnimatePresence mode="wait">
        {gameState === 'lobby' && (
          <PlayLobby
            avatar={avatar}
            nickname={nickname}
            activeGroupId={activeGroupId}
            setActiveGroupId={setActiveGroupId}
            onShuffleAvatar={handleShuffleAvatar}
            onAvatarChange={handleAvatarChange}
            t={t}
          />
        )}

        {gameState === 'question' && !hasAnswered && currentQuestionIndex >= 0 && selectedQuiz && (
          <PlayQuestion
            selectedQuiz={selectedQuiz}
            currentQuestionIndex={currentQuestionIndex}
            selectedIndexes={selectedIndexes}
            onToggleSelection={toggleSelection}
            onSubmitAnswer={handleAnswer}
            t={t}
          />
        )}

        {gameState === 'question' && hasAnswered && !answerResult && (
          <PlayWaiting t={t} />
        )}

        {gameState === 'question' && hasAnswered && answerResult && (
          <PlayAnswerResult answerResult={answerResult} avatar={avatar} t={t} />
        )}

        {gameState === 'leaderboard' && (
          <PlayLeaderboardWait score={score} avatar={avatar} t={t} />
        )}

        {gameState === 'podium' && (
          <PlayPodium
            finalRank={finalRank}
            score={score}
            avatar={avatar}
            onPlayAgain={() => {
              resetGame();
              router.push('/');
            }}
            t={t}
          />
        )}
      </AnimatePresence>
      <PlayAudioBlockedIndicator isAudioBlocked={isAudioBlocked} t={t} />
    </div>
  );
}
