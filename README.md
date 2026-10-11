# Mapa de The Witcher 3 en español

Mapas interactivos de The Witcher 3: Wild Hunt en español. Los nombres de lugares, monstruos y categorías salen en los dos idiomas, por ejemplo "Sumergidos (Drowners)", para ubicarlos sin importar el idioma en que tengas el juego.

Es un fork de [witcher3map](https://github.com/witcher3map/witcher3map) migrado a Next.js. La versión original (jQuery + Leaflet 0.7), ya traducida, vive en la rama [`legacy-es`](../../tree/legacy-es).

## Desarrollo

```bash
yarn install
yarn dev
```

Los tiles del mapa (~860 MB) no van en git. En local, `public/tiles` es un symlink a una carpeta con el contenido de [witcher3map-maps](https://github.com/witcher3map/witcher3map-maps/releases/download/1.1/witcher3map-maps-master.zip):

```bash
ln -s ~/Sites/witcher3map-tiles public/tiles
```

En producción los tiles se sirven desde Cloudflare R2 con `NEXT_PUBLIC_TILES_URL=https://<bucket público>`.

## Datos

- `src/i18n/locales/{en,es}`: traducciones (mismo formato i18next que el original).
- `src/data/maps/*.json`: marcadores generados desde la rama legacy con
  `node scripts/convert-mapdata.mjs <ruta a assets/ de legacy-es>`.

## Créditos y licencia

Creado originalmente por [untamed0](https://github.com/untamed0), con [mcarver](https://github.com/mcarver) y los [colaboradores](https://github.com/witcher3map/witcher3map/graphs/contributors) del proyecto. Licencia [CC BY-NC-SA 4.0](http://creativecommons.org/licenses/by-nc-sa/4.0/): uso no comercial, con atribución, y las obras derivadas se comparten bajo la misma licencia.

The Witcher 3, su logo, íconos, mapa y textos son propiedad de [CD PROJEKT RED](https://en.cdprojektred.com/). Se usan bajo la sección 9.4 de su User Agreement: contenido de fans sin fines de lucro.
