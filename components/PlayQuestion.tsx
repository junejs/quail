import { motion } from 'motion/react';
import { Quiz } from '@/lib/store';
import { Pause } from 'lucide-react';

type PlayQuestionProps = {
  selectedQuiz: Quiz;
  currentQuestionIndex: number;
  selectedIndexes: number[];
  onToggleSelection: (index: number) => void;
  onSubmitAnswer: (indexes: number[]) => void;
  isPaused: boolean;
  t: (key: string) => string;
};

export default function PlayQuestion({
  selectedQuiz,
  currentQuestionIndex,
  selectedIndexes,
  onToggleSelection,
  onSubmitAnswer,
  isPaused,
  t
}: PlayQuestionProps) {
  const question = selectedQuiz.questions[currentQuestionIndex];

  return (
    <motion.div
      key="question"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex-1 flex flex-col p-4 gap-4 relative"
    >
      <div className={`flex-1 grid gap-4 ${question.type === 'true_false' ? 'grid-cols-1 grid-rows-2' : 'grid-cols-2 grid-rows-2'}`}>
        {question.options.map((opt: any, i: number) => (
          <motion.button
            key={opt.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToggleSelection(i)}
            className={`${opt.color} rounded-3xl shadow-xl flex items-center justify-center transition-all relative overflow-hidden group border-4 ${selectedIndexes.includes(i) ? 'border-white scale-95 shadow-[0_0_30px_rgba(255,255,255,0.5)]' : 'border-transparent'}`}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="transform group-hover:scale-110 transition-transform">
                {opt.shape === 'triangle' && <div className="w-0 h-0 border-l-[40px] border-r-[40px] border-b-[68px] border-l-transparent border-r-transparent border-b-white drop-shadow-lg" />}
                {opt.shape === 'diamond' && <div className="w-20 h-20 bg-white rotate-45 shadow-lg" />}
                {opt.shape === 'circle' && <div className="w-24 h-24 bg-white rounded-full shadow-lg" />}
                {opt.shape === 'square' && <div className="w-24 h-24 bg-white shadow-lg" />}
              </div>
              {question.type === 'multiple' && selectedIndexes.includes(i) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-6 right-6 bg-white text-indigo-600 rounded-full p-2 shadow-xl"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </div>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        ))}
      </div>
      {question.type === 'multiple' && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSubmitAnswer(selectedIndexes)}
          disabled={selectedIndexes.length === 0}
          className="bg-white text-indigo-600 font-black text-3xl py-8 rounded-[2rem] shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50 uppercase tracking-widest"
        >
          {t('play.submitAnswer')}
        </motion.button>
      )}

      {/* Pause Overlay */}
      {isPaused && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50"
        >
          <Pause size={64} className="text-white mb-4" fill="currentColor" />
          <p className="text-white font-black text-3xl uppercase tracking-widest">{t('host.gamePaused')}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
