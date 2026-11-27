// ============================================================================
// Everything in the room you're likely to change, in one place.
// Positions are in metres in the room (see room.js), y is height off the floor.
//
// The room is an attic bedroom, 4.57 m wide and 4.54 m deep. Facing the back
// wall: the bookshelf (x 0.7 - 1.7) and the desk (x 1.8 - 4.5) along it, the
// bed against the sloping left wall, a gallery wall on the right.
//   'back' wall: x from 0 (left corner) to 4.57
//   'right' wall: z from 0 (back corner) to 4.54 (the open front)
// ============================================================================

export const ROOM = {
    // ---- posters ------------------------------------------------------------
    // Swap a poster by replacing its image (any size; it keeps its aspect
    // ratio, `w` sets the width in metres). y is the poster's centre height.
    // `frame` puts it in one of the bedroom's three picture frames instead
    // (cropped to fit): 'cuadro' is the wide one over the desk, 'cuadro2' the
    // small one over the bookshelf, 'cuadro3' the tall one next to it. Frames
    // with no poster are taken down.
    // `fm` hangs it in a real picture frame (from models/room/frames.glb, the nearest shape) with a white mount.
    // `tape` pins it up with two bits of tape. `id` makes it clickable (see
    // GUIDE.lines and room.js).
    posters: [
        // the main wall, round the Supreme decks (see `boards` below): all different sizes,
        // all in the same black frame, and every one clickable (a close-up)
        // over the decks: Midrand's water tower (Jozi) in the middle, KZN photos either side
        { src: 'images/room/posters/midrand.webp', wall: 'back', x: 3.55, y: 2.76, w: 0.62, rot: -0.004, fm: true, id: 'jozi' },
        // KZN either side of it, each in its own frame and all different sizes, up into the
        // space under the ceiling: the coast over the cane fields on the left, Tongaat's
        // Daily Market over Phoenix's Al-Falah Centre on the right
        { src: 'images/room/posters/kzn-coast.webp', wall: 'back', x: 2.88, y: 3.3, w: 0.5, rot: 0.01, fm: true },
        { src: 'images/room/posters/kzn-cane.webp', wall: 'back', x: 2.87, y: 2.82, w: 0.44, rot: -0.008, fm: true },
        { src: 'images/room/posters/tongaat-market.webp', wall: 'back', x: 4.2, y: 2.94, w: 0.56, rot: -0.01, fm: true },
        { src: 'images/room/posters/phoenix-alfalah.webp', wall: 'back', x: 4.2, y: 2.47, w: 0.52, rot: 0.008, fm: true },
        { src: 'images/room/posters/12th-fail.webp', wall: 'back', x: 4.18, y: 1.84, w: 0.5, rot: -0.012, tape: true, id: 'twelfth' },   // (where the Stüssy 8 ball was)
        { src: 'images/room/posters/spiderman.webp', wall: 'back', x: 2.24, y: 2.1, w: 0.47, rot: 0.02, tape: true, id: 'spiderman' },
        // small ones round Spider-Man and Bowen: a note under Spider-Man, the indentured
        // labourers arriving up high, Kalam over Mandela
        { src: 'images/room/posters/authenticity.webp', wall: 'back', x: 2.26, y: 1.44, w: 0.22, rot: -0.02, tape: true, id: 'authenticity' },
        { src: 'images/room/posters/indentured.webp', wall: 'back', x: 2.13, y: 2.93, w: 0.62, rot: -0.008, fm: true, id: 'indentured' },
        { src: 'images/room/posters/kalam.webp', wall: 'back', x: 1.13, y: 2.63, w: 0.3, rot: 0.012, fm: true, id: 'kalam' },
        // over the bookshelf: Mandela, and Bowen beside him (the ceiling slopes down above them)
        { src: 'images/room/posters/mandela-rally.webp', wall: 'back', x: 1.15, y: 2.0, w: 0.46, rot: 0.01, fm: true, id: 'mandela' },
        { src: 'images/room/posters/bowen.webp', wall: 'back', x: 1.68, y: 2.33, w: 0.44, rot: -0.015, tape: true, id: 'bowen' },
        // Cam's additions, all different sizes: Biko over Bowen, Goku left of Mandela, Sisyphus
        // over the indentured labourers, 12th Fail at the foot of the right-hand column, and
        // Still Here Despite It All under the cane fields
        { src: 'images/room/posters/biko.webp', wall: 'back', x: 1.47, y: 3.2, w: 0.36, rot: -0.01, fm: true, id: 'biko' },
        { src: 'images/room/posters/goku.webp', wall: 'back', x: 0.66, y: 2.25, w: 0.3, rot: 0.015, tape: true, id: 'goku' },
        { src: 'images/room/posters/sisyphus.webp', wall: 'back', x: 2.13, y: 3.41, w: 0.3, rot: -0.012, tape: true, id: 'sisyphus' },
        { src: 'images/room/posters/jordan.webp', wall: 'back', x: 3.86, y: 3.5, w: 0.6, rot: 0.006, tape: true, id: 'jordan' },   // over the water tower and Tongaat's market
        { src: 'images/room/posters/still-here.webp', wall: 'back', x: 2.88, y: 2.42, w: 0.4, rot: -0.01, tape: true, id: 'stillhere' },
        // (the right wall has the pin board)
    ],

    // ---- this year's modules: one composition book each, in a loose stack on the bottom shelf
    // beside the textbooks, the code on a strip of tape across the cover. Click one to pull it
    // out; its card shows the module's project(s), and Previous / Next flip through them.
    modules: [
        { code: 'PROG7312', projects: [
            { title: 'Smart-X IoT Mesh', about: 'A WPF desktop app on a .NET API: it ingests sensor telemetry, runs device commands through my own queue, priority-queue and stack (with undo), and maps an ESP32 mesh with self-healing routes (BFS, Prim\'s MST, Dijkstra) and fast history queries from my own AVL tree.', link: null },
        ] },
        { code: 'PROG7314', projects: [
            { title: 'Peak', about: 'An Android hiking companion: trails on Google Maps, favourites, and live GPS tracking of distance and elevation, on a Node.js / Express API with JWT auth and Firebase.', link: null },
        ] },
        { code: 'INSY7314', projects: [
            { title: 'HustleHub+', about: 'A freelance marketplace on the MERN stack, built secure from the start: strong-password rules, JWT sessions, input validation, rate limiting and a strict content security policy.', link: null },
        ] },
        { code: 'INSY7315', projects: [
            { title: 'SAID Mobile Outreach App', about: 'For The Society for Animals in Distress: owners request visits, admins plan outreach days, and technicians record treatments in the field, even offline. I built the back end: the Express API, MongoDB, JWT and role-based access, CI/CD and Azure hosting.', link: 'https://theloopweb7315.z1.web.core.windows.net' },
        ] },
    ],

    // ---- the pin board on the right wall: Cam's own photos. u, v: metres from the board's
    // centre (u to the right as you face it, v up); w: width in metres; rot: a slight tilt.
    pinboard: [
        // top row
        { src: 'images/room/pins/ylc-2017.webp', href: 'https://saiia.org.za/wp-content/uploads/2018/08/Highlights_2017_Report.pdf', u: -0.84, v: 0.2, w: 0.4, rot: -0.07, pin: '#e6b422' },
        { src: 'images/room/pins/parents-1st-birthday.webp', u: -0.4, v: 0.17, w: 0.26, rot: 0.04, pin: '#b3202a' },
        { src: 'images/room/pins/said-expo.webp', u: 0.1, v: 0.21, w: 0.4, rot: -0.04, pin: '#2457d6' },
        { src: 'images/room/pins/two-oceans.webp', u: 0.8, v: 0.2, w: 0.42, rot: 0.05, pin: '#e6b422' },
        // bottom row (the gap in the middle is for the school photo)
        { src: 'images/room/pins/results-day.webp', href: 'https://www.citizen.co.za/midrand-reporter/news-headlines/2020/01/08/midrand-high-school-celebrates-matricresults2019/', u: -0.78, v: -0.22, w: 0.36, rot: 0.05, pin: '#2457d6' },
        { src: 'images/room/pins/grandparents.webp', u: -0.28, v: -0.22, w: 0.38, rot: -0.05, pin: '#b3202a' },
        { src: 'images/room/pins/cape-town.webp', u: 0.8, v: -0.22, w: 0.4, rot: -0.04, pin: '#2457d6' },
    ],

    // ---- the figures' first comics: under the logo once you pick a figure up -------
    // (covers from the Marvel Database on Fandom)
    bios: {
        cyclops: { name: 'Scott Summers', about: 'One of Charles Xavier’s first students and the X-Men’s field leader for decades. His eyes fire optic blasts he can’t switch off, so a ruby-quartz visor is all that holds them back. A born tactician who always has a plan.',
            first: 'X-Men #1 (1963)',
            cover: 'https://static.wikia.nocookie.net/marveldatabase/images/2/2f/X-Men_Vol_1_1.jpg/revision/latest/scale-to-width-down/300?cb=20180128172113' },
        daredevil: { name: 'Matt Murdock', about: 'A Hell’s Kitchen lawyer blinded as a boy by a radioactive spill that sent his other senses off the charts, including a radar sense. Trained by the blind master Stick, he argues cases by day and fights for the neighbourhood by night.',
            first: 'Daredevil #1 (1964)',
            cover: 'https://static.wikia.nocookie.net/marveldatabase/images/7/7c/Daredevil_Vol_1_1.jpg/revision/latest/scale-to-width-down/300?cb=20251207203058' },
        thing: { name: 'Ben Grimm', about: 'A test pilot from Yancy Street whose body turned to orange rock when cosmic rays hit the Fantastic Four’s rocket. Huge strength, a big heart, and the line everyone knows: “It’s clobberin’ time!”',
            first: 'Fantastic Four #1 (1961)',
            cover: 'https://static.wikia.nocookie.net/marveldatabase/images/f/f2/Fantastic_Four_Vol_1_1.jpg/revision/latest/scale-to-width-down/300?cb=20220818071618' },
        hood: { name: 'Parker Robbins', about: 'A small-time New York crook who shot a demon on a warehouse job and kept its red cloak and boots. The boots let him walk on air, the cloak carries Dormammu’s power, and he used both to pull the city’s villains into one crime empire.',
            first: 'The Hood #1 (2002)',
            cover: 'https://static.wikia.nocookie.net/marveldatabase/images/2/23/Hood_Vol_1_1.jpg/revision/latest/scale-to-width-down/300?cb=20200120194326' },
        jubilee: { name: 'Jubilation Lee', about: 'A Beverly Hills orphan who lived in a shopping mall, where her mutant power showed up: bright plasma fireworks from her hands. She followed the X-Men home to their base in Australia, saved Wolverine’s life and became his sidekick.',
            first: 'The Uncanny X-Men #244 (1989)',
            cover: 'https://static.wikia.nocookie.net/marveldatabase/images/f/f5/Uncanny_X-Men_Vol_1_244.jpg/revision/latest/scale-to-width-down/300?cb=20180209013549' },
        jeff: { name: 'Jeff the Land Shark', about: 'A pocket-sized land shark who breathes out of water, eats everything and is smarter than he lets on. He turned up with the West Coast Avengers, was adopted by Gwenpool, and became a fan favourite.',
            first: 'West Coast Avengers #6 (2018)',
            cover: 'https://static.wikia.nocookie.net/marveldatabase/images/5/5e/West_Coast_Avengers_Vol_3_6.jpg/revision/latest/scale-to-width-down/300?cb=20181213011744' },
    },

    // ---- the skate decks over the monitor --------------------------------------
    // Three decks across on wall pegs, top to bottom. Each is either an image
    // of the deck (`img`, lying sideways, nose to tail) or a colour with a word.
    // ---- the chair: where it stands (metres) and which way it faces (radians)
    chair: { x: 3.9, z: 1.9, turn: -2.6 },

    boards: {
        x: 3.2, y: 1.78, gap: 0.035,
        length: 1.1, width: 0.25,                 // as long as the monitor
        decks: [
            { img: 'images/room/boards/supreme-red.webp' },
            { img: 'images/room/boards/supreme-blue.webp' },
            { img: 'images/room/boards/supreme-yellow.webp' },
        ],
    },

    // (the records on the wall are in records-data.js)

    // ---- a neon sign (off for now): { text, font, color, wall, x, y, w }
    neon: null,

    // ---- the figures' voice lines (their ultimates), played when you go up close ---
    // YouTube clips; `start` / `end` in seconds pick one version where a clip has two
    // (the player/enemy line first, the ally line after it). Add `file: 'audio/voices/x.mp3'`
    // to play a sound file instead (no player card); the clip is the fallback.
    voices: {
        cyclops:   { file: 'audio/voices/cyclops.mp3', youtube: 'Ursmh60wcrI', start: 0, end: 5 },      // ally "OPTIC FURY" is 5 - 10
        daredevil: { file: 'audio/voices/daredevil.mp3', youtube: 'TntWTtDZnvU', start: 0, end: 10 },     // ally line is 10 - 14
        jeff:      { file: 'audio/voices/jeff.mp3', youtube: 's3LnjEZFc4Q', start: 0, end: 5 },
        thing:     { file: 'audio/voices/thing.mp3', youtube: 'Bsohu8QD2kk', start: 0, end: 4 },
        jubilee:   { file: 'audio/voices/jubilee.mp3', youtube: 'j-hIXjHywmg', start: 0, end: 3.4 },    // just her line (the file is trimmed to it)
        hood:      { file: 'audio/voices/hood.mp3', youtube: '7fKxv8XeN3U', start: 0, end: 5 },      // ally "FACE OBLIVION" is 5 - 8
    },

    // (the record player plays the record wall's albums: records-data.js)

    // ---- photo album (the framed photo on the desk opens it) ------------------
    // Add your school pictures here: { src, caption }.
    album: [
        { src: 'images/academics/mhs_bg.jpg' },
        { src: 'images/academics/emeris_bg.jpg' },
        { src: 'images/home/jhb_bg.jpg' },
    ],
}

