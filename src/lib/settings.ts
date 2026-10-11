'use client';
import { useMemo } from 'react';
import type { Lang, TextOptions } from '@/i18n/t';
import { useStoredString, writeStorage } from './storage';

const asLang = (value: string): Lang => (value === 'en' ? 'en' : 'es');

// Español por default; el inglés queda como opción
export function useTextOptions(): TextOptions {
	const lang = asLang(useStoredString('lang', 'es'));
	const namesFirst = asLang(useStoredString('namesFirst', 'es'));
	return useMemo(() => ({ lang, namesFirst }), [lang, namesFirst]);
}

export const setLang = (lang: Lang) => writeStorage('lang', lang);
export const setNamesFirst = (lang: Lang) => writeStorage('namesFirst', lang);
