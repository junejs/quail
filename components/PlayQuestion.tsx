import { motion } from 'motion/react';
import { Quiz, Question } from '@/lib/store';
import { Pause } from 'lucide-react';
import { memo } from 'react';

type PlayQuestionProps = {
  selectedQuiz: Quiz;
  currentQuestionIndex: number;
  selectedIndexes: number[];
  onToggleSelection: (index: number) => void;
  onSubmitAnswer: (indexes: number[]) => void;
  isPaused: boolean;
  t: (key: string) => string;
};

// Memoized option button component
const OptionButton = memo((
  { option, index, isSelected, type, onClick }: {
    option: Question['options'][0];
    index: number;
    isSelected: boolean;
    type: Question['type'];
    onClick: () => void;
  }
) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`${option.color} rounded-3xl shadow-xl flex items-center justify-center transition-all relative overflow-hidden group border-4 ${isSelected ? 'border-white scale-95 shadow-[0_0_30px_rgba(255,255,255,0.5)]' : 'border-transparent'}`}
  >
    <div className="flex flex-col items-center gap-2 sm:gap-4">
      <div className="transform group-hover:scale-110 transition-transform">
        {option.shape === 'triangle' && <div className="w-0 h-0 border-l-[32px] border-r-[32px] border-b-[54px] sm:border-l-[40px] sm:border-r-[40px] sm:border-b-[68px] border-l-transparent border-r-transparent border-b-white drop-shadow-lg" />}
        {option.shape === 'diamond' && <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rotate-45 shadow-lg" />}
        {option.shape === 'circle' && <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full shadow-lg" />}
        {option.shape === 'square' && <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white shadow-lg" />}
      </div>
      {type === 'multiple' && isSelected && (
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
));

OptionButton.displayName = 'OptionButton';

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
      className="flex flex-col h-full p-4 gap-4 relative"
    >
      <div className={`flex-1 grid gap-4 overflow-hidden ${question.type === 'true_false' ? 'grid-cols-1 grid-rows-2' : 'grid-cols-2 grid-rows-2'}`}>
        {question.options.map((opt, i) => (
          <OptionButton
            key={opt.id}
            option={opt}
            index={i}
            isSelected={selectedIndexes.includes(i)}
            type={question.type}
            onClick={() => onToggleSelection(i)}
          />
        ))}
      </div>
      {question.type === 'multiple' && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSubmitAnswer(selectedIndexes)}
          disabled={selectedIndexes.length === 0}
          className="flex-none bg-white text-indigo-600 font-black text-2xl sm:text-3xl py-4 sm:py-6 rounded-[2rem] shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50 uppercase tracking-widest"
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
