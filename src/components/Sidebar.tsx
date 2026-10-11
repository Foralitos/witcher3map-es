'use client';
import Fuse from 'fuse.js';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ICONS, hiddenMarkersKey, type LatLng, type MapData } from '@/data/maps';
import { renderTemplate, t, type TextOptions } from '@/i18n/t';
import { setLang, setNamesFirst } from '@/lib/settings';
import { writeStorage } from '@/lib/storage';

type Props = {
	map: MapData;
	text: TextOptions;
	hiddenCategories: string[];
	setHiddenCategories: (next: string[]) => void;
	hideMonsters: boolean;
	onClose: () => void;
};

type SearchItem = { title: string; type: string; coords: LatLng };

export default function Sidebar({ map, text, hiddenCategories, setHiddenCategories, hideMonsters, onClose }: Props) {
	const [query, setQuery] = useState('');
	const tr = (key: string) => t(key, text);

	// Búsqueda sobre los nombres ya renderizados: en español encuentra por español y por inglés
	const fuse = useMemo(() => {
		const items: SearchItem[] = [];
		for (const [type, markers] of Object.entries(map.categories)) {
			for (const marker of markers) {
				const label = renderTemplate(marker.label, map.calls, text);
				const popupTitle = marker.popupTitle ? renderTemplate(marker.popupTitle, map.calls, text) : '';
				const title = !popupTitle || popupTitle.includes(label) ? popupTitle || label : `${label} (${popupTitle})`;
				for (const coords of marker.coords) items.push({ title, type, coords });
			}
		}
		return new Fuse(items, { keys: ['title'], threshold: 0.2, ignoreLocation: true });
	}, [map, text]);
	const results = query.trim() ? fuse.search(query.trim()).slice(0, 30) : [];

	const goTo = ([lat, lng]: LatLng) => {
		// El mapa escucha hashchange (mismo mecanismo que los links dentro de los popups)
		window.history.pushState(null, '', `#${map.maxZoom - 1}/${lat}/${lng}/m=${lat},${lng}`);
		window.dispatchEvent(new HashChangeEvent('hashchange'));
		if (window.matchMedia('(max-width: 768px)').matches) onClose();
	};

	const toggleCategory = (type: string) =>
		setHiddenCategories(hiddenCategories.includes(type) ? hiddenCategories.filter((c) => c !== type) : [...hiddenCategories, type]);

	return (
		<aside className="sidebar flex h-full w-80 max-w-[85vw] shrink-0 flex-col overflow-y-auto bg-black px-4 pb-4 text-white">
			<div className="flex items-start justify-between pt-3">
				<Link href="/" title={tr('sidebar.returnToMapSelection')}>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src="/img/logo.png" alt="The Witcher 3" className="w-48" />
				</Link>
				<button onClick={onClose} className="text-2xl text-gold-dim hover:text-gold" aria-label="Cerrar">
					×
				</button>
			</div>

			<h2 className="mt-2 text-lg text-gold">{tr(`maps.${map.path === 'hos_velen' ? 'velen' : map.path}`)}</h2>

			<input
				type="search"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				placeholder={tr('home.searchPlaceholder')}
				className="mt-3 w-full border border-gold-dim bg-transparent px-2 py-1 text-sm outline-none placeholder:text-gold-dim focus:border-gold"
			/>
			{results.length > 0 && (
				<ul className="mt-2 space-y-1 text-sm">
					{results.map(({ item }) => (
						<li key={`${item.type}-${item.coords.join(',')}`}>
							<button onClick={() => goTo(item.coords)} className="flex w-full items-center gap-2 text-left hover:text-gold">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={`/icons/${ICONS[item.type].file}.png`} alt="" className="h-5 w-5 object-contain" />
								<span dangerouslySetInnerHTML={{ __html: item.title }} />
							</button>
						</li>
					))}
				</ul>
			)}

			<ul className="mt-4 space-y-1">
				{map.sidebar.map(({ type, key }) => {
					const count = map.categories[type].reduce((n, m) => n + m.coords.length, 0);
					const hidden = hiddenCategories.includes(type);
					return (
						<li key={type}>
							<button
								onClick={() => toggleCategory(type)}
								className={`flex w-full items-center gap-3 text-left hover:text-gold ${hidden ? 'opacity-35' : ''}`}
							>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={`/icons/${ICONS[type].file}.png`} alt="" className="h-7 w-7 object-contain" />
								<span className="flex-1" dangerouslySetInnerHTML={{ __html: tr(key) }} />
								<span className="text-xs text-gold-dim">{count}</span>
							</button>
						</li>
					);
				})}
			</ul>

			<ul className="mt-4 space-y-1 border-t border-gold-dim/40 pt-3 text-sm text-gold-dim">
				<li>
					<button className="hover:text-gold" onClick={() => setHiddenCategories([])}>
						{tr('controls.show')}
					</button>
					{' · '}
					<button className="hover:text-gold" onClick={() => setHiddenCategories(map.sidebar.map((c) => c.type))}>
						{tr('controls.hide')}
					</button>
				</li>
				<li>
					<button className="hover:text-gold" onClick={() => writeStorage('hide-monsters', hideMonsters ? null : 'true')}>
						{tr(hideMonsters ? 'controls.showMonsters' : 'controls.hideMonsters')}
					</button>
				</li>
				<li>
					<button
						className="hover:text-gold"
						onClick={() => {
							if (window.confirm(tr('controls.resetInvisConfirm'))) writeStorage(hiddenMarkersKey(map), null);
						}}
					>
						{tr('controls.resetInvisible')}
					</button>
				</li>
			</ul>

			<div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gold-dim">
				<button className={text.lang === 'es' ? 'text-gold' : 'hover:text-gold'} onClick={() => setLang('es')}>
					Español
				</button>
				<button className={text.lang === 'en' ? 'text-gold' : 'hover:text-gold'} onClick={() => setLang('en')}>
					English
				</button>
				{text.lang === 'es' && (
					<button className="hover:text-gold" onClick={() => setNamesFirst(text.namesFirst === 'en' ? 'es' : 'en')}>
						Nombres: {text.namesFirst === 'en' ? 'inglés' : 'español'} primero ⇄
					</button>
				)}
			</div>

			<p className="mt-auto pt-6 text-xs text-neutral-500">
				Basado en{' '}
				<a className="underline" href="https://github.com/witcher3map/witcher3map" target="_blank" rel="noreferrer">
					witcher3map
				</a>{' '}
				de untamed0 y colaboradores, licencia{' '}
				<a className="underline" href="http://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noreferrer">
					CC BY-NC-SA
				</a>
				. The Witcher 3, logo, íconos, mapa y textos son propiedad de CD PROJEKT RED.
			</p>
		</aside>
	);
}
