'use client';
// Mapa Leaflet imperativo (se carga con ssr: false desde MapApp).
// Replica custom.js legacy: CRS, tiles TMS, maxBounds, labels en hover, popups, ocultar marcadores
// con clic derecho / long-press, waypoint (clic derecho en el mapa), notas y permalink en el hash
// (#z/lat/lng/m=lat,lng/w=lat,lng).
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useRef } from 'react';
import {
	ICONS,
	hiddenMarkersKey,
	markerKey,
	noteKey,
	notesKey,
	type LatLng,
	type MapData,
	type Note,
} from '@/data/maps';
import { renderTemplate, t, type TextOptions } from '@/i18n/t';
import { readStoredArray, readStoredList, useStoredArray, useStoredList } from '@/lib/storage';

const TILES_URL = process.env.NEXT_PUBLIC_TILES_URL ?? '/tiles';
const HIDDEN_OPACITY = 0.25;

type Props = {
	map: MapData;
	text: TextOptions;
	hiddenCategories: string[];
	hideMonsters: boolean;
	sfw: boolean;
	addingNote: boolean;
	onNoteAdded: (key: string) => void;
	onNoteClick: (key: string) => void;
};

type HashState = { zoom: number; center: LatLng; marker?: LatLng; waypoint?: LatLng };

function parsePair(value: string): LatLng | undefined {
	const [lat, lng] = value.split(',').map(Number);
	return Number.isNaN(lat) || Number.isNaN(lng) ? undefined : [lat, lng];
}

