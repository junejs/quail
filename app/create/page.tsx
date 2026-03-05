'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '@/lib/store';
import { useTranslation } from '@/lib/translations';
import { Plus, Trash2, Save, ArrowLeft, CheckCircle2 } from 'lucide-react';
import AuthGuard from '@/components/auth-guard';

export default function CreateQuizPage() {
  const router = useRouter();
  const { addQuiz } = useGameStore();
  const { t } = useTranslation();

  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<any[]>([
    {
      id: 1,
      text: '',
      type: 'single',
      timeLimit: 20,
      options: [
        { id: 0, text: '', color: 'bg-red-500', shape: 'triangle' },
        { id: 1, text: '', color: 'bg-blue-500', shape: 'diamond' },
        { id: 2, text: '', color: 'bg-yellow-500', shape: 'circle' },
        { id: 3, text: '', color: 'bg-green-500', shape: 'square' },
      ],
      correctAnswerIndexes: [0],
      explanation: '',
    },
  ]);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now(),
        text: '',
        type: 'single',
        timeLimit: 20,
        options: [
          { id: 0, text: '', color: 'bg-red-500', shape: 'triangle' },
          { id: 1, text: '', color: 'bg-blue-500', shape: 'diamond' },
          { id: 2, text: '', color: 'bg-yellow-500', shape: 'circle' },
          { id: 3, text: '', color: 'bg-green-500', shape: 'square' },
        ],
        correctAnswerIndexes: [0],
        explanation: '',
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length === 1) return;
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];

    if (field === 'type') {
      if (value === 'true_false') {
        newQuestions[index].options = [
          { id: 0, text: 'True', color: 'bg-blue-500', shape: 'diamond' },
          { id: 1, text: 'False', color: 'bg-red-500', shape: 'triangle' },
        ];
        newQuestions[index].correctAnswerIndexes = [0];
      } else if (value === 'single' || value === 'multiple') {
        newQuestions[index].options = [
          { id: 0, text: '', color: 'bg-red-500', shape: 'triangle' },
          { id: 1, text: '', color: 'bg-blue-500', shape: 'diamond' },
          { id: 2, text: '', color: 'bg-yellow-500', shape: 'circle' },
          { id: 3, text: '', color: 'bg-green-500', shape: 'square' },
        ];
        newQuestions[index].correctAnswerIndexes = [0];
      }
    }

    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const toggleCorrectAnswer = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    const question = newQuestions[qIndex];

    if (question.type === 'multiple') {
      if (question.correctAnswerIndexes.includes(oIndex)) {
        if (question.correctAnswerIndexes.length > 1) {
          question.correctAnswerIndexes = question.correctAnswerIndexes.filter((i: number) => i !== oIndex);
        }
      } else {
        question.correctAnswerIndexes = [...question.correctAnswerIndexes, oIndex];
      }
    } else {
      question.correctAnswerIndexes = [oIndex];
    }

    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex].text = value;
    setQuestions(newQuestions);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert(t('create.quizTitle') + ' ' + t('common.required'));
      return;
    }
    if (questions.some(q => !q.text.trim() || q.options.some((o: any) => !o.text.trim()))) {
      alert(t('create.fillAll'));
      return;
    }

    const newQuiz = {
      id: Date.now().toString(),
      title,
      questions,
    };

    await addQuiz(newQuiz);
    router.push('/');
  };

  return (
    <AuthGuard>
      <div className="min-h-screen p-4 md:p-8 font-sans relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-12">
            <motion.button
              whileHover={{ x: -5 }}
              onClick={() => router.push('/')}
              className="flex items-center gap-3 text-white/50 hover:text-white font-black uppercase tracking-widest text-sm transition-all"
            >
              <ArrowLeft size={20} />
              {t('common.back')}
            </motion.button>
            <h1 className="text-4xl font-black text-white tracking-tighter drop-shadow-2xl">{t('create.createQuiz')}</h1>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              className="flex items-center gap-3 bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black hover:bg-indigo-50 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] uppercase tracking-widest text-sm"
            >
              <Save size={20} />
              {t('create.saveQuiz')}
            </motion.button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl mb-12 border border-white/20"
          >
            <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-3">{t('create.quizTitle')}</label>
            <input
              type="text"
              placeholder={t('create.titlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-4xl font-black p-6 bg-white/5 border-2 border-white/10 rounded-3xl focus:border-white focus:bg-white/10 text-white placeholder:text-white/20 outline-none transition-all"
            />
          </motion.div>

          <div className="space-y-12">
            <AnimatePresence mode="popLayout">
              {questions.map((q, qIndex) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={q.id}
                  className="bg-white/5 backdrop-blur-lg p-10 rounded-[3rem] shadow-xl border border-white/10 relative group hover:bg-white/[0.07] transition-colors"
                >
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleRemoveQuestion(qIndex)}
                    className="absolute -top-4 -right-4 bg-rose-500 text-white p-3 rounded-2xl shadow-xl opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={20} />
                  </motion.button>

                  <div className="flex flex-wrap justify-between items-center gap-6 mb-10">
                    <div className="flex items-center gap-6">
                      <span className="bg-white/10 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-white/10">{t('host.question')} {qIndex + 1}</span>
                      <select
                        value={q.type}
                        onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 font-black text-sm text-white outline-none focus:border-white/30 transition-all cursor-pointer"
                      >
                        <option value="single" className="bg-zinc-900">{t('create.singleChoice')}</option>
                        <option value="true_false" className="bg-zinc-900">{t('create.trueFalse')}</option>
                        <option value="multiple" className="bg-zinc-900">{t('create.multipleChoice')}</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">{t('host.timeRemaining')}:</label>
                      <select
                        value={q.timeLimit}
                        onChange={(e) => handleQuestionChange(qIndex, 'timeLimit', parseInt(e.target.value))}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 font-black text-sm text-white outline-none focus:border-white/30 transition-all cursor-pointer"
                      >
                        <option value={5} className="bg-zinc-900">5s</option>
                        <option value={10} className="bg-zinc-900">10s</option>
                        <option value={20} className="bg-zinc-900">20s</option>
                        <option value={30} className="bg-zinc-900">30s</option>
                        <option value={60} className="bg-zinc-900">60s</option>
                      </select>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder={t('create.questionPlaceholder')}
                    value={q.text}
                    onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                    className="w-full text-3xl font-black p-8 bg-white/5 border-2 border-white/10 rounded-[2rem] focus:border-white focus:bg-white/10 text-white placeholder:text-white/10 outline-none transition-all mb-10 text-center"
                  />

                  <div className={`grid gap-6 ${q.type === 'true_false' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
                    {q.options.map((opt: any, oIndex: number) => (
                      <div key={opt.id} className="relative flex items-center group/opt">
                        <div className={`absolute left-5 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${opt.color} group-hover/opt:scale-110 transition-transform`}>
                          {opt.shape === 'triangle' && <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[14px] border-l-transparent border-r-transparent border-b-white" />}
                          {opt.shape === 'diamond' && <div className="w-6 h-6 bg-white rotate-45" />}
                          {opt.shape === 'circle' && <div className="w-7 h-7 bg-white rounded-full" />}
                          {opt.shape === 'square' && <div className="w-7 h-7 bg-white" />}
                        </div>
                        <input
                          type="text"
                          placeholder={`${t('create.optionPlaceholder')} ${oIndex + 1}`}
                          value={opt.text}
                          readOnly={q.type === 'true_false'}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                          className={`w-full pl-20 pr-16 py-6 bg-white/5 border-2 border-white/10 rounded-2xl focus:border-white focus:bg-white/10 text-white placeholder:text-white/10 outline-none transition-all font-black text-xl ${q.type === 'true_false' ? 'cursor-default' : ''} ${q.correctAnswerIndexes.includes(oIndex) ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}
                        />
                        <motion.button
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.8 }}
                          onClick={() => toggleCorrectAnswer(qIndex, oIndex)}
                          className={`absolute right-5 p-2 rounded-full transition-all ${q.correctAnswerIndexes.includes(oIndex) ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'text-white/10 hover:text-white/30'}`}
                        >
                          <CheckCircle2 size={32} fill={q.correctAnswerIndexes.includes(oIndex) ? 'currentColor' : 'none'} />
                        </motion.button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10">
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-3">{t('create.answerOptions')} {t('create.optional')}</label>
                    <textarea
                      placeholder={t('create.explanationPlaceholder')}
                      value={q.explanation || ''}
                      onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                      className="w-full p-6 bg-white/5 border-2 border-white/10 rounded-2xl focus:border-white focus:bg-white/10 text-white placeholder:text-white/10 outline-none transition-all font-bold text-lg min-h-[120px] resize-none"
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddQuestion}
            className="w-full mt-12 border-4 border-dashed border-white/10 p-12 rounded-[3rem] text-white/20 hover:text-white hover:border-white/30 transition-all flex flex-col items-center gap-4 group"
          >
            <div className="bg-white/5 p-5 rounded-full group-hover:bg-white/10 transition-colors border border-white/10">
              <Plus size={40} />
            </div>
            <span className="text-2xl font-black uppercase tracking-widest">{t('create.addQuestion')}</span>
          </motion.button>
        </div>
      </div>
    </AuthGuard>
  );
}
