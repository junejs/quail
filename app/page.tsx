'use client';

import { useState, useEffect, Suspense, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
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
    isAuthenticated, authEnabled, logout, checkAuth
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

      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
        {/* Language Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all flex items-center gap-3 px-5 group"
            title={t('language.select')}
          >
            <Globe size={18} className="group-hover:rotate-12 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{locale === 'en' ? 'English' : '中文'}</span>
          </button>
          <AnimatePresence>
            {showLangMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full right-0 mt-3 w-32 bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50"
              >
                <button
                  onClick={() => { setLocale('en'); setShowLangMenu(false); }}
                  className={`w-full px-5 py-3 text-left text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-colors ${locale === 'en' ? 'text-indigo-400' : 'text-white/40'}`}
                >
                  EN
                </button>
                <button
                  onClick={() => { setLocale('zh'); setShowLangMenu(false); }}
                  className={`w-full px-5 py-3 text-left text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-colors ${locale === 'zh' ? 'text-indigo-400' : 'text-white/40'}`}
                >
                  中文
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {authEnabled && isAuthenticated && (
          <button
            onClick={() => logout()}
            className="p-3 rounded-2xl bg-rose-500/5 backdrop-blur-xl border border-rose-500/20 text-rose-400/70 hover:bg-rose-500/10 hover:text-rose-400 transition-all flex items-center gap-3 px-5 group"
            title={t('common.logout')}
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('common.logout')}</span>
          </button>
        )}
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/[0.03] backdrop-blur-3xl p-10 rounded-[3rem] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] text-center relative overflow-hidden group/card">
          {/* Decorative inner glow */}
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none group-hover/card:bg-indigo-500/30 transition-colors duration-1000" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full pointer-events-none group-hover/card:bg-purple-500/30 transition-colors duration-1000" />

          <motion.h1
            initial={{ letterSpacing: "0.5em", opacity: 0, filter: "blur(10px)" }}
            animate={{ letterSpacing: "0.02em", opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-8xl font-black text-white mb-2 drop-shadow-[0_0_20px_rgba(99,102,241,0.3)] relative"
          >
            QUAIL
            <motion.span
              animate={{
                opacity: [0, 0.5, 0],
                x: [-4, 4, -4],
                letterSpacing: "0.02em"
              }}
              transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 4 }}
              className="absolute inset-0 text-indigo-400 blur-[3px] pointer-events-none select-none mix-blend-screen"
            >
              QUAIL
            </motion.span>
          </motion.h1>
          <p className="text-white/30 font-black tracking-[0.2em] uppercase text-[10px] mb-12 ml-[0.2em]">{t('home.subtitle')}</p>

          <AnimatePresence mode="wait">
            {!showHostOptions ? (
              <motion.div
                key="join-mode"
                initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                transition={{ duration: 0.4, ease: "circOut" }}
              >
                <form onSubmit={handleJoinGame} className="space-y-5 mb-10">
                  <div className="group relative">
                    <input
                      type="text"
                      placeholder={t('home.pinPlaceholder')}
                      value={inputPin}
                      onChange={(e) => setInputPin(e.target.value)}
                      className="w-full text-center text-4xl font-black p-6 bg-white/[0.02] border border-white/10 rounded-[2rem] text-white placeholder:text-white/10 focus:border-indigo-500/50 focus:bg-white/[0.05] focus:ring-[12px] focus:ring-indigo-500/10 outline-none transition-all tracking-[0.2em] shadow-inner"
                      maxLength={6}
                    />
                    <motion.div
                      layoutId="input-glow"
                      className="absolute inset-0 rounded-[2rem] bg-indigo-500/10 opacity-0 group-focus-within:opacity-100 blur-2xl transition-opacity pointer-events-none"
                    />
                  </div>
                  <div className="group relative">
                    <input
                      type="text"
                      placeholder={t('home.nicknamePlaceholder')}
                      value={inputNickname}
                      onChange={(e) => setInputNickname(e.target.value)}
                      className="w-full text-center text-xl font-black p-6 bg-white/[0.02] border border-white/10 rounded-[2rem] text-white placeholder:text-white/10 focus:border-indigo-500/50 focus:bg-white/[0.05] focus:ring-[12px] focus:ring-indigo-500/10 outline-none transition-all shadow-inner"
                      maxLength={15}
                    />
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-rose-400 font-black text-[10px] uppercase tracking-widest"
                    >
                      {error}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={!isConnected || isJoining}
                    className="group relative w-full bg-indigo-600 text-white font-black text-2xl p-6 rounded-[2rem] hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] overflow-hidden"
                  >
                    <span className="relative z-10 uppercase tracking-wider">{isJoining ? t('home.joining') : t('home.joinGame')}</span>
                    <motion.div
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, ease: "linear" }}
                      className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-30deg] pointer-events-none"
                    />
                  </button>
                </form>

                <div className="relative py-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-[#0c0c0c] px-6 text-[9px] text-white/20 font-black uppercase tracking-[0.5em]">{t('home.orHostSession')}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (authEnabled && !isAuthenticated) {
                      router.push('/login?callback=' + encodeURIComponent('/'));
                      return;
                    }
                    setShowHostOptions(true);
                  }}
                  disabled={!isConnected}
                  className="w-full bg-white/5 text-white/40 font-black text-[10px] uppercase tracking-[0.3em] p-5 rounded-2xl border border-white/5 hover:bg-white/10 hover:text-white hover:border-white/10 transition-all flex items-center justify-center gap-3 group"
                >
                  <Settings size={14} className="group-hover:rotate-90 transition-transform duration-500" />
                  {t('home.hostOptions')}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="host-mode"
                initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                transition={{ duration: 0.4, ease: "circOut" }}
                className="space-y-8"
              >
                <div className="text-left">
                  <label className="block text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-5 ml-2">{t('home.selectQuiz')}</label>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {quizzes.map((quiz) => (
                      <button
                        key={quiz.id}
                        onClick={() => setSelectedQuiz(quiz)}
                        className={`w-full text-left p-5 rounded-[1.5rem] border transition-all flex justify-between items-center group/item relative overflow-hidden ${selectedQuiz?.id === quiz.id
                          ? 'border-indigo-500/50 bg-indigo-500/10 text-white shadow-[0_0_30px_rgba(99,102,241,0.1)]'
                          : 'border-white/5 bg-white/[0.02] text-white/40 hover:border-white/10 hover:bg-white/[0.05]'
                          }`}
                      >
                        <div className="flex flex-col relative z-10">
                          <span className="font-black text-sm uppercase tracking-wider group-hover/item:text-white transition-colors">{quiz.title}</span>
                          <span className="text-[10px] font-bold opacity-30 mt-1 uppercase tracking-widest">{quiz.questions.length} {t('common.questions')}</span>
                        </div>
                        {selectedQuiz?.id === quiz.id && (
                          <motion.div
                            layoutId="active-quiz-indicator"
                            className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,1)]"
                          />
                        )}
                        {/* Hover background effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => router.push('/create')}
                    className="flex flex-col items-center gap-3 p-6 bg-white/[0.02] border border-white/5 rounded-[1.5rem] text-white/40 hover:border-indigo-500/30 hover:bg-indigo-500/5 hover:text-white transition-all group"
                  >
                    <PlusCircle size={24} className="group-hover:scale-110 group-hover:rotate-90 transition-all duration-500" />
                    <span className="font-black text-[9px] uppercase tracking-[0.3em]">{t('common.create')}</span>
                  </button>
                  <button
                    onClick={() => router.push('/history')}
                    className="flex flex-col items-center gap-3 p-6 bg-white/[0.02] border border-white/5 rounded-[1.5rem] text-white/40 hover:border-amber-500/30 hover:bg-amber-500/5 hover:text-white transition-all group"
                  >
                    <History size={24} className="group-hover:scale-110 transition-transform" />
                    <span className="font-black text-[9px] uppercase tracking-[0.3em]">{t('common.history')}</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (authEnabled && !isAuthenticated) {
                      router.push('/login?callback=' + encodeURIComponent('/'));
                      return;
                    }
                    handleHostGame();
                  }}
                  disabled={!selectedQuiz}
                  className="group relative w-full flex items-center justify-center gap-4 p-6 bg-indigo-600 rounded-[2rem] text-white hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] disabled:opacity-50 overflow-hidden"
                >
                  <Play size={24} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                  <span className="font-black text-xl uppercase tracking-[0.1em] relative z-10">{t('home.startLobby')}</span>
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5, ease: "linear" }}
                    className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-30deg] pointer-events-none"
                  />
                </button>

                <button
                  onClick={() => setShowHostOptions(false)}
                  className="text-white/20 font-black text-[9px] uppercase tracking-[0.5em] hover:text-white/50 transition-colors flex items-center justify-center gap-2 group mx-auto"
                >
                  <span className="group-hover:-translate-x-1 transition-transform">←</span> {t('common.back')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {!isConnected && (
            <div className="mt-10 pt-8 border-t border-white/5">
              <p className="text-[9px] text-white/20 flex items-center justify-center gap-3 font-black uppercase tracking-[0.4em]">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                {t('home.connecting')}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Footer info */}
      <div className="absolute bottom-8 text-white/5 text-[9px] font-black uppercase tracking-[0.8em] select-none hover:text-white/20 transition-colors duration-1000">
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
