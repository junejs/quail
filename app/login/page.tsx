'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { useGameStore } from '@/lib/store';
import { useTranslation } from '@/lib/translations';
import { Lock, User, ArrowRight, AlertCircle } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callback = searchParams.get('callback') || '/';
  const { checkAuth, authEnabled } = useGameStore();
  const { t } = useTranslation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const verify = async () => {
      const isAuth = await checkAuth();
      if (isAuth) {
        router.push(callback);
      }
    };
    verify();
  }, [checkAuth, router, callback]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        await checkAuth();
        router.push(callback);
      } else {
        const data = await res.json();
        setError(data.error || t('login.invalidCredentials'));
      }
    } catch (err) {
      setError(t('login.connectionFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/20 shadow-2xl relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex p-5 rounded-3xl bg-indigo-500/20 border border-indigo-500/30 mb-6">
            <Lock className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">{t('login.hostLogin')}</h1>
          <p className="text-white/40 font-bold uppercase tracking-widest text-xs">{t('login.hostRequired')}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] ml-4">{t('login.username')}</label>
            <div className="relative">
              <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('login.usernamePlaceholder')}
                required
                className="w-full pl-16 pr-6 py-5 bg-white/5 border-2 border-white/10 rounded-2xl focus:border-white focus:bg-white/10 text-white placeholder:text-white/10 outline-none transition-all font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] ml-4">{t('login.password')}</label>
            <div className="relative">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.passwordPlaceholder')}
                required
                className="w-full pl-16 pr-6 py-5 bg-white/5 border-2 border-white/10 rounded-2xl focus:border-white focus:bg-white/10 text-white placeholder:text-white/10 outline-none transition-all font-bold"
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="w-full bg-white text-indigo-900 py-6 rounded-2xl font-black text-xl shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 uppercase tracking-widest disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-indigo-900/20 border-t-indigo-900 rounded-full animate-spin" />
            ) : (
              <>
                {t('login.login')}
                <ArrowRight className="w-6 h-6" />
              </>
            )}
          </motion.button>
        </form>

        <button
          onClick={() => router.push('/')}
          className="w-full mt-8 text-white/30 hover:text-white text-xs font-black uppercase tracking-widest transition-colors"
        >
          {t('login.backToHome')}
        </button>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-900 flex items-center justify-center font-sans text-white">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
