#!/usr/bin/env node

/**
 * Load Test Script for Quail Game
 * Simulates multiple bot players joining and answering questions
 *
 * Usage:
 *   node load-test-players.js --pin=123456 --count=30
 *
 * Options:
 *   --pin      Game PIN to join (required)
 *   --count    Number of players to simulate (default: 30)
 *   --url      Server URL (default: http://localhost:3000)
 */

const io = require('socket.io-client');

// List of English names for bot players
const ENGLISH_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Dorothy', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Melissa', 'George', 'Deborah',
  'Edward', 'Stephanie', 'Ronald', 'Rebecca', 'Timothy', 'Sharon', 'Jason', 'Laura',
  'Jeffrey', 'Cynthia', 'Ryan', 'Kathleen', 'Jacob', 'Amy', 'Gary', 'Shirley',
  'Nicholas', 'Angela', 'Eric', 'Helen', 'Jonathan', 'Anna', 'Stephen', 'Brenda',
  'Larry', 'Pamela', 'Justin', 'Emma', 'Scott', 'Nicole', 'Brandon', 'Samantha',
  'Benjamin', 'Katherine', 'Samuel', 'Christine', 'Frank', 'Debra', 'Gregory', 'Rachel',
  'Raymond', 'Catherine', 'Alexander', 'Carolyn', 'Patrick', 'Janet', 'Jack', 'Ruth',
  'Dennis', 'Maria', 'Jerry', 'Heather', 'Tyler', 'Diane', 'Aaron', 'Virginia',
  'Jose', 'Julie', 'Henry', 'Joyce', 'Adam', 'Victoria', 'Douglas', 'Olivia',
  'Nathan', 'Kelly', 'Peter', 'Christina', 'Zachary', 'Lauren', 'Kyle', 'Joan',
  'Walter', 'Evelyn', 'Ethan', 'Judith', 'Jeremy', 'Megan', 'Harold', 'Cheryl',
  'Christian', 'Andrea', 'Keith', 'Hannah', 'Noah', 'Martha', 'Roger', 'Jacqueline'
];

// Shuffle array and return first n names
function getRandomNames(count) {
  const shuffled = [...ENGLISH_NAMES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    pin: '',
    count: 30,
    url: 'http://localhost:3000'
  };

  for (const arg of args) {
    if (arg.startsWith('--pin=')) {
      config.pin = arg.split('=')[1];
    } else if (arg.startsWith('--count=')) {
      config.count = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--url=')) {
      config.url = arg.split('=')[1];
    }
  }

  if (!config.pin) {
    console.error('Error: --pin is required');
    console.log('Usage: node load-test-players.js --pin=123456 [--count=30] [--url=http://localhost:3000]');
    process.exit(1);
  }

  // Validate player count
  if (config.count < 1 || config.count > 100) {
    console.error('Error: --count must be between 1 and 100');
    process.exit(1);
  }

  return config;
}

// Player bot class
class PlayerBot {
  constructor(id, name, config, stats) {
    this.id = id;
    this.nickname = name;
    this.sessionId = `bot_session_${id}_${Date.now()}`;
    this.config = config;
    this.stats = stats;
    this.socket = null;
    this.currentQuestionIndex = -1;
    this.answerTimeout = null;
    this.hasJoined = false;
  }

  connect() {
    this.socket = io(this.config.url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log(`✓ ${this.nickname} connected`);
      // Join the game room
      this.socket.emit('join_room', {
        pin: this.config.pin,
        nickname: this.nickname,
        sessionId: this.sessionId
      });
    });

    this.socket.on('joined_room', ({ pin, player, quiz }) => {
      if (!this.hasJoined) {
        this.hasJoined = true;
        this.stats.connected++;
        this.updateConnectionStatus();
        console.log(`  └─ ${this.nickname} joined room ${pin}`);
      }
    });

    this.socket.on('game_started', () => {
      console.log(`\n🎮 ${this.nickname}: Game started!`);
    });

    this.socket.on('question_started', (questionIndex) => {
      this.currentQuestionIndex = questionIndex;
      this.answerQuestion(questionIndex);
    });

