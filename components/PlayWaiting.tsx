import { motion } from 'motion/react';

type PlayWaitingProps = {
  t: (key: string) => string;
};

export default function PlayWaiting({ t }: PlayWaitingProps) {
  return (
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
      <h1 className="text-4xl font-black text-white mb-2">{t('play.waiting')}</h1>
      <p className="text-white/40 font-bold uppercase tracking-widest text-xs">{t('play.tensionBuilding')}</p>
    </motion.div>
  );
}
