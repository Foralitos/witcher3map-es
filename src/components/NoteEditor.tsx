'use client';
import { useState } from 'react';
import type { Note } from '@/data/maps';
import { t, type TextOptions } from '@/i18n/t';

type Props = {
	note: Note;
	text: TextOptions;
	onSave: (note: Note) => void;
	onDelete: () => void;
	onClose: () => void;
};

export default function NoteEditor({ note, text, onSave, onDelete, onClose }: Props) {
	const [draft, setDraft] = useState(note);
	const tr = (key: string) => t(key, text);
	const field = 'w-full border border-gold-dim/60 bg-black px-2 py-1 text-sm text-white outline-none focus:border-gold';
	const dirty = draft.label !== note.label || draft.title !== note.title || draft.text !== note.text;

	return (
		<div className="absolute inset-x-3 bottom-3 z-[1000] mx-auto max-w-md border border-gold-dim bg-black/95 p-4 text-sm md:left-auto md:right-14 md:mx-0">
			<div className="mb-2 flex items-center justify-between">
				<span className="text-gold">{draft.title || tr('notes.title').replace(':', '')}</span>
				<button onClick={onClose} className="text-xl text-gold-dim hover:text-gold" aria-label="Cerrar">
					×
				</button>
			</div>
			<label className="block text-gold-dim">{tr('notes.label')}</label>
			<input
				className={field}
				value={draft.label}
				placeholder={tr('notes.enterLabel')}
				onChange={(e) => setDraft({ ...draft, label: e.target.value })}
			/>
			<label className="mt-2 block text-gold-dim">{tr('notes.title')}</label>
			<input
				className={field}
				value={draft.title}
				placeholder={tr('notes.enterTitle')}
				onChange={(e) => setDraft({ ...draft, title: e.target.value })}
			/>
			<label className="mt-2 block text-gold-dim">{tr('notes.note')}</label>
			<textarea
				className={`${field} h-24 resize-none`}
				value={draft.text}
				placeholder={tr('notes.enterText')}
				onChange={(e) => setDraft({ ...draft, text: e.target.value })}
			/>
			<div className="mt-3 flex gap-3">
				<button
					disabled={!dirty}
					onClick={() => onSave(draft)}
					className="border border-gold-dim px-3 py-1 text-gold enabled:hover:border-gold disabled:opacity-40"
				>
					{tr('notes.saveNote')}
				</button>
				<button onClick={onDelete} className="px-3 py-1 text-gold-dim hover:text-gold">
					{tr('notes.deleteNote')}
				</button>
			</div>
		</div>
	);
}
