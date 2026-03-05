import { AnimatePresence, motion } from 'motion/react';

type PlayAudioBlockedIndicatorProps = {
  isAudioBlocked: boolean;
  t: (key: string) => string;
};

export default function PlayAudioBlockedIndicator({ isAudioBlocked, t }: PlayAudioBlockedIndicatorProps) {
  return (
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
            <span className="text-white font-black text-xs uppercase tracking-widest">{t('play.clickToEnableSound')}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
