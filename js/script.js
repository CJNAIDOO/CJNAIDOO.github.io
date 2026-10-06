const video = document.getElementById("vid")
const titles = document.getElementById("title")
const warning = document.querySelectorAll(".warning")[0]
const menu = document.getElementById("menu")
const clockSection = document.querySelectorAll(".clock")[0]
const dateTime = document.getElementById("date")
const xmbMain = document.querySelectorAll(".xmb-main")[0]
const sections = Array.from(document.querySelectorAll(".xmb-title"))
const startupSound = document.getElementById("startup")
const navSound = document.getElementById("nav")

let sectionNumber = 0
let menuReady = false

// Every section remembers its own focused row, so moving through one
// section's submenu never changes another section's.
const focusedItem = sections.map(() => 0)

// Space between the last row scrolled past and the category icon, and the
// breathing room between the focused row and the rows after it.
const ABOVE_GAP = 20
const BELOW_GAP = 16

// Where the whole XMB bar slides to for each section: [<1400px, 2560-3840px, everything else]
const MENU_OFFSETS = [
    ['-40%', 0, 0],
    ['-10%', '18%', '18%'],
    ['22%', '32%', '39%'],
    ['50%', '47%', '60%'],
    ['76%', '62%', '77%'],
    ['100%', '77%', '97%'],
]

let checkLoad = () =>{
    return new Promise((resolve) => {
        if (document.readyState === 'complete') {
            resolve();
        } else {
            window.addEventListener('load', resolve);
        }
    })
}

let titlesTimeOut = () =>{
    return new Promise(resolve => {
        setTimeout(resolve, 10000)
    }
    )
}

let warningTimeOut = () => {
    return new Promise(resolve => {
        setTimeout(resolve, 7000)
    }
    )
}

let warningDisplay = async () =>{
    await titlesTimeOut();
    titles.remove()
    warning.style.opacity = '1'
    setTimeout( () =>{
        warning.style.opacity = '0'
        warning.remove()
    }, 6000)
    await warningTimeOut();
}

let sideClock = () => {
    let d  = new Date()
    let clock = `${d.getDate()}/${d.getMonth()+1} ${d.getHours()}:${d.getMinutes()}`
    dateTime.innerText = clock
    setTimeout(sideClock, 1000)
}

let loadTitles = async () =>{
    await checkLoad()
    video.play()
    video.style.opacity = '1'
    titles.style.opacity = '1'
    await warningDisplay();
}

let loadMenu = async () =>{
    await loadTitles()
    menu.style.opacity = '1'
    menuReady = true
    sideClock()
    clockSection.style.opacity = '1'
}

let moveMenu = (hd, ultraHd, fullHd) =>{
    let width = document.body.clientWidth
    if (width < 1400) {
        xmbMain.style.marginRight = hd
    }
    else if (width >= 2560 && width <= 3840) {
        xmbMain.style.marginRight = ultraHd
    }
    else {
        xmbMain.style.marginRight = fullHd
    }
}

let submenuItems = (sectionEl) => Array.from(sectionEl.querySelectorAll(":scope > .xmb-contents > .submenu"))

// Puts one section's rows in place. Exactly one row is .active and sits in
// the first row's slot; rows before it are .above and stack over the category
// icon; rows after it are .below and follow on underneath. Rows are moved with
// a transform (--shift), never margins, so every section behaves the same no
// matter how many rows it has.
let layoutSubmenu = (sn) =>{
    const sectionEl = sections[sn]
    const items = submenuItems(sectionEl)
    if (items.length === 0) return

    const current = focusedItem[sn]
    const icon = sectionEl.querySelector(":scope > img")
    const tops = items.map((item) => item.offsetTop)
    const toFirstSlot = tops[0] - tops[current]

    const lastAbove = items[current - 1]
    const aboveShift = lastAbove
        ? (icon.offsetTop - ABOVE_GAP) - (lastAbove.offsetTop + lastAbove.offsetHeight)
        : 0

    items.forEach((item, i) =>{
        item.classList.toggle("active", i === current)
        item.classList.toggle("above", i < current)
        item.classList.toggle("below", i > current)

        let shift = toFirstSlot
        if (i < current) shift = aboveShift
        else if (i > current) shift = toFirstSlot + BELOW_GAP
        item.style.setProperty("--shift", `${shift}px`)
    })

    // let the extra features (overlays, prompts) know which row is focused
    document.dispatchEvent(new CustomEvent("xmb:focus", { detail: { section: sn, item: current } }))
}

let focusSection = (next) =>{
    if (next < 0 || next >= sections.length || next === sectionNumber) return false
    sections[sectionNumber].classList.remove("active")
    sectionNumber = next
    sections[sectionNumber].classList.add("active")

    const offsets = MENU_OFFSETS[Math.min(sectionNumber, MENU_OFFSETS.length - 1)]
    moveMenu(...offsets)
    layoutSubmenu(sectionNumber)
    return true
}

let focusSubMenu = (step) =>{
    const count = submenuItems(sections[sectionNumber]).length
    const next = focusedItem[sectionNumber] + step
    if (next < 0 || next >= count) return false
    focusedItem[sectionNumber] = next
    layoutSubmenu(sectionNumber)
    return true
}

const NAV_KEYS = {
    ArrowDown: () => focusSubMenu(1),
    ArrowUp: () => focusSubMenu(-1),
    ArrowRight: () => focusSection(sectionNumber + 1),
    ArrowLeft: () => focusSection(sectionNumber - 1),
}

document.body.addEventListener('keydown', (e) =>{
    const action = NAV_KEYS[e.key]
    if (!action) return
    e.preventDefault()
    if (!menuReady) return
    if (action()) {
        navSound.currentTime = 0
        navSound.play()
    }
})

// Rows are measured, so lay everything out once images have their size, and
// again whenever the window changes size.
let layoutAll = () => sections.forEach((_, sn) => layoutSubmenu(sn))
layoutAll()
window.addEventListener('load', layoutAll)
window.addEventListener('resize', () => layoutSubmenu(sectionNumber))

const startApp = () => {
    // Hide the start screen
    document.getElementById("start-screen").style.display = "none";
    
    startupSound.play();
    loadMenu();
    
    document.removeEventListener('click', startApp);
    document.removeEventListener('keydown', startApp);
};

// Listen for the user's first click or key press to start the app
document.addEventListener('click', startApp);
document.addEventListener('keydown', startApp);