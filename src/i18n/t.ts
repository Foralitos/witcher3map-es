// Traducción mínima compatible con los JSON de i18next del sitio legacy:
// llaves "ns:ruta.a.llave" (ns default "general"), fallback a inglés e interpolación __var__.
// En español, los nombres (lugares, monstruos, categorías...) salen en los dos idiomas:
// "Sumergidos (Drowners)" o "Drowners (Sumergidos)" según namesFirst.
import enGeneral from './locales/en/general.json';
import enK from './locales/en/k.json';
import enS from './locales/en/s.json';
import enT from './locales/en/t.json';
import enV from './locales/en/v.json';
import enW from './locales/en/w.json';
import esGeneral from './locales/es/general.json';
import esK from './locales/es/k.json';
import esS from './locales/es/s.json';
import esT from './locales/es/t.json';
import esV from './locales/es/v.json';
import esW from './locales/es/w.json';

export type Lang = 'es' | 'en';
export type TextOptions = { lang: Lang; namesFirst: Lang };
type Tree = { [key: string]: string | Tree };

const resources: Record<Lang, Record<string, Tree>> = {
	en: { general: enGeneral, k: enK, s: enS, t: enT, v: enV, w: enW },
	es: { general: esGeneral, k: esK, s: esS, t: esT, v: esV, w: esW },
};

function lookup(lang: Lang, ns: string, path: string): string | undefined {
	let node: string | Tree | undefined = resources[lang][ns];
	for (const part of path.split('.')) {
		if (node === undefined || typeof node === 'string') return undefined;
		node = node[part];
	}
	return typeof node === 'string' ? node : undefined;
}

function interpolate(value: string, vars?: Record<string, string>): string {
	if (!vars) return value;
	return value.replace(/__(\w+)__/g, (match, name: string) => vars[name] ?? match);
}

// Mismo criterio que el postprocesador dualNames de la rama legacy-es
const nameSegments = ['label', 'label*', 'popupTitle', 'inns', 'witcherGear'];
const nameRoots = ['monsters', 'sidebar', 'maps'];
function isNameKey(path: string): boolean {
	const parts = path.split('.');
	if (parts[0] === 'notes') return false;
	if (nameRoots.includes(parts[0])) return true;
	return parts.some((part) => nameSegments.includes(part));
}

function splitKey(key: string): [string, string] {
	const sep = key.indexOf(':');
	return sep > -1 ? [key.slice(0, sep), key.slice(sep + 1)] : ['general', key];
}

function translate(lang: Lang, key: string, vars?: Record<string, string>): string {
	const [ns, path] = splitKey(key);
	const value = lookup(lang, ns, path) ?? lookup('en', ns, path);
	return value === undefined ? key : interpolate(value, vars);
}

export function t(key: string, opts: TextOptions, vars?: Record<string, string>): string {
	const value = translate(opts.lang, key, vars);
	const [ns, path] = splitKey(key);
	if (opts.lang !== 'es' || !isNameKey(path)) return value;

	const en = lookup('en', ns, path);
	if (en === undefined) return value;
	const english = interpolate(en, vars);
	if (!english || english === value) return value;
	return opts.namesFirst === 'en' ? `${english} (${value})` : `${value} (${english})`;
}

export type Call = { k: string; o?: Record<string, string> };

// Resuelve las plantillas de src/data/maps: cada ⟦n⟧ es una llamada calls[n] a $.t() del legacy,
// cuyas opciones también pueden traer tokens.
export function renderTemplate(template: string, calls: Call[], opts: TextOptions): string {
	return template.replace(/⟦(\d+)⟧/g, (_, n: string) => {
		const call = calls[Number(n)];
		const vars = call.o
			? Object.fromEntries(Object.entries(call.o).map(([k, v]) => [k, renderTemplate(String(v), calls, opts)]))
			: undefined;
		return t(call.k, opts, vars);
	});
}
