import { drizzle } from 'drizzle-orm/pglite';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleMysql } from 'drizzle-orm/mysql2';
import { PGlite } from '@electric-sql/pglite';
import postgres from 'postgres';
import * as mysql from 'mysql2/promise';
import * as schema from './schema';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import type { Sql } from 'postgres';

// Database type configuration
type DbType = 'pglite' | 'postgresql' | 'mysql';

/**
 * Detect database type from DATABASE_URL
 * Defaults to 'pglite' if no DATABASE_URL is provided
 */
function detectDbType(): DbType {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.log(`> [Database] No DATABASE_URL provided, using embedded PGlite`);
    return 'pglite'; // Default to embedded PGlite
  }

  // Parse the URL protocol to determine database type
  const url = databaseUrl.toLowerCase();

  if (url.startsWith('mysql://')) {
    // Mask password in logs
    const maskedUrl = databaseUrl.replace(/:([^@]+)@/, ':****@');
    console.log(`> [Database] Detected MySQL database from URL: ${maskedUrl}`);
    return 'mysql';
  }

  if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
    // Mask password in logs
    const maskedUrl = databaseUrl.replace(/:([^@]+)@/, ':****@');
    console.log(`> [Database] Detected PostgreSQL database from URL: ${maskedUrl}`);
    return 'postgresql';
  }

  // Fallback to PGlite if URL format is unrecognized
  console.warn(`> [Database] Unrecognized DATABASE_URL format, defaulting to PGlite`);
  console.warn(`> [Database] Expected format: postgres://... or mysql://...`);
  return 'pglite';
}

// Lazy evaluation of dbType to ensure env vars are loaded
let _cachedDbType: DbType | null = null;

function getDbType(): DbType {
  if (_cachedDbType === null) {
    _cachedDbType = detectDbType();
  }
  return _cachedDbType;
}

// Singleton instances
let db: any = null;
let client: any = null;

/**
 * Get the migrations directory path for the current database type
 */
function getMigrationsDir(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = join(__filename, '..');
  const migrationsDir = join(__dirname, 'migrations');

  // PGlite and PostgreSQL use the same SQL scripts
  const dbFolder = getDbType() === 'mysql' ? 'mysql' : 'pglite';
  return join(migrationsDir, dbFolder);
}

/**
 * Read SQL migration files from the migrations directory
 */
function getMigrationFiles(): string[] {
  const migrationsDir = getMigrationsDir();
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // Execute in alphabetical order

  return files.map((f) => join(migrationsDir, f));
}

/**
 * Read SQL file content
 */
function readSqlFile(filePath: string): string {
  return readFileSync(filePath, 'utf-8');
}

/**
 * Create migration tracking table if it doesn't exist
 */
