'use client';

import { motion } from 'motion/react';

type PlayPodiumProps = {
  finalRank: number | null;
  score: number;
  avatar: string | null;
  onPlayAgain: () => void;
  t: (key: string) => string;
};

export default function PlayPodium({
  finalRank,
  score,
  avatar,
  onPlayAgain,
  t
}: PlayPodiumProps) {
  return (
    <motion.div
      key="podium-result"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 flex flex-col items-center justify-center p-8 text-center"
    >
      <div className="bg-white/10 backdrop-blur-xl p-12 rounded-[3.5rem] border border-white/20 shadow-2xl w-full max-w-md relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/30 blur-3xl rounded-full pointer-events-none" />

        <h1 className="text-5xl font-black text-white mb-4 uppercase tracking-tighter">{t('play.gameOver')}</h1>

        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="text-9xl mb-8 drop-shadow-2xl"
        >
          {avatar}
        </motion.div>

        <div className="bg-white text-indigo-900 px-12 py-10 rounded-[2.5rem] shadow-2xl my-8 transform hover:scale-105 transition-transform">
          <p className="text-sm font-black uppercase tracking-[0.3em] opacity-40 mb-2">{t('play.finalRank')}</p>
          <p className="text-9xl font-black leading-none">
            {finalRank}
            <span className="text-4xl align-top ml-1">
              {finalRank === 1 ? t('play.rank.st') : finalRank === 2 ? t('play.rank.nd') : finalRank === 3 ? t('play.rank.rd') : t('play.rank.th')}
            </span>
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 px-10 py-6 rounded-3xl mb-10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">{t('play.finalScore')}</p>
          <p className="text-5xl font-black text-white">{score}</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPlayAgain}
          className="w-full bg-indigo-600 text-white px-10 py-6 rounded-2xl font-black text-2xl shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:bg-indigo-500 transition-all uppercase tracking-widest"
        >
          {t('play.playAgain')}
        </motion.button>
      </div>
    </motion.div>
  );
}
