import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	// Builds de verificación sin pisar el `next dev` en curso
	distDir: process.env.NEXT_DIST_DIR || '.next',
	cacheComponents: true,
	partialPrefetching: true,
	turbopack: {
		// Hay un yarn.lock suelto en ~ que confunde la detección del root
		root: __dirname,
		rules: {
			'*.css': {
				loaders: ['@tailwindcss/turbopack'],
				as: '*.css',
			},
		},
	},
};

export default nextConfig;
