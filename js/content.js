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
            title: "Sekuriti",
            year: "2026",
            status: "Cybersecurity assistant · C# / WPF",
            summary: "A cybersecurity assistant for everyday South Africans. Ask about scams, phishing, passwords and 2FA, paste a suspicious SMS or WhatsApp for a verdict, manage security to-dos in plain English and test yourself with a quiz. It uses Google Gemini with function calling and falls back to a built-in rule engine offline. Version 2 of my PROG6221 project, which scored 90%.",
            stack: ["C#", ".NET 9", "WPF", "MVVM", "Gemini API"],
            photo: "images/projects/sekuriti_bg.jpg", // placeholder: swap for a real screenshot or photo
            logo: "images/projects/sekuriti_logo.png",
            live: null,
            repo: null, // TODO: GitHub URL
        },
        betterbudget: {
            title: "BetterBudget",
            year: "2026",
            status: "Budget tracker · Android",
            summary: "An Android budget tracker: log expenses with receipt photos, group them into categories, set monthly goals, automate recurring payments and see where your money goes, all synced to Firebase. It started as a team-of-four PROG7313 project; I migrated it to my own account, rebuilt the data layer and fixed its bugs.",
            stack: ["Kotlin", "Coroutines & Flow", "MVVM", "Firebase", "WorkManager", "JUnit"],
            photo: "images/projects/betterbudget_bg.jpg", // placeholder: swap for a real screenshot or photo
            logo: "images/projects/betterbudget_logo.png",
            live: null,
            repo: "https://github.com/CJNAIDOO/better-budget",
        },
        theloop: {
            title: "SAID Mobile Outreach App",
            year: "2026",
            status: "The Loop · team of five",
            summary: "A platform for The Society for Animals in Distress that connects pet owners in underserved communities with SAID's Mobile Treatment Unit. Owners request visits, admins plan outreach days per area, and Animal Health Technicians record treatments in the field, even with no signal. I built the back end: the Express REST API, the MongoDB data model and transactions, JWT security and role-based access, CI/CD and Azure hosting.",
            stack: ["Node.js", "Express", "MongoDB", "JWT", "Azure App Service", "GitHub Actions", "React PWA"],
            photo: "images/projects/theloop_bg.jpg",
            logo: "images/projects/theloop_icon.png", // SAID badge (THE LOOP wordmark: theloop_logo.png)
            live: "https://theloopweb7315.z1.web.core.windows.net",
            repo: null, // github.com/EMGPMD/insy7315-2026-task-2-group-9 (university org: public?)
        },
        peak: {
            title: "Peak",
            year: "2026",
            status: "Hiking app · Android + API · team project",
            summary: "An Android hiking companion: explore trails on Google Maps, bookmark favourites and track a hike live with GPS in a background service that logs distance and elevation gain, ending with a trip summary and photos. It runs on a Node.js / Express REST API with JWT auth, rate limiting and Firebase.", // TODO: add what you built
            stack: ["Kotlin", "Google Maps", "Room", "Retrofit", "Firebase Auth", "Node.js", "Express"],
            photo: "images/projects/peak_bg.jpg", // placeholder: swap for a real screenshot or photo
            logo: "images/projects/peak_logo.png",
            live: null,
            repo: null, // github.com/EMGPMD/prog7314-2026-part-2-group-15 (university org: public?)
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
