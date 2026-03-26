'use client';

import { motion } from 'motion/react';
import { Quiz } from '@/lib/store';

type HostQuestionResultProps = {
  selectedQuiz: Quiz;
  currentQuestionIndex: number;
  answerCounts: Record<number, number>;
  onShowLeaderboard: () => void;
  t: (key: string) => string;
};

export default function HostQuestionResult({
  selectedQuiz,
  currentQuestionIndex,
  answerCounts,
  onShowLeaderboard,
  t
}: HostQuestionResultProps) {
  const question = selectedQuiz.questions[currentQuestionIndex];
  const total = Math.max(1, Object.values(answerCounts).reduce((a, b) => a + b, 0));

  return (
    <motion.div
      key="question_result"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen flex flex-col p-12 items-center overflow-hidden"
    >
      <div className="w-full max-w-6xl flex justify-between items-center mb-12 flex-shrink-0">
        <h1 className="text-6xl font-black text-white uppercase tracking-tighter">{t('host.results')}</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onShowLeaderboard}
          className="bg-white text-indigo-900 px-12 py-6 rounded-2xl text-3xl font-black hover:bg-indigo-50 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] uppercase tracking-widest"
        >
          {t('host.showLeaderboard')}
        </motion.button>
      </div>

      <div className="bg-white/10 backdrop-blur-xl rounded-[3rem] p-12 border border-white/20 shadow-2xl text-center mb-12 w-full max-w-6xl flex-shrink-0">
        <h1 className="text-4xl font-black text-white leading-tight">
          {question.text}
        </h1>
      </div>

      <div className="flex items-end justify-center gap-10 h-64 w-full max-w-6xl px-12 flex-shrink-0">
        {question.options.map((opt: any, i: number) => {
          const count = answerCounts[i] || 0;
          const heightPercentage = (count / total) * 100;
          const isCorrect = question.correctAnswerIndexes.includes(i);

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

      <div className="flex-1 w-full max-w-6xl flex items-end pb-8">
        {question.explanation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full bg-white/5 backdrop-blur-md border border-white/10 px-10 py-6 rounded-[2.5rem] shadow-2xl"
          >
            <h3 className="text-indigo-400 font-black uppercase tracking-[0.4em] text-xs mb-3">{t('host.explanation')}</h3>
            <p
              className="text-white leading-relaxed font-bold overflow-hidden"
              style={{
                fontSize: 'clamp(1rem, 1.5vw, 1.5rem)',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {question.explanation}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
