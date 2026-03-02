import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname: '0.0.0.0', port });
const handle = app.getRequestHandler();

let isNextReady = false;
app.prepare().then(() => {
  console.log('> Next.js app prepared');
  isNextReady = true;
});

// Types
interface Player {
  id: string;
  nickname: string;
  score: number;
  streak: number;
  hasAnswered: boolean;
  lastAnswerCorrect: boolean;
  totalResponseTime: number; // For tie-breaking
  lastPointsEarned?: number;
  lastSpeedBonus?: number;
  lastStreakBonus?: number;
}

interface Room {
  pin: string;
  hostId: string;
  players: Record<string, Player>;
  state: 'lobby' | 'question' | 'question_result' | 'leaderboard' | 'podium';
  currentQuestionIndex: number;
  questionStartTime: number;
  answers: Record<string, number>; // playerId -> optionIndex
  quiz: any;
}

const rooms: Record<string, Room> = {};

function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const server = createServer(async (req, res) => {
  try {
    const parsedUrl = parse(req.url!, true);
    const { pathname } = parsedUrl;

    if (pathname === '/api/health') {
      res.statusCode = 200;
      res.end('ok');
      return;
    }

    if (!isNextReady) {
      res.statusCode = 503;
      res.end('Next.js is starting up...');
      return;
    }

    await handle(req, res, parsedUrl);
  } catch (err) {
    console.error('Error occurred handling', req.url, err);
    res.statusCode = 500;
    res.end('internal server error');
  }
});

