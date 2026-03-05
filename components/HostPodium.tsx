import { AnimatePresence, motion } from 'motion/react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Quiz } from '@/lib/store';

type HostPodiumProps = {
  podium: any[];
  selectedQuiz: Quiz | null;
  showChart: boolean;
  onToggleChart: () => void;
  onBackToHome: () => void;
  t: (key: string) => string;
};

const RankBadge = ({ rank, color }: { rank: number, color: string }) => (
  <div className="relative w-16 h-16 flex items-center justify-center">
    <svg viewBox="0 0 100 100" className={`absolute inset-0 w-full h-full drop-shadow-lg ${color}`}>
      <path d="M50 5 L95 38 L78 92 L22 92 L5 38 Z" fill="currentColor" />
    </svg>
    <span className="relative z-10 text-2xl font-black text-white">{rank}</span>
  </div>
);

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
      <h1 className="text-6xl font-black text-white mb-32 uppercase tracking-tighter drop-shadow-2xl">{selectedQuiz?.title || t('host.podium')}</h1>

      <div className={`w-full max-w-7xl flex flex-col items-center gap-16 px-12 transition-all duration-500`}>
        <div className={`flex flex-col lg:flex-row items-center lg:items-end gap-12 w-full justify-center`}>
          <div className="flex items-end gap-6 h-[35rem] justify-center order-2 lg:order-1">
            {/* 2nd Place */}
            {podium[1] && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: '70%' }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.5 }}
                className="w-56 bg-indigo-500/20 backdrop-blur-xl border-t-2 border-x-2 border-white/20 rounded-t-[2rem] flex flex-col items-center justify-start pt-8 relative shadow-2xl"
              >
                <motion.div
                  initial={{ scale: 0, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="absolute -top-28 flex flex-col items-center gap-2"
                >
                  <span className="text-7xl drop-shadow-2xl">{podium[1].avatar}</span>
                </motion.div>

                <div className="mt-4 mb-6">
                  <RankBadge rank={2} color="text-slate-400" />
                </div>

                <div className="text-center px-4">
                  <h2 className="text-2xl font-black text-white truncate w-48 mb-1">{podium[1].nickname}</h2>
                  <p className="text-indigo-200/60 font-bold text-lg">{podium[1].score}</p>
                </div>
              </motion.div>
            )}

            {/* 1st Place */}
            {podium[0] && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: '100%' }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.8 }}
                className="w-64 bg-indigo-600/40 backdrop-blur-xl border-t-4 border-x-4 border-indigo-400/30 rounded-t-[2.5rem] flex flex-col items-center justify-start pt-8 relative shadow-[0_0_60px_rgba(99,102,241,0.5)]"
              >
                <motion.div
                  initial={{ scale: 0, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ delay: 1.5 }}
                  className="absolute -top-36 flex flex-col items-center gap-2"
                >
                  <motion.span
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="text-9xl drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                  >
                    {podium[0].avatar}
                  </motion.span>
                </motion.div>

                <div className="mt-4 mb-8">
                  <RankBadge rank={1} color="text-yellow-500" />
                </div>

                <div className="text-center px-4">
                  <h2 className="text-3xl font-black text-white truncate w-56 mb-2">{podium[0].nickname}</h2>
                  <p className="text-yellow-400 font-black text-2xl drop-shadow-lg">{podium[0].score}</p>
                </div>
              </motion.div>
            )}

            {/* 3rd Place */}
            {podium[2] && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: '50%' }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
                className="w-56 bg-indigo-400/10 backdrop-blur-xl border-t-2 border-x-2 border-white/10 rounded-t-[1.5rem] flex flex-col items-center justify-start pt-8 relative shadow-2xl"
              >
                <motion.div
                  initial={{ scale: 0, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="absolute -top-24 flex flex-col items-center gap-2"
                >
                  <span className="text-6xl drop-shadow-2xl">{podium[2].avatar}</span>
                </motion.div>

                <div className="mt-4 mb-4">
                  <RankBadge rank={3} color="text-orange-600" />
                </div>

                <div className="text-center px-4">
                  <h2 className="text-xl font-black text-white truncate w-48 mb-1">{podium[2].nickname}</h2>
                  <p className="text-indigo-200/40 font-bold">{podium[2].score}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Performance Chart */}
          <AnimatePresence>
            {showChart && (
              <motion.div
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                transition={{ duration: 0.5 }}
                className="bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 shadow-2xl h-[35rem] flex flex-col flex-1 min-w-[30rem] order-1 lg:order-2"
              >
                <h3 className="text-xl font-black text-white/40 uppercase tracking-[0.3em] mb-6">{t('host.performanceOverTime')}</h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={Array.from({ length: (podium[0]?.scoreHistory?.length || 0) }, (_, i) => {
                        const point: any = { name: `Q${i}` };
                        podium.slice(0, 5).forEach(p => {
                          point[p.nickname] = p.scoreHistory[i];
                        });
                        return point;
                      })}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke="rgba(255,255,255,0.3)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="rgba(255,255,255,0.3)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `${val}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(10, 5, 2, 0.8)',
                          borderRadius: '1rem',
                          border: '1px solid rgba(255,255,255,0.1)',
                          backdropFilter: 'blur(10px)',
                          color: '#fff'
                        }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend iconType="circle" />
                      {podium.slice(0, 5).map((p, idx) => (
                        <Line
                          key={p.id}
                          type="monotone"
                          dataKey={p.nickname}
                          stroke={idx === 0 ? '#fbbf24' : idx === 1 ? '#818cf8' : idx === 2 ? '#a5b4fc' : '#6366f1'}
                          strokeWidth={idx === 0 ? 4 : 2}
                          dot={{ r: 4, fill: '#fff', strokeWidth: 2 }}
                          activeDot={{ r: 8, strokeWidth: 0 }}
                          animationDuration={2000}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Runners-up */}
        {(podium[3] || podium[4]) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 }}
            className="w-full max-w-3xl bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-8 shadow-xl"
          >
            <h3 className="text-center text-[10px] font-black text-white/30 uppercase tracking-[0.5em] mb-6">{t('host.runnersUp')}</h3>
            <div className="flex flex-col sm:flex-row justify-center gap-8">
              {[3, 4].map(rankIndex => {
                const p = podium[rankIndex];
                if (!p) return null;
                return (
                  <div key={p.id} className="flex items-center gap-4 bg-white/5 px-6 py-4 rounded-2xl border border-white/5 flex-1 max-w-xs">
                    <span className="text-3xl">{p.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-black truncate">{p.nickname}</p>
                      <p className="text-white/40 text-xs font-bold">{p.score} pts</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-black text-white/60">
                      {rankIndex + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      <div className="flex gap-6 mt-24">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleChart}
          className={`bg-white/10 backdrop-blur-md border border-white/20 text-white px-12 py-5 rounded-2xl font-black text-xl transition-all uppercase tracking-[0.2em] ${showChart ? 'bg-indigo-600/40 border-indigo-500/50' : 'hover:bg-white/20'}`}
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
