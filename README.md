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

## Project Structure

```
├── app/                # Next.js pages (Home, Host, Play, Create)
├── components/         # Reusable UI components & Socket Provider
├── lib/                # Core logic (Audio Manager, Zustand Store, Utils)
├── hooks/              # Custom React hooks
├── server.ts           # Express + Socket.io Server
└── audio_design.md     # Audio system design principles
```

## License

MIT
