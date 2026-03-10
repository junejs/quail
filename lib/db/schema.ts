import { pgTable, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { mysqlTable, varchar, binary, timestamp as mysqlTimestamp, json } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// ============================================================================
// PostgreSQL / PGlite Schema
// ============================================================================

export const pgQuizzes = pgTable('quizzes', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  questions: jsonb('questions').$type<any[]>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pgGameResults = pgTable('game_results', {
  id: text('id').primaryKey(),
  quizId: text('quiz_id').notNull(),
  quizTitle: text('quiz_title').notNull(),
  pin: text('pin').notNull(),
  standings: jsonb('standings').$type<any[]>().notNull(),
  playedAt: timestamp('played_at').defaultNow().notNull(),
});

export const pgActiveGames = pgTable('active_games', {
  pin: text('pin').primaryKey(),
  hostId: text('host_id').notNull(),
  hostSessionId: text('host_session_id').notNull(),
  quizId: text('quiz_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastHeartbeat: timestamp('last_heartbeat').defaultNow().notNull(),
});

// ============================================================================
// MySQL Schema
// ============================================================================

export const mysqlQuizzes = mysqlTable('quizzes', {
  id: binary('id', { length: 36 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  questions: json('questions').$type<any[]>().notNull(),
  createdAt: mysqlTimestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const mysqlGameResults = mysqlTable('game_results', {
  id: binary('id', { length: 36 }).default(sql`(UUID())`).primaryKey(),
  quizId: binary('quiz_id', { length: 36 }).notNull(),
  quizTitle: varchar('quiz_title', { length: 255 }).notNull(),
  pin: varchar('pin', { length: 10 }).notNull(),
  standings: json('standings').$type<any[]>().notNull(),
  playedAt: mysqlTimestamp('played_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const mysqlActiveGames = mysqlTable('active_games', {
  pin: varchar('pin', { length: 10 }).primaryKey(),
  hostId: varchar('host_id', { length: 255 }).notNull(),
  hostSessionId: varchar('host_session_id', { length: 255 }).notNull(),
  quizId: binary('quiz_id', { length: 36 }).notNull(),
  createdAt: mysqlTimestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  lastHeartbeat: mysqlTimestamp('last_heartbeat').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ============================================================================
// Type exports
// ============================================================================

export type Quiz = {
  id: string;
  title: string;
  questions: any[];
  createdAt: Date;
};

export type GameResult = {
  id: string;
  quizId: string;
  quizTitle: string;
  pin: string;
  standings: any[];
  playedAt: Date;
};

export type ActiveGame = {
  pin: string;
  hostId: string;
  hostSessionId: string;
  quizId: string;
  createdAt: Date;
  lastHeartbeat: Date;
};

// Type inference helpers
export type NewQuiz = Omit<Quiz, 'createdAt'>;
export type NewGameResult = Omit<GameResult, 'id' | 'playedAt'>;
export type NewActiveGame = Omit<ActiveGame, 'createdAt' | 'lastHeartbeat'>;