const io = new Server(server, {
  path: '/socket.io',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Host creates a room
  socket.on('create_room', (quiz) => {
    const pin = generatePin();
    rooms[pin] = {
      pin,
      hostId: socket.id,
      players: {},
      state: 'lobby',
      currentQuestionIndex: -1,
      questionStartTime: 0,
      answers: {},
      quiz,
    };
    socket.join(pin);
    socket.emit('room_created', pin);
  });

  // Player joins a room
  socket.on('join_room', ({ pin, nickname }) => {
    const room = rooms[pin];
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }
    if (room.state !== 'lobby') {
      socket.emit('error', 'Game already started');
      return;
    }

    const player: Player = {
      id: socket.id,
      nickname,
      score: 0,
      streak: 0,
      hasAnswered: false,
      lastAnswerCorrect: false,
      totalResponseTime: 0,
    };

    room.players[socket.id] = player;
    socket.join(pin);
    socket.emit('joined_room', { pin, player, quiz: room.quiz });
    
    // Notify host
    io.to(room.hostId).emit('player_joined', Object.values(room.players));
  });

  // Host starts the game
  socket.on('start_game', (pin) => {
    const room = rooms[pin];
    if (room && room.hostId === socket.id) {
      room.state = 'question';
      room.currentQuestionIndex = 0;
      room.questionStartTime = Date.now();
      room.answers = {};
      
      // Reset player answer states
      Object.values(room.players).forEach(p => {
        p.hasAnswered = false;
        p.lastAnswerCorrect = false;
      });

      io.to(pin).emit('game_started');
      io.to(pin).emit('question_started', room.currentQuestionIndex);
    }
  });

  // Host moves to next question
  socket.on('next_question', (pin) => {
    const room = rooms[pin];
    if (room && room.hostId === socket.id) {
      room.state = 'question';
      room.currentQuestionIndex++;
      room.questionStartTime = Date.now();
      room.answers = {};
      
      Object.values(room.players).forEach(p => {
        p.hasAnswered = false;
        p.lastAnswerCorrect = false;
      });

      io.to(pin).emit('question_started', room.currentQuestionIndex);
    }
  });

  // Host shows question result
  socket.on('show_question_result', (pin) => {
    const room = rooms[pin];
    if (room && room.hostId === socket.id) {
      room.state = 'question_result';
      
      // Send result to each player individually
      Object.values(room.players).forEach(p => {
        io.to(p.id).emit('answer_result', { 
          isCorrect: p.lastAnswerCorrect, 
          score: p.score, 
          streak: p.streak,
          pointsEarned: p.lastAnswerCorrect ? p.score - (p.score - (p.lastPointsEarned || 0)) : 0, // This is a bit complex to track perfectly without more state
          lastPointsEarned: p.lastPointsEarned || 0
        });
      });

      // Send aggregated results to host
      const answerCounts: Record<number, number> = {};
      Object.values(room.answers).forEach(ans => {
        answerCounts[ans] = (answerCounts[ans] || 0) + 1;
      });
      
      io.to(pin).emit('question_result_shown', answerCounts);
    }
  });

  // Player submits answer
  socket.on('submit_answer', ({ pin, answerIndexes, isCorrect, timeLimit }) => {
    const room = rooms[pin];
    if (!room || room.state !== 'question') return;

    const player = room.players[socket.id] as any;
    if (!player || player.hasAnswered) return;

    const timeTaken = Date.now() - room.questionStartTime;
    player.hasAnswered = true;
    player.totalResponseTime += timeTaken;
    
    room.answers[socket.id] = Array.isArray(answerIndexes) ? answerIndexes[0] : answerIndexes;

    if (isCorrect) {
      player.lastAnswerCorrect = true;
      player.streak++;
      
      // 1. Base + Speed Bonus (Max 1000)
      const speedBonus = Math.max(0, 1 - (timeTaken / (timeLimit * 1000)));
      const basePoints = 500;
      const speedPoints = Math.round(500 * speedBonus);
      let points = basePoints + speedPoints;
      
      // 2. Streak Bonus
      let streakBonus = 0;
      if (player.streak >= 5) streakBonus = 500;
      else if (player.streak >= 3) streakBonus = 200;
      else if (player.streak >= 2) streakBonus = 100;
      
      points += streakBonus;
      player.score += points;
      player.lastPointsEarned = points;
      player.lastSpeedBonus = speedPoints;
      player.lastStreakBonus = streakBonus;
    } else {
      player.lastAnswerCorrect = false;
      player.streak = 0;
      player.lastPointsEarned = 0;
    }

    // Notify host about the answer
    io.to(room.hostId).emit('player_answered', {
      playerId: socket.id,
      answerIndexes,
      totalAnswers: Object.keys(room.answers).length
    });

    // Check if everyone has answered
    if (Object.keys(room.answers).length === Object.keys(room.players).length) {
      io.to(room.hostId).emit('all_answered');
    }
  });

  // Host shows leaderboard
  socket.on('show_leaderboard', (pin) => {
    const room = rooms[pin];
    if (room && room.hostId === socket.id) {
      room.state = 'leaderboard';
      const leaderboard = Object.values(room.players)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.totalResponseTime - b.totalResponseTime; // Tie-breaker: lower time is better
        })
        .slice(0, 5);
      io.to(pin).emit('leaderboard_updated', leaderboard);
    }
  });

  // Host ends game
  socket.on('end_game', (pin) => {
    const room = rooms[pin];
    if (room && room.hostId === socket.id) {
      room.state = 'podium';
      const finalStandings = Object.values(room.players)
        .sort((a, b) => b.score - a.score);
      io.to(pin).emit('game_ended', finalStandings);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Handle player disconnect
    for (const pin in rooms) {
      const room = rooms[pin];
      if (room.players[socket.id]) {
        delete room.players[socket.id];
        io.to(room.hostId).emit('player_left', Object.values(room.players));
      }
      // If host disconnects, end the room
      if (room.hostId === socket.id) {
        io.to(pin).emit('host_disconnected');
        delete rooms[pin];
      }
    }
  });
});

server.listen(port, hostname, () => {
  console.log(`> Ready on http://${hostname}:${port}`);
  console.log(`> Environment: ${process.env.NODE_ENV}`);
});
