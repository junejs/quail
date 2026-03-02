'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '@/lib/store';
import { Plus, Trash2, Save, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function CreateQuizPage() {
  const router = useRouter();
  const { addQuiz } = useGameStore();

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

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a quiz title');
      return;
    }
    if (questions.some(q => !q.text.trim() || q.options.some((o: any) => !o.text.trim()))) {
      alert('Please fill in all questions and options');
      return;
    }

    const newQuiz = {
      id: Date.now().toString(),
      title,
      questions,
    };

    addQuiz(newQuiz);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 font-bold transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="text-3xl font-black text-zinc-800 tracking-tight">Create New Quiz</h1>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg"
          >
            <Save size={20} />
            Save Quiz
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm mb-8 border border-zinc-200">
          <label className="block text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Quiz Title</label>
          <input 
            type="text" 
            placeholder="Enter quiz title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-2xl font-bold p-4 bg-zinc-50 border-2 border-zinc-100 rounded-xl focus:border-indigo-500 focus:bg-white outline-none transition-all"
          />
        </div>

        <div className="space-y-8">
          {questions.map((q, qIndex) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={q.id} 
              className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 relative group"
            >
              <button 
                onClick={() => handleRemoveQuestion(qIndex)}
                className="absolute -top-3 -right-3 bg-red-100 text-red-600 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
              >
                <Trash2 size={18} />
              </button>

              <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <span className="bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-sm font-bold">Question {qIndex + 1}</span>
                  <select 
                    value={q.type}
                    onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)}
                    className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1 font-bold text-zinc-700 outline-none"
                  >
                    <option value="single">Single Choice</option>
                    <option value="true_false">True/False</option>
                    <option value="multiple">Multiple Choice</option>
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-bold text-zinc-500">Time Limit:</label>
                  <select 
                    value={q.timeLimit}
                    onChange={(e) => handleQuestionChange(qIndex, 'timeLimit', parseInt(e.target.value))}
                    className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1 font-bold text-zinc-700 outline-none"
                  >
                    <option value={5}>5s</option>
                    <option value={10}>10s</option>
                    <option value={20}>20s</option>
                    <option value={30}>30s</option>
                    <option value={60}>60s</option>
                  </select>
                </div>
              </div>

              <input 
                type="text" 
                placeholder="Start typing your question..."
                value={q.text}
                onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                className="w-full text-xl font-bold p-4 bg-zinc-50 border-2 border-zinc-100 rounded-xl focus:border-indigo-500 focus:bg-white outline-none transition-all mb-8 text-center"
              />

              <div className={`grid gap-4 ${q.type === 'true_false' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
                {q.options.map((opt: any, oIndex: number) => (
                  <div key={opt.id} className="relative flex items-center">
                    <div className={`absolute left-4 w-8 h-8 rounded-lg flex items-center justify-center ${opt.color}`}>
                      {opt.shape === 'triangle' && <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-white" />}
                      {opt.shape === 'diamond' && <div className="w-4 h-4 bg-white rotate-45" />}
                      {opt.shape === 'circle' && <div className="w-5 h-5 bg-white rounded-full" />}
                      {opt.shape === 'square' && <div className="w-5 h-5 bg-white" />}
                    </div>
                    <input 
                      type="text" 
                      placeholder={`Option ${oIndex + 1}`}
                      value={opt.text}
                      readOnly={q.type === 'true_false'}
                      onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                      className={`w-full pl-16 pr-12 py-4 bg-zinc-50 border-2 border-zinc-100 rounded-xl focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold ${q.type === 'true_false' ? 'cursor-default' : ''}`}
                    />
                    <button 
                      onClick={() => toggleCorrectAnswer(qIndex, oIndex)}
                      className={`absolute right-4 p-1 rounded-full transition-colors ${q.correctAnswerIndexes.includes(oIndex) ? 'text-green-500' : 'text-zinc-300 hover:text-zinc-400'}`}
                    >
                      <CheckCircle2 size={24} fill={q.correctAnswerIndexes.includes(oIndex) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <button 
          onClick={handleAddQuestion}
          className="w-full mt-8 border-4 border-dashed border-zinc-200 p-8 rounded-3xl text-zinc-400 hover:text-indigo-500 hover:border-indigo-200 hover:bg-indigo-50 transition-all flex flex-col items-center gap-2 group"
        >
          <div className="bg-zinc-100 p-3 rounded-full group-hover:bg-indigo-100 transition-colors">
            <Plus size={32} />
          </div>
          <span className="text-xl font-black">Add Question</span>
        </button>
      </div>
    </div>
  );
}
