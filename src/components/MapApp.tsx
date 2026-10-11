'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { hiddenCategoriesKey, type MapData } from '@/data/maps';
import { useTextOptions } from '@/lib/settings';
import { useStoredList, useStoredString } from '@/lib/storage';
import Sidebar from './Sidebar';

// Leaflet toca window al importarse: solo en el cliente
const WitcherMap = dynamic(() => import('./WitcherMap'), { ssr: false });

export default function MapApp({ map }: { map: MapData }) {
	const text = useTextOptions();
	const [hiddenCategories, setHiddenCategories] = useStoredList(hiddenCategoriesKey(map));
	const hideMonsters = useStoredString('hide-monsters', '') === 'true';
	const [sidebarOpen, setSidebarOpen] = useState(true);

	return (
		<main className="flex h-dvh w-screen overflow-hidden bg-black">
			{sidebarOpen && (
				<div className="absolute inset-y-0 left-0 z-[1000] md:static">
					<Sidebar
						map={map}
						text={text}
						hiddenCategories={hiddenCategories}
						setHiddenCategories={setHiddenCategories}
						hideMonsters={hideMonsters}
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
				<WitcherMap map={map} text={text} hiddenCategories={hiddenCategories} hideMonsters={hideMonsters} />
			</div>
		</main>
	);
}
