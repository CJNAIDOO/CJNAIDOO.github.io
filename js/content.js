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
            "I'm a Johannesburg-based developer in my final year of Computer Science at Emeris. I enjoy employing emerging technologies to deliver novel solutions to South African problems.", // TODO: your five things
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
            summary: "Final-year BCAD student. I'm currently building HustleHub+, a freelance platform on the MERN stack; Peak, a Kotlin hiking app that brings safety information together so hikers stay aware in real time; and a mobile outreach platform.", // TODO: a few words on what the outreach platform does
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
            label: "Frontend & Mobile",
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
                { name: "Python", icon: "python"},
                { name: "OpenCV", icon: "opencv"},
                { name: "YOLO"},
                { name: "Pandas", icon: "pandas"},
                { name: "NumPy", icon: "numpy"},
                { name: "Matplotlib", icon: "matplotlib"},
                { name: "Prompt engineering"},
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
                { name: "Cloudinary"},
                { name: "Windows Server", icon: "windows11"},
            ],
        },
    },

    // ---- My Projects (opened like a PS3/PSP folder) ------------------------
    // live: URL of the running project (optional)   repo: GitHub URL (optional)
    // Pressing ✕ / Enter opens live if there is one, otherwise repo.
    projects: {
        academic: {
            label: "Academic",
            items: [
                {
                    title: "TODO: Academic project",
                    summary: "TODO: what it is, what problem it solves, what you built.",
                    stack: ["TODO"],
                    role: "TODO",
                    year: "2025",
                    status: "TODO",
                    live: null,
                    repo: null,
                },
                {
                    title: "TODO: Another academic project",
                    summary: "TODO",
                    stack: ["TODO"],
                    role: "TODO",
                    year: "2024",
                    status: "TODO",
                    live: null,
                    repo: null,
                },
            ],
        },
        personal: {
            label: "Personal",
            items: [
                {
                    title: "XMB Portfolio",
                    summary: "This site: a PS3 XMB style portfolio running on a 3D PSP you can pick up and turn around.",
                    stack: ["HTML", "SCSS", "JavaScript", "three.js"],
                    role: "Solo",
                    year: "2026",
                    status: "Live",
                    live: "https://cjnaidoo.github.io/",
                    repo: "https://github.com/CJNAIDOO/CJNAIDOO.github.io",
                },
                {
                    title: "TODO: Personal project",
                    summary: "TODO",
                    stack: ["TODO"],
                    role: "TODO",
                    year: "2025",
                    status: "TODO",
                    live: null,
                    repo: null,
                },
            ],
        },
    },

    // ---- Let's Connect -----------------------------------------------------
    connect: {
        linkedin: "", // TODO: "https://www.linkedin.com/in/your-profile/"
        github: "https://github.com/CJNAIDOO",
        email: {
            to: "Cameron J. Naidoo",
            // Free key from https://web3forms.com (enter your email, they send the key).
            // It's meant to be public, so it's fine in this file.
            web3formsKey: "", // TODO
        },
    },
}
