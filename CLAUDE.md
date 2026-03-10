# Quail - Real-time Multiplayer Quiz Platform

Quail is a high-energy, real-time multiplayer quiz platform inspired by Kahoot. It allows hosts to create and run interactive quizzes where players join via a game PIN and compete in real-time.

## 🚀 Core Features

- **Real-time Multiplayer**: Seamless interaction between host and players using WebSockets.
- **Dual Modes**: 
  - **Host Mode**: Manage game flow, display questions, and show live leaderboards.
  - **Player Mode**: Join games via PIN, answer questions on mobile or desktop.
- **Quiz Creator**: Intuitive interface to build custom quizzes with multiple question types (Multiple Choice, True/False).
- **Live Leaderboard**: Dynamic scoring and ranking updates after every question.
- **Immersive Audio**: Professional-grade background music and sound effects that adapt to the game state.
- **Podium Finish**: Celebratory end-game screen with final rankings and confetti.

## ✨ Characteristics

- **Engaging UX**: Smooth transitions and animations powered by Framer Motion.
- **Responsive Design**: Optimized for both large screens (Host) and mobile devices (Players).
- **"Pressure & Release" Audio**: Sound design specifically crafted to build tension during questions and provide relief during results.
- **Zero-Config Join**: Players join instantly with a 6-digit PIN without needing an account.

## 🏗️ Technical Architecture

Quail uses a full-stack architecture designed for low-latency real-time communication:

- **Client-Side**: Next.js App Router for a fast, SEO-friendly frontend.
- **Real-time Layer**: Socket.io handles the bidirectional communication between the server and all connected clients.
- **State Management**: Zustand manages client-side game state, ensuring synchronization across components.
- **Server-Side**: A custom Express server integrated with Next.js to handle room management and game logic.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Real-time**: [Socket.io](https://socket.io/)
- **Animations**: [motion/react](https://www.framer.com/motion/) (Framer Motion)
- **Audio**: [Howler.js](https://howlerjs.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database**: [Drizzle ORM](https://orm.drizzle.team/) (supports PGlite, PostgreSQL, MySQL)
- **Backend**: [Express](https://expressjs.com/)

## 📂 Project Structure

```text
├── app/                # Next.js pages (Home, Host, Play, Create)
├── components/         # Reusable UI components & Socket Provider
├── lib/                # Core logic (Audio Manager, Zustand Store, Utils)
│   └── db/             # Database schema and connection (Drizzle ORM)
├── hooks/              # Custom React hooks
├── server.ts           # Express + Socket.io Server
├── drizzle.config.ts   # Drizzle ORM configuration
├── metadata.json       # App metadata & permissions
└── audio_design.md     # Audio system design principles
```

## 🛠️ Development Commands

- **Install Dependencies**: `npm install`
- **Start Dev Server**: `npm run dev` (Runs custom Express server with Next.js)
- **Build Application**: `npm run build`
- **Start Production**: `npm start`
- **Run Linter**: `npm run lint`

## 📏 Coding Standards

### TypeScript & Logic
- **Strict Typing**: Use TypeScript for all components and logic. Avoid `any`.
- **Named Imports**: Always use named imports (e.g., `import { useState } from 'react'`).
- **Enums**: Use standard `enum` declarations. Do not use `const enum`.
- **State Management**: Use Zustand for global game state; React `useState` for local UI state.
- **Real-time**: All game events must flow through the Socket.io provider.

### Components & UI
- **Styling**: Use Tailwind CSS utility classes exclusively. No inline styles or CSS-in-JS.
- **Icons**: Use `lucide-react` for all iconography.
- **Animations**: Use `motion/react` (Framer Motion) for all transitions and interactive feedback.
- **Responsive**: Design mobile-first for Player views and desktop-first for Host views.

### Audio
- **AudioManager**: Use the centralized `audioManager` in `lib/audio-manager.ts` for all sound triggers.
- **BGM/SFX**: Distinguish between background music (looping) and sound effects (one-shot).
- **User Interaction**: Audio must be unlocked via a user interaction (e.g., clicking "Enter" or "Start").

### Internationalization (i18n)
- **Translation Files**: All translations are stored in `messages/en.json` and `messages/zh.json`
- **Locale Store**: Use Zustand store in `lib/i18n.ts` for locale state management
- **useTranslation Hook**: Use `useTranslation` from `lib/translations.ts` for accessing translations
- **Translation Key Format**: Use dot notation (e.g., `home.title`, `play.correct`)
- **Adding New Keys**: Always add translations to BOTH language files
- **Language Switching**: Use `setLocale()` from `useI18nStore` to switch languages

### Database
- **ORM**: Use Drizzle ORM for all database operations (`lib/db/`)
- **Supported Databases**: PGlite (default), PostgreSQL, MySQL
- **Configuration**: Create `.env.local` and set `DATABASE_URL` (type auto-detected)
- **Schema Definitions**: All table schemas are defined in `lib/db/schema.ts`
- **Database Functions**: Import CRUD functions from `lib/db/index.ts`
- **Type Safety**: Use Drizzle's inferred types for database records
- **Migrations**: SQL scripts in `lib/db/migrations/` run automatically on startup

#### Database Configuration
```bash
# Create .env.local from template
cp .env.example .env.local

# Set DATABASE_URL in .env.local
DATABASE_URL=postgres://user:password@host:port/database
```

**Note**: Database type is auto-detected from `DATABASE_URL` protocol:
- `postgres://` → PostgreSQL
- `mysql://` → MySQL
- Empty/unset → PGlite

#### Database API
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
```