// ============================================================================
// The guide on the TV. Each line can have a voice clip: record it, save it as
// audio/guide/<id>.mp3 and set `voice: true`. Without a clip he "talks" in
// little computer blips while the words type out.
// ============================================================================
export const GUIDE = {
    name: 'MZALA',
    lines: {
        welcome:   { text: 'Welcome to my room. Pick up the PSP on the desk or switch on the PS3. It’s the same portfolio either way.', voice: false },
        nudge:     { text: 'Still looking around? Almost everything in here is clickable. The PSP and the PS3 are where my portfolio lives, though.', voice: false },
        enterPsp:  { text: 'Use the arrow keys to move around, Enter to open something and Esc to go back.', voice: false },
        enterPs3:  { text: 'Use the arrow keys to move around, Enter to open something and Esc to go back. You can also click straight on the screen.', voice: false },
        backHome:  { text: 'Back in the room. Have a look around.', voice: false },
        records:   { text: 'My playlists. Pick one and I’ll put it on.', voice: false },
        crate:     { text: 'My albums. Flip through, pick one and I’ll put it on.', voice: false },
        needle:    { text: 'Needle’s down. Good choice.', voice: false },
        bowen:     { text: 'Mr. West Ham.', voice: false },
        ilifa:     { text: 'Ilifa is a game I’m helping build. You can play the demo in Games, on the PSP or the PS3.', voice: false },
        tetris:    { text: 'I built this Tetris from scratch in C#. It’s playable in Games too.', voice: false },
        kalam:     { text: 'Dream, dream, dream.', voice: false },
        jozi:      { text: '011 to the world.', voice: false },
        // the tour: what he says when you click (and zoom in on) something
        psp:       { text: 'My PSP. This whole portfolio runs on it. Click it again to pick it up.', voice: false },
        ps3:       { text: 'My PS3. Click the monitor and the portfolio comes up on the big screen.', voice: false },
        ds3:       { text: 'My DualShock 3. Pick it up and press START to play on the PS3.', voice: false },
        team:      { text: 'My Marvel Rivals picks. Click a figure to hear about it, click again to pick it up.', voice: false },
        games:     { text: 'My PS4 games. Click one to pull it out.', voice: false },
        books:     { text: 'My books. Click one to pull it out.', voice: false },
        films:     { text: 'My favourite films. Click one to pull it out.', voice: false },
        tv:        { text: 'That’s MZALA, my virtual presence in this room. I’ll point out what’s worth a look.', voice: false },
    },
    // click MZALA himself and he either falls over or gets cross (a line from these at random)
    reactions: {
        fall: [
            'Ow! Who builds a desk with no railing?',
            'I’m fine. I meant to do that.',
            'Eish, my circuits.',
            'Gravity: 1, MZALA: 0.',
        ],
        angry: [
            'Haibo, hands off.',
            'Do I poke you?',
            'Click the PSP, not me.',
            'I’m working here.',
        ],
        sus: [
            'Kinda sus.',
            'Emergency meeting. You. Now.',
            'I saw you vent.',
        ],
    },
    idleSeconds: 25,     // say `nudge` after this long without a click in the room
}
