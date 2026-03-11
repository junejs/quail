import { AnimatePresence, motion } from 'motion/react';
import { memo } from 'react';
import { Quiz } from '@/lib/store';
import type { Player } from '@/lib/types';
import { PodiumStand } from './HostPodium/PodiumStand';
import { PerformanceChart } from './HostPodium/PerformanceChart';

type HostPodiumProps = {
  podium: Player[];
  selectedQuiz: Quiz | null;
  showChart: boolean;
  onToggleChart: () => void;
  onBackToHome: () => void;
  t: (key: string) => string;
};

// Memoized runner-up card component
const RunnerUpCard = memo(({ player, rank }: { player: Player; rank: number }) => (
  <div className="flex items-center gap-4 bg-white/5 px-6 py-4 rounded-2xl border border-white/5 flex-1 max-w-xs">
    <span className="text-3xl">{player.avatar}</span>
    <div className="flex-1 min-w-0">
      <p className="text-white font-black truncate">{player.nickname}</p>
      <p className="text-white/40 text-xs font-bold">{player.score} pts</p>
    </div>
    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-black text-white/60">
      {rank}
    </div>
  </div>
));

RunnerUpCard.displayName = 'RunnerUpCard';

export default function HostPodium({
  podium,
  selectedQuiz,
  showChart,
  onToggleChart,
  onBackToHome,
  t
}: HostPodiumProps) {
  return (
    <motion.div
      key="podium"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col items-center justify-start pt-32 pb-32 overflow-y-auto custom-scrollbar"
    >
      <h1 className="text-6xl font-black text-white mb-32 uppercase tracking-tighter drop-shadow-2xl">
        {selectedQuiz?.title || t('host.podium')}
      </h1>

      <div className="w-full max-w-7xl flex flex-col items-center gap-16 px-12 transition-all duration-500">
        <div className="flex flex-col lg:flex-row items-center lg:items-end gap-12 w-full justify-center">
          <PodiumStand podium={podium} />
          <PerformanceChart podium={podium} showChart={showChart} t={t} />
        </div>

        {/* Runners-up */}
        <AnimatePresence>
          {(podium[3] || podium[4]) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 2 }}
              className="w-full max-w-3xl bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-8 shadow-xl"
            >
              <h3 className="text-center text-[10px] font-black text-white/30 uppercase tracking-[0.5em] mb-6">
                {t('host.runnersUp')}
              </h3>
              <div className="flex flex-col sm:flex-row justify-center gap-8">
                {podium[3] && <RunnerUpCard player={podium[3]} rank={4} />}
                {podium[4] && <RunnerUpCard player={podium[4]} rank={5} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-6 mt-24">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleChart}
          className={`bg-white/10 backdrop-blur-md border border-white/20 text-white px-12 py-5 rounded-2xl font-black text-xl transition-all uppercase tracking-[0.2em] ${
            showChart ? 'bg-indigo-600/40 border-indigo-500/50' : 'hover:bg-white/20'
          }`}
        >
          {showChart ? t('host.hideStats') : t('host.showStats')}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBackToHome}
          className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-12 py-5 rounded-2xl font-black text-xl hover:bg-white/20 transition-all uppercase tracking-[0.2em]"
        >
          {t('host.backToHome')}
        </motion.button>
      </div>
    </motion.div>
  );
}
