import { AnimatePresence, motion } from 'motion/react';
import { Shuffle } from 'lucide-react';
import { AVATAR_GROUPS } from '@/lib/constants';

type PlayLobbyProps = {
    avatar: string | null;
    nickname: string | null;
    activeGroupId: string;
    setActiveGroupId: (id: string) => void;
    onShuffleAvatar: () => void;
    onAvatarChange: (avatar: string) => void;
    t: (key: string) => string;
};

export default function PlayLobby({
    avatar,
    nickname,
    activeGroupId,
    setActiveGroupId,
    onShuffleAvatar,
    onAvatarChange,
    t
}: PlayLobbyProps) {
    return (
        <motion.div
            key="lobby"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center"
        >
            <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="bg-white/10 backdrop-blur-xl p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] border border-white/20 shadow-2xl w-full max-w-xl flex flex-col items-center"
            >
                <h1 className="text-3xl sm:text-5xl font-black text-white mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{t('play.youreIn')}</h1>
                <p className="text-sm sm:text-xl font-bold text-white/50 uppercase tracking-widest mb-6">{t('play.pickCharacter')}</p>

                <div className="relative mb-8 group">
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-indigo-500/20 blur-xl rounded-[100%] scale-x-150" />
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-white/10 rounded-[100%] border border-white/20" />

                    <motion.div
                        key={avatar || 'avatar'}
                        initial={{ scale: 0.5, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="text-8xl sm:text-9xl drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] cursor-pointer relative z-10"
                        onClick={onShuffleAvatar}
                    >
                        {avatar}
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-white/20 blur-3xl rounded-full -z-10"
                        />
                    </motion.div>

                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 180 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onShuffleAvatar}
                        className="absolute -bottom-2 -right-2 bg-indigo-500 text-white p-3 rounded-full shadow-lg border-2 border-white/20 hover:bg-indigo-400 transition-colors z-20"
                        title="Randomize"
                    >
                        <Shuffle size={20} />
                    </motion.button>
                </div>

                <div className="flex w-full overflow-x-auto gap-2 mb-6 bg-black/20 p-1.5 rounded-2xl no-scrollbar snap-x">
                    {AVATAR_GROUPS.map((group) => (
                        <button
                            key={group.id}
                            onClick={() => setActiveGroupId(group.id)}
                            className={`flex-shrink-0 py-2 px-4 sm:px-6 rounded-xl text-xs sm:text-sm font-black transition-all uppercase tracking-tighter snap-center ${activeGroupId === group.id
                                ? 'bg-white text-indigo-900 shadow-lg'
                                : 'text-white/40 hover:text-white/70'
                                }`}
                        >
                            {t(group.name)}
                        </button>
                    ))}
                </div>

                <div className="w-full bg-black/10 rounded-3xl p-4 mb-8">
                    <div
                        className="grid grid-cols-5 sm:grid-cols-6 gap-3 sm:gap-4 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar"
                    >
                        <AnimatePresence mode="popLayout">
                            {Array.from(new Set(AVATAR_GROUPS.find(g => g.id === activeGroupId)?.avatars || [])).map((a) => (
                                <motion.button
                                    key={`${activeGroupId}-${a}`}
                                    layout
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    whileHover={{ scale: 1.2, zIndex: 10 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => onAvatarChange(a)}
                                    className={`text-3xl sm:text-4xl p-2 rounded-xl transition-all duration-200 ${avatar === a
                                        ? 'bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.2)] scale-110 ring-2 ring-white/50'
                                        : 'hover:bg-white/10 grayscale-[0.5] opacity-60 hover:opacity-100 hover:grayscale-0'
                                        }`}
                                >
                                    {a}
                                </motion.button>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="text-2xl sm:text-4xl font-black text-indigo-400 bg-white/5 border border-white/10 px-6 sm:px-10 py-3 sm:py-5 rounded-2xl sm:rounded-3xl shadow-xl inline-block">
                    {nickname}
                </div>
            </motion.div>
        </motion.div>
    );
}