    this.socket.on('answer_result', (result) => {
      const status = result.isCorrect ? '✅ Correct' : '❌ Wrong';
      const points = result.pointsEarned > 0 ? ` (+${result.pointsEarned} pts)` : '';
      console.log(`  ${this.nickname}: ${status}${points} - Score: ${result.score}`);

      if (result.isCorrect) {
        this.stats.correctAnswers++;
      } else {
        this.stats.wrongAnswers++;
      }
    });

    this.socket.on('question_result_shown', () => {
      // Clear any pending answer timeout
      if (this.answerTimeout) {
        clearTimeout(this.answerTimeout);
        this.answerTimeout = null;
      }
    });

    this.socket.on('leaderboard_updated', (leaderboard) => {
      const myRank = leaderboard.findIndex(p => p.nickname === this.nickname);
      if (myRank >= 0) {
        console.log(`  🏆 ${this.nickname}: Rank #${myRank + 1}`);
      }
    });

    this.socket.on('game_ended', (finalStandings) => {
      const myRank = finalStandings.findIndex(p => p.nickname === this.nickname);
      console.log(`\n🏁 ${this.nickname}: Game finished! Final rank: #${myRank + 1}, Score: ${finalStandings[myRank]?.score || 0}`);
    });

    this.socket.on('error', (error) => {
      console.error(`  ❌ ${this.nickname}: Error - ${error}`);
    });

    this.socket.on('disconnect', (reason) => {
      this.stats.connected--;
      this.updateConnectionStatus();
      console.log(`  🔌 ${this.nickname} disconnected: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      console.error(`  ❌ ${this.nickname}: Connection error - ${error.message}`);
    });
  }

  answerQuestion(questionIndex) {
    // Clear any existing timeout
    if (this.answerTimeout) {
      clearTimeout(this.answerTimeout);
    }

    // Random delay between 0.5-10 seconds
    const delay = Math.floor(Math.random() * 9500) + 500;

    this.answerTimeout = setTimeout(() => {
      // Random answer (0-3 for 4 options)
      const answerIndexes = [Math.floor(Math.random() * 4)];

      this.socket.emit('submit_answer', {
        pin: this.config.pin,
        answerIndexes
      });

      this.stats.totalAnswers++;
      this.displayStats();
    }, delay);
  }

  updateConnectionStatus() {
    process.stdout.write(`\r📊 Connected: ${this.stats.connected}/${this.config.count} | Answers: ${this.stats.totalAnswers} (✅${this.stats.correctAnswers} ❌${this.stats.wrongAnswers})`);
  }

  displayStats() {
    // Update the one-line stats display
    this.updateConnectionStatus();
  }

  disconnect() {
    if (this.answerTimeout) {
      clearTimeout(this.answerTimeout);
    }
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

// Main execution
function main() {
  const config = parseArgs();

  console.log('\n🤖 Quail Load Test Players');
  console.log('═'.repeat(50));
  console.log(`📋 Configuration:`);
  console.log(`   - Game PIN: ${config.pin}`);
  console.log(`   - Players: ${config.count}`);
  console.log(`   - Server: ${config.url}`);
  console.log('═'.repeat(50));
  console.log('\n⏳ Connecting players...\n');

  // Shared statistics
  const stats = {
    connected: 0,
    totalAnswers: 0,
    correctAnswers: 0,
    wrongAnswers: 0
  };

  // Get random names for all players
  const playerNames = getRandomNames(config.count);

  // Create player bots
  const players = [];

  for (let i = 0; i < config.count; i++) {
    const player = new PlayerBot(i + 1, playerNames[i], config, stats);
    players.push(player);

    // Stagger connections slightly
    setTimeout(() => {
      player.connect();
    }, i * 100); // 100ms delay between each connection
  }

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down players...');
    players.forEach(player => player.disconnect());
    console.log('✓ All players disconnected\n');
    process.exit(0);
  });

  // Keep the process running
  console.log('✓ Players initialized. Waiting for game events...');
  console.log('💡 Press Ctrl+C to exit\n');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { PlayerBot };
