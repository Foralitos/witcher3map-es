import type { Call } from '@/i18n/t';
import icons from './maps/_icons.json';
import huertoBlanco from './maps/huerto-blanco.json';
import kaerMorhen from './maps/kaer-morhen.json';
import skellige from './maps/skellige.json';
import toussaint from './maps/toussaint.json';
import velen from './maps/velen.json';

export type LatLng = [number, number];

export type MarkerData = {
	coords: LatLng[];
	label: string;
	popup: string;
	popupTitle?: string;
};

// Generado por scripts/convert-mapdata.mjs desde la rama legacy-es
export type MapData = {
	slug: string;
	path: string;
	ns: string;
	crs: 'simple' | 'mercator';
	bounds: [LatLng, LatLng];
	center: LatLng;
	maxZoom: number;
	sidebar: { type: string; key: string }[];
	calls: Call[];
	categories: Record<string, MarkerData[]>;
};

export type IconData = { file: string; size: [number, number] };

export const MAPS = [velen, skellige, toussaint, huertoBlanco, kaerMorhen] as unknown as MapData[];
export const ICONS = icons as unknown as Record<string, IconData>;

export function getMap(slug: string): MapData | undefined {
	return MAPS.find((map) => map.slug === slug);
}

export function markerKey([lat, lng]: LatLng): string {
	return `${lat};${lng}`;
}

export const hiddenMarkersKey = (map: MapData) => `markers-${map.path}-hidden`;
export const hiddenCategoriesKey = (map: MapData) => `categories-${map.path}-hidden`;
// Mismo formato que el legacy: notes<mapa> = [{ key, lat, lng, label, title, text }]
export const notesKey = (map: MapData) => `notes${map.path}`;

export type Note = { key: string; lat: number; lng: number; label: string; title: string; text: string };
export const noteKey = (lat: number, lng: number) => `${lat.toFixed(3)}_${lng.toFixed(3)}`;
