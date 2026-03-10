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
  const topThree = leaderboard.slice(0, 3);
  const restPlayers = leaderboard.slice(3, 10); // Only show ranks 4-10

  const getMedal = (rank: number) => {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return null;
  };

  const getPodiumOrder = (count: number) => {
    if (count === 1) return [0];
    if (count === 2) return [1, 0]; // 2nd left, 1st center
    return [1, 0, 2]; // 2nd left, 1st center, 3rd right
  };

  const getPodiumHeight = (position: 'left' | 'center' | 'right') => {
    if (position === 'center') return 'h-44';
    return 'h-36';
  };

  const getPodiumColors = (rank: number) => {
    if (rank === 0) return 'from-yellow-400/30 to-yellow-600/30 border-yellow-400/40';
    if (rank === 1) return 'from-gray-300/30 to-gray-500/30 border-gray-300/40';
    return 'from-orange-400/30 to-orange-600/30 border-orange-400/40';
  };

  return (
    <motion.div
      key="leaderboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen flex flex-col p-12 items-center overflow-hidden"
    >
      <div className="w-full max-w-6xl flex justify-between items-center mb-6 flex-shrink-0">
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

      {/* Podium for top 3 */}
      {topThree.length > 0 && (
        <div className="flex items-end justify-center gap-4 mb-4 flex-shrink-0 w-full max-w-4xl">
          {getPodiumOrder(topThree.length).map((originalIndex, i) => {
            const player = topThree[originalIndex];
            const position = i === 1 ? 'center' : i === 0 ? 'left' : 'right';
            const height = getPodiumHeight(position);
            const colors = getPodiumColors(originalIndex);

            return (
              <motion.div
                key={player.id}
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.15, type: 'spring', stiffness: 200 }}
                className={`flex flex-col items-center ${position === 'center' ? 'flex-1' : 'flex-1'}`}
              >
                {/* Avatar + Medal */}
                <div className="relative mb-3">
                  <motion.div
                    animate={{ scale: originalIndex === 0 ? [1, 1.1, 1] : 1 }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-6xl relative z-10"
                  >
                    {player.avatar}
                  </motion.div>
                  {originalIndex === 0 && (
                    <motion.div
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 + i * 0.15 }}
                      className="absolute -top-5 left-1/2 -translate-x-1/2 text-3xl z-20"
                    >
                      👑
                    </motion.div>
                  )}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.15, type: 'spring' }}
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-2xl z-20"
                  >
                    {getMedal(originalIndex)}
                  </motion.div>
                </div>

                {/* Podium Base */}
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.2 + i * 0.15, type: 'spring' }}
                  className={`w-full ${height} bg-gradient-to-t ${colors} backdrop-blur-xl rounded-t-[2rem] border-2 shadow-2xl flex flex-col items-center justify-start pt-4 relative`}
                  style={{ transformOrigin: 'bottom' }}
                >
                  <span className="text-2xl font-black text-white/90 mb-1">{player.nickname}</span>
                  <span className="text-3xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">{player.score}</span>
                  {player.streak >= 3 && (
                    <motion.span
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute bottom-3 text-sm bg-orange-500/30 px-2 py-1 rounded-lg border border-orange-500/40 text-orange-300 font-black"
                    >
                      🔥 {player.streak}
                    </motion.span>
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Rest of players list (4-10) */}
      <div className="flex-1 w-full max-w-3xl flex flex-col justify-center py-4">
        {restPlayers.length > 0 ? (
          <div className="h-full grid grid-rows-7 gap-2">
            <AnimatePresence mode="popLayout">
              {restPlayers.map((p, index) => {
                const actualRank = index + 4;
                return (
                  <motion.div
                    layout
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 30, opacity: 0 }}
                    transition={{ delay: index * 0.03 }}
                    key={p.id}
                    className="bg-white/10 backdrop-blur-md px-4 rounded-2xl border border-white/10 shadow-lg flex justify-between items-center hover:bg-white/15 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <span className="text-xl font-black text-white/30 w-7 flex-shrink-0">{actualRank}</span>
                      <span className="text-2xl flex-shrink-0">{p.avatar}</span>
                      <span className="text-lg font-black text-white truncate">{p.nickname}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {p.streak >= 3 && (
                        <span className="text-sm bg-orange-500/20 px-2 py-1 rounded-lg border border-orange-500/30 text-orange-400 font-black">
                          🔥 {p.streak}
                        </span>
                      )}
                      <span className="text-xl font-black text-white">{p.score}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center justify-center text-white/30 text-2xl font-black">
            No more players
          </div>
        )}
      </div>
    </motion.div>
  );
}
