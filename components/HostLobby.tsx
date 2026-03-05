import { AnimatePresence, motion } from 'motion/react';
import { QrCode } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Quiz } from '@/lib/store';

type HostLobbyProps = {
  pin: string;
  players: any[];
  selectedQuiz: Quiz;
  showQR: boolean;
  setShowQR: (show: boolean) => void;
  joinUrl: string;
  onStartGame: () => void;
  t: (key: string) => string;
};

export default function HostLobby({
  pin,
  players,
  selectedQuiz,
  showQR,
  setShowQR,
  joinUrl,
  onStartGame,
  t
}: HostLobbyProps) {
  return (
    <motion.div
      key="lobby"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col"
    >
      <div className="bg-white/10 backdrop-blur-xl p-8 border-b border-white/10 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-12">
          <div>
            <h2 className="text-sm font-black text-white/40 uppercase tracking-[0.3em] mb-2">{t('host.joinAt')}</h2>
            <div className="flex items-center gap-8">
              <div className="relative group">
                <motion.h1
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-9xl font-black tracking-tighter text-white drop-shadow-[0_0_30px_rgba(99,102,241,0.5)] relative z-10"
                >
                  {pin}
                </motion.h1>
                {/* Scanning line effect */}
                <motion.div
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-1 bg-indigo-500/50 blur-[2px] z-20 pointer-events-none"
                />
                <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full -z-10 group-hover:bg-indigo-500/20 transition-colors" />
              </div>
              <button
                onClick={() => setShowQR(!showQR)}
                className={`p-5 rounded-3xl transition-all flex items-center gap-3 font-black uppercase tracking-widest text-sm border relative overflow-hidden ${showQR ? 'bg-white text-indigo-900 border-white shadow-[0_0_30px_rgba(255,255,255,0.4)]' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                  }`}
                title={t('host.scanToJoin')}
              >
                <QrCode size={24} className="relative z-10" />
                <span className="relative z-10">{t('host.scanToJoin')}</span>
                {showQR && (
                  <motion.div
                    layoutId="qr-active-bg"
                    className="absolute inset-0 bg-white"
                  />
                )}
              </button>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,1)]" />
              <p className="text-lg font-bold text-white/60">{t('host.quiz')}: <span className="text-white">{selectedQuiz.title}</span></p>
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStartGame}
          disabled={players.length === 0}
          className="bg-white text-indigo-900 px-16 py-8 rounded-[2.5rem] text-4xl font-black hover:bg-indigo-50 disabled:opacity-30 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] uppercase tracking-tighter"
        >
          {t('host.startGame')}
        </motion.button>
      </div>
      <div className="flex-1 p-12 relative">
        <AnimatePresence>
          {showQR && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0502]/60 backdrop-blur-xl p-8"
            >
              <div className="bg-white p-16 rounded-[4rem] shadow-[0_0_60px_rgba(255,255,255,0.2)] flex flex-col items-center text-center border-[12px] border-indigo-600">
                <h2 className="text-5xl font-black text-zinc-900 mb-10 uppercase tracking-tighter">{t('host.scanToJoinGame')}</h2>
                <div className="bg-white p-8 rounded-[3rem] shadow-inner border-4 border-zinc-100">
                  <QRCodeCanvas
                    value={joinUrl}
                    size={400}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="mt-10">
                  <p className="text-xl font-black text-zinc-400 uppercase tracking-widest mb-2">{t('host.gamePin')}</p>
                  <p className="text-8xl font-black text-indigo-600 tracking-widest">{pin}</p>
                </div>
                <button
                  onClick={() => setShowQR(false)}
                  className="mt-12 bg-zinc-900 text-white px-16 py-5 rounded-3xl text-2xl font-black hover:bg-zinc-800 transition-all uppercase tracking-widest"
                >
                  {t('host.close')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between items-center mb-10">
          <h3 className="text-3xl font-black text-white/80 uppercase tracking-widest">{t('host.players')} ({players.length})</h3>
        </div>
        <div className="flex flex-wrap gap-6">
          <AnimatePresence>
            {players.map((p) => (
              <motion.div
                layout
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                key={p.id}
                className={`bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl shadow-xl text-2xl font-black flex items-center gap-4 border transition-all ${p.isDisconnected ? 'border-rose-500/50 text-white/30 grayscale' : 'border-white/10 text-white'
                  }`}
              >
                <span className="text-4xl">{p.avatar}</span>
                {p.nickname}
                {p.isDisconnected && <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-2">{t('host.offline')}</span>}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
