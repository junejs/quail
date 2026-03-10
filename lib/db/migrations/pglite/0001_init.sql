-- Migration: 0001_init
-- Created at: 2025-03-10
-- Description: Create initial tables for quizzes, game results, and active games

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  questions JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create game_results table
CREATE TABLE IF NOT EXISTS game_results (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL,
  quiz_title TEXT NOT NULL,
  pin TEXT NOT NULL,
  standings JSONB NOT NULL,
  played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create active_games table
CREATE TABLE IF NOT EXISTS active_games (
  pin TEXT PRIMARY KEY,
  host_id TEXT NOT NULL,
  host_session_id TEXT NOT NULL,
  quiz_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_active_games_heartbeat ON active_games(last_heartbeat);
CREATE INDEX IF NOT EXISTS idx_active_games_host ON active_games(host_session_id);
CREATE INDEX IF NOT EXISTS idx_game_results_played_at ON game_results(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON quizzes(created_at DESC);
