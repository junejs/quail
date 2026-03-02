import { create } from 'zustand';

export interface Question {
  id: number;
  text: string;
  type: 'single' | 'true_false' | 'multiple';
  timeLimit: number;
  options: { id: number; text: string; color: string; shape: string }[];
  correctAnswerIndexes: number[]; // Changed from correctAnswerIndex to support multiple
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
}

interface GameState {
  pin: string | null;
  nickname: string | null;
  avatar: string | null;
  isHost: boolean;
  gameState: 'idle' | 'lobby' | 'question' | 'question_result' | 'leaderboard' | 'podium';
  players: any[];
  currentQuestion: any | null;
  score: number;
  streak: number;
  quizzes: Quiz[];
  selectedQuiz: Quiz | null;
  setPin: (pin: string | null) => void;
  setNickname: (nickname: string | null) => void;
  setAvatar: (avatar: string | null) => void;
  setIsHost: (isHost: boolean) => void;
  setGameState: (state: 'idle' | 'lobby' | 'question' | 'question_result' | 'leaderboard' | 'podium') => void;
  setPlayers: (players: any[]) => void;
  setCurrentQuestion: (question: any | null) => void;
  setScore: (score: number) => void;
  setStreak: (streak: number) => void;
  addQuiz: (quiz: Quiz) => Promise<void>;
  fetchQuizzes: () => Promise<void>;
  setSelectedQuiz: (quiz: Quiz | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
  pin: null,
  nickname: null,
  avatar: null,
  isHost: false,
  gameState: 'idle',
  players: [],
  currentQuestion: null,
  score: 0,
  streak: 0,
  quizzes: [],
  selectedQuiz: null,
  setPin: (pin) => set({ pin }),
  setNickname: (nickname) => set({ nickname }),
  setAvatar: (avatar) => set({ avatar }),
  setIsHost: (isHost) => set({ isHost }),
  setGameState: (gameState) => set({ gameState }),
  setPlayers: (players) => set({ players }),
  setCurrentQuestion: (currentQuestion) => set({ currentQuestion }),
  setScore: (score) => set({ score }),
  setStreak: (streak) => set({ streak }),
  addQuiz: async (quiz) => {
    try {
      await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quiz),
      });
      set((state) => ({ quizzes: [...state.quizzes, quiz] }));
    } catch (err) {
      console.error('Failed to save quiz:', err);
    }
  },
  fetchQuizzes: async () => {
    try {
      const res = await fetch('/api/quizzes');
      const quizzes = await res.json();
      set({ quizzes });
    } catch (err) {
      console.error('Failed to fetch quizzes:', err);
    }
  },
  setSelectedQuiz: (selectedQuiz) => set({ selectedQuiz }),
}));
