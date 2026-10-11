'use client';
// Preferencias en localStorage leídas con useSyncExternalStore (sin setState en efectos).
// Las llaves 'lang', 'namesFirst', 'hide-monsters' y 'markers-<mapa>-hidden' son las mismas del sitio legacy.
import { useCallback, useSyncExternalStore } from 'react';

const EVENT = 'w3map-storage';

function read(key: string): string | null {
	try {
		return window.localStorage.getItem(key);
	} catch {
		return null;
	}
}

export function writeStorage(key: string, value: string | null) {
	try {
		if (value === null) window.localStorage.removeItem(key);
		else window.localStorage.setItem(key, value);
	} catch {
		// modo privado o storage bloqueado: la preferencia solo dura esta sesión de página
	}
	window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

function subscribe(callback: () => void) {
	window.addEventListener('storage', callback);
	window.addEventListener(EVENT, callback);
	return () => {
		window.removeEventListener('storage', callback);
		window.removeEventListener(EVENT, callback);
	};
}

export function useStoredString(key: string, fallback: string): string {
	return useSyncExternalStore(
		subscribe,
		() => read(key) ?? fallback,
		() => fallback,
	);
}

// Listas (JSON) cacheadas por el string crudo para que useSyncExternalStore reciba la misma referencia
const listCache = new Map<string, { raw: string | null; list: string[] }>();
function readList(key: string): string[] {
	const raw = read(key);
	const cached = listCache.get(key);
	if (cached && cached.raw === raw) return cached.list;
	let list: string[] = [];
	try {
		const parsed: unknown = raw ? JSON.parse(raw) : [];
		if (Array.isArray(parsed)) list = parsed.map(String);
	} catch {
		list = [];
	}
	listCache.set(key, { raw, list });
	return list;
}
const EMPTY: string[] = [];

export function useStoredList(key: string): [string[], (next: string[]) => void] {
	const list = useSyncExternalStore(
		subscribe,
		() => readList(key),
		() => EMPTY,
	);
	const set = useCallback((next: string[]) => writeStorage(key, JSON.stringify(next)), [key]);
	return [list, set];
}

export function readStoredList(key: string): string[] {
	return readList(key);
}

// Igual que useStoredList pero para arreglos de objetos (notas)
const jsonCache = new Map<string, { raw: string | null; value: unknown[] }>();
function readJson<T>(key: string): T[] {
	const raw = read(key);
	const cached = jsonCache.get(key);
	if (cached && cached.raw === raw) return cached.value as T[];
	let value: unknown[] = [];
	try {
		const parsed: unknown = raw ? JSON.parse(raw) : [];
		if (Array.isArray(parsed)) value = parsed;
	} catch {
		value = [];
	}
	jsonCache.set(key, { raw, value });
	return value as T[];
}
const EMPTY_JSON: never[] = [];

export function useStoredArray<T>(key: string): [T[], (next: T[]) => void] {
	const value = useSyncExternalStore(
		subscribe,
		() => readJson<T>(key),
		() => EMPTY_JSON,
	);
	const set = useCallback((next: T[]) => writeStorage(key, JSON.stringify(next)), [key]);
	return [value, set];
}

export function readStoredArray<T>(key: string): T[] {
	return readJson<T>(key);
}
