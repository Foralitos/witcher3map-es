'use client';
import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';
import { hiddenCategoriesKey, hiddenMarkersKey, notesKey, type MapData, type Note } from '@/data/maps';
import { useTextOptions } from '@/lib/settings';
import { useStoredArray, useStoredList, useStoredString } from '@/lib/storage';
import NoteEditor from './NoteEditor';
import Sidebar from './Sidebar';

// Leaflet toca window al importarse: solo en el cliente
const WitcherMap = dynamic(() => import('./WitcherMap'), { ssr: false });

export default function MapApp({ map }: { map: MapData }) {
	const text = useTextOptions();
	const [hiddenCategories, setHiddenCategories] = useStoredList(hiddenCategoriesKey(map));
	const [hiddenMarkers] = useStoredList(hiddenMarkersKey(map));
	const [notes, setNotes] = useStoredArray<Note>(notesKey(map));
	const hideMonsters = useStoredString('hide-monsters', '') === 'true';
	const sfw = useStoredString('sfw', '') === 'true';
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [addingNote, setAddingNote] = useState(false);
	const [editingNote, setEditingNote] = useState<string | null>(null);

	const onNoteAdded = useCallback((key: string) => {
		setAddingNote(false);
		setEditingNote(key);
	}, []);
	const onNoteClick = useCallback((key: string) => setEditingNote(key), []);
	const note = notes.find((n) => n.key === editingNote);

	return (
		<main className="flex h-dvh w-screen overflow-hidden bg-black">
			{sidebarOpen && (
				<div className="absolute inset-y-0 left-0 z-[1000] md:static">
					<Sidebar
						map={map}
						text={text}
						hiddenCategories={hiddenCategories}
						setHiddenCategories={setHiddenCategories}
						hiddenMarkers={hiddenMarkers}
						hideMonsters={hideMonsters}
						sfw={sfw}
						addingNote={addingNote}
						onToggleAddingNote={() => setAddingNote(!addingNote)}
						onClose={() => setSidebarOpen(false)}
					/>
				</div>
			)}
			{!sidebarOpen && (
				<button
					onClick={() => setSidebarOpen(true)}
					className="absolute left-3 top-3 z-[1000] border border-gold-dim bg-black/80 px-3 py-1 text-gold hover:border-gold"
				>
					☰ Menú
				</button>
			)}
			<div className="relative flex-1">
				<WitcherMap
					map={map}
					text={text}
					hiddenCategories={hiddenCategories}
					hideMonsters={hideMonsters}
					sfw={sfw}
					addingNote={addingNote}
					onNoteAdded={onNoteAdded}
					onNoteClick={onNoteClick}
				/>
				{addingNote && (
					<div className="pointer-events-none absolute inset-x-0 top-3 z-[1000] text-center">
						<span className="bg-black/85 px-3 py-1 text-sm text-gold">
							{text.lang === 'es' ? 'Toca el mapa donde quieres la nota' : 'Click the map to place your note'}
						</span>
					</div>
				)}
				{note && (
					<NoteEditor
						key={note.key}
						note={note}
						text={text}
						onSave={(next) => setNotes(notes.map((n) => (n.key === next.key ? next : n)))}
						onDelete={() => {
							setNotes(notes.filter((n) => n.key !== note.key));
							setEditingNote(null);
						}}
						onClose={() => setEditingNote(null)}
					/>
				)}
			</div>
		</main>
	);
}
