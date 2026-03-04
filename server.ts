import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { getDb, saveQuiz, getAllQuizzes, saveGameResult, getGameResults } from './lib/db';
import jwt from 'jsonwebtoken';
import { serialize, parse as parseCookie } from 'cookie';
import { authenticateLDAP } from './lib/ldap';
import { AVATARS } from './lib/constants';

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
  sessionId: string;
  nickname: string;
  avatar: string;
  score: number;
  streak: number;
  scoreHistory: number[];
  hasAnswered: boolean;
  lastAnswerCorrect: boolean;
  totalResponseTime: number; // For tie-breaking
  lastPointsEarned?: number;
  lastSpeedBonus?: number;
  lastStreakBonus?: number;
  isDisconnected: boolean;
}

function getRandomAvatar() {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

interface Room {
  pin: string;
  hostId: string;
  hostSessionId: string;
  players: Record<string, Player>;
  state: 'lobby' | 'question' | 'question_result' | 'leaderboard' | 'podium';
  currentQuestionIndex: number;
  questionStartTime: number;
  answers: Record<string, number>; // playerId -> optionIndex
  quiz: any;
}

const rooms: Record<string, Room> = {};

const JWT_SECRET = process.env.JWT_SECRET || 'quail-secret-key';
const LDAP_ENABLED = process.env.NEXT_PUBLIC_LDAP_ENABLED === 'true';

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

    if (pathname === '/api/quizzes' && req.method === 'GET') {
      const quizzes = await getAllQuizzes();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(quizzes));
      return;
    }

    if (pathname === '/api/quizzes' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const quiz = JSON.parse(body);
          await saveQuiz(quiz);
          res.statusCode = 201;
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
      return;
    }

    if (pathname === '/api/results' && req.method === 'GET') {
      const results = await getGameResults();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(results));
      return;
    }

    // Auth Routes
    if (pathname === '/api/auth/status' && req.method === 'GET') {
      if (!LDAP_ENABLED) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ authenticated: true, ldapEnabled: false }));
        return;
      }

      const cookies = parseCookie(req.headers.cookie || '');
      const token = cookies.auth_token;

      if (!token) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ authenticated: false, ldapEnabled: true }));
        return;
      }

      try {
        jwt.verify(token, JWT_SECRET);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ authenticated: true, ldapEnabled: true }));
      } catch (e) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ authenticated: false, ldapEnabled: true }));
      }
      return;
    }

    if (pathname === '/api/auth/login' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const { username, password } = JSON.parse(body);
          const isAuthenticated = await authenticateLDAP(username, password);

          if (isAuthenticated) {
            const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
            res.setHeader('Set-Cookie', serialize('auth_token', token, {
              path: '/',
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              maxAge: 60 * 60 * 24 // 24 hours
            }));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } else {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Invalid credentials' }));
          }
        } catch (e) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Invalid request' }));
        }
      });
      return;
    }

    if (pathname === '/api/auth/logout' && req.method === 'POST') {
      res.setHeader('Set-Cookie', serialize('auth_token', '', {
        path: '/',
        maxAge: -1
      }));
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true }));
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
  socket.on('create_room', ({ quiz, sessionId }) => {
    const pin = generatePin();
    rooms[pin] = {
      pin,
      hostId: socket.id,
      hostSessionId: sessionId,
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
  socket.on('join_room', ({ pin, nickname, sessionId }) => {
    const room = rooms[pin];
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }
    if (room.state !== 'lobby') {
      socket.emit('error', 'Game already started');
      return;
    }

    // Check if player with this sessionId already exists
    const existingPlayer = Object.values(room.players).find(p => p.sessionId === sessionId);
    if (existingPlayer) {
      existingPlayer.id = socket.id;
      existingPlayer.isDisconnected = false;
      socket.join(pin);
      socket.emit('joined_room', { pin, player: existingPlayer, quiz: room.quiz });
      io.to(room.hostId).emit('player_joined', Object.values(room.players));
      return;
    }

    const player: Player = {
      id: socket.id,
      sessionId,
      nickname,
      avatar: getRandomAvatar(),
      score: 0,
      streak: 0,
      scoreHistory: [0],
      hasAnswered: false,
      lastAnswerCorrect: false,
      totalResponseTime: 0,
      isDisconnected: false,
    };

    room.players[socket.id] = player;
    socket.join(pin);
    socket.emit('joined_room', { pin, player, quiz: room.quiz });
    
    // Notify host
    io.to(room.hostId).emit('player_joined', Object.values(room.players));
  });

  socket.on('change_avatar', ({ pin, avatar }) => {
    const room = rooms[pin];
    if (room && room.players[socket.id]) {
      room.players[socket.id].avatar = avatar;
      // Notify host to update the player list
      io.to(room.hostId).emit('player_joined', Object.values(room.players));
    }
  });

  // Player rejoins a room (after refresh)
  socket.on('rejoin_room', ({ pin, sessionId }) => {
    const room = rooms[pin];
    if (!room) {
      socket.emit('rejoin_failed', 'Room not found');
      return;
    }

    // Check if it's the host rejoining
    if (room.hostSessionId === sessionId) {
      room.hostId = socket.id;
      socket.join(pin);
      socket.emit('rejoined_room', { 
        pin, 
        isHost: true,
        quiz: room.quiz,
        gameState: room.state,
        currentQuestionIndex: room.currentQuestionIndex,
        players: Object.values(room.players)
      });
      return;
    }

    const player = Object.values(room.players).find(p => p.sessionId === sessionId);
    if (!player) {
      socket.emit('rejoin_failed', 'Session not found');
      return;
    }

    // Update player socket ID
    const oldId = player.id;
    delete room.players[oldId];
    player.id = socket.id;
    player.isDisconnected = false;
    room.players[socket.id] = player;

    socket.join(pin);
    socket.emit('rejoined_room', { 
      pin, 
      isHost: false,
      player, 
      quiz: room.quiz,
      gameState: room.state,
      currentQuestionIndex: room.currentQuestionIndex
    });

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
          pointsEarned: p.lastPointsEarned || 0,
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
  socket.on('submit_answer', ({ pin, answerIndexes }) => {
    const room = rooms[pin];
    if (!room || room.state !== 'question') return;

    const player = room.players[socket.id];
    if (!player || player.hasAnswered) return;

    const currentQuestion = room.quiz.questions[room.currentQuestionIndex];
    if (!currentQuestion) return;

    const timeTaken = Date.now() - room.questionStartTime;
    const timeLimit = currentQuestion.timeLimit || 20;
    
    player.hasAnswered = true;
    player.totalResponseTime += timeTaken;
    
    // Server-side correctness check
    let isCorrect = false;
    if (currentQuestion.type === 'multiple') {
      const submittedIndices = Array.isArray(answerIndexes) ? answerIndexes : [answerIndexes];
      const correctIndices = currentQuestion.correctAnswerIndexes || [];
      isCorrect = submittedIndices.length === correctIndices.length && 
                  submittedIndices.every((idx: number) => correctIndices.includes(idx));
      room.answers[socket.id] = submittedIndices[0]; // For host display, just use the first one
    } else {
      const submittedIndex = Array.isArray(answerIndexes) ? answerIndexes[0] : answerIndexes;
      const correctIndices = currentQuestion.correctAnswerIndexes || [];
      isCorrect = correctIndices.includes(submittedIndex);
      room.answers[socket.id] = submittedIndex;
    }

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
      
      // Update score history for all players
      Object.values(room.players).forEach(p => {
        p.scoreHistory.push(p.score);
      });

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
  socket.on('end_game', async (pin) => {
    const room = rooms[pin];
    if (room && room.hostId === socket.id) {
      room.state = 'podium';
      const finalStandings = Object.values(room.players)
        .sort((a, b) => b.score - a.score);
      
      // Save game result to DB
      try {
        await saveGameResult({
          quiz_id: room.quiz.id,
          quiz_title: room.quiz.title,
          pin: room.pin,
          standings: finalStandings
        });
      } catch (err) {
        console.error('Failed to save game result:', err);
      }

      io.to(pin).emit('game_ended', finalStandings);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Handle player disconnect
    for (const pin in rooms) {
      const room = rooms[pin];
      const player = room.players[socket.id];
      if (player) {
        player.isDisconnected = true;
        // Don't delete immediately to allow rejoining
        io.to(room.hostId).emit('player_joined', Object.values(room.players));
      }
      // If host disconnects, end the room after a short delay
      if (room.hostId === socket.id) {
        setTimeout(() => {
          // Check if host reconnected (id might have changed)
          if (rooms[pin] && rooms[pin].hostId === socket.id) {
            io.to(pin).emit('host_disconnected');
            delete rooms[pin];
          }
        }, 5000);
      }
    }
  });
});

server.listen(port, hostname, () => {
  console.log(`> Ready on http://${hostname}:${port}`);
  console.log(`> Environment: ${process.env.NODE_ENV}`);
});
