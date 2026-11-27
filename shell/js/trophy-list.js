// A game's trophies, on its card in the room: Cam's count by grade with the XMB's trophy icons,
// and, from "View trophy list", every trophy in the base game (no DLC), earned or still locked,
// scrolling inside the same card. The lists (names, descriptions, grades, rarity) come from
// data/trophies/<key>.json and the icons from one sprite each (images/room/trophies/<key>.webp),
// loaded only when a list opens.
const GRADES = [['p', 'Platinum'], ['g', 'Gold'], ['s', 'Silver'], ['b', 'Bronze']];
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rarityWord = (r) => (r < 5 ? 'Ultra rare' : r < 15 ? 'Very rare' : r < 50 ? 'Rare' : 'Common');

// what Cam's earned (shelf-data.js GAMES[].trophies): everything, or everything but `missing`
export const trophyState = (game, list) => {
    const t = game.trophies || {};
    const missing = new Set(t.missing || []);
    const earned = list.map((x) => !missing.has(x.n) && !(x.g === 'p' && (missing.size || t.left)));
    return earned;
};
// the counts by grade, for the card: [{ g, earned, total }]
export const trophyCounts = (game) => {
    const tot = game.trophies?.totals || {};
    const missingGrades = game.trophies?.missingGrades || {};
    const left = game.trophies?.left || 0;
    return GRADES.map(([g, name]) => {
        const total = tot[g] || 0;
        let earned = total - (missingGrades[g] || 0);
        if (g === 'p' && (left || Object.keys(missingGrades).length)) earned = 0;
        return { g, name, total, earned, unknown: !!left && g !== 'p' };
    });
};

// the XMB's trophy icons (images/trophies/), for the card and the list
export const ICON = { p: 'images/trophies/platinum.png', g: 'images/trophies/gold.png', s: 'images/trophies/silver.png', b: 'images/trophies/bronze.png' };
const GRADE_NAME = Object.fromEntries(GRADES);
// the card's summary: the four icons with Cam's count under each
export const countsHTML = (game) => trophyCounts(game).map((c) => `
    <li class="t-${c.g}" title="${c.name}"><img src="${ICON[c.g]}" alt="" width="34" height="36"><span>${c.unknown ? `<b>${c.total}</b>` : `<b>${c.earned}</b><i>/${c.total}</i>`}</span><small>${c.name}</small></li>`).join('');   // (the note under the icons is gone: Mzala says it)

// the full list, inside the card: progress, then every trophy (earned or still locked), scrolling
const lists = new Map();
export function trophyListHTML(game) {
    const t = game.trophies || {}, key = t.list || game.key;
    if (!lists.has(key)) lists.set(key, fetch(`data/trophies/${key}.json`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status)))).catch((e) => { lists.delete(key); throw e; }));
    return lists.get(key).then((data) => {
        const list = data.trophies, earned = trophyState(game, list);
        const n = Math.max(0, earned.filter(Boolean).length - (t.left || 0));
        const pct = Math.round((n / list.length) * 100);
        const sprite = `images/room/trophies/${key}.webp`, cols = data.cols, rows = Math.max(1, Math.ceil(list.length / cols));
        const icon = (i) => `background-image:url('${sprite}');background-size:${cols * 100}% auto;background-position:${((i % cols) / Math.max(1, cols - 1)) * 100}% ${(Math.floor(i / cols) / Math.max(1, rows - 1)) * 100}%`;
        // earned first, like the PS4's default sort; locked ones after
        const order = list.map((x, i) => i).sort((a, b) => (earned[b] - earned[a]) || (a - b));
        return `
            <div class="tl-in__head">
                <span class="tl-in__bar"><i style="width:${pct}%"></i></span><b>${pct}%</b><small>${n} of ${list.length} trophies</small>
            </div>
            <ol class="tl-in__list">${order.map((i) => { const x = list[i]; return `
                <li class="tl-in__row${earned[i] ? '' : ' is-locked'}" tabindex="0">
                    <span class="tl-in__icon" style="${icon(i)}"></span>
                    <span class="tl-in__text"><b>${esc(x.n)}</b><span>${esc(x.d)}</span><small>${earned[i] ? '' : 'Not earned yet  ·  '}${x.r}% of players  ·  ${rarityWord(x.r)}</small></span>
                    <img class="tl-in__grade" src="${ICON[x.g]}" alt="${GRADE_NAME[x.g]}" width="22" height="24">
                </li>`; }).join('')}</ol>
            <p class="tl-in__src">From Exophase. Base game only, no DLC.</p>`;
    });
}
