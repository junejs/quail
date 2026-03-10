# Mock Players for Load Testing

This directory contains scripts to simulate multiple bot players for testing the Quail game platform.

## Usage

### 1. Start the Game Server

In one terminal:
```bash
npm run dev
```

### 2. Create a Game as Host

Open `http://localhost:3000/host` in your browser and create/start a game. Note the **Game PIN** displayed.

### 3. Run the Mock Players

In another terminal, run:
```bash
node mockplayer/load-test-players.js --pin=123456 --count=30
```

Replace `123456` with your actual game PIN.

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--pin` | Game PIN to join | **(required)** |
| `--count` | Number of players to simulate | `30` |
| `--url` | Server URL | `http://localhost:3000` |

## Examples

```bash
# Simulate 20 players
node mockplayer/load-test-players.js --pin=123456 --count=20

# Simulate 50 players
node mockplayer/load-test-players.js --pin=123456 --count=50

# Connect to a different server
node mockplayer/load-test-players.js --pin=123456 --count=30 --url=http://192.168.1.100:3000
```

## What the Bots Do

- ✅ Join the game with random English names (James, Mary, Robert, ...)
- ✅ Answer each question in random time (0.5-10 seconds)
- ✅ Select random answer options
- ✅ Display real-time statistics:
  - Connected players count
  - Answer counts (correct/wrong)
  - Per-question results
  - Leaderboard positions

## Output Example

```
🤖 Quail Load Test Players
══════════════════════════════════════════════════
📋 Configuration:
   - Game PIN: 123456
   - Players: 30
   - Server: http://localhost:3000
══════════════════════════════════════════════════

⏳ Connecting players...

✓ Bot_1 connected
  └─ Bot_1 joined room 123456
✓ Bot_2 connected
  └─ Bot_2 joined room 123456
...

📊 Connected: 30/30 | Answers: 90 (✅45 ❌45)
```

## Stopping the Bots

Press `Ctrl+C` to gracefully disconnect all bot players.