function parseHash(hash: string): HashState | null {
	const [zoom, lat, lng, ...params] = hash.replace(/^#/, '').split('/');
	if (!zoom) return null;
	const state: HashState = { zoom: Number(zoom), center: [Number(lat), Number(lng)] };
	if ([state.zoom, ...state.center].some(Number.isNaN)) return null;
	for (const param of params) {
		if (param.startsWith('m=')) state.marker = parsePair(param.slice(2));
		if (param.startsWith('w=')) state.waypoint = parsePair(param.slice(2));
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

const waypointIcon = () => L.icon({ iconUrl: '/icons/waypoint.png', iconSize: [26, 32] });
const noteIcon = () => L.icon({ iconUrl: `/icons/${ICONS.note_marker.file}.png`, iconSize: ICONS.note_marker.size });

export default function WitcherMap({ map, text, hiddenCategories, hideMonsters, sfw, addingNote, onNoteAdded, onNoteClick }: Props) {
	const containerRef = useRef<HTMLDivElement>(null);
	const leafletRef = useRef<L.Map | null>(null);
	const groupsRef = useRef<Map<string, L.LayerGroup>>(new Map());
	const markersRef = useRef<Map<string, L.Marker>>(new Map());
	const [hiddenMarkers, setHiddenMarkers] = useStoredList(hiddenMarkersKey(map));
	const [notes, setNotes] = useStoredArray<Note>(notesKey(map));

	// Mapa, tiles, waypoint y permalink: una vez por mapa
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const bounds = L.latLngBounds(map.bounds);
		const leaflet = L.map(container, {
			crs: map.crs === 'simple' ? L.CRS.Simple : L.CRS.EPSG3857,
			center: map.center,
			zoom: 3,
			minZoom: 2,
			maxZoom: map.maxZoom,
			maxBounds: bounds,
			zoomControl: false,
			attributionControl: false,
			tapHold: true,
		});
		L.control.zoom({ position: 'topright' }).addTo(leaflet);
		createTiles(map).addTo(leaflet);
		leafletRef.current = leaflet;

		let openMarker: LatLng | undefined;
		let waypoint: L.Marker | undefined;

		const writeHash = () => {
			const c = leaflet.getCenter();
			let hash = `#${leaflet.getZoom()}/${c.lat.toFixed(3)}/${c.lng.toFixed(3)}`;
			if (openMarker) hash += `/m=${openMarker[0]},${openMarker[1]}`;
			if (waypoint) {
				const w = waypoint.getLatLng();
				hash += `/w=${w.lat.toFixed(3)},${w.lng.toFixed(3)}`;
			}
			if (hash !== window.location.hash) window.history.replaceState(null, '', hash);
		};

		const removeWaypoint = () => {
			waypoint?.remove();
			waypoint = undefined;
			writeHash();
		};
		const placeWaypoint = (latlng: L.LatLngExpression) => {
			waypoint?.remove();
			waypoint = L.marker(latlng, { icon: waypointIcon() })
				.on('click', removeWaypoint)
				.on('contextmenu', (e) => {
					L.DomEvent.stopPropagation(e.originalEvent);
					removeWaypoint();
				})
				.addTo(leaflet);
			writeHash();
		};

		const applyHash = () => {
			const state = parseHash(window.location.hash);
			if (!state) return;
			leaflet.setView(state.center, state.zoom);
			if (state.waypoint) placeWaypoint(state.waypoint);
			if (state.marker) markersRef.current.get(markerKey(state.marker))?.openPopup();
		};

		leaflet.on('contextmenu', (e) => {
			if (bounds.contains(e.latlng)) placeWaypoint(e.latlng);
		});
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

		const initial = parseHash(window.location.hash);
		if (initial?.waypoint) placeWaypoint(initial.waypoint);

		return () => {
			window.removeEventListener('hashchange', applyHash);
			leaflet.remove();
			leafletRef.current = null;
		};
	}, [map]);

	// Marcadores: se reconstruyen al cambiar idioma, orden de nombres o modo SFW
	useEffect(() => {
		const leaflet = leafletRef.current;
		if (!leaflet) return;
		const groups = groupsRef.current;
		const markers = markersRef.current;
		const storageKey = hiddenMarkersKey(map);
		const loveInterest = `<h1>${t('sidebar.loveInterest', text)}</h1>${t('misc.loveInterestDesc', text)}`;

		for (const [type, items] of Object.entries(map.categories)) {
			const icon = ICONS[type];
			const leafletIcon = L.icon({ iconUrl: `/icons/${icon.file}.png`, iconSize: icon.size });
			const group = L.layerGroup();
			for (const item of items) {
				const label = renderTemplate(item.label, map.calls, text);
				const title = item.popupTitle ? renderTemplate(item.popupTitle, map.calls, text) : label;
				const body = renderTemplate(item.popup, map.calls, text);
				// Modo SFW del original: los burdeles se muestran como "interés amoroso"
				const sfwItem = sfw && type === 'brothel' && /prostitute|prostitut/i.test(body + item.popup);
				const popup = sfwItem ? loveInterest : `<h1>${title}</h1>${body}`;
				for (const coord of item.coords) {
					const key = markerKey(coord);
					const marker = L.marker(coord, { icon: leafletIcon, riseOnHover: true })
						.bindTooltip(sfwItem ? t('sidebar.loveInterest', text) : label, { direction: 'auto' })
						.bindPopup(popup);
					marker.on('contextmenu', (e) => {
						// Que el clic derecho en un marcador no ponga también el waypoint
						L.DomEvent.stopPropagation(e.originalEvent);
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
			const marker = state.marker && markers.get(markerKey(state.marker));
			if (marker) {
				marker.addTo(leaflet);
				marker.openPopup();
			}
		}

		return () => {
			groups.forEach((group) => group.remove());
			groups.clear();
			markers.clear();
		};
	}, [map, text, sfw, setHiddenMarkers]);

	// Categorías visibles
	useEffect(() => {
		const leaflet = leafletRef.current;
		if (!leaflet) return;
		groupsRef.current.forEach((group, type) => {
			if (hiddenCategories.includes(type)) group.remove();
			else group.addTo(leaflet);
		});
	}, [hiddenCategories, map, text, sfw]);

	// Marcadores ocultos (semitransparentes, como en el original)
	useEffect(() => {
		markersRef.current.forEach((marker, key) => {
			marker.setOpacity(hiddenMarkers.includes(key) ? HIDDEN_OPACITY : 1);
		});
	}, [hiddenMarkers, map, text, sfw]);

	// Notas del usuario
	useEffect(() => {
		const leaflet = leafletRef.current;
		if (!leaflet) return;
		const layer = L.layerGroup().addTo(leaflet);
		for (const note of notes) {
			const marker = L.marker([note.lat, note.lng], { icon: noteIcon(), riseOnHover: true }).on('click', () =>
				onNoteClick(note.key),
			);
			if (note.label || note.title) marker.bindTooltip(note.label || note.title, { direction: 'auto' });
			layer.addLayer(marker);
		}
		return () => {
			layer.remove();
		};
	}, [notes, map, onNoteClick]);

	// Modo "agregar nota": el siguiente clic en el mapa crea la nota
	useEffect(() => {
		const leaflet = leafletRef.current;
		const container = containerRef.current;
		if (!leaflet || !container || !addingNote) return;
		container.classList.add('adding-note');
		const onClick = (e: L.LeafletMouseEvent) => {
			const note: Note = { key: noteKey(e.latlng.lat, e.latlng.lng), lat: e.latlng.lat, lng: e.latlng.lng, label: '', title: '', text: '' };
			setNotes([...readStoredArray<Note>(notesKey(map)), note]);
			onNoteAdded(note.key);
		};
		leaflet.once('click', onClick);
		return () => {
			leaflet.off('click', onClick);
			container.classList.remove('adding-note');
		};
	}, [addingNote, map, setNotes, onNoteAdded]);

	useEffect(() => {
		containerRef.current?.classList.toggle('hide-monsters', hideMonsters);
	}, [hideMonsters]);

	return <div ref={containerRef} className="witcher-map h-full w-full" />;
}
