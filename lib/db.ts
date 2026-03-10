import { PGlite } from '@electric-sql/pglite';

let db: PGlite | null = null;

export async function getDb() {
  if (!db) {
    db = new PGlite('./quail-db');
    await initDb(db);
  }
  return db;
}

async function initDb(db: PGlite) {
  // Create quizzes table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      questions JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create game_results table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS game_results (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      quiz_id TEXT NOT NULL,
      quiz_title TEXT NOT NULL,
      pin TEXT NOT NULL,
      standings JSONB NOT NULL,
      played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create active_games table for tracking ongoing games
  await db.exec(`
    CREATE TABLE IF NOT EXISTS active_games (
      pin TEXT PRIMARY KEY,
      host_id TEXT NOT NULL,
      host_session_id TEXT NOT NULL,
      quiz_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes for active_games
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_active_games_heartbeat
      ON active_games(last_heartbeat);
  `);
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_active_games_host
      ON active_games(host_session_id);
  `);
}

export async function saveQuiz(quiz: { id: string; title: string; questions: any[] }) {
  const db = await getDb();
  await db.query(
    'INSERT INTO quizzes (id, title, questions) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET title = $2, questions = $3',
    [quiz.id, quiz.title, JSON.stringify(quiz.questions)]
  );
}

export async function getAllQuizzes() {
  const db = await getDb();
  const res = await db.query('SELECT * FROM quizzes ORDER BY created_at DESC');
  return res.rows;
}

export async function saveGameResult(result: { quiz_id: string; quiz_title: string; pin: string; standings: any[] }) {
  const db = await getDb();
  await db.query(
    'INSERT INTO game_results (quiz_id, quiz_title, pin, standings) VALUES ($1, $2, $3, $4)',
    [result.quiz_id, result.quiz_title, result.pin, JSON.stringify(result.standings)]
  );
}

export async function getGameResults() {
  const db = await getDb();
  const res = await db.query('SELECT * FROM game_results ORDER BY played_at DESC');
  return res.rows;
}

// ==================== Active Games Management ====================

/**
 * Generate a unique 4-digit PIN that is not currently in use
 * Uses database UNIQUE constraint to ensure no duplicates
 */
export async function generateUniquePin(): Promise<string> {
  const db = await getDb();
  const maxAttempts = 100;

  for (let i = 0; i < maxAttempts; i++) {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();

    try {
      // Try to insert the PIN, if it exists we'll get a constraint error
      await db.query(
        'INSERT INTO active_games (pin, host_id, host_session_id, quiz_id) VALUES ($1, $2, $3, $4)',
        [pin, '', '', ''] // Temporary placeholder
      );
      // If we get here, the PIN was successfully reserved
      return pin;
    } catch (error: any) {
      // PIN already exists or other constraint error, try again
      if (error.code === '23505' || error.message?.includes('unique')) {
        continue;
      }
      throw error;
    }
  }

  throw new Error('Failed to generate unique PIN after maximum attempts');
}

/**
 * Register an active game in the database
 */
export async function registerActiveGame(params: {
  pin: string;
  hostId: string;
  hostSessionId: string;
  quizId: string;
}): Promise<void> {
  const db = await getDb();
  await db.query(
    `INSERT INTO active_games (pin, host_id, host_session_id, quiz_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (pin) DO UPDATE SET
       host_id = EXCLUDED.host_id,
       host_session_id = EXCLUDED.host_session_id,
       quiz_id = EXCLUDED.quiz_id`,
    [params.pin, params.hostId, params.hostSessionId, params.quizId]
  );
}

/**
 * Remove an active game from the database (when game ends)
 */
export async function removeActiveGame(pin: string): Promise<void> {
  const db = await getDb();
  await db.query('DELETE FROM active_games WHERE pin = $1', [pin]);
}

/**
 * Update the heartbeat timestamp for an active game
 */
export async function updateGameHeartbeat(pin: string): Promise<void> {
  const db = await getDb();
  await db.query(
    'UPDATE active_games SET last_heartbeat = CURRENT_TIMESTAMP WHERE pin = $1',
    [pin]
  );
}

/**
 * Clean up expired games (no heartbeat for 10 minutes)
 */
export async function cleanupExpiredGames(): Promise<number> {
  const db = await getDb();
  const result = await db.query(
    `DELETE FROM active_games
     WHERE last_heartbeat < CURRENT_TIMESTAMP - INTERVAL '10 minutes'`
  );
  return result.rowcount || 0;
}

/**
 * Check if a PIN is currently active
 */
export async function isPinActive(pin: string): Promise<boolean> {
  const db = await getDb();
  const res = await db.query(
    'SELECT 1 FROM active_games WHERE pin = $1',
    [pin]
  );
  return (res.rows.length ?? 0) > 0;
}

/**
 * Get all active games (for monitoring/debugging)
 */
export async function getActiveGames(): Promise<any[]> {
  const db = await getDb();
  const res = await db.query(
    'SELECT pin, host_id, host_session_id, quiz_id, created_at, last_heartbeat FROM active_games ORDER BY created_at DESC'
  );
  return res.rows;
}
