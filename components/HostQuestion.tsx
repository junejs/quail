import { motion } from 'motion/react';
import { Quiz } from '@/lib/store';
import { Pause, Play } from 'lucide-react';

type HostQuestionProps = {
  selectedQuiz: Quiz;
  currentQuestionIndex: number;
  timeLeft: number;
  answersCount: number;
  players: any[];
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  t: (key: string) => string;
};

export default function HostQuestion({
  selectedQuiz,
  currentQuestionIndex,
  timeLeft,
  answersCount,
  players,
  isPaused,
  onPause,
  onResume,
  t
}: HostQuestionProps) {
  const question = selectedQuiz.questions[currentQuestionIndex];

  return (
    <motion.div
      key="question"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 flex flex-col p-12"
    >
      <div className="bg-white/10 backdrop-blur-xl rounded-[3rem] p-16 border border-white/20 shadow-2xl text-center mb-12 relative overflow-hidden">
        {/* Decorative inner glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none" />

        <h1 className="text-6xl font-black text-white relative z-10 leading-tight">
          {question.text}
        </h1>
        {question.type === 'multiple' && (
          <div className="mt-6 text-indigo-400 font-black uppercase tracking-[0.4em] text-sm">
            {t('host.multipleChoiceSelectAll')}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-12 px-8">
        <motion.div
          animate={{
            scale: timeLeft <= 5 ? [1, 1.15, 1] : 1,
            borderColor: timeLeft <= 5 ? ['rgba(255,255,255,0.2)', '#ef4444', 'rgba(255,255,255,0.2)'] : 'rgba(255,255,255,0.2)'
          }}
          transition={{ duration: 0.5, repeat: timeLeft <= 5 ? Infinity : 0 }}
          className="w-40 h-40 rounded-full bg-white/5 backdrop-blur-md border-8 border-white/10 flex items-center justify-center text-7xl font-black text-white shadow-2xl relative"
        >
          {isPaused && (
            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Pause size={48} className="text-white" fill="currentColor" />
            </div>
          )}
          {!isPaused && timeLeft}
        </motion.div>
        <div className="flex items-center gap-6">
          <button
            onClick={isPaused ? onResume : onPause}
            className="p-6 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 transition-all shadow-xl"
            title={isPaused ? t('host.resume') : t('host.pause')}
          >
            {isPaused ? <Play size={32} fill="currentColor" /> : <Pause size={32} fill="currentColor" />}
          </button>
          <div className="text-4xl font-black text-white/40 bg-white/5 backdrop-blur-md px-12 py-6 rounded-[2rem] border border-white/10 shadow-xl">
            {t('host.answers')}: <span className="text-white">{answersCount}</span> <span className="text-white/20">/</span> {players.length}
          </div>
        </div>
      </div>

      <div className={`grid gap-8 flex-1 ${question.type === 'true_false' ? 'grid-cols-2' : 'grid-cols-2'}`}>
        {question.options.map((opt: any) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            key={opt.id}
            className={`${opt.color} rounded-[2.5rem] shadow-2xl flex items-center p-10 text-white relative overflow-hidden group border-4 border-transparent`}
          >
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mr-8 group-hover:scale-110 transition-transform shadow-lg">
              {opt.shape === 'triangle' && <div className="w-0 h-0 border-l-[24px] border-r-[24px] border-b-[42px] border-l-transparent border-r-transparent border-b-white drop-shadow-md" />}
              {opt.shape === 'diamond' && <div className="w-12 h-12 bg-white rotate-45 shadow-md" />}
              {opt.shape === 'circle' && <div className="w-14 h-14 bg-white rounded-full shadow-md" />}
              {opt.shape === 'square' && <div className="w-14 h-14 bg-white shadow-md" />}
            </div>
            <span className="text-5xl font-black tracking-tight">{opt.text}</span>
            {/* Decorative inner glow */}
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
