# Cameron J. Naidoo · XMB Portfolio

A PS3/PSP XMB style portfolio that runs on the screen of a 3D PSP.

## Run it locally

```
npm install        # first time only
npm start          # then open http://localhost:3000
npm run watch      # in a second terminal while editing SCSS
```

Handy while developing: `http://localhost:3000/?skipintro` skips the intro
and the XMB's start screen. `xmb.html` still works on its own too.

## Where things live

| Path | What it is |
| --- | --- |
| `index.html`, `shell/` | The intro (cjn monogram) + the 3D PSP (three.js from a CDN) |
| `models/psp.glb` | The PSP model (textures resized to 2048px) |
| `xmb.html` | The XMB itself, shown on the PSP's screen |
| `js/script.js` | XMB navigation (sections and rows) |
| `js/content.js` | **All portfolio content**: academics, skills, projects, links |
| `js/features.js` | Overlays, project folders, PSN-style message box, ✕/○ keys, mouse |
| `js/shell-bridge.js` | Lets the PSP's buttons drive the XMB |
| `scss/` | Styles (`npm run build` compiles `scss/main.css`) |

## Controls

Arrow keys or the D-pad move around. ✕ / Enter opens (project folders,
links, the message box); ○ / Esc / Backspace goes back. You can also click
the PSP's buttons, the icons and rows on the screen, and drag the PSP to turn it.

## Credits

3D model: ["Sony PSP"](https://sketchfab.com/3d-models/sony-psp-dca89d10ec304d0cab76837750df7761)
by [Ilya Ostrovsky](https://sketchfab.com/strov), licensed under
[CC BY 4.0](http://creativecommons.org/licenses/by/4.0/). Changes: textures
resized and the screen replaced with a live page.

Type: [Geist](https://vercel.com/font) and
[Instrument Serif](https://github.com/Instrument/instrument-serif) Italic (both SIL
Open Font License). See `fonts/README.md`.

Backdrop: a product-shot studio (dark or light, toggle bottom left): CSS backdrop and
spotlight (`shell/js/studio.js`), with the PSP's reflection and contact shadow in `shell/js/viewer.js`.

PSP, PlayStation and Sony are trademarks of Sony Interactive Entertainment;
this is a non-commercial fan recreation.
