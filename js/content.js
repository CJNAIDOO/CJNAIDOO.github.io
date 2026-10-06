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
            "I'm a Johannesburg-based developer in my final year of Computer Science at Emeris. I enjoy building fullstack web apps, native Android apps, cloud services on Azure, desktop tools and interactive experiences like this one.", // TODO: your five things
            "I'm looking for a software engineering graduate role where I can keep growing as a developer, and I'm looking forward to continuing my studies in computer science.",
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
                { name: "HTML", icon: "html5", note: "Semantic, accessible page structure" },
                { name: "CSS", icon: "css3", note: "Layout, animation and responsive design" },
                { name: "SCSS", icon: "sass", note: "Variables, mixins and partials for bigger stylesheets", learning: true },
                { name: "three.js", icon: "threejs", mono: true, note: "3D in the browser: this PSP runs on it" },
                { name: "React", icon: "react", note: "Component-based web front ends", learning: true },
                { name: "Kotlin & Android", icon: "kotlin", note: "Native Android apps with Views and XML layouts" },
                { name: "WPF", icon: "dotnetcore", note: "Windows desktop apps in C# and XAML" },
            ],
        },
        backend: {
            label: "Backend",
            tools: [
                { name: "C#", icon: "csharp", note: "OOP, data structures and algorithms" },
                { name: "Java", icon: "java", note: "OOP, file processing and Swing / JOptionPane GUIs; I tutor it" },
                { name: "C++", icon: "cplusplus", note: "Lower-level programming and memory" },
                { name: "JavaScript", icon: "javascript", note: "Server and browser scripting" },
                { name: "ASP.NET Core MVC", icon: "dotnetcore", note: "Model-View-Controller web apps" },
                { name: "Node.js & Express", icon: "nodejs", note: "REST APIs behind MERN apps" },
                { name: "REST APIs", note: "Designing and consuming JSON APIs" },
                { name: "Unit testing", icon: "junit", note: "JUnit, Kotlin and C# unit tests" },
            ],
        },
        databases: {
            label: "Databases",
            tools: [
                { name: "SQL Server", icon: "microsoftsqlserver", note: "T-SQL queries, views and procedures" },
                { name: "Oracle SQL", icon: "oracle", note: "Relational databases from first principles" },
                { name: "MySQL", icon: "mysql", note: "Relational storage for web apps" },
                { name: "MongoDB", icon: "mongodb", note: "Document database for MERN apps" },
                { name: "Firebase", icon: "firebase", note: "Realtime data and auth for mobile apps" },
                { name: "SQLite & Room", icon: "sqlite", note: "On-device storage for Android" },
                { name: "Data modelling", note: "ER diagrams and normalisation" },
            ],
        },
        ai: {
            label: "Data & AI",
            tools: [
                { name: "Python", icon: "python", note: "Scripting, computer vision and data work", learning: true },
                { name: "OpenCV", icon: "opencv", note: "Real-time video: hand and glove tracking" },
                { name: "YOLO", note: "Object detection for tracking players and hands" },
                { name: "Pandas", icon: "pandas", note: "Cleaning and shaping data", learning: true },
                { name: "NumPy", icon: "numpy", note: "Fast numerical arrays", learning: true },
                { name: "Matplotlib", icon: "matplotlib", note: "Charts and data visualisation", learning: true },
                { name: "Prompt engineering", note: "Working with LLMs: prompts, context and agents" },
            ],
        },
        devops: {
            label: "Cloud & DevOps",
            tools: [
                { name: "Azure", icon: "azure", note: "App Service, Functions and Blob Storage" },
                { name: "Azure SQL", icon: "azuresqldatabase", note: "Managed SQL databases in the cloud" },
                { name: "Docker", icon: "docker", note: "Containerised builds and environments" },
                { name: "Git", icon: "git", note: "Version control, branching and merging" },
                { name: "GitHub", icon: "github", mono: true, note: "Repos, pull requests and Pages hosting" },
                { name: "GitHub Actions", icon: "githubactions", note: "CI/CD pipelines", learning: true },
                { name: "Grafana", icon: "grafana", note: "Dashboards and monitoring", learning: true },
                { name: "Cloudinary", note: "Media hosting and image delivery", learning: true },
                { name: "Windows Server", icon: "windows11", note: "Server setup and administration", learning: true },
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
