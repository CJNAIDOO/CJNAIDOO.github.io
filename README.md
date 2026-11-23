# Cameron J. Naidoo · Portfolio

A portfolio you walk into: a 3D gaming bedroom (desk, shelf, record player, cork board) built in three.js,
with the full portfolio running on the screen of a 3D PSP (a PS3/PSP style XMB). Phones get the PSP on its
own. Live at <https://cjnaidoo.github.io/>.

No build step for the site itself: it is plain HTML, CSS and ES modules, with three.js loaded from a CDN
(see the import map in `index.html`), so GitHub Pages serves it as it is.

## Run it locally

```
npm install        # first time only
npm start          # then open http://localhost:3000
npm run watch      # in a second terminal while editing the XMB's SCSS
```

Handy URL switches:

| Add to the address | What it does |
| --- | --- |
| `?skipintro` | Skip the intro and the XMB's start screen |
| `?room` / `?lite` | Force the full room / force the PSP on its own (the default on phones) |
| `?livechrome` | Use the live liquid-chrome shader on the loading screen instead of the baked loop |
| `?wall=RRGGBB` | Preview another wall colour in the room, e.g. `?wall=a9b39a` |

## Where things live

| Path | What it is |
| --- | --- |
| `index.html`, `shell/` | The loading screen, the 3D room, the PSP and the page chrome |
| `shell/js/room.js` | The room: models, walls, lighting, camera, shelves, interactions |
| `shell/js/room-config.js` | **Room content**: posters, framed photos, cork-board pins, positions |
| `shell/js/shelf-data.js`, `records-data.js` | The books, films, games and records on the shelves |
| `models/room/` | The room's 3D models (`.glb`) |
| `xmb.html` | The XMB itself, shown on the PSP's screen |
| `js/content.js` | **All portfolio content**: academics, skills, projects, links |
| `js/script.js`, `js/features.js` | XMB navigation, overlays, project folders, message box |
| `js/tetris.js`, `js/ilifa.js` | The games / demos reachable from the XMB |
| `scss/` | XMB styles (`npm run build` compiles `scss/main.css`) |
| `images/og-image.jpg`, `favicon.ico`, `apple-touch-icon.png`, `site.webmanifest` | Tab icon and the link-preview card |

## Things to know when editing

- **Cache-busting:** the scripts and styles are loaded with `?v=NN`. Bump the number (in `index.html` and
  where `main.js` imports `room.js`) when a file changes, or visitors can see a stale copy.
- **A CV link:** drop a PDF at `cv/Cameron-Naidoo-CV.pdf`. A "CV (PDF)" button then appears bottom right
  on its own. Remove the file and it disappears.
- **Email form:** paste a Web3Forms access key into `connect.email.web3formsKey` in `js/content.js`.
- **Photos on the walls:** put the image in `images/room/posters/`, then add an entry to `posters` in
  `shell/js/room-config.js`. `fm: true` hangs it in a real picture frame (`models/room/frames.glb`), `tape: true`
  pins it up as a poster.

## Controls

In the room, drag to look around (a little), click things to look closer. On the XMB, arrow keys or the D-pad
move around; ✕ / Enter opens, ○ / Esc / Backspace goes back. You can also click the PSP's buttons and drag
the PSP to turn it.

## Credits

3D models: "Sony PSP" by [Ilya Ostrovsky](https://sketchfab.com/strov)
([source](https://sketchfab.com/3d-models/sony-psp-dca89d10ec304d0cab76837750df7761)),
[CC BY 4.0](http://creativecommons.org/licenses/by/4.0/); changes: textures resized and the screen replaced with
a live page. The room's other models, the picture-frame pack and the wall-paint texture are credited in the
site's Credits panel.

Type: [Geist](https://vercel.com/font) and
[Instrument Serif](https://github.com/Instrument/instrument-serif) Italic (SIL Open Font License); the other
fonts are listed in `fonts/README.md`.

PSP, PlayStation and Sony are trademarks of Sony Interactive Entertainment. Game covers, film posters and
album art belong to their owners. This is a non-commercial personal project.