async function createMigrationTable(dbType: DbType): Promise<void> {
  if (dbType === 'mysql') {
    await (client as mysql.Connection).query(`
      CREATE TABLE IF NOT EXISTS _drizzle_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } else if (dbType === 'pglite') {
    await (client as PGlite).exec(`
      CREATE TABLE IF NOT EXISTS _drizzle_migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } else {
    // PostgreSQL
    await (client as Sql).unsafe(`
      CREATE TABLE IF NOT EXISTS _drizzle_migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
}

/**
 * Get list of executed migrations
 */
async function getExecutedMigrations(): Promise<string[]> {
  const currentDbType = getDbType();
  if (currentDbType === 'mysql') {
    const [rows] = await (client as mysql.Connection).query(
      'SELECT name FROM _drizzle_migrations ORDER BY id'
    );
    return (rows as any[]).map((r) => r.name);
  } else if (currentDbType === 'pglite') {
    const result = await (client as PGlite).query(
      'SELECT name FROM _drizzle_migrations ORDER BY id'
    );
    return result.rows.map((r: any) => r.name);
  } else {
    // PostgreSQL
    const result = await (client as Sql)`
      SELECT name FROM _drizzle_migrations ORDER BY id
    `;
    return result.map((r: any) => r.name);
  }
}

/**
 * Execute SQL migration file
 */
async function executeMigration(sql: string, fileName: string): Promise<void> {
  const currentDbType = getDbType();
  if (currentDbType === 'mysql') {
    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => {
        // Filter out empty statements and pure comments
        if (s.length === 0) return false;
        // Remove comment lines and check if there's any SQL left
        const withoutComments = s
          .split('\n')
          .filter(line => !line.trim().startsWith('--'))
          .join('\n')
          .trim();
        return withoutComments.length > 0;
      })
      .map((s) => {
        // Remove comment lines from the statement before executing
        return s
          .split('\n')
          .filter(line => !line.trim().startsWith('--'))
          .join('\n')
          .trim();
      });

    for (const statement of statements) {
      await (client as mysql.Connection).query(statement);
    }

    // Record migration
    await (client as mysql.Connection).query(
      'INSERT INTO _drizzle_migrations (name) VALUES (?)',
      [fileName]
    );
  } else if (currentDbType === 'pglite') {
    const pglite = client as PGlite;
    await pglite.exec(sql);

    // Record migration
    await pglite.query(
      'INSERT INTO _drizzle_migrations (name) VALUES ($1)',
      [fileName]
    );
  } else {
    // PostgreSQL
    // Execute each statement separately
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => {
        // Filter out empty statements and pure comments
        if (s.length === 0) return false;
        // Remove comment lines and check if there's any SQL left
        const withoutComments = s
          .split('\n')
          .filter(line => !line.trim().startsWith('--'))
          .join('\n')
          .trim();
        return withoutComments.length > 0;
      })
      .map((s) => {
        // Remove comment lines from the statement before executing
        return s
          .split('\n')
          .filter(line => !line.trim().startsWith('--'))
          .join('\n')
          .trim();
      });

    for (const statement of statements) {
      await (client as Sql).unsafe(statement);
    }

    // Record migration
    await (client as Sql)`INSERT INTO _drizzle_migrations (name) VALUES (${fileName})`;
  }
}

/**
 * Run pending migrations
 */
async function runMigrations(): Promise<void> {
  const startTime = Date.now();
  const currentDbType = getDbType();
  console.log(`> [Database] Checking migrations for ${currentDbType}...`);

  const migrationsDir = getMigrationsDir();
  console.log(`> [Database] Migrations directory: ${migrationsDir}`);

  try {
    await createMigrationTable(currentDbType);
    console.log(`> [Database] Migration tracking table ready`);
  } catch (error) {
    console.error(`> [Database] Failed to create migration tracking table:`, error);
    throw error;
  }

  try {
    const executedMigrations = await getExecutedMigrations();
    console.log(`> [Database] Previously executed migrations: ${executedMigrations.length}`);

    const migrationFiles = getMigrationFiles();
    console.log(`> [Database] Available migration files: ${migrationFiles.length}`);

    const pendingMigrations = migrationFiles.filter((filePath) => {
      const fileName = filePath.split('/').pop() || filePath;
      return !executedMigrations.includes(fileName);
    });

    if (pendingMigrations.length === 0) {
      console.log(`> [Database] ✓ No pending migrations to run`);
      return;
    }

    console.log(`> [Database] Running ${pendingMigrations.length} pending migration(s)...`);

    for (const filePath of pendingMigrations) {
      const fileName = filePath.split('/').pop() || filePath;
      console.log(`> [Database]   → Executing: ${fileName}`);

      try {
        const sql = readSqlFile(filePath);
        await executeMigration(sql, fileName);
        console.log(`> [Database]   ✓ Completed: ${fileName}`);
      } catch (error: any) {
        console.error(`> [Database]   ✗ Failed: ${fileName}`);
        console.error(`> [Database]   Error: ${error.message}`);
        if (error.code) {
          console.error(`> [Database]   Error code: ${error.code}`);
        }
        throw error;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`> [Database] ✓ All migrations completed successfully (${duration}s)`);
  } catch (error) {
    console.error(`> [Database] Migration failed after ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
    throw error;
  }
}

/**
 * Get database connection based on configured type
 */
export async function getDb() {
  if (db) {
    return db;
  }

  const startTime = Date.now();
  const currentDbType = getDbType();
  console.log(`> [Database] Initializing database connection...`);
  console.log(`> [Database] Database type: ${currentDbType}`);

  try {
    switch (currentDbType) {
      case 'pglite':
        db = await initPglite();
        break;
      case 'postgresql':
        db = await initPostgreSQL();
        break;
      case 'mysql':
        db = await initMySQL();
        break;
      default:
        throw new Error(`Unsupported database type: ${currentDbType}`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`> [Database] ✓ Database ready (${duration}s)`);

    return db;
  } catch (error) {
    console.error(`> [Database] ✗ Database initialization failed`);
    throw error;
  }
}

/**
 * Initialize PGlite connection
 */
async function initPglite() {
  const startTime = Date.now();
  const dbPath = './quail-db';
  console.log(`> [Database] Initializing PGlite...`);
  console.log(`> [Database] Database path: ${dbPath}`);

  try {
    const pglite = new PGlite(dbPath);
    client = pglite;
    const dbConnection = drizzle(pglite, { schema });

    console.log(`> [Database] PGlite connection established`);
    await runMigrations();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`> [Database] ✓ PGlite initialization completed (${duration}s)`);

    return dbConnection;
  } catch (error: any) {
    console.error(`> [Database] ✗ PGlite initialization failed: ${error.message}`);
    throw error;
  }
}

/**
 * Initialize PostgreSQL connection
 */
async function initPostgreSQL() {
  const startTime = Date.now();
  const url = process.env.DATABASE_URL!;
  const maskedUrl = url.replace(/:([^@]+)@/, ':****@');

  console.log(`> [Database] Initializing PostgreSQL...`);
  console.log(`> [Database] Connecting to: ${maskedUrl}`);

  try {
    client = postgres(url, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    const dbConnection = drizzlePg(client, { schema });

    // Test connection
    await client`SELECT 1`;
    console.log(`> [Database] PostgreSQL connection established`);

    await runMigrations();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`> [Database] ✓ PostgreSQL initialization completed (${duration}s)`);

    return dbConnection;
  } catch (error: any) {
    console.error(`> [Database] ✗ PostgreSQL initialization failed: ${error.message}`);
    console.error(`> [Database] Check your DATABASE_URL and ensure the database is accessible`);
    throw error;
  }
}

/**
 * Initialize MySQL connection
 */
async function initMySQL() {
  const startTime = Date.now();
  const url = process.env.DATABASE_URL!;
  const maskedUrl = url.replace(/:([^@]+)@/, ':****@');

  console.log(`> [Database] Initializing MySQL...`);
  console.log(`> [Database] Connecting to: ${maskedUrl}`);

  try {
    const connection = await mysql.createConnection(url);
    client = connection;
    const dbConnection = drizzleMysql(connection, { schema, mode: 'default' });

    console.log(`> [Database] MySQL connection established`);
    await runMigrations();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`> [Database] ✓ MySQL initialization completed (${duration}s)`);

    return dbConnection;
  } catch (error: any) {
    console.error(`> [Database] ✗ MySQL initialization failed: ${error.message}`);
    console.error(`> [Database] Check your DATABASE_URL and ensure the database is accessible`);

    if (error.code === 'ECONNREFUSED') {
      console.error(`> [Database] Connection refused - check if MySQL server is running`);
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error(`> [Database] Access denied - check your credentials`);
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error(`> [Database] Database does not exist - create it first`);
    }

    throw error;
  }
}

// ============================================================================
// Quiz Operations
// ============================================================================

export async function saveQuiz(quiz: { id: string; title: string; questions: any[] }) {
  const database = await getDb();

  const currentDbType = getDbType();
  if (currentDbType === 'pglite' || currentDbType === 'postgresql') {
    await database.insert(schema.pgQuizzes)
      .values({
        id: quiz.id,
        title: quiz.title,
        questions: quiz.questions,
      })
      .onConflictDoUpdate({
        target: schema.pgQuizzes.id,
        set: {
          title: quiz.title,
          questions: quiz.questions,
        },
      });
  } else {
    // MySQL
    await database.insert(schema.mysqlQuizzes)
      .values({
        id: quiz.id,
        title: quiz.title,
        questions: quiz.questions,
      })
      .onDuplicateKeyUpdate({
        set: {
          title: quiz.title,
          questions: quiz.questions,
        },
      });
  }
}

export async function getAllQuizzes() {
  const database = await getDb();

  const currentDbType = getDbType();
  if (currentDbType === 'pglite' || currentDbType === 'postgresql') {
    return await database.select().from(schema.pgQuizzes).orderBy(desc(schema.pgQuizzes.createdAt));
  } else {
    // MySQL
    return await database.select().from(schema.mysqlQuizzes).orderBy(desc(schema.mysqlQuizzes.createdAt));
  }
}

// ============================================================================
// Game Results Operations
// ============================================================================

export async function saveGameResult(result: { quiz_id: string; quiz_title: string; pin: string; standings: any[] }) {
  const database = await getDb();
  const id = crypto.randomUUID();

  const currentDbType = getDbType();
  if (currentDbType === 'pglite' || currentDbType === 'postgresql') {
    await database.insert(schema.pgGameResults)
      .values({
        id,
        quizId: result.quiz_id,
        quizTitle: result.quiz_title,
        pin: result.pin,
        standings: result.standings,
      });
  } else {
    // MySQL
    await database.insert(schema.mysqlGameResults)
      .values({
        id,
        quizId: result.quiz_id,
        quizTitle: result.quiz_title,
        pin: result.pin,
        standings: result.standings,
      });
  }
}

export async function getGameResults() {
  const database = await getDb();

  const currentDbType = getDbType();
  if (currentDbType === 'pglite' || currentDbType === 'postgresql') {
    return await database.select().from(schema.pgGameResults).orderBy(desc(schema.pgGameResults.playedAt));
  } else {
    // MySQL
    return await database.select().from(schema.mysqlGameResults).orderBy(desc(schema.mysqlGameResults.playedAt));
  }
}

// ============================================================================
// Active Games Operations
// ============================================================================

/**
 * Generate a unique 4-digit PIN that is not currently in use
 */
export async function generateUniquePin(): Promise<string> {
  const database = await getDb();
  const maxAttempts = 100;

  for (let i = 0; i < maxAttempts; i++) {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();

    try {
      const currentDbType = getDbType();
  if (currentDbType === 'pglite' || currentDbType === 'postgresql') {
        await database.insert(schema.pgActiveGames)
          .values({
            pin,
            hostId: '',
            hostSessionId: '',
            quizId: '',
          });
      } else {
        // MySQL
        await database.insert(schema.mysqlActiveGames)
          .values({
            pin,
            hostId: '',
            hostSessionId: '',
            quizId: '',
          });
      }
      return pin;
    } catch (error: any) {
      // PIN already exists, try again
      if (error.code === '23505' || error.code === 'ER_DUP_ENTRY' || error.message?.includes('unique')) {
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
  const database = await getDb();

  const currentDbType = getDbType();
  if (currentDbType === 'pglite' || currentDbType === 'postgresql') {
    await database.insert(schema.pgActiveGames)
      .values({
        pin: params.pin,
        hostId: params.hostId,
        hostSessionId: params.hostSessionId,
        quizId: params.quizId,
      })
      .onConflictDoUpdate({
        target: schema.pgActiveGames.pin,
        set: {
          hostId: params.hostId,
          hostSessionId: params.hostSessionId,
          quizId: params.quizId,
        },
      });
  } else {
    // MySQL
    await database.insert(schema.mysqlActiveGames)
      .values({
        pin: params.pin,
        hostId: params.hostId,
        hostSessionId: params.hostSessionId,
        quizId: params.quizId,
      })
      .onDuplicateKeyUpdate({
        set: {
          hostId: params.hostId,
          hostSessionId: params.hostSessionId,
          quizId: params.quizId,
        },
      });
  }
}

/**
 * Remove an active game from the database
 */
export async function removeActiveGame(pin: string): Promise<void> {
  const database = await getDb();

  const currentDbType = getDbType();
  if (currentDbType === 'pglite' || currentDbType === 'postgresql') {
    await database.delete(schema.pgActiveGames).where(eq(schema.pgActiveGames.pin, pin));
  } else {
    // MySQL
    await database.delete(schema.mysqlActiveGames).where(eq(schema.mysqlActiveGames.pin, pin));
  }
}

/**
 * Update the heartbeat timestamp for an active game
 */
export async function updateGameHeartbeat(pin: string): Promise<void> {
  const database = await getDb();

  const currentDbType = getDbType();
  if (currentDbType === 'pglite' || currentDbType === 'postgresql') {
    await database.update(schema.pgActiveGames)
      .set({ lastHeartbeat: new Date() })
      .where(eq(schema.pgActiveGames.pin, pin));
  } else {
    // MySQL
    await database.update(schema.mysqlActiveGames)
      .set({ lastHeartbeat: new Date() })
      .where(eq(schema.mysqlActiveGames.pin, pin));
  }
}

/**
 * Clean up expired games (no heartbeat for 10 minutes)
 */
export async function cleanupExpiredGames(): Promise<number> {
  const database = await getDb();
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  const currentDbType = getDbType();
  if (currentDbType === 'pglite' || currentDbType === 'postgresql') {
    const result = await database.delete(schema.pgActiveGames)
      .where(lt(schema.pgActiveGames.lastHeartbeat, tenMinutesAgo))
      .returning();
    return result.length;
  } else {
    // MySQL
    const result = await database.delete(schema.mysqlActiveGames)
      .where(lt(schema.mysqlActiveGames.lastHeartbeat, tenMinutesAgo));
    return result.affectedRows || 0;
  }
}

/**
 * Check if a PIN is currently active
 */
export async function isPinActive(pin: string): Promise<boolean> {
  const database = await getDb();

  const currentDbType = getDbType();
  if (currentDbType === 'pglite' || currentDbType === 'postgresql') {
    const result = await database.select()
      .from(schema.pgActiveGames)
      .where(eq(schema.pgActiveGames.pin, pin))
      .limit(1);
    return result.length > 0;
  } else {
    // MySQL
    const result = await database.select()
      .from(schema.mysqlActiveGames)
      .where(eq(schema.mysqlActiveGames.pin, pin))
      .limit(1);
    return result.length > 0;
  }
}

/**
 * Get all active games (for monitoring/debugging)
 */
export async function getActiveGames(): Promise<any[]> {
  const database = await getDb();

  const currentDbType = getDbType();
  if (currentDbType === 'pglite' || currentDbType === 'postgresql') {
    return await database.select()
      .from(schema.pgActiveGames)
      .orderBy(desc(schema.pgActiveGames.createdAt));
  } else {
    // MySQL
    return await database.select()
      .from(schema.mysqlActiveGames)
      .orderBy(desc(schema.mysqlActiveGames.createdAt));
  }
}

// ============================================================================
// Helper imports for query building
// ============================================================================

import { eq, desc, lt } from 'drizzle-orm';

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Close database connection
 */
export async function closeDb() {
  if (client) {
    const currentDbType = getDbType();
    if (currentDbType === 'postgresql') {
      await (client as Sql).end({ timeout: 5 });
    } else if (currentDbType === 'mysql') {
      await (client as mysql.Connection).end();
    }
  }
  db = null;
  client = null;
}
