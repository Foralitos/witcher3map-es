// Migra los marcadores del sitio legacy (rama legacy-es, jQuery) a JSON para la app Next.
// Uso: node scripts/convert-mapdata.mjs <ruta a assets/ legacy>
//
// Cada mapdata-*.js se evalúa en un sandbox donde $.t() no traduce: devuelve un token ⟦n⟧
// que apunta a calls[n] = { k: llave, o?: opciones }. Así las coordenadas y la forma en que
// se arman los popups quedan idénticas y la traducción ocurre en runtime (src/i18n/t.ts).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const legacy = process.argv[2];
if (!legacy) {
	console.error('Uso: node scripts/convert-mapdata.mjs <ruta a assets/ legacy>');
	process.exit(1);
}
const outDir = path.resolve('src/data/maps');
fs.mkdirSync(outDir, { recursive: true });

const MAPS = [
	{ slug: 'velen', file: 'hos_velen', ns: 'v' },
	{ slug: 'skellige', file: 'skellige', ns: 's' },
	{ slug: 'toussaint', file: 'toussaint', ns: 't' },
	{ slug: 'huerto-blanco', file: 'white_orchard', ns: 'w' },
	{ slug: 'kaer-morhen', file: 'kaer_morhen', ns: 'k' },
];

// Íconos: icons.<tipo> = L.icon({ iconUrl: '.../<archivo>.png', iconSize: [w, h] })
const shared = fs.readFileSync(path.join(legacy, 'scripts/custom/shared.js'), 'utf8');
const icons = {};
for (const m of shared.matchAll(/icons\.(\w+)\s*=\s*L\.icon\(\{\s*iconUrl\s*:\s*'[^']*\/(\w+)\.png',\s*iconSize\s*:\s*\[(\d+),\s*(\d+)\]/g)) {
	icons[m[1]] = { file: m[2], size: [Number(m[3]), Number(m[4])] };
}
fs.writeFileSync(path.join(outDir, '_icons.json'), JSON.stringify(icons, null, '\t') + '\n');
console.log(`íconos: ${Object.keys(icons).length}`);

for (const map of MAPS) {
	const src = fs.readFileSync(path.join(legacy, `scripts/custom/mapdata-${map.file}.js`), 'utf8');

	const calls = [];
	const index = new Map();
	const t = (k, o) => {
		const id = JSON.stringify([k, o ?? null]);
		if (!index.has(id)) {
			index.set(id, calls.length);
			calls.push(o ? { k, o } : { k });
		}
		return `⟦${index.get(id)}⟧`;
	};
	const ctx = { L: { latLng: (a, b) => [a, b] }, $: { t } };
	ctx.window = ctx;
	vm.runInNewContext(src, ctx);

	const data = ctx[`mapdata_${map.file}`];
	const categories = {};
	let total = 0;
	for (const [type, items] of Object.entries(data)) {
		const markers = [];
		for (const item of items) {
			if (!item) continue;
			const marker = { coords: item.coords, label: item.label, popup: item.popup ?? '' };
			if (item.popupTitle != null) marker.popupTitle = item.popupTitle;
			markers.push(marker);
			total += item.coords.length;
		}
		if (markers.length) categories[type] = markers;
	}

	// Orden y llaves del sidebar, tal cual el markup legacy: <i class="tipo"></i><div ... data-i18n="llave">
	const markup = fs.readFileSync(path.join(legacy, `markup/${map.ns}/index.html`), 'utf8');
	const keyList = markup.slice(markup.indexOf('<ul class="key">'), markup.indexOf('<ul class="key controls">'));
	const sidebar = [...keyList.matchAll(/<i class="(\w+)"><\/i><div[^>]*data-i18n="([^"]+)"/g)]
		.map(([, type, key]) => ({ type, key }))
		.filter(({ type }) => categories[type]);

	const out = {
		slug: map.slug,
		path: ctx.map_path,
		ns: map.ns,
		// Igual que custom.js legacy: estos mapas usan L.CRS.Simple, el resto la CRS default (Mercator)
		crs: ['hos_velen', 'velen', 'toussaint', 'kaer_morhen'].includes(ctx.map_path) ? 'simple' : 'mercator',
		bounds: [ctx.map_sWest, ctx.map_nEast],
		center: ctx.map_center,
		maxZoom: ctx.map_mZoom,
		sidebar,
		calls,
		categories,
	};
	fs.writeFileSync(path.join(outDir, `${map.slug}.json`), JSON.stringify(out) + '\n');

	const counts = Object.entries(categories).map(([k, v]) => `${k}:${v.reduce((n, m) => n + m.coords.length, 0)}`);
	console.log(`${map.slug}: ${total} marcadores, ${calls.length} llaves, sidebar ${sidebar.length}/${Object.keys(categories).length}\n  ${counts.join(' ')}`);
}
