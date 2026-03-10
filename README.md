# Quail - Real-time Multiplayer Quiz Platform

<div align="center">
<img width="120" height="120" alt="Quail Logo" src="logo.png" />

<img width="1200" height="475" alt="Quail Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

<!-- Add your banner screenshot here -->
<!-- ![Banner](docs/images/banner.png) -->

Quail is a high-energy, real-time multiplayer quiz platform inspired by Kahoot. It allows hosts to create and run interactive quizzes where players join via a game PIN and compete in real-time.

## Features

- **Real-time Multiplayer** - Seamless interaction between host and players using WebSockets
- **Dual Modes** - Host Mode for managing games, Player Mode for joining via PIN
- **Quiz Creator** - Intuitive interface to build custom quizzes with Multiple Choice and True/False questions
- **Live Leaderboard** - Dynamic scoring and ranking updates after every question
- **Immersive Audio** - Professional background music and sound effects that adapt to game state
- **Podium Finish** - Celebratory end-game screen with final rankings and confetti

## Use Cases

- **Classroom Education** - Teachers can create engaging quizzes for students to review material
- **Team Building** - Companies can use Quail for fun, interactive team activities
- **Social Events** - Friends and family can enjoy quiz nights together
- **Training Sessions** - Corporate trainers can assess knowledge retention in a fun way
- **Icebreakers** - Event organizers can use quick quizzes to get participants engaged

## Screenshots

<!-- Add your screenshots here. Recommended size: 1200x675 (16:9 aspect ratio) -->

### Home Page
```
docs/images/home.png
```
<!-- ![Home Page](docs/images/home.png) -->

### Quiz Creator
```
docs/images/creator.png
```
<!-- ![Quiz Creator](docs/images/creator.png) -->

### Host View
```
docs/images/host.png
```
<!-- ![Host View](docs/images/host.png) -->

### Player View
```
docs/images/player.png
```
<!-- ![Player View](docs/images/player.png) -->

### Leaderboard
```
docs/images/leaderboard.png
```
<!-- ![Leaderboard](docs/images/leaderboard.png) -->

### Podium
```
docs/images/podium.png
```
<!-- ![Podium](docs/images/podium.png) -->

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Real-time**: Socket.io
- **Animations**: Framer Motion
- **Audio**: Howler.js
- **State Management**: Zustand
- **Icons**: Lucide React
- **Backend**: Express
- **Database**: Drizzle ORM (supports PGlite, PostgreSQL, MySQL)
- **i18n**: Zustand + JSON files

## Internationalization (i18n)

Quail supports multiple languages (English and Chinese) with a client-side translation system.

### Architecture

- **Translation Files**: Stored in `messages/en.json` and `messages/zh.json`
- **State Management**: Zustand store (`lib/i18n.ts`) manages the current locale
- **Translation Hook**: `useTranslation()` hook (`lib/translations.ts`) provides access to translations
- **Language Detection**: Automatically detects browser language, with manual override via localStorage

### Usage

```tsx
import { useTranslation } from '@/lib/translations';

function MyComponent() {
  const { t, locale } = useTranslation();

  return <h1>{t('home.title')}</h1>;
}
```

### Adding New Translations

1. Add translation keys to both `messages/en.json` and `messages/zh.json`
2. Use the `t('key.path')` function in components
3. Supported locales: `en` (English), `zh` (Chinese)

### File Structure

```
├── messages/
│   ├── en.json          # English translations
│   └── zh.json          # Chinese translations
├── lib/
│   ├── i18n.ts          # Zustand store for locale state
│   └── translations.ts  # useTranslation hook
```

## Database

Quail uses **Drizzle ORM** for database operations, providing type-safe queries and multi-database support.

### Supported Databases

| Database | Usage | Configuration |
|----------|-------|---------------|
| **PGlite** | Embedded PostgreSQL (default) | Leave `DATABASE_URL` empty |
| **PostgreSQL** | Remote PostgreSQL server | `DATABASE_URL=postgres://...` |
| **MySQL** | Remote MySQL server | `DATABASE_URL=mysql://...` |

### Configuration

