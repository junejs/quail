'use client';

import { useState, useEffect, Suspense, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { useSocket } from '@/components/socket-provider';
import { useGameStore } from '@/lib/store';
import { sampleQuiz } from '@/lib/quiz-data';
import { PlusCircle, Play, Settings, History, LogOut, Globe } from 'lucide-react';
import { audioManager } from '@/lib/audio-manager';
import { useTranslation } from '@/lib/translations';
import { useI18nStore, initLocale } from '@/lib/i18n';

// 简单的 hook 用于订阅 store 变化
function useStore<T>(store: { getState: () => T; subscribe: (listener: () => void) => () => void }, selector: (state: T) => any) {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState())
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { socket, isConnected } = useSocket();
  const {
    setPin, setNickname, setAvatar, setIsHost, setGameState,
    quizzes, addQuiz, fetchQuizzes, selectedQuiz, setSelectedQuiz,
    sessionId, setSessionId, setPlayers,
    isAuthenticated, ldapEnabled, logout, checkAuth
  } = useGameStore();
  const { t } = useTranslation();
  const locale = useStore(useI18nStore, (state) => state.locale);
  const setLocale = useI18nStore((state) => state.setLocale);

  const [inputPin, setInputPin] = useState(searchParams.get('pin') || '');
  const [inputNickname, setInputNickname] = useState('');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showHostOptions, setShowHostOptions] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Initialize locale on mount
  useEffect(() => {
    initLocale();
  }, []);

  useEffect(() => {
    const pinFromUrl = searchParams.get('pin');
    if (pinFromUrl && !inputPin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInputPin(pinFromUrl);
    }
  }, [searchParams, inputPin]);

  useEffect(() => {
    if (!sessionId && typeof window !== 'undefined') {
      const id = localStorage.getItem('quail_sessionId') || Math.random().toString(36).substring(2, 15);
      setSessionId(id);
    }
  }, [sessionId, setSessionId]);

  useEffect(() => {
    const init = async () => {
      await fetchQuizzes();
      await checkAuth();
    };
    init();
  }, [fetchQuizzes, checkAuth]);

  useEffect(() => {
    // Initialize with sample quiz if no quizzes exist after fetching
    if (quizzes.length === 0) {
      addQuiz(sampleQuiz);
    }
  }, [quizzes.length, addQuiz]);


  useEffect(() => {
    if (!socket) return;

    const onJoinedRoom = ({ pin, player, quiz }: { pin: string, player: any, quiz: any }) => {
      setPin(pin);
      setNickname(player.nickname);
      setAvatar(player.avatar);
      setIsHost(false);
      setGameState('lobby');
      setSelectedQuiz(quiz);
      router.push('/play');
    };

    const onRejoinedRoom = ({ pin, isHost, player, quiz, gameState, players }: any) => {
      setPin(pin);
      setIsHost(isHost);
      setGameState(gameState);
      setSelectedQuiz(quiz);
      if (isHost) {
        setPlayers(players || []);
        router.push('/host');
      } else if (player) {
        setNickname(player.nickname);
        setAvatar(player.avatar);
        router.push('/play');
      }
    };

    const onError = (msg: string) => {
      setError(msg);
      setIsJoining(false);
    };

    socket.on('joined_room', onJoinedRoom);
    socket.on('rejoined_room', onRejoinedRoom);
    socket.on('error', onError);

    return () => {
      socket.off('joined_room', onJoinedRoom);
      socket.off('rejoined_room', onRejoinedRoom);
      socket.off('error', onError);
    };
  }, [socket, router, setPin, setNickname, setAvatar, setIsHost, setGameState, setSelectedQuiz, setPlayers]);

  const handleHostGame = () => {
    if (!socket) return;
    audioManager?.playSfx('join'); // Unlock audio
    const quizToUse = selectedQuiz || quizzes[0];
    if (!quizToUse) return;

    setSelectedQuiz(quizToUse);
    setIsHost(true);
    socket.emit('create_room', { quiz: quizToUse, sessionId });
    socket.once('room_created', (pin: string) => {
      setPin(pin);
      setGameState('lobby');
      router.push('/host');
    });
  };

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket) return;
    audioManager?.playSfx('join'); // Unlock audio
    if (!inputPin || !inputNickname) {
      setError(t('home.error.enterPinAndNickname'));
      return;
    }

    setIsJoining(true);
    setError('');

    socket.emit('join_room', { pin: inputPin, nickname: inputNickname, sessionId });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans overflow-hidden relative">
      {/* Floating Elements */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 5, 0]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-[15%] text-indigo-500/20 select-none hidden lg:block z-0"
      >
        <PlusCircle size={120} />
      </motion.div>
      <motion.div
        animate={{
          y: [0, 20, 0],
          rotate: [0, -5, 0]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 right-[15%] text-purple-500/20 select-none hidden lg:block z-0"
      >
        <Play size={140} />
      </motion.div>

      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        {/* Language Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="p-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2 px-4"
            title={t('language.select')}
          >
            <Globe size={18} />
            <span className="text-xs font-black uppercase tracking-widest">{locale === 'en' ? 'EN' : '中文'}</span>
          </button>
          {showLangMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full right-0 mt-2 bg-zinc-800/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-xl"
            >
              <button
                onClick={() => { setLocale('en'); setShowLangMenu(false); }}
                className={`w-full px-4 py-2 text-left text-sm font-medium hover:bg-white/10 transition-colors ${locale === 'en' ? 'text-indigo-400' : 'text-white/60'}`}
              >
                English
              </button>
              <button
                onClick={() => { setLocale('zh'); setShowLangMenu(false); }}
                className={`w-full px-4 py-2 text-left text-sm font-medium hover:bg-white/10 transition-colors ${locale === 'zh' ? 'text-indigo-400' : 'text-white/60'}`}
              >
                中文
              </button>
            </motion.div>
          )}
        </div>
        {ldapEnabled && isAuthenticated && (
          <button
            onClick={() => logout()}
            className="p-3 rounded-full bg-rose-500/10 backdrop-blur-md border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all flex items-center gap-2 px-4"
            title={t('common.logout')}
          >
            <LogOut size={20} />
            <span className="text-xs font-black uppercase tracking-widest">{t('common.logout')}</span>
          </button>
        )}
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 shadow-2xl text-center overflow-hidden">
          {/* Decorative inner glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/30 blur-3xl rounded-full pointer-events-none" />

          <motion.h1
            initial={{ letterSpacing: "0.2em", opacity: 0 }}
            animate={{ letterSpacing: "-0.05em", opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-7xl font-black text-white mb-2 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] relative group"
          >
            quail
            <motion.span
              animate={{
                opacity: [0, 1, 0],
                x: [-2, 2, -2],
                skewX: [-10, 10, -10]
              }}
              transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
              className="absolute inset-0 text-indigo-500/30 blur-[2px] pointer-events-none select-none"
            >
              quail
            </motion.span>
            <motion.span
              animate={{
                opacity: [0, 0.8, 0],
                x: [2, -2, 2],
                skewX: [10, -10, 10]
              }}
              transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 2.5 }}
              className="absolute inset-0 text-rose-500/30 blur-[2px] pointer-events-none select-none"
            >
              quail
            </motion.span>
          </motion.h1>
          <p className="text-indigo-200/60 font-medium tracking-widest uppercase text-[10px] mb-10">{t('home.subtitle')}</p>

          {!showHostOptions ? (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <form onSubmit={handleJoinGame} className="space-y-4 mb-8">
                <div className="group relative">
                  <input
                    type="text"
                    placeholder={t('home.pinPlaceholder')}
                    value={inputPin}
                    onChange={(e) => setInputPin(e.target.value)}
                    className="w-full text-center text-3xl font-black p-5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:border-indigo-500 focus:bg-white/10 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all tracking-widest"
                    maxLength={6}
                  />
                  <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity pointer-events-none" />
                </div>
                <div className="group relative">
                  <input
                    type="text"
                    placeholder={t('home.nicknamePlaceholder')}
                    value={inputNickname}
                    onChange={(e) => setInputNickname(e.target.value)}
                    className="w-full text-center text-xl font-bold p-5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:border-indigo-500 focus:bg-white/10 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"
                    maxLength={15}
                  />
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-rose-400 font-bold text-sm"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={!isConnected || isJoining}
                  className="group relative w-full bg-indigo-600 text-white font-black text-2xl p-5 rounded-2xl hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(79,70,229,0.4)] overflow-hidden"
                >
                  <span className="relative z-10">{isJoining ? t('home.joining') : t('home.joinGame')}</span>
                  {/* Button shine effect */}
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1, ease: "linear" }}
                    className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] pointer-events-none"
                  />
                </button>
              </form>

              <div className="relative py-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#1a1a1a] px-4 text-[10px] text-white/30 font-black uppercase tracking-[0.3em]">{t('home.orHostSession')}</span>
                </div>
              </div>

              <button
                onClick={() => setShowHostOptions(true)}
                disabled={!isConnected}
                className="w-full bg-white/5 text-white/70 font-bold text-sm p-4 rounded-xl border border-white/10 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Settings size={16} />
                {t('home.hostOptions')}
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-left">
                <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3">{t('home.selectQuiz')}</label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                  {quizzes.map((quiz) => (
                    <button
                      key={quiz.id}
                      onClick={() => setSelectedQuiz(quiz)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex justify-between items-center group ${selectedQuiz?.id === quiz.id
                        ? 'border-indigo-500 bg-indigo-500/20 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10'
                        }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-sm group-hover:text-white transition-colors">{quiz.title}</span>
                        <span className="text-[10px] opacity-40">{quiz.questions.length} {t('common.questions')}</span>
                      </div>
                      {selectedQuiz?.id === quiz.id && (
                        <motion.div layoutId="active-quiz" className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,1)]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => router.push('/create')}
                  className="flex flex-col items-center gap-2 p-5 bg-white/5 border border-white/10 rounded-2xl text-white/60 hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-white transition-all group"
                >
                  <PlusCircle size={24} className="group-hover:scale-110 transition-transform" />
                  <span className="font-black text-[10px] uppercase tracking-widest">{t('common.create')}</span>
                </button>
                <button
                  onClick={() => router.push('/history')}
                  className="flex flex-col items-center gap-2 p-5 bg-white/5 border border-white/10 rounded-2xl text-white/60 hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-white transition-all group"
                >
                  <History size={24} className="group-hover:scale-110 transition-transform" />
                  <span className="font-black text-[10px] uppercase tracking-widest">{t('common.history')}</span>
                </button>
              </div>

              <button
                onClick={handleHostGame}
                disabled={!selectedQuiz}
                className="group relative w-full flex items-center justify-center gap-3 p-5 bg-indigo-600 rounded-2xl text-white hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] disabled:opacity-50 overflow-hidden"
              >
                <Play size={24} fill="currentColor" />
                <span className="font-black text-lg uppercase tracking-wider relative z-10">{t('home.startLobby')}</span>
                {/* Button shine effect */}
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1.5, ease: "linear" }}
                  className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] pointer-events-none"
                />
              </button>

              <button
                onClick={() => setShowHostOptions(false)}
                className="text-white/30 font-black text-[10px] uppercase tracking-widest hover:text-white/60 transition-colors"
              >
                ← {t('common.back')}
              </button>
            </motion.div>
          )}

          {!isConnected && (
            <div className="mt-8 pt-6 border-t border-white/5">
              <p className="text-[10px] text-white/20 flex items-center justify-center gap-2 font-black uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
                {t('home.connecting')}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Footer info */}
      <div className="absolute bottom-6 text-white/10 text-[10px] font-black uppercase tracking-[0.5em] select-none">
        {t('home.version')}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-100 flex items-center justify-center font-sans">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
