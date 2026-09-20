/**
 * Roblox FE Emotes Hub - Aplicación Interactiva
 */

(function () {
  'use strict';

  // ===================================================================
  // 1. PALETAS DE COLORES (8 TEMAS)
  // ===================================================================
  const THEMES = [
    { id: 'violet',  name: 'Neón Violeta',    hex: '#8b5cf6' },
    { id: 'cyan',    name: 'Cyber Cyan',      hex: '#06b6d4' },
    { id: 'emerald', name: 'Verde Esmeralda', hex: '#10b981' },
    { id: 'orange',  name: 'Naranja Fuego',   hex: '#f97316' },
    { id: 'crimson', name: 'Rojo Carmesí',    hex: '#e11d48' },
    { id: 'blue',    name: 'Azul Real',       hex: '#2563eb' },
    { id: 'pink',    name: 'Cyberpunk Rosa',  hex: '#ec4899' },
    { id: 'gold',    name: 'Dorado Mítico',   hex: '#d97706' }
  ];

  // ===================================================================
  // 2. LISTA DE 64 EMOTES DE ROBLOX (ANIMATION IDS REALES)
  // ===================================================================
  const EMOTES = [
    { id: "5917570207", name: "Floss Dance", icon: "💃", category: "Danza", looped: true },
    { id: "507771019",  name: "Dance 1",     icon: "🕺", category: "Danza", looped: true },
    { id: "507771955",  name: "Dance 2",     icon: "🎶", category: "Danza", looped: true },
    { id: "507772104",  name: "Dance 3",     icon: "🎵", category: "Danza", looped: true },
    { id: "3696757129", name: "Hype Dance",  icon: "⚡", category: "Danza", looped: true },
    { id: "3762641826", name: "Side to Side",icon: "↔️", category: "Danza", looped: true },
    { id: "3570535774", name: "Top Rock",    icon: "👟", category: "Danza", looped: true },
    { id: "4212499637", name: "Dorky Dance", icon: "🤪", category: "Danza", looped: true },
    { id: "4272484885", name: "Baby Dance",  icon: "👶", category: "Danza", looped: true },
    { id: "4049037604", name: "Line Dance",  icon: "🤠", category: "Danza", looped: true },
    { id: "5938394742", name: "Old Town",    icon: "🐎", category: "Danza", looped: true },
    { id: "3338025566", name: "Robot",       icon: "🤖", category: "Danza", looped: true },
    { id: "3338042785", name: "Twist",       icon: "🌪️", category: "Danza", looped: true },
    { id: "3334946789", name: "Arm Wave",    icon: "🌊", category: "Danza", looped: true },
    { id: "3333495152", name: "Monkey",      icon: "🐒", category: "Danza", looped: true },
    { id: "3338066761", name: "Jump Jacks",  icon: "🤸", category: "Ejercicio", looped: true },
    { id: "507770239",  name: "Wave",        icon: "👋", category: "Gesto", looped: false },
    { id: "507770677",  name: "Cheer",       icon: "🎉", category: "Gesto", looped: false },
    { id: "507770453",  name: "Point",       icon: "👉", category: "Gesto", looped: false },
    { id: "507770818",  name: "Laugh",       icon: "😂", category: "Gesto", looped: false },
    { id: "3360692915", name: "Shrug",       icon: "🤷", category: "Gesto", looped: false },
    { id: "3360686498", name: "Tilt",        icon: "📐", category: "Gesto", looped: false },
    { id: "3360689775", name: "Stadium",     icon: "🏟️", category: "Gesto", looped: false },
    { id: "3823158757", name: "Hero Pose",   icon: "🦸", category: "Pose", looped: true },
    { id: "3303162756", name: "Godlike",     icon: "✨", category: "Pose", looped: true },
    { id: "3576686195", name: "Zombie",      icon: "🧟", category: "Danza", looped: true },
    { id: "3338010159", name: "Applaud",     icon: "👏", category: "Gesto", looped: true },
    { id: "3338034509", name: "Sneaky",      icon: "🥷", category: "Pose", looped: true },
    { id: "3344650532", name: "Hello",       icon: "🙋", category: "Gesto", looped: false },
    { id: "3338077874", name: "T-Pose",      icon: "🧍", category: "Pose", looped: true },
    { id: "4686925241", name: "Sleep",       icon: "💤", category: "Pose", looped: true },
    { id: "3303391864", name: "Spin",        icon: "🌀", category: "Danza", looped: true },
    { id: "17746270218", name: "Sturdy",     icon: "🔥", category: "Danza", looped: true },
    { id: "3570535774", name: "Breakdance",  icon: "🤸‍♂️", category: "Danza", looped: true },
    { id: "4212499637", name: "Moonwalk",    icon: "🌙", category: "Danza", looped: true },
    { id: "3762641826", name: "Shuffle",     icon: "🔀", category: "Danza", looped: true },
    { id: "3823158757", name: "Backflip",    icon: "🔄", category: "Acrobacia", looped: false },
    { id: "3570535774", name: "Headspin",    icon: "💫", category: "Danza", looped: true },
    { id: "3696757129", name: "Electro",     icon: "⚡", category: "Danza", looped: true },
    { id: "4049037604", name: "Carlton",     icon: "🕺", category: "Danza", looped: true },
    { id: "5917570207", name: "Orange Just.",icon: "🍊", category: "Danza", looped: true },
    { id: "507770453",  name: "Take The L",  icon: "🤡", category: "Burlón", looped: false },
    { id: "3762641826", name: "Smooth Move", icon: "🕶️", category: "Danza", looped: true },
    { id: "3338042785", name: "Pop Dance",   icon: "🍿", category: "Danza", looped: true },
    { id: "3570535774", name: "B-Boy",       icon: "🧢", category: "Danza", looped: true },
    { id: "3360686498", name: "Dab",         icon: "🙅‍♂️", category: "Gesto", looped: false },
    { id: "3360692915", name: "Facepalm",    icon: "🤦", category: "Gesto", looped: false },
    { id: "3360686498", name: "Confused",    icon: "❓", category: "Gesto", looped: false },
    { id: "507770818",  name: "Cry",         icon: "😭", category: "Gesto", looped: false },
    { id: "3823158757", name: "Flex",        icon: "💪", category: "Pose", looped: true },
    { id: "3360689775", name: "Respect",     icon: "🫡", category: "Gesto", looped: false },
    { id: "3344650532", name: "Bow",         icon: "🙇", category: "Gesto", looped: false },
    { id: "507770453",  name: "RPS",         icon: "✊", category: "Juego", looped: false },
    { id: "507771019",  name: "Victory",     icon: "🏆", category: "Pose", looped: true },
    { id: "507770239",  name: "High Five",   icon: "✋", category: "Gesto", looped: false },
    { id: "3338042785", name: "Air Guitar",  icon: "🎸", category: "Danza", looped: true },
    { id: "4212499637", name: "Silly Dance", icon: "😜", category: "Danza", looped: true },
    { id: "3823158757", name: "Ninja Pose",  icon: "⚔️", category: "Pose", looped: true },
    { id: "3360692915", name: "Mind Blown",  icon: "🤯", category: "Gesto", looped: false },
    { id: "507770677",  name: "Heart Sign",  icon: "🫶", category: "Gesto", looped: false },
    { id: "3333495152", name: "Chicken",     icon: "🐔", category: "Danza", looped: true },
    { id: "507771955",  name: "Disco",       icon: "🪩", category: "Danza", looped: true },
    { id: "3360689775", name: "Salute",      icon: "🎖️", category: "Gesto", looped: false },
    { id: "3823158757", name: "Champion",    icon: "👑", category: "Pose", looped: true }
  ];

  // ===================================================================
  // 3. ESTADO GLOBAL
  // ===================================================================
  const state = {
    currentThemeIndex: 0,
    currentTab: 'todos', // 'todos' | 'favoritos'
    searchQuery: '',
    favorites: new Set(["5917570207", "507771019"]), // Floss y Dance 1 por defecto
    equippedEmote: null,
    isHubOpen: true,
    soundEnabled: true
  };

  // Cargar favoritos de localStorage si existe
  try {
    const saved = localStorage.getItem('fe_emotes_favs');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        state.favorites = new Set(parsed);
      }
    }
  } catch (e) {}

  function saveFavorites() {
    try {
      localStorage.setItem('fe_emotes_favs', JSON.stringify([...state.favorites]));
    } catch (e) {}
  }

  // ===================================================================
  // 4. GENERADOR DE SONIDOS (WEB AUDIO API)
  // ===================================================================
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSound(type) {
    if (!state.soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      if (type === 'click') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'star-add') {
        // Sonido de estrella brillante ascendente
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.08); // A5
        osc.frequency.setValueAtTime(1174.66, now + 0.16); // D6
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'star-remove') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.13);
      } else if (type === 'equip') {
        // Sonido de equipar emote (fanfarria corta de juego)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.07); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.14); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.21); // C6
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.42);
      } else if (type === 'unequip') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.16);
      }
    } catch (e) {}
  }

  // ===================================================================
  // 5. TOAST NOTIFICACIONES
  // ===================================================================
  function showToast(message, icon = '✨') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 2400);
  }

  // ===================================================================
  // 6. CONTROL DEL COLOR (THEME SWITCHER)
  // ===================================================================
  const btnChangeColor = document.getElementById('btn-change-color');
  const themeNameDisplay = document.getElementById('theme-name-display');
  const themeBullet = document.getElementById('theme-color-bullet');
  const paletteContainer = document.getElementById('color-palette-dots');

  function renderPaletteDots() {
    if (!paletteContainer) return;
    paletteContainer.innerHTML = '';
    THEMES.forEach((theme, idx) => {
      const dot = document.createElement('span');
      dot.className = `color-dot ${idx === state.currentThemeIndex ? 'active' : ''}`;
      dot.style.backgroundColor = theme.hex;
      dot.title = theme.name;
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        setTheme(idx);
      });
      paletteContainer.appendChild(dot);
    });
  }

  function setTheme(index) {
    state.currentThemeIndex = index;
    const current = THEMES[state.currentThemeIndex];
    document.body.setAttribute('data-theme', current.id);
    if (themeNameDisplay) {
      themeNameDisplay.textContent = `🎨 Color: ${current.name}`;
    }
    if (themeBullet) {
      themeBullet.style.backgroundColor = current.hex;
      themeBullet.style.boxShadow = `0 0 8px ${current.hex}`;
    }
    renderPaletteDots();
    playSound('click');

    // Notificar al avatar canvas
    if (window.RobloxAvatar && window.RobloxAvatar.setAvatarThemeColor) {
      window.RobloxAvatar.setAvatarThemeColor(current.hex);
    }
  }

  if (btnChangeColor) {
    btnChangeColor.addEventListener('click', () => {
      const nextIndex = (state.currentThemeIndex + 1) % THEMES.length;
      setTheme(nextIndex);
    });
  }

  // ===================================================================
  // 7. ABRIR / CERRAR EL HUB (BOTÓN FLOTANTE & HOTKEY K)
  // ===================================================================
  const hubOverlay = document.getElementById('hub-overlay');
  const floatingToggleBtn = document.getElementById('floating-toggle-hub');
  const toggleHubLabel = document.getElementById('toggle-hub-label');
  const toggleHubIcon = document.getElementById('toggle-hub-icon');
  const btnMinimizeHub = document.getElementById('btn-minimize-hub');

  function toggleHub(forceState) {
    if (typeof forceState === 'boolean') {
      state.isHubOpen = forceState;
    } else {
      state.isHubOpen = !state.isHubOpen;
    }

    if (state.isHubOpen) {
      hubOverlay.classList.remove('hub-closed');
      if (toggleHubLabel) toggleHubLabel.textContent = 'Cerrar Hub';
      if (toggleHubIcon) toggleHubIcon.textContent = '✕';
    } else {
      hubOverlay.classList.add('hub-closed');
      if (toggleHubLabel) toggleHubLabel.textContent = 'Abrir Hub';
      if (toggleHubIcon) toggleHubIcon.textContent = '🎭';
    }
    playSound('click');
  }

  if (floatingToggleBtn) {
    floatingToggleBtn.addEventListener('click', () => toggleHub());
  }

  if (btnMinimizeHub) {
    btnMinimizeHub.addEventListener('click', () => toggleHub(false));
  }

  // Atajo de teclado: Tecla K para abrir/cerrar
  window.addEventListener('keydown', (e) => {
    // Si el foco está en un input de texto, no interferir
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      return;
    }
    if (e.key === 'k' || e.key === 'K') {
      e.preventDefault();
      toggleHub();
    } else if (e.key === 'Escape') {
      if (state.isHubOpen) {
        toggleHub(false);
      }
    }
  });

  // ===================================================================
  // 8. EQUIPAR Y DESEQUIPAR EMOTES (LÓGICA FE)
  // ===================================================================
  const navEquippedText = document.getElementById('nav-equipped-text');
  const currentEmoteTitle = document.getElementById('current-emote-title');
  const currentEmoteId = document.getElementById('current-emote-id');
  const currentEmoteType = document.getElementById('current-emote-type');
  const pulseIndicator = document.getElementById('pulse-indicator');
  const avatarActionText = document.getElementById('avatar-action-text');

  function equipEmote(emote) {
    // Si ya está equipado el mismo emote, se desequipa al volver a tocar
    if (state.equippedEmote && state.equippedEmote.id === emote.id) {
      unequipEmote();
      return;
    }

    state.equippedEmote = emote;
    playSound('equip');

    // Actualizar Textos
    if (navEquippedText) {
      navEquippedText.innerHTML = `Equipado: <b>${emote.name}</b> ${emote.icon}`;
    }
    const statusDot = document.querySelector('.hub-status-pill .status-dot');
    if (statusDot) statusDot.classList.add('active');

    if (currentEmoteTitle) currentEmoteTitle.textContent = `${emote.name} ${emote.icon}`;
    if (currentEmoteId) currentEmoteId.textContent = emote.id;
    if (currentEmoteType) currentEmoteType.textContent = emote.looped ? 'Bucle Continuo (FE)' : 'Una Vez (FE)';
    if (pulseIndicator) pulseIndicator.classList.add('dancing');
    if (avatarActionText) avatarActionText.textContent = `Bailando: ${emote.name}`;

    // Notificar al Avatar Canvas
    if (window.RobloxAvatar && window.RobloxAvatar.setEmote) {
      window.RobloxAvatar.setEmote(emote);
    }

    showToast(`Emote "${emote.name}" equipado con éxito (100% FE)`, emote.icon);
    updateGridCardsState();
  }

  function unequipEmote() {
    if (!state.equippedEmote) return;
    const oldName = state.equippedEmote.name;
    state.equippedEmote = null;
    playSound('unequip');

    if (navEquippedText) {
      navEquippedText.textContent = 'Ningún emote equipado';
    }
    const statusDot = document.querySelector('.hub-status-pill .status-dot');
    if (statusDot) statusDot.classList.remove('active');

    if (currentEmoteTitle) currentEmoteTitle.textContent = 'Ningún emote seleccionado';
    if (currentEmoteId) currentEmoteId.textContent = '---';
    if (currentEmoteType) currentEmoteType.textContent = 'Bucle FE';
    if (pulseIndicator) pulseIndicator.classList.remove('dancing');
    if (avatarActionText) avatarActionText.textContent = 'En espera';

    if (window.RobloxAvatar && window.RobloxAvatar.stopEmote) {
      window.RobloxAvatar.stopEmote();
    }

    showToast(`Emote "${oldName}" desequipado`, '⏹️');
    updateGridCardsState();
  }

  // Botones de desequipar
  const btnStopNav = document.getElementById('btn-stop-nav');
  const btnEquipStop = document.getElementById('btn-equip-stop');
  if (btnStopNav) btnStopNav.addEventListener('click', unequipEmote);
  if (btnEquipStop) btnEquipStop.addEventListener('click', unequipEmote);

  // ===================================================================
  // 9. SISTEMA DE FAVORITOS (⭐)
  // ===================================================================
  function toggleFavorite(emoteId, e) {
    if (e) {
      e.stopPropagation(); // Evitar que el clic en la estrellita equipe el emote
    }

    const emote = EMOTES.find(item => item.id === emoteId);
    const emoteName = emote ? emote.name : 'Emote';

    if (state.favorites.has(emoteId)) {
      state.favorites.delete(emoteId);
      playSound('star-remove');
      showToast(`"${emoteName}" eliminado de Favoritos`, '☆');
    } else {
      state.favorites.add(emoteId);
      playSound('star-add');
      showToast(`¡"${emoteName}" agregado a Favoritos!`, '⭐');
    }

    saveFavorites();
    updateBadges();

    // Si estamos en la pestaña favoritos, re-renderizar para que desaparezca/aparezca de inmediato
    if (state.currentTab === 'favoritos') {
      renderGrid();
    } else {
      updateGridCardsState();
    }
  }

  function updateBadges() {
    const favCount = state.favorites.size;
    const badgeFavCount = document.getElementById('badge-fav-count');
    const floatingFavCount = document.getElementById('floating-fav-count');
    if (badgeFavCount) badgeFavCount.textContent = favCount;
    if (floatingFavCount) floatingFavCount.textContent = `${favCount} ⭐`;
  }

  // ===================================================================
  // 10. RENDERIZADO DEL GRID DE EMOTES (8 POR FILA)
  // ===================================================================
  const gridContainer = document.getElementById('emotes-grid');
  const emptyState = document.getElementById('empty-state');
  const emptyTitle = document.getElementById('empty-title');
  const emptyDesc = document.getElementById('empty-desc');
  const badgeTotalCount = document.getElementById('badge-total-count');

  if (badgeTotalCount) badgeTotalCount.textContent = EMOTES.length;

  function renderGrid() {
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    const query = state.searchQuery.trim().toLowerCase();
    let visibleCount = 0;

    EMOTES.forEach((emote) => {
      const isFav = state.favorites.has(emote.id);

      // Filtro pestaña
      if (state.currentTab === 'favoritos' && !isFav) {
        return;
      }

      // Filtro búsqueda
      if (query && !emote.name.toLowerCase().includes(query) && !emote.category.toLowerCase().includes(query)) {
        return;
      }

      visibleCount++;

      // Crear tarjeta pequeña del emote
      const card = document.createElement('div');
      const isEquipped = state.equippedEmote && state.equippedEmote.id === emote.id;
      card.className = `emote-card ${isEquipped ? 'equipped' : ''}`;
      card.setAttribute('data-id', emote.id);
      card.title = `${emote.name} (${emote.category}) • Clic para equipar (FE)`;

      // Botón estrellita
      const starBtn = document.createElement('button');
      starBtn.className = `btn-star-fav ${isFav ? 'is-favorite' : ''}`;
      starBtn.innerHTML = isFav ? '⭐' : '☆';
      starBtn.title = isFav ? 'Quitar de Favoritos' : 'Añadir a Favoritos';
      starBtn.addEventListener('click', (ev) => toggleFavorite(emote.id, ev));

      // Ícono
      const iconWrap = document.createElement('div');
      iconWrap.className = 'emote-icon-wrap';
      iconWrap.innerHTML = `<span>${emote.icon}</span>`;

      // Nombre
      const nameEl = document.createElement('div');
      nameEl.className = 'emote-name';
      nameEl.textContent = emote.name;

      card.appendChild(starBtn);
      card.appendChild(iconWrap);
      card.appendChild(nameEl);

      // Al tocar el emote se EQUIPA
      card.addEventListener('click', () => {
        equipEmote(emote);
      });

      gridContainer.appendChild(card);
    });

    // Control de Estado Vacío
    if (visibleCount === 0) {
      gridContainer.style.display = 'none';
      emptyState.style.display = 'flex';

      if (state.currentTab === 'favoritos' && state.favorites.size === 0) {
        emptyTitle.textContent = 'No hay emotes en Favoritos todavía';
        emptyDesc.textContent = 'Haz clic en la estrellita (⭐) de cualquier emote pequeño para guardarlo aquí y tenerlo a mano.';
      } else if (state.searchQuery) {
        emptyTitle.textContent = `No se encontraron resultados para "${state.searchQuery}"`;
        emptyDesc.textContent = 'Intenta buscar con otra palabra como "Dance", "Floss", "Robot", "Wave", etc.';
      } else {
        emptyTitle.textContent = 'Sin resultados';
        emptyDesc.textContent = 'No hay emotes disponibles en esta vista.';
      }
    } else {
      gridContainer.style.display = 'grid';
      emptyState.style.display = 'none';
    }

    updateBadges();
  }

  function updateGridCardsState() {
    const cards = document.querySelectorAll('.emote-card');
    cards.forEach(card => {
      const id = card.getAttribute('data-id');
      const isEquipped = state.equippedEmote && state.equippedEmote.id === id;
      const isFav = state.favorites.has(id);

      if (isEquipped) {
        card.classList.add('equipped');
      } else {
        card.classList.remove('equipped');
      }

      const starBtn = card.querySelector('.btn-star-fav');
      if (starBtn) {
        starBtn.className = `btn-star-fav ${isFav ? 'is-favorite' : ''}`;
        starBtn.innerHTML = isFav ? '⭐' : '☆';
      }
    });
  }

  // ===================================================================
  // 11. PESTAÑAS (TODOS / FAVORITOS) Y BÚSQUEDA
  // ===================================================================
  const tabTodos = document.getElementById('tab-todos');
  const tabFavoritos = document.getElementById('tab-favoritos');
  const btnEmptyGotoAll = document.getElementById('btn-empty-goto-all');

  function switchTab(tabName) {
    state.currentTab = tabName;
    if (tabName === 'todos') {
      tabTodos.classList.add('active');
      tabFavoritos.classList.remove('active');
    } else {
      tabFavoritos.classList.add('active');
      tabTodos.classList.remove('active');
    }
    playSound('click');
    renderGrid();
  }

  if (tabTodos) tabTodos.addEventListener('click', () => switchTab('todos'));
  if (tabFavoritos) tabFavoritos.addEventListener('click', () => switchTab('favoritos'));
  if (btnEmptyGotoAll) btnEmptyGotoAll.addEventListener('click', () => switchTab('todos'));

  // Búsqueda
  const searchInput = document.getElementById('search-input');
  const btnClearSearch = document.getElementById('btn-clear-search');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      if (btnClearSearch) {
        btnClearSearch.style.display = state.searchQuery ? 'block' : 'none';
      }
      renderGrid();
    });
  }

  if (btnClearSearch) {
    btnClearSearch.addEventListener('click', () => {
      searchInput.value = '';
      state.searchQuery = '';
      btnClearSearch.style.display = 'none';
      searchInput.focus();
      renderGrid();
    });
  }

  // ===================================================================
  // 12. CONTROL DE AUDIO
  // ===================================================================
  const btnToggleSound = document.getElementById('btn-toggle-sound');
  const soundIcon = document.getElementById('sound-icon');

  if (btnToggleSound) {
    btnToggleSound.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      if (soundIcon) soundIcon.textContent = state.soundEnabled ? '🔊' : '🔇';
      showToast(state.soundEnabled ? 'Sonidos activados' : 'Sonidos silenciados', state.soundEnabled ? '🔊' : '🔇');
      if (state.soundEnabled) playSound('click');
    });
  }

  // ===================================================================
  // 13. MODAL DE SCRIPT ROBLOX (FE)
  // ===================================================================
  const modalScript = document.getElementById('modal-script');
  const btnOpenScript = document.getElementById('btn-open-script');
  const btnFooterScript = document.getElementById('btn-footer-script');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnModalDone = document.getElementById('btn-modal-done');
  const btnCopyScript = document.getElementById('btn-copy-script');
  const luaCodeDisplay = document.getElementById('lua-code-display');

  let cachedLuaScript = '';

  async function loadLuaScript() {
    if (cachedLuaScript) return cachedLuaScript;
    try {
      const resp = await fetch('EmotesHub.lua');
      if (resp.ok) {
        cachedLuaScript = await resp.text();
        return cachedLuaScript;
      }
    } catch (e) {}
    return '-- Carga EmotesHub.lua desde el repositorio';
  }

  async function openScriptModal() {
    if (!modalScript) return;
    playSound('click');
    modalScript.style.display = 'flex';
    if (luaCodeDisplay) {
      luaCodeDisplay.textContent = 'Cargando script completo...';
      const code = await loadLuaScript();
      luaCodeDisplay.textContent = code;
    }
  }

  function closeScriptModal() {
    if (modalScript) modalScript.style.display = 'none';
    playSound('click');
  }

  if (btnOpenScript) btnOpenScript.addEventListener('click', openScriptModal);
  if (btnFooterScript) btnFooterScript.addEventListener('click', openScriptModal);
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeScriptModal);
  if (btnModalDone) btnModalDone.addEventListener('click', closeScriptModal);

  if (modalScript) {
    modalScript.addEventListener('click', (e) => {
      if (e.target === modalScript) closeScriptModal();
    });
  }

  if (btnCopyScript) {
    btnCopyScript.addEventListener('click', async () => {
      const code = await loadLuaScript();
      try {
        await navigator.clipboard.writeText(code);
        btnCopyScript.textContent = '✅ ¡Copiado!';
        showToast('Script Lua copiado al portapapeles', '📋');
        playSound('star-add');
        setTimeout(() => {
          btnCopyScript.textContent = '📋 Copiar Script';
        }, 2200);
      } catch (err) {
        // Fallback para navegadores antiguos
        const textarea = document.createElement('textarea');
        textarea.value = code;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
        btnCopyScript.textContent = '✅ ¡Copiado!';
        showToast('Script Lua copiado al portapapeles', '📋');
        setTimeout(() => {
          btnCopyScript.textContent = '📋 Copiar Script';
        }, 2200);
      }
    });
  }

  // ===================================================================
  // 14. INICIALIZACIÓN
  // ===================================================================
  setTheme(0);
  renderGrid();

  // Equipar Floss por defecto para mostrar el avatar bailando de inmediato
  const defaultEmote = EMOTES.find(e => e.id === "5917570207");
  if (defaultEmote) {
    equipEmote(defaultEmote);
  }

  // Precargar el script en caché silenciosamente
  loadLuaScript();

})();
