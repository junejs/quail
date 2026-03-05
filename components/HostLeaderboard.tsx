import { AnimatePresence, motion } from 'motion/react';
import { Quiz } from '@/lib/store';

type HostLeaderboardProps = {
  leaderboard: any[];
  selectedQuiz: Quiz;
  currentQuestionIndex: number;
  onNextQuestion: () => void;
  t: (key: string) => string;
};

export default function HostLeaderboard({
  leaderboard,
  selectedQuiz,
  currentQuestionIndex,
  onNextQuestion,
  t
}: HostLeaderboardProps) {
  return (
    <motion.div
      key="leaderboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col p-12 items-center"
    >
      <div className="w-full max-w-5xl flex justify-between items-center mb-16">
        <h1 className="text-6xl font-black text-white uppercase tracking-tighter">{t('host.leaderboard')}</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNextQuestion}
          className="bg-white text-indigo-900 px-12 py-6 rounded-2xl text-3xl font-black hover:bg-indigo-50 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] uppercase tracking-widest"
        >
          {currentQuestionIndex < selectedQuiz.questions.length - 1 ? t('host.nextQuestion') : t('host.viewPodium')}
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
  );
}
