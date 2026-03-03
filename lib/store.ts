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
  sessionId: string | null;
  isHost: boolean;
  gameState: 'idle' | 'lobby' | 'question' | 'question_result' | 'leaderboard' | 'podium';
  players: any[];
  currentQuestion: any | null;
  score: number;
  streak: number;
  quizzes: Quiz[];
  gameResults: any[];
  selectedQuiz: Quiz | null;
  isAuthenticated: boolean;
  ldapEnabled: boolean;
  setPin: (pin: string | null) => void;
  setNickname: (nickname: string | null) => void;
  setAvatar: (avatar: string | null) => void;
  setSessionId: (id: string | null) => void;
  setIsHost: (isHost: boolean) => void;
  setGameState: (state: 'idle' | 'lobby' | 'question' | 'question_result' | 'leaderboard' | 'podium') => void;
  setPlayers: (players: any[]) => void;
  setCurrentQuestion: (question: any | null) => void;
  setScore: (score: number) => void;
  setStreak: (streak: number) => void;
  addQuiz: (quiz: Quiz) => Promise<void>;
  fetchQuizzes: () => Promise<void>;
  fetchResults: () => Promise<void>;
  setSelectedQuiz: (quiz: Quiz | null) => void;
  checkAuth: () => Promise<boolean>;
  logout: () => Promise<void>;
  resetGame: () => void;
  hydrate: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  pin: null,
  nickname: null,
  avatar: null,
  sessionId: null,
  isHost: false,
  gameState: 'idle',
  players: [],
  currentQuestion: null,
  score: 0,
  streak: 0,
  quizzes: [],
  gameResults: [],
  selectedQuiz: null,
  isAuthenticated: false,
  ldapEnabled: false,
  setPin: (pin) => {
    set({ pin });
    if (typeof window !== 'undefined') localStorage.setItem('quail_pin', pin || '');
  },
  setNickname: (nickname) => {
    set({ nickname });
    if (typeof window !== 'undefined') localStorage.setItem('quail_nickname', nickname || '');
  },
  setAvatar: (avatar) => {
    set({ avatar });
    if (typeof window !== 'undefined') localStorage.setItem('quail_avatar', avatar || '');
  },
  setSessionId: (sessionId) => {
    set({ sessionId });
    if (typeof window !== 'undefined') localStorage.setItem('quail_sessionId', sessionId || '');
  },
  setIsHost: (isHost) => {
    set({ isHost });
    if (typeof window !== 'undefined') localStorage.setItem('quail_isHost', isHost ? 'true' : 'false');
  },
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
  fetchResults: async () => {
    try {
      const res = await fetch('/api/results');
      const gameResults = await res.json();
      set({ gameResults });
    } catch (err) {
      console.error('Failed to fetch results:', err);
    }
  },
  setSelectedQuiz: (selectedQuiz) => set({ selectedQuiz }),
  checkAuth: async () => {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      set({ isAuthenticated: data.authenticated, ldapEnabled: data.ldapEnabled });
      return data.authenticated;
    } catch (err) {
      console.error('Failed to check auth:', err);
      return false;
    }
  },
  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      set({ isAuthenticated: false });
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  },
  resetGame: () => {
    set({
      pin: null,
      nickname: null,
      avatar: null,
      sessionId: null,
      isHost: false,
      gameState: 'idle',
      players: [],
      currentQuestion: null,
      score: 0,
      streak: 0,
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('quail_pin');
      localStorage.removeItem('quail_nickname');
      localStorage.removeItem('quail_avatar');
      localStorage.removeItem('quail_sessionId');
      localStorage.removeItem('quail_isHost');
    }
  },
  hydrate: () => {
    if (typeof window === 'undefined') return;
    const pin = localStorage.getItem('quail_pin');
    const nickname = localStorage.getItem('quail_nickname');
    const avatar = localStorage.getItem('quail_avatar');
    const sessionId = localStorage.getItem('quail_sessionId');
    const isHost = localStorage.getItem('quail_isHost') === 'true';

    if (pin || nickname || sessionId) {
      set({ pin, nickname, avatar, sessionId, isHost });
    }
  }
}));
