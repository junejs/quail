-- Migration: 0001_init
-- Created at: 2025-03-10
-- Description: Create initial tables for quizzes, game results, and active games

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id BINARY(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  questions JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create game_results table
CREATE TABLE IF NOT EXISTS game_results (
  id BINARY(36) PRIMARY KEY DEFAULT (UUID()),
  quiz_id BINARY(36) NOT NULL,
  quiz_title VARCHAR(255) NOT NULL,
  pin VARCHAR(10) NOT NULL,
  standings JSON NOT NULL,
  played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_game_results_played_at (played_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create active_games table
CREATE TABLE IF NOT EXISTS active_games (
  pin VARCHAR(10) PRIMARY KEY,
  host_id VARCHAR(255) NOT NULL,
  host_session_id VARCHAR(255) NOT NULL,
  quiz_id BINARY(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_active_games_heartbeat (last_heartbeat),
  INDEX idx_active_games_host (host_session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
