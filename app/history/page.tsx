'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { useGameStore } from '@/lib/store';
import { ArrowLeft, Trophy, Calendar, Hash, Users, ChevronRight, ChevronDown } from 'lucide-react';
import AuthGuard from '@/components/auth-guard';

export default function HistoryPage() {
  const router = useRouter();
  const { gameResults, fetchResults } = useGameStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-50 p-4 md:p-8 font-sans">
        <div className="max-w-4xl mx-auto">
          <header className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors font-bold"
            >
              <ArrowLeft size={20} />
              Back to Home
            </button>
            <h1 className="text-3xl font-black tracking-tighter text-zinc-900">
              Match History
            </h1>
          </header>

          {gameResults.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-zinc-100">
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="text-zinc-300" size={32} />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 mb-2">No games played yet</h2>
              <p className="text-zinc-500">Host a game and finish it to see results here!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {gameResults.map((result) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedId(expandedId === result.id ? null : result.id)}
                    className="w-full text-left p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-zinc-900 mb-1">{result.quiz_title}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-zinc-500 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          {formatDate(result.played_at)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Hash size={14} />
                          PIN: {result.pin}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users size={14} />
                          {result.standings.length} Players
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden md:block">
                        <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Winner</div>
                        <div className="text-indigo-600 font-black">{result.standings[0]?.nickname || 'N/A'}</div>
                      </div>
                      <div className="p-2 bg-zinc-100 rounded-full text-zinc-400">
                        {expandedId === result.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </div>
                    </div>
                  </button>

                  {expandedId === result.id && (
                    <div className="px-6 pb-6 border-t border-zinc-50 bg-zinc-50/50">
                      <div className="pt-6 space-y-2">
                        <div className="grid grid-cols-12 px-4 py-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                          <div className="col-span-1">#</div>
                          <div className="col-span-6">Player</div>
                          <div className="col-span-3 text-right">Score</div>
                          <div className="col-span-2 text-right">Streak</div>
                        </div>
                        {result.standings.map((player: any, index: number) => (
                          <div 
                            key={player.id}
                            className={`grid grid-cols-12 items-center px-4 py-3 rounded-xl border ${
                              index === 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-zinc-100'
                            }`}
                          >
                            <div className="col-span-1 font-black text-zinc-400">
                              {index === 0 ? '🏆' : index + 1}
                            </div>
                            <div className="col-span-6 flex items-center gap-2">
                              <span className="text-2xl">{player.avatar}</span>
                              <span className="font-bold text-zinc-900">{player.nickname}</span>
                            </div>
                            <div className="col-span-3 text-right font-black text-zinc-900">
                              {player.score.toLocaleString()}
                            </div>
                            <div className="col-span-2 text-right">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                                🔥 {player.streak}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
