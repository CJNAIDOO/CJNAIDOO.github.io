document.addEventListener('DOMContentLoaded', () => {
  const startupAudio = document.getElementById('startup');
  const navAudio = document.getElementById('nav');
  const bootScreen = document.getElementById('boot-screen');
  const dateEl = document.getElementById('date');

  const categories = Array.from(document.querySelectorAll('.xmb-title'));
  let catIdx = Math.max(0, categories.findIndex(c => c.classList.contains('active')));
  let itemIdx = 0;

  function getItems(cat) {
    return Array.from(cat.querySelectorAll('.xmb-contents > .submenu'));
  }

  function updateClock() {
    if (!dateEl) return;
    const now = new Date();
    dateEl.textContent = now.toLocaleString(undefined, {
      weekday: 'short', year: 'numeric', month: 'short',
      day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }
  updateClock();
  setInterval(updateClock, 30000);

  function render() {
    categories.forEach((cat, cI) => {
      const isActive = cI === catIdx;
      cat.classList.toggle('active', isActive);

      getItems(cat).forEach((item, iI) => {
        item.classList.toggle('active', isActive && iI === itemIdx);
      });
    });

    // Slide the row so the active category sits under center
    const track = document.querySelector('.xmb-main');
    if (track) {
      const gap = 140;     // must match .xmb-main gap in CSS
      const itemWidth = 90; // must match .xmb-title width in CSS
      const offset = catIdx * (gap + itemWidth);
      track.style.transform = `translateX(${-offset}px)`;
    }
  }

  function playNav() {
    if (!navAudio) return;
    navAudio.currentTime = 0;
    navAudio.play().catch(() => {});
  }

  let booted = false;
  function boot() {
    if (booted) return;
    booted = true;

    if (startupAudio) {
      startupAudio.currentTime = 0;
      startupAudio.play().catch(() => {});
    }
    if (bootScreen) {
      bootScreen.classList.add('fade-out');
      setTimeout(() => bootScreen.remove(), 1200);
    }
    render();
  }

  document.addEventListener('keydown', (e) => {
    if (!booted) { boot(); return; }

    const cat = categories[catIdx];
    const items = getItems(cat);
    let moved = false;

    if (e.key === 'ArrowRight' && catIdx < categories.length - 1) {
      catIdx++; itemIdx = 0; moved = true;
    } else if (e.key === 'ArrowLeft' && catIdx > 0) {
      catIdx--; itemIdx = 0; moved = true;
    } else if (e.key === 'ArrowDown' && itemIdx < items.length - 1) {
      itemIdx++; moved = true;
    } else if (e.key === 'ArrowUp' && itemIdx > 0) {
      itemIdx--; moved = true;
    }

    if (moved) {
      playNav();
      render();
    }
  });

  document.addEventListener('click', () => {
    if (!booted) boot();
  });

  // Set initial layout state (categories/items visible before boot too,
  // in case someone lands here with the boot screen already dismissed)
  render();
});