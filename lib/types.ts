// ============================================================================
// Shared Type Definitions
// ============================================================================

export interface Question {
  id: number;
  text: string;
  type: 'single' | 'true_false' | 'multiple';
  timeLimit: number;
  options: { id: number; text: string; color: string; shape: string }[];
  correctAnswerIndexes: number[];
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
}

export interface Player {
  id: string;
  sessionId: string;
  nickname: string;
  avatar: string;
  score: number;
  streak: number;
  scoreHistory: number[];
  hasAnswered: boolean;
  lastAnswerCorrect: boolean;
  totalResponseTime: number;
  lastPointsEarned?: number;
  lastSpeedBonus?: number;
  lastStreakBonus?: number;
  isDisconnected: boolean;
}

export interface GameResult {
  id: string;
  quizId: string;
  quizTitle: string;
  pin: string;
  standings: Player[];
  playedAt: Date;
}

export interface ActiveGame {
  pin: string;
  hostId: string;
  hostSessionId: string;
  quizId: string;
  createdAt: Date;
  lastHeartbeat: Date;
}

export type GameState = 'idle' | 'lobby' | 'question' | 'question_result' | 'leaderboard' | 'podium';
