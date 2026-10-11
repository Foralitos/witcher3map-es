'use client';
// Mapa Leaflet imperativo (se carga con ssr: false desde MapApp).
// Replica el setup de custom.js legacy: CRS, tiles TMS, maxBounds, labels en hover, popups,
// ocultar marcadores con clic derecho / long-press y permalink en el hash (#z/lat/lng/m=lat,lng).
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { ICONS, hiddenMarkersKey, markerKey, type LatLng, type MapData } from '@/data/maps';
import { renderTemplate, type TextOptions } from '@/i18n/t';
import { readStoredList, useStoredList } from '@/lib/storage';

const TILES_URL = process.env.NEXT_PUBLIC_TILES_URL ?? '/tiles';
const HIDDEN_OPACITY = 0.25;

type Props = {
	map: MapData;
	text: TextOptions;
	hiddenCategories: string[];
	hideMonsters: boolean;
};

type HashState = { zoom: number; center: LatLng; marker?: LatLng };

function parseHash(hash: string): HashState | null {
	const [zoom, lat, lng, ...params] = hash.replace(/^#/, '').split('/');
	const state: HashState = { zoom: Number(zoom), center: [Number(lat), Number(lng)] };
	if ([state.zoom, ...state.center].some(Number.isNaN) || zoom === '') return null;
	const m = params.find((p) => p.startsWith('m='));
	if (m) {
		const [mLat, mLng] = m.slice(2).split(',').map(Number);
		if (!Number.isNaN(mLat) && !Number.isNaN(mLng)) state.marker = [mLat, mLng];
	}
	return state;
}

function createTiles(map: MapData) {
	const Tiles = L.TileLayer.extend({
		getTileUrl(coords: L.Coords) {
			// Los tiles son TMS. En CRS.Simple Leaflet 1.x ignora `tms`, y Leaflet 0.7 los pedía como -y-1
			const y = map.crs === 'simple' ? -coords.y - 1 : 2 ** coords.z - 1 - coords.y;
			return `${TILES_URL}/${map.path}/${coords.z}/${coords.x}/${y}.png`;
		},
	});
	return new (Tiles as unknown as typeof L.TileLayer)('', {
		bounds: L.latLngBounds(map.bounds),
		noWrap: true,
		minZoom: 2,
		maxZoom: map.maxZoom,
	});
}

export default function WitcherMap({ map, text, hiddenCategories, hideMonsters }: Props) {
	const containerRef = useRef<HTMLDivElement>(null);
	const leafletRef = useRef<L.Map | null>(null);
	const groupsRef = useRef<Map<string, L.LayerGroup>>(new Map());
	const markersRef = useRef<Map<string, L.Marker>>(new Map());
	const [hiddenMarkers, setHiddenMarkers] = useStoredList(hiddenMarkersKey(map));

	// Mapa, tiles y permalink: una vez por mapa
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const leaflet = L.map(container, {
			crs: map.crs === 'simple' ? L.CRS.Simple : L.CRS.EPSG3857,
			center: map.center,
			zoom: 3,
			minZoom: 2,
			maxZoom: map.maxZoom,
			maxBounds: L.latLngBounds(map.bounds),
			zoomControl: false,
			attributionControl: false,
			tapHold: true,
		});
		L.control.zoom({ position: 'topright' }).addTo(leaflet);
		createTiles(map).addTo(leaflet);
		leafletRef.current = leaflet;

		let openMarker: LatLng | undefined;
		const writeHash = () => {
			const c = leaflet.getCenter();
			let hash = `#${leaflet.getZoom()}/${c.lat.toFixed(3)}/${c.lng.toFixed(3)}`;
			if (openMarker) hash += `/m=${openMarker[0]},${openMarker[1]}`;
			if (hash !== window.location.hash) window.history.replaceState(null, '', hash);
		};
		const applyHash = () => {
			const state = parseHash(window.location.hash);
			if (!state) return;
			leaflet.setView(state.center, state.zoom);
			if (state.marker) markersRef.current.get(markerKey(state.marker))?.openPopup();
		};

		leaflet.on('moveend', writeHash);
		leaflet.on('popupopen', (e) => {
			const ll = e.popup.getLatLng();
			openMarker = ll ? [ll.lat, ll.lng] : undefined;
			writeHash();
		});
		leaflet.on('popupclose', () => {
			openMarker = undefined;
			writeHash();
		});
		window.addEventListener('hashchange', applyHash);

		return () => {
			window.removeEventListener('hashchange', applyHash);
			leaflet.remove();
			leafletRef.current = null;
		};
	}, [map]);

	// Marcadores: se reconstruyen al cambiar idioma u orden de nombres
	useEffect(() => {
		const leaflet = leafletRef.current;
		if (!leaflet) return;
		const groups = groupsRef.current;
		const markers = markersRef.current;
		const storageKey = hiddenMarkersKey(map);

		for (const [type, items] of Object.entries(map.categories)) {
			const icon = ICONS[type];
			const leafletIcon = L.icon({ iconUrl: `/icons/${icon.file}.png`, iconSize: icon.size });
			const group = L.layerGroup();
			for (const item of items) {
				const label = renderTemplate(item.label, map.calls, text);
				const title = item.popupTitle ? renderTemplate(item.popupTitle, map.calls, text) : label;
				const popup = `<h1>${title}</h1>${renderTemplate(item.popup, map.calls, text)}`;
				for (const coord of item.coords) {
					const key = markerKey(coord);
					const marker = L.marker(coord, { icon: leafletIcon, riseOnHover: true })
						.bindTooltip(label, { direction: 'auto' })
						.bindPopup(popup);
					marker.on('contextmenu', () => {
						const hidden = readStoredList(storageKey);
						setHiddenMarkers(hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key]);
					});
					markers.set(key, marker);
					group.addLayer(marker);
				}
			}
			groups.set(type, group);
		}

		// Si el link trae un marcador (m=lat,lng), abrirlo ya que existen los marcadores
		const state = parseHash(window.location.hash);
		if (state) {
			leaflet.setView(state.center, state.zoom);
			if (state.marker) {
				const marker = markers.get(markerKey(state.marker));
				if (marker) {
					marker.addTo(leaflet);
					marker.openPopup();
				}
			}
		}

		return () => {
			groups.forEach((group) => group.remove());
			groups.clear();
			markers.clear();
		};
	}, [map, text, setHiddenMarkers]);

	// Categorías visibles
	useEffect(() => {
		const leaflet = leafletRef.current;
		if (!leaflet) return;
		groupsRef.current.forEach((group, type) => {
			if (hiddenCategories.includes(type)) group.remove();
			else group.addTo(leaflet);
		});
	}, [hiddenCategories, map, text]);

	// Marcadores ocultos (semitransparentes, como en el original)
	useEffect(() => {
		markersRef.current.forEach((marker, key) => {
			marker.setOpacity(hiddenMarkers.includes(key) ? HIDDEN_OPACITY : 1);
		});
	}, [hiddenMarkers, map, text]);

	useEffect(() => {
		containerRef.current?.classList.toggle('hide-monsters', hideMonsters);
	}, [hideMonsters]);

	return <div ref={containerRef} className="witcher-map h-full w-full" />;
}
