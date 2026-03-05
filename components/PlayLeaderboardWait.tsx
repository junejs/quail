import { motion } from 'motion/react';

type PlayLeaderboardWaitProps = {
  score: number;
  avatar: string | null;
  t: (key: string) => string;
};

export default function PlayLeaderboardWait({ score, avatar, t }: PlayLeaderboardWaitProps) {
  return (
    <motion.div
      key="leaderboard-wait"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 flex flex-col items-center justify-center p-8 text-center"
    >
      <div className="bg-white/10 backdrop-blur-xl p-12 rounded-[3rem] border border-white/20 shadow-2xl w-full max-w-sm">
        <h1 className="text-4xl font-black text-white mb-8">
          {score > 0 ? t('play.climbing') : t('play.readyForNext')}
        </h1>
        <div className="text-8xl mb-10 drop-shadow-2xl animate-bounce">{avatar}</div>
        <div className="bg-white/5 border border-white/10 px-10 py-6 rounded-3xl mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">{t('play.currentScore')}</p>
          <p className="text-5xl font-black text-white">{score}</p>
        </div>
        <p className="text-xs font-black uppercase tracking-[0.4em] text-indigo-400 animate-pulse">{t('play.lookAtBigScreen')}</p>
      </div>
    </motion.div>
  );
}
