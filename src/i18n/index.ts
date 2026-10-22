import { en, type MessageKey } from './en';
import { pt } from './pt';
import type { Locale } from '../types';

export type { MessageKey };

/** Registry of UI languages. Flip `available` once a language is fully translated. */
export const LOCALES: Record<Locale, { label: string; available: boolean }> = {
  en: { label: 'English', available: true },
  pt: { label: 'Português (em breve)', available: false },
};

const dictionaries: Record<Locale, Partial<Record<MessageKey, string>>> = { en, pt };

export type TFunction = (key: MessageKey) => string;

export function createT(locale: Locale): TFunction {
  const dict = dictionaries[locale] ?? en;
  return (key) => dict[key] ?? en[key];
}
