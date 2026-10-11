'use client';
import Link from 'next/link';
import { MAPS } from '@/data/maps';
import { t } from '@/i18n/t';
import { setLang, useTextOptions } from '@/lib/settings';

export default function Home() {
	const text = useTextOptions();

	return (
		<main
			className="flex min-h-dvh flex-col items-center justify-center bg-black bg-cover bg-center px-4 py-10"
			style={{ backgroundImage: "linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,.85)), url('/img/homebg.jpg')" }}
		>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img src="/img/logo.png" alt="The Witcher 3: Wild Hunt" className="w-64" />
			<p className="mt-2 text-center text-gold-dim">
				{text.lang === 'es' ? 'Mapas interactivos no oficiales, en español' : 'Unofficial interactive maps'}
			</p>

			<ul className="mt-8 w-full max-w-sm space-y-3">
				{MAPS.map((map) => (
					<li key={map.slug}>
						<Link
							href={`/${map.slug}`}
							className="block border border-gold-dim/60 bg-black/70 px-4 py-3 text-center text-xl text-white hover:border-gold hover:text-gold"
							dangerouslySetInnerHTML={{ __html: t(`maps.${map.path === 'hos_velen' ? 'velen' : map.path}`, text) }}
						/>
					</li>
				))}
			</ul>

			<div className="mt-8 flex gap-4 text-sm text-gold-dim">
				<button className={text.lang === 'es' ? 'text-gold' : 'hover:text-gold'} onClick={() => setLang('es')}>
					Español
				</button>
				<button className={text.lang === 'en' ? 'text-gold' : 'hover:text-gold'} onClick={() => setLang('en')}>
					English
				</button>
			</div>

			<p className="mt-10 max-w-md text-center text-xs text-neutral-500">
				Basado en{' '}
				<a className="underline" href="https://github.com/witcher3map/witcher3map" target="_blank" rel="noreferrer">
					witcher3map
				</a>{' '}
				de untamed0 y colaboradores (CC BY-NC-SA). The Witcher 3 y su contenido son propiedad de CD PROJEKT RED.
			</p>
		</main>
	);
}
