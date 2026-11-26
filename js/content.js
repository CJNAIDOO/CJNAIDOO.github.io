// ============================================================================
// Portfolio content — edit this file to change what the XMB overlays show.
// Everything marked TODO is placeholder text to replace this week.
// Photos: put them in images/academics/ and set the path, e.g.
//   photo: "images/academics/high-school.jpg"
// Leave photo as null to show the plain background until you have one.
// Trophies (achievements): tier is "platinum", "gold" or "silver".
// ============================================================================

const PORTFOLIO = {

    // ---- Home: About me ----------------------------------------------------
    // A first draft to edit: make it sound like you.
    about: {
        label: "About me",
        name: "Cameron J. Naidoo",
        tagline: "Aspiring Creative Technologist & Fullstack Developer",
        location: "Johannesburg, South Africa", // TODO: check
        photo: "images/home/jhb_bg.jpg",
        // Shown on its own (no name or location: the site already says both).
        summary: [
            "I'm a Johannesburg-based developer finishing my Computer Science degree at Emeris, graduating in May 2027. I enjoy employing emerging technologies to deliver novel solutions to South African problems.", // TODO: your five things
            "I'm looking for a software engineering graduate role where I can continue growing as a developer, and I'm looking forward to continuing my studies in computer science.",
        ],
    },

    // ---- My Academics ------------------------------------------------------
    academics: {
        highschool: {
            label: "High School",
            name: "Midrand High School",
            years: "2014 – 2019",
            location: "Midrand, Gauteng",
            photo: "images/academics/mhs_bg.jpg",
            logo: "images/academics/mhs_logo.png",
            summary: "Matriculated as Dux Scholar with seven distinctions", // the subjects below run on after a semicolon
            // listed in the sentence above; add the marks you want to show
            subjects: [
                { name: "Physical Science", mark: "95%" },
                { name: "Accounting", mark: "95%" },
                { name: "Life Sciences" },              // TODO: mark?
                { name: "Mathematics" },                // TODO: mark?
                { name: "Afrikaans", mark: "90%" },
                { name: "English" },                    // TODO: mark?
            ],
            // platinum gets its own line; the rest fill two columns, left then right
            trophies: [
                { tier: "platinum", title: "Dux Scholar" },
                { tier: "gold", title: "Model UN first team" },
                { tier: "gold", title: "SAIIA Young Leaders Conference 2017 delegate" },
                { tier: "gold", title: "Slam poetry first team" },
                { tier: "gold", title: "Cricket first team" },
            ],
        },
        university: {
            label: "University",
            name: "IIE Emeris",
            years: "2024 – 2026",
            location: "Waterfall, Gauteng",
            photo: "images/academics/emeris_bg.jpg",
            logo: "images/academics/emeris_logo.png",
            summary: "BCAD student, graduating in May 2027. I'm currently building HustleHub+, a freelance platform on the MERN stack; Peak, a Kotlin hiking app that brings safety information together so hikers stay aware in real time; and a mobile outreach platform.", // TODO: a few words on what the outreach platform does
            trophies: [
                { tier: "gold", title: "Top Achiever: First Year" },
                { tier: "gold", title: "93% average" },
                { tier: "gold", title: "Golden Key member" },
            ],
        },
    },

    // ---- My Expertise ------------------------------------------------------
    // Each section is a list of tools: an icon, the name and a few words on
    // what you use it for.
    //   icon:     a file in images/tech/ (Devicon, MIT). Leave it out and the
    //             tile shows the first letters of the name instead.
    //   learning: true = used it, still growing (the icon shows a bit dimmer)
    expertise: {
        frontend: {
            label: "Frontend",
            tools: [
                { name: "HTML", icon: "html5"},
                { name: "CSS", icon: "css3"},
                { name: "three.js", icon: "threejs", mono: true},
                { name: "React", icon: "react"},
                { name: "Kotlin & Android", icon: "kotlin"},
                { name: "WPF", icon: "dotnetcore"},
            ],
        },
        backend: {
            label: "Backend",
            tools: [
                { name: "C#", icon: "csharp"},
                { name: "Java", icon: "java"},
                { name: "C++", icon: "cplusplus"},
                { name: "JavaScript", icon: "javascript"},
                { name: "ASP.NET Core MVC", icon: "dotnetcore"},
                { name: "Node.js & Express", icon: "nodejs"},
                { name: "Unit testing", icon: "junit"},
            ],
        },
        databases: {
            label: "Databases",
            tools: [
                { name: "SQL Server", icon: "microsoftsqlserver"},
                { name: "Oracle SQL", icon: "oracle"},
                { name: "MySQL", icon: "mysql"},
                { name: "MongoDB", icon: "mongodb"},
                { name: "Firebase", icon: "firebase"},
                { name: "SQLite & Room", icon: "sqlite"},
            ],
        },
        ai: {
            label: "Data & AI",
            tools: [
                { name: "OpenCV", icon: "opencv"},
                { name: "YOLO"},
            ],
        },
        devops: {
            label: "Cloud & DevOps",
            tools: [
                { name: "Azure", icon: "azure"},
                { name: "Azure SQL", icon: "azuresqldatabase"},
                { name: "Docker", icon: "docker"},
                { name: "Git", icon: "git"},
                { name: "GitHub", icon: "github", mono: true},
                { name: "GitHub Actions", icon: "githubactions"},
                { name: "Grafana", icon: "grafana"},
            ],
        },
    },

    // ---- My Projects -------------------------------------------------------
    // One XMB row per project (the rows are in xmb.html, matched by data-id).
    // Laid out like My Academics: photo background, the project's logo bottom left.
    // ✕ / Enter opens live if there is one, otherwise repo.
    projects: {
        sekuriti: {
            says: "A cybersecurity helper for everyday South Africans. It uses Gemini for the chat and falls back to its own built-in rules when it's offline.",
            title: "Sekuriti",
            year: "2026",
            status: "Desktop app · solo",
            summary: "A cybersecurity assistant for everyday South Africans. Ask about scams, phishing, passwords and 2FA, paste a suspicious SMS or WhatsApp for a verdict, manage security to-dos in plain English and test yourself with a quiz. It uses Google Gemini with function calling and falls back to a built-in rule engine offline.",
            stack: ["C#", ".NET 9", "WPF", "MVVM", "Gemini API"],
            photo: "images/projects/sekuriti_bg.jpg?v=4", // placeholder: swap for a real screenshot or photo
            logo: "images/projects/sekuriti_logo.png",
            live: null,
            repo: null, // TODO: GitHub URL
        },
        betterbudget: {
            says: "This started as a group project in the first semester of my third year, and I revamped it. I rebuilt the data layer, fixed the outstanding bugs and redesigned the UI so it feels more intuitive.",
            title: "BetterBudget",
            year: "2026",
            status: "Android app · team of four, then solo",
            summary: "An Android budget tracker: log expenses with receipt photos, group them into categories, set monthly goals, automate recurring payments and see where your money goes, all synced to Firebase. It started as a team-of-four PROG7313 project and has since been migrated, rebuilt and extended as a solo project.",
            stack: ["Kotlin", "Coroutines & Flow", "MVVM", "Firebase", "WorkManager", "JUnit"],
            photo: "images/projects/betterbudget_bg.jpg?v=4", // placeholder: swap for a real screenshot or photo
            logo: "images/projects/betterbudget_logo.png",
            live: null,
            repo: "https://github.com/CJNAIDOO/Better-Budget",
        },
        theloop: {
            says: "I was the group leader on this one. I was responsible for making sure everyone delivered their part, and I owned the back end: the Express API, the MongoDB data model and transactions, the security and role-based access, and the pipeline that deploys it to Azure. I also led the presentation.",
            title: "SAID Mobile Outreach App",
            year: "2026",
            status: "Web app · team of five",
            summary: "A platform for The Society for Animals in Distress that connects pet owners in underserved communities with SAID's Mobile Treatment Unit. Owners request visits, admins plan outreach days per area, and Animal Health Technicians record treatments in the field, even with no signal.",
            stack: ["Node.js", "Express", "MongoDB", "JWT", "Azure App Service", "GitHub Actions", "React PWA"],
            photo: "images/projects/theloop_bg.jpg?v=4",
            logo: "images/projects/theloop_icon.png", // SAID badge (THE LOOP wordmark: theloop_logo.png)
            trophies: [
                { tier: "gold", title: "Best Presentation" },
                { tier: "gold", title: "People's Choice Award" },
            ],
            live: "https://theloopweb7315.z1.web.core.windows.net",
            repo: null, // github.com/EMGPMD/insy7315-2026-task-2-group-9 (university org: public?)
        },
        peak: {
            says: "A hiking app I built with a teammate. My side was the API, finding and saving trails, Google sign-in, fingerprint login, notifications and hike recaps. I also deployed the API and got the app ready for the Play Store.",
            title: "Peak",
            year: "2026",
            status: "Android app + API · team of two",
            summary: "An Android hiking companion: explore trails on Google Maps, bookmark favourites and track a hike live with GPS in a background service that logs distance and elevation gain, ending with a trip summary and photos. It runs on a Node.js / Express REST API with JWT auth, rate limiting and Firebase, and works offline.",
            stack: ["Kotlin", "Google Maps", "Room", "Retrofit", "Firebase Auth", "Node.js", "Express"],
            photo: "images/projects/peak_bg.jpg?v=4", // placeholder: swap for a real screenshot or photo
            logo: "images/projects/peak_logo.png",
            live: null,
            repo: null, // github.com/EMGPMD/prog7314-2026-part-2-group-15 (university org: public?)
        },
        hustlehub: {
            says: "A freelance marketplace, built with one teammate. I was responsible for the API throughout. In part one I set up the foundations: the secure authentication API. In part two I carried it on, with gigs, bookings, payments and income tracking. In part three I added the SARS tax estimate, account lockout, secret scanning, and the Docker and logging setup. I also helped out on the React front end.",
            title: "HustleHub+",
            year: "2026",
            status: "Web app · team of two",
            summary: "A secure freelance marketplace for South Africans: freelancers list services, clients book them with simulated payments, and a tax estimate is worked out from each freelancer's earnings. It has JWT sessions, role-based access, account lockout, rate limiting and a strict content security policy, and ships through CI with secret scanning and static analysis.",
            stack: ["MongoDB", "Express", "React", "Node.js", "JWT", "Docker", "GitHub Actions", "Grafana"],
            photo: "images/projects/hustlehub_bg.jpg?v=4", // placeholder: jacaranda gradient; swap for a real screenshot
            logo: "images/projects/hustlehub_logo_wide.png?v=2", // one-line wordmark for the screen (the menu icon is the stacked one)
            live: null,
            repo: null, // TODO: personal GitHub URL once migrated (now github.com/EMGPMD/insy7314-2026-poe-part-3-group-4)
        },
        smartx: {
            says: "An individual project. I wrote the queues, the stack, a graph and an AVL tree myself, with no ready-made collections. The queues and stack run the live command stream with undo. The graph routes the sensor mesh around failures and keeps the power cost down. The AVL tree makes the history queries fast.",
            title: "Smart-X IoT Mesh",
            year: "2026",
            status: "Desktop app + API · solo",
            summary: "A WPF desktop app on a .NET 10 Minimal API for a growing facility's IoT sensors (hydroponic trays, irrigation valves, pumps). It ingests sensor telemetry, runs device commands with undo, and maps a 16-node ESP32 mesh with self-healing routes and fast historical queries. The queue, priority queue, stack, graph and AVL tree behind it are all hand-written, and the spanning tree keeps the mesh connected for about a third of the energy of using every link.",
            stack: ["C#", ".NET 10", "WPF", "ASP.NET Core", "Graphs & AVL trees", "Dijkstra", "ESP32 mesh"],
            photo: "images/projects/smartx_bg.jpg?v=5",
            logo: "images/projects/smartx_logo_wide.png",
            live: null,
            repo: null, // TODO: personal GitHub URL once migrated (now github.com/EMGPMD/prog7312-2026-poe-part-3-st10434031-cameron-naidoo)
        },
    },

    // ---- Photos --------------------------------------------------------------
    // Landing on Photos opens a three.js space with these floating in it.
    // Each one: a path ("images/photos/01.jpg"), { src, caption }, or null for
    // an empty numbered frame until you add the picture.
    photos: {
        title: "Photos",
        items: Array(16).fill(null), // TODO: add photos
    },

    // ---- Games ---------------------------------------------------------------
    // play: ✕ starts the game. Tetris is my C# / WPF Tetris ported to
    // JavaScript (js/tetris.js). TODO: repo URL github.com/CJNAIDOO/Tetris?
    games: {
        tetris: { title: "Tetris", play: true },
        // Ilifa: Phaser 3 action game (in development), games/ilifa/.
        // Started as the Syntax Sorcerers' IAT Fusion Hackathon entry (Mzanzi Chronicles).
        ilifa: { title: "Ilifa", play: true, demo: true },
    },

    // ---- Let's Connect -----------------------------------------------------
    connect: {
        linkedin: "https://www.linkedin.com/in/cameron-joshua-naidoo-343a9b264/",
        github: "https://github.com/CJNAIDOO",
        email: {
            to: "Cameron J. Naidoo",
            // Free key from https://web3forms.com (enter your email, they send the key).
            // It's meant to be public, so it's fine in this file.
            web3formsKey: "", // TODO
        },
    },
}
