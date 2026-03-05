import en from '@/messages/en.json';
import zh from '@/messages/zh.json';
import { useI18nStore, Locale } from './i18n';

export type TranslationKeys = typeof en;

const translations: Record<Locale, TranslationKeys> = {
  en,
  zh,
};

type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${NestedKeyOf<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

export type TranslationPath = NestedKeyOf<TranslationKeys>;

// 简单的路径获取函数
function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let result: any = obj;
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return path; // 返回路径作为后备
    }
  }
  return typeof result === 'string' ? result : path;
}

export function useTranslation() {
  const locale = useI18nStore((state) => state.locale);

  const t = (key: string): string => {
    return getNestedValue(translations[locale], key);
  };

  return { t, locale };
}
