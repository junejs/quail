'use client';

import { create } from 'zustand';

export type Locale = 'en' | 'zh';

interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  initialized: boolean;
}

// 检测浏览器语言
function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';

  const stored = localStorage.getItem('quail_locale');
  if (stored === 'zh' || stored === 'en') return stored;

  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('zh')) return 'zh';

  return 'en';
}

// 创建 store，不使用 persist 以避免 hydration 问题
export const useI18nStore = create<I18nState>((set) => ({
  locale: 'en',
  initialized: false,
  setLocale: (locale: Locale) => {
    localStorage.setItem('quail_locale', locale);
    set({ locale });
  },
}));

// 初始化语言（在客户端挂载后调用）
export function initLocale() {
  const locale = getInitialLocale();
  useI18nStore.setState({ locale, initialized: true });
}
