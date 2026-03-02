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
