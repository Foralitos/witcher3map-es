import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
	title: 'Mapa de The Witcher 3 en español',
	description: 'Mapas interactivos de The Witcher 3: Wild Hunt en español, con los nombres en español e inglés.',
};

export const viewport: Viewport = {
	themeColor: '#000000',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
	return (
		<html lang="es" className="h-full antialiased">
			<body className="min-h-full bg-black">{children}</body>
		</html>
	);
}
