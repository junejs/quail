# Database Migrations

This directory contains SQL migration scripts for different database types.

## Directory Structure

```
migrations/
├── pglite/           # SQL scripts for PGlite and PostgreSQL
│   └── 0001_init.sql
├── mysql/            # SQL scripts for MySQL
│   └── 0001_init.sql
└── README.md         # This file
```

## How It Works

1. **Automatic Execution**: When the application starts, it automatically:
   - Creates a `_drizzle_migrations` table to track executed migrations
   - Scans the migrations directory for the current database type
   - Executes any pending migrations that haven't been run yet
   - Records each successful migration in the tracking table

2. **Migration Files**:
   - Named with a numeric prefix (e.g., `0001_init.sql`, `0002_add_index.sql`)
   - Executed in alphabetical order
   - Each file is executed only once

3. **Database Type Selection**:
   - PGlite and PostgreSQL use the `pglite/` directory
   - MySQL uses the `mysql/` directory
   - Controlled by the `DB_TYPE` environment variable

## Creating New Migrations

1. Create a new SQL file in the appropriate directory:
   ```
   # For PGlite/PostgreSQL
   touch lib/db/migrations/pglite/0002_add_feature.sql

   # For MySQL
   touch lib/db/migrations/mysql/0002_add_feature.sql
   ```

2. Add your SQL changes:
   ```sql
   -- Migration: 0002_add_feature
   -- Description: Add new column to quizzes table

   ALTER TABLE quizzes ADD COLUMN description TEXT;
   CREATE INDEX idx_quizzes_title ON quizzes(title);
   ```

3. Restart the application - migrations will run automatically

## Manual Migration Commands

```bash
# Run migrations manually (usually automatic on startup)
npm run db:migrate

# Push schema directly to database (development only)
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## Migration Tracking

The `_drizzle_migrations` table stores:

| Column | Type | Description |
|--------|------|-------------|
| id | INT/SERIAL | Auto-increment ID |
| name | TEXT/VARCHAR | Migration file name |
| executed_at | TIMESTAMP | When the migration was executed |

## Best Practices

1. **Always use IF NOT EXISTS** when creating tables/indexes
2. **Keep migrations idempotent** - safe to run multiple times
3. **Test migrations** on a local database first
4. **Never modify existing migration files** - create new ones instead
5. **Use transactions** for complex migrations (if needed)