Create `.env.local` for local configuration (auto-loaded via dotenv):

```bash
cp .env.example .env.local
```

**Example configurations:**
```bash
# PGlite (default)
DATABASE_URL=

# PostgreSQL
DATABASE_URL=postgres://user:password@host:port/database

# MySQL
DATABASE_URL=mysql://user:password@host:port/database
```

**Note:** Database type is auto-detected from `DATABASE_URL` protocol.

### Database Schema

Quail uses three main tables:

- **`quizzes`**: Store quiz configurations (title, questions)
- **`game_results`**: Store completed game results (standings, scores)
- **`active_games`**: Track ongoing games (PIN, host, heartbeat)

### File Structure

```
lib/db/
├── schema.ts       # Drizzle schema definitions
├── index.ts        # Database connection & CRUD functions
└── migrations/     # Database migration files
```

### Migrations

Generate and run migrations:

```bash
# Generate migration from schema changes
npx drizzle-kit generate

# Push schema directly to database (for development)
npx drizzle-kit push

# Open Drizzle Studio (database GUI)
npx drizzle-kit studio
```

### API Reference

```typescript
import {
  saveQuiz,
  getAllQuizzes,
  saveGameResult,
  getGameResults,
  generateUniquePin,
  registerActiveGame,
  removeActiveGame,
  updateGameHeartbeat,
  cleanupExpiredGames,
  isPinActive,
  getActiveGames,
} from '@/lib/db';

// Quiz operations
await saveQuiz({ id: 'quiz-1', title: 'My Quiz', questions: [...] });
const quizzes = await getAllQuizzes();

// Game result operations
await saveGameResult({ quiz_id: 'quiz-1', quiz_title: 'My Quiz', pin: '1234', standings: [...] });
const results = await getGameResults();

// Active game operations
const pin = await generateUniquePin();
await registerActiveGame({ pin, hostId: '...', hostSessionId: '...', quizId: '...' });
await updateGameHeartbeat(pin);
await removeActiveGame(pin);
await cleanupExpiredGames();
```

## Getting Started

### Prerequisites

- Node.js 18+

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### How to Play

1. **Host a Game**: Click "Host a Game" on the home page, then create or select a quiz
2. **Share PIN**: A 6-digit game PIN will be displayed for players to join
3. **Join as Player**: Players enter the PIN on the home page to join
4. **Answer Questions**: Players answer on their devices while host displays on big screen
5. **See Results**: Live leaderboard updates after each question

## Testing

### Load Testing with Mock Players

Quail includes a load testing tool that simulates multiple bot players for local testing.

#### Usage

```bash
# Terminal 1: Start the server
npm run dev

# Terminal 2: Create a game at http://localhost:3000/host and note the Game PIN

# Terminal 3: Run mock players (replace 123456 with your actual PIN)
npm run mock-players -- --pin=123456 --count=30
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--pin` | Game PIN to join | **(required)** |
| `--count` | Number of bot players (1-100) | `30` |
| `--url` | Server URL | `http://localhost:3000` |

#### Examples

```bash
# Simulate 20 players
npm run mock-players -- --pin=123456 --count=20

# Simulate 50 players
npm run mock-players -- --pin=123456 --count=50

# Connect to a different server
node mockplayer/load-test-players.js --pin=123456 --count=30 --url=http://192.168.1.100:3000
```

#### Bot Behavior

- ✅ Join with random English names (James, Mary, Robert, ...)
- ✅ Answer questions in random time (0.5-10 seconds)
- ✅ Select random answer options
- ✅ Real-time statistics display

For more details, see [mockplayer/README.md](mockplayer/README.md).

## Project Structure

```
├── app/                # Next.js pages (Home, Host, Play, Create)
├── components/         # Reusable UI components & Socket Provider
├── lib/                # Core logic (Audio Manager, Zustand Store, Utils)
│   └── db/             # Database schema and connection (Drizzle ORM)
├── hooks/              # Custom React hooks
├── server.ts           # Express + Socket.io Server
├── drizzle.config.ts   # Drizzle ORM configuration
└── audio_design.md     # Audio system design principles
```

## License

MIT
