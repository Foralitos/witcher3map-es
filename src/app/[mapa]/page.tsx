import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import MapApp from '@/components/MapApp';
import { MAPS, getMap } from '@/data/maps';

const TITLES: Record<string, string> = {
	velen: 'Velen y Novigrado',
	skellige: 'Islas de Skellige',
	toussaint: 'Toussaint',
	'huerto-blanco': 'Huerto Blanco',
	'kaer-morhen': 'Kaer Morhen',
};

export function generateStaticParams() {
	return MAPS.map((map) => ({ mapa: map.slug }));
}

export async function generateMetadata({ params }: PageProps<'/[mapa]'>): Promise<Metadata> {
	const { mapa } = await params;
	return { title: `${TITLES[mapa] ?? 'Mapa'} · Mapa de The Witcher 3` };
}

async function MapLoader({ params }: { params: PageProps<'/[mapa]'>['params'] }) {
	const { mapa } = await params;
	const map = getMap(mapa);
	if (!map) notFound();
	return <MapApp map={map} />;
}

export default function MapPage({ params }: PageProps<'/[mapa]'>) {
	return (
		<Suspense fallback={<div className="h-dvh bg-black" />}>
			<MapLoader params={params} />
		</Suspense>
	);
}
