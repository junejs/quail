'use client';

import { motion } from 'motion/react';
import { memo } from 'react';
import type { Player } from '@/lib/types';

// Memoized rank badge component
const RankBadge = memo(({ rank, color }: { rank: number, color: string }) => (
  <div className="relative w-16 h-16 flex items-center justify-center">
    <svg viewBox="0 0 100 100" className={`absolute inset-0 w-full h-full drop-shadow-lg ${color}`}>
      <path d="M50 5 L95 38 L78 92 L22 92 L5 38 Z" fill="currentColor" />
    </svg>
    <span className="relative z-10 text-2xl font-black text-white">{rank}</span>
  </div>
));

RankBadge.displayName = 'RankBadge';

// Memoized podium player component
const PodiumPlayer = memo((
  { player, rank, height, colors, delay }: {
    player: Player;
    rank: number;
    height: string;
    colors: string;
    delay: number;
  }
) => {
  const getAvatarSize = (rank: number) => {
    if (rank === 1) return 'text-9xl drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]';
    if (rank === 2) return 'text-7xl drop-shadow-2xl';
    return 'text-6xl drop-shadow-2xl';
  };

  const getTopPosition = (rank: number) => {
    if (rank === 1) return '-top-36';
    if (rank === 2) return '-top-28';
    return '-top-24';
  };

  const getAvatarDelay = (rank: number) => {
    if (rank === 1) return 1.5;
    if (rank === 2) return 1.2;
    return 1;
  };

  return (
    <motion.div
      initial={{ height: 0 }}
      animate={{ height }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay }}
      className={`${rank === 1 ? 'w-64 bg-indigo-600/40 border-t-4 border-x-4 border-indigo-400/30 rounded-t-[2.5rem] shadow-[0_0_60px_rgba(99,102,241,0.5)]' : rank === 2 ? 'w-56 bg-indigo-500/20 border-t-2 border-x-2 border-white/20 rounded-t-[2rem]' : 'w-56 bg-indigo-400/10 border-t-2 border-x-2 border-white/10 rounded-t-[1.5rem]'} backdrop-blur-xl flex flex-col items-center justify-start pt-8 relative shadow-2xl`}
    >
      <motion.div
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: getAvatarDelay(rank) }}
        className={`absolute ${getTopPosition(rank)} flex flex-col items-center gap-2`}
      >
        {rank === 1 ? (
          <motion.span
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className={getAvatarSize(rank)}
          >
            {player.avatar}
          </motion.span>
        ) : (
          <span className={getAvatarSize(rank)}>{player.avatar}</span>
        )}
      </motion.div>

      <div className={`mt-4 ${rank === 1 ? 'mb-8' : rank === 2 ? 'mb-6' : 'mb-4'}`}>
        <RankBadge
          rank={rank}
          color={rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-slate-400' : 'text-orange-600'}
        />
      </div>

      <div className="text-center px-4">
        <h2 className={`${rank === 1 ? 'text-3xl w-56 mb-2' : rank === 2 ? 'text-2xl w-48 mb-1' : 'text-xl w-48 mb-1'} font-black text-white truncate mb-1`}>
          {player.nickname}
        </h2>
        <p className={`${rank === 1 ? 'text-yellow-400 font-black text-2xl drop-shadow-lg' : rank === 2 ? 'text-indigo-200/60 font-bold text-lg' : 'text-indigo-200/40 font-bold'}`}>
          {player.score}
        </p>
      </div>
    </motion.div>
  );
});

PodiumPlayer.displayName = 'PodiumPlayer';

interface PodiumStandProps {
  podium: Player[];
}

export const PodiumStand = memo(({ podium }: PodiumStandProps) => {
  return (
    <div className="flex items-end gap-6 h-[35rem] justify-center order-2 lg:order-1">
      {/* 2nd Place */}
      {podium[1] && (
        <PodiumPlayer
          player={podium[1]}
          rank={2}
          height="70%"
          colors="from-indigo-500/20"
          delay={0.5}
        />
      )}

      {/* 1st Place */}
      {podium[0] && (
        <PodiumPlayer
          player={podium[0]}
          rank={1}
          height="100%"
          colors="from-indigo-600/40"
          delay={0.8}
        />
      )}

      {/* 3rd Place */}
      {podium[2] && (
        <PodiumPlayer
          player={podium[2]}
          rank={3}
          height="50%"
          colors="from-indigo-400/10"
          delay={0.2}
        />
      )}
    </div>
  );
});

PodiumStand.displayName = 'PodiumStand';
