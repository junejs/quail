import { motion } from 'motion/react';

type AnswerResult = {
  isCorrect: boolean;
  score: number;
  streak: number;
  pointsEarned?: number;
  lastPointsEarned?: number;
};

type PlayAnswerResultProps = {
  answerResult: AnswerResult;
  avatar: string | null;
  t: (key: string) => string;
};

export default function PlayAnswerResult({ answerResult, avatar, t }: PlayAnswerResultProps) {
  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      className={`flex-1 flex flex-col items-center justify-center p-8 text-center text-white relative ${answerResult.isCorrect ? 'bg-emerald-600' : 'bg-rose-600'}`}
    >
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
        {answerResult.isCorrect ? t('play.correctFeedback') : t('play.incorrectFeedback')}
      </motion.h1>

      <motion.div
        animate={{ rotate: answerResult.isCorrect ? [0, 10, -10, 0] : [0, -5, 5, 0] }}
        transition={{ duration: 0.5 }}
        className="text-9xl mb-10 drop-shadow-2xl"
      >
        {avatar}
      </motion.div>

      <div className="bg-black/30 backdrop-blur-md border border-white/10 px-10 py-6 rounded-[2.5rem] mb-6 w-full max-w-xs shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.3em] opacity-50 mb-2">{t('play.totalScore')}</p>
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
              <span>🔥</span> {answerResult.streak} {t('play.streakFeedback')}
            </motion.div>
          )}
        </motion.div>
      )}

      {!answerResult.isCorrect && (
        <p className="text-2xl font-black mt-8 opacity-60 uppercase tracking-widest">
          {t('play.keepGoing')}
        </p>
      )}
    </motion.div>
  );
}
