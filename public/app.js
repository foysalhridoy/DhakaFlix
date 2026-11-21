/**
 * DhakaFlix - Minimal Modern Media Platform
 * Integrated with DhakaFlix ISP Server (172.16.50.4)
 */

(function () {
  'use strict';

  // State Management
  const state = {
    currentUrl: '',
    parentUrl: null,
    categories: [],
    folders: [],
    files: [],
    filteredFolders: [],
    filteredFiles: [],
    viewMode: localStorage.getItem('df_view_mode') || 'grid',
    sortOrder: 'date-desc',
    searchQuery: '',
    activeFilter: 'all',
    currentPlaying: null,
    currentSelectedMovie: null
  };

  // DOM Elements
  const el = {
    homeLogoLink: document.getElementById('homeLogoLink'),
    filterInput: document.getElementById('filterInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    gridViewBtn: document.getElementById('gridViewBtn'),
    listViewBtn: document.getElementById('listViewBtn'),
    sortSelect: document.getElementById('sortSelect'),
    refreshBtn: document.getElementById('refreshBtn'),
    parentDirBtn: document.getElementById('parentDirBtn'),

    breadcrumbsBar: document.getElementById('breadcrumbsBar'),
    currentFolderTitle: document.getElementById('currentFolderTitle'),
    currentFolderCount: document.getElementById('currentFolderCount'),

    itemsContainer: document.getElementById('itemsContainer'),
    loadingState: document.getElementById('loadingState'),
    errorState: document.getElementById('errorState'),
    errorMessage: document.getElementById('errorMessage'),
    emptyState: document.getElementById('emptyState'),
    retryBtn: document.getElementById('retryBtn'),

    // Movie Details Modal
    movieDetailsModal: document.getElementById('movieDetailsModal'),
    detailsPosterBanner: document.getElementById('detailsPosterBanner'),
    detailsTitle: document.getElementById('detailsTitle'),
    detailsMeta: document.getElementById('detailsMeta'),
    detailsTags: document.getElementById('detailsTags'),
    closeDetailsBtn: document.getElementById('closeDetailsBtn'),
    detailsLaunchVlcBtn: document.getElementById('detailsLaunchVlcBtn'),
    detailsLaunchBrowserBtn: document.getElementById('detailsLaunchBrowserBtn'),
    detailsDownloadM3uBtn: document.getElementById('detailsDownloadM3uBtn'),
    detailsCopyStreamBtn: document.getElementById('detailsCopyStreamBtn'),
    detailsOpenFolderBtn: document.getElementById('detailsOpenFolderBtn'),

    // Jumper & VLC Help Modals
    directUrlBtn: document.getElementById('directUrlBtn'),
    urlJumperModal: document.getElementById('urlJumperModal'),
    jumpUrlInput: document.getElementById('jumpUrlInput'),
    submitJumpUrlBtn: document.getElementById('submitJumpUrlBtn'),
    cancelUrlModalBtn: document.getElementById('cancelUrlModalBtn'),
    closeUrlModalBtn: document.getElementById('closeUrlModalBtn'),

    vlcHelpBtn: document.getElementById('vlcHelpBtn'),
    vlcHelpModal: document.getElementById('vlcHelpModal'),
    closeVlcModalBtn: document.getElementById('closeVlcModalBtn'),
    dismissVlcModalBtn: document.getElementById('dismissVlcModalBtn'),

    // In-Browser Video Player
    playerModal: document.getElementById('playerModal'),
    mainVideoPlayer: document.getElementById('mainVideoPlayer'),
    playerMediaTitle: document.getElementById('playerMediaTitle'),
    playerEpisodeSub: document.getElementById('playerEpisodeSub'),
    playerCloseBtn: document.getElementById('playerCloseBtn'),
    playerPrevEpBtn: document.getElementById('playerPrevEpBtn'),
    playerNextEpBtn: document.getElementById('playerNextEpBtn'),
    playerVlcDirectBtn: document.getElementById('playerVlcDirectBtn'),
    playerResumeBadge: document.getElementById('playerResumeBadge'),
    playerCinemaLayout: document.getElementById('playerCinemaLayout'),
    playerSeriesPanel: document.getElementById('playerSeriesPanel'),
    seriesEpCountBadge: document.getElementById('seriesEpCountBadge'),
    seasonTabsScroll: document.getElementById('seasonTabsScroll'),
    episodesScrollList: document.getElementById('episodesScrollList'),
    videoBuffering: document.getElementById('videoBuffering'),
    mkvUnsupportedBanner: document.getElementById('mkvUnsupportedBanner'),
    bannerLaunchVlcBtn: document.getElementById('bannerLaunchVlcBtn'),
    subtitleSelect: document.getElementById('subtitleSelect'),
    externalSubtitleInput: document.getElementById('externalSubtitleInput'),
    speedSelect: document.getElementById('speedSelect'),
    filterPillsBar: document.getElementById('filterPillsBar'),

    // Mobile Drawer
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    mobileDrawer: document.getElementById('mobileDrawer'),
    mobileDrawerClose: document.getElementById('mobileDrawerClose'),
    mobileDrawerBody: document.getElementById('mobileDrawerBody'),
    drawerBackdrop: document.getElementById('drawerBackdrop'),

    // Toast
    toastNotification: document.getElementById('toastNotification'),
    toastMessage: document.getElementById('toastMessage'),

    // WOW Features
    playerPipBtn: document.getElementById('playerPipBtn'),
    heroBanner: document.getElementById('heroBanner'),
    heroBg: document.getElementById('heroBg'),
    heroBackdropImg: document.getElementById('heroBackdropImg'),
    heroTitle: document.getElementById('heroTitle'),
    heroSpecs: document.getElementById('heroSpecs'),
    heroMeta: document.getElementById('heroMeta'),
    heroTags: document.getElementById('heroTags'),
    heroDots: document.getElementById('heroDots'),
    heroBtnPlay: document.getElementById('heroBtnPlay'),
    heroBtnVlc: document.getElementById('heroBtnVlc'),
    heroBtnInfo: document.getElementById('heroBtnInfo'),
    heroPosterWrap: document.getElementById('heroPosterWrap'),
    heroPosterImg: document.getElementById('heroPosterImg'),
    heroPrevBtn: document.getElementById('heroPrevBtn'),
    heroNextBtn: document.getElementById('heroNextBtn'),
    continueWatchingSection: document.getElementById('continueWatchingSection'),
    cwScroll: document.getElementById('cwScroll'),
    cwClearBtn: document.getElementById('cwClearBtn'),
    searchAutocomplete: document.getElementById('searchAutocomplete'),
    kbdHelpOverlay: document.getElementById('kbdHelpOverlay'),
    kbdHelpCloseBtn: document.getElementById('kbdHelpCloseBtn')
  };

  // ============================================================
  // INITIALIZATION
  // ============================================================

  async function init() {
    setupEventListeners();
    setViewMode(state.viewMode);
    await loadCategories();

    const urlParams = new URLSearchParams(window.location.search);
    const startUrl = urlParams.get('dir') || (state.categories.length > 0 ? state.categories[0].url : 'http://172.16.50.7/DHAKA-FLIX-7/English%20Movies/%282026%29/');

    if (startUrl) {
      navigateTo(startUrl, false);
    }

    // WOW features initialization
    renderContinueWatching();
    initHeroBanner();

    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.url) {
        navigateTo(e.state.url, false);
      }
    });
  }

  // ============================================================
  // LOAD CATEGORIES & BIND DROPDOWNS
  // ============================================================

  async function loadCategories() {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success && data.categories) {
        state.categories = data.categories;
        populateMobileDrawer();
      }
    } catch (err) {
      console.warn('Categories fetch failed:', err);
    }
  }

  function populateMobileDrawer() {
    if (!el.mobileDrawerBody) return;
    let html = '';

    const groups = {};
    state.categories.forEach(cat => {
      const g = cat.group || 'Other';
      if (!groups[g]) groups[g] = [];
      groups[g].push(cat);
    });

    for (const [groupName, items] of Object.entries(groups)) {
      html += `<div style="font-size:0.72rem; font-weight:700; color:var(--text-dim); text-transform:uppercase; margin:14px 0 6px; padding-left:8px; letter-spacing:0.5px;">${escapeHtml(groupName)}</div>`;
      items.forEach(cat => {
        html += `
          <a href="#" class="dropdown-item" data-url="${escapeHtml(cat.url)}" style="padding:10px 12px; margin-bottom:3px;">
            <span>${cat.icon || '🎬'} ${escapeHtml(cat.name)}</span>
            ${cat.badge ? `<span class="item-badge">${escapeHtml(cat.badge)}</span>` : ''}
          </a>
        `;
      });
    }

    el.mobileDrawerBody.innerHTML = html;

    el.mobileDrawerBody.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const url = item.getAttribute('data-url');
        if (url) {
          closeMobileDrawer();
          navigateTo(url);
        }
      });
    });
  }

  function updateDropdownActiveHighlight(currentUrl) {
    document.querySelectorAll('.dropdown-item').forEach(item => {
      const url = item.getAttribute('data-url');
      if (url && currentUrl.startsWith(url.replace(/\/$/, ''))) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // ============================================================
  // DIRECTORY NAVIGATION
  // ============================================================

  async function navigateTo(targetUrl, pushState = true) {
    if (!targetUrl) return;

    state.currentUrl = targetUrl;
    if (pushState) {
      window.history.pushState({ url: targetUrl }, '', `?dir=${encodeURIComponent(targetUrl)}`);
    }

    updateDropdownActiveHighlight(targetUrl);
    showLoading();

    try {
      const res = await fetch(`/api/browse?url=${encodeURIComponent(targetUrl)}`);
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to browse directory');
      }

      state.parentUrl = data.parentUrl;
      state.folders = data.folders || [];
      state.files = data.files || [];

      renderBreadcrumbs(data.breadcrumbs || []);
      updateHeroHeader(targetUrl);
      applyFilterAndSort();

      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      showError(err.message);
    }
  }

  function renderBreadcrumbs(breadcrumbs) {
    if (!el.breadcrumbsBar) return;

    if (!breadcrumbs || breadcrumbs.length === 0) {
      el.breadcrumbsBar.innerHTML = `<span class="crumb-current">Home</span>`;
      return;
    }

    let html = '';
    breadcrumbs.forEach((crumb, idx) => {
      const isLast = idx === breadcrumbs.length - 1;
      if (idx === 0) {
        html += `<a href="#" class="crumb-link" data-url="${escapeHtml(state.categories[0]?.url || '')}">Home</a>`;
      } else if (isLast) {
        html += `<span class="crumb-sep">/</span><span class="crumb-current" title="${escapeHtml(crumb.name)}">${escapeHtml(crumb.name)}</span>`;
      } else {
        html += `<span class="crumb-sep">/</span><a href="#" class="crumb-link" data-url="${escapeHtml(crumb.url)}">${escapeHtml(crumb.name)}</a>`;
      }
    });

    el.breadcrumbsBar.innerHTML = html;

    el.breadcrumbsBar.querySelectorAll('.crumb-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const url = link.getAttribute('data-url');
        if (url) navigateTo(url);
      });
    });
  }

  function updateHeroHeader(targetUrl) {
    const matchedCategory = state.categories.find(c => c.url === targetUrl);
    let title = matchedCategory ? matchedCategory.name : decodeURIComponent(targetUrl.replace(/\/$/, '').split('/').pop() || 'Media');

    el.currentFolderTitle.textContent = title;

    if (state.parentUrl && state.parentUrl !== targetUrl) {
      el.parentDirBtn.style.display = 'inline-flex';
    } else {
      el.parentDirBtn.style.display = 'none';
    }
  }

  // ============================================================
  // FILTERING & SORTING
  // ============================================================

  function applyFilterAndSort() {
    let folders = [...state.folders];
    let files = [...state.files];

    const query = state.searchQuery.toLowerCase().trim();
    if (query) {
      folders = folders.filter(f => (f.name + ' ' + (f.cleanTitle || '')).toLowerCase().includes(query));
      files = files.filter(f => (f.name + ' ' + (f.cleanTitle || '')).toLowerCase().includes(query));
    }

    const filter = state.activeFilter || 'all';
    if (filter !== 'all') {
      if (filter === 'movie') {
        folders = folders.filter(f => f.mediaType === 'movie' || (!f.name.toLowerCase().includes('season') && !f.name.toLowerCase().includes('series')));
        files = files.filter(f => f.type === 'video');
      } else if (filter === 'series') {
        folders = folders.filter(f => f.mediaType === 'series' || f.type === 'series' || /season|series|s\d{2}/i.test(f.name) || /tv-web-series/i.test(f.url));
        files = files.filter(f => /s\d{2}e\d{2}|ep\d+|season/i.test(f.name));
      } else if (filter === '1080p') {
        folders = folders.filter(f => /1080p|fhd/i.test(f.name) || (f.tags && f.tags.includes('1080p')));
        files = files.filter(f => /1080p|fhd/i.test(f.name) || (f.tags && f.tags.includes('1080p')));
      } else if (filter === '4k') {
        folders = folders.filter(f => /4k|2160p|uhd/i.test(f.name) || (f.tags && f.tags.includes('4K')));
        files = files.filter(f => /4k|2160p|uhd/i.test(f.name) || (f.tags && f.tags.includes('4K')));
      } else if (filter === '2026') {
        folders = folders.filter(f => f.name.includes('2026') || (f.year && f.year.includes('2026')));
        files = files.filter(f => f.name.includes('2026'));
      } else if (filter === 'hindi') {
        folders = folders.filter(f => /hindi|bollywood/i.test(f.name) || /hindi/i.test(f.url));
        files = files.filter(f => /hindi/i.test(f.name));
      } else if (filter === 'south') {
        folders = folders.filter(f => /south|tamil|telugu|malayalam|kannada/i.test(f.name) || /south/i.test(f.url));
        files = files.filter(f => /south|tamil|telugu|malayalam/i.test(f.name));
      } else if (filter === 'bangla') {
        folders = folders.filter(f => /bangla|bengali|dhallywood/i.test(f.name) || /bangla/i.test(f.url));
        files = files.filter(f => /bangla|bengali/i.test(f.name));
      } else if (filter === 'korean') {
        folders = folders.filter(f => /korean|kdrama|k-drama/i.test(f.name) || /korean/i.test(f.url));
        files = files.filter(f => /korean|kdrama/i.test(f.name));
      } else if (filter === 'dual') {
        folders = folders.filter(f => /dual|multi|hindi\s*dub/i.test(f.name) || (f.tags && f.tags.includes('Dual Audio')));
        files = files.filter(f => /dual|multi/i.test(f.name));
      }
    }

    const [field, direction] = state.sortOrder.split('-');
    const multiplier = direction === 'desc' ? -1 : 1;

    const sorter = (a, b) => {
      if (field === 'name') {
        const na = a.cleanTitle || a.name;
        const nb = b.cleanTitle || b.name;
        return multiplier * na.localeCompare(nb, undefined, { numeric: true, sensitivity: 'base' });
      }
      if (field === 'date') {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return multiplier * (da - db);
      }
      return 0;
    };

    folders.sort(sorter);
    files.sort(sorter);

    state.filteredFolders = folders;
    state.filteredFiles = files;

    const totalCount = state.filteredFolders.length + state.filteredFiles.length;
    el.currentFolderCount.textContent = `${totalCount} title${totalCount === 1 ? '' : 's'}`;

    renderItems();
  }

  async function handleFilterPillClick(pillBtn) {
    const filter = pillBtn.getAttribute('data-filter') || 'all';
    state.activeFilter = filter;

    if (el.filterPillsBar) {
      el.filterPillsBar.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    }
    pillBtn.classList.add('active');

    // Filter memory set first
    applyFilterAndSort();

    // If local results are empty and user clicked a category/tag pill, query the indexed catalog
    const totalCount = state.filteredFolders.length + state.filteredFiles.length;
    if (totalCount === 0 && filter !== 'all') {
      let queryTerm = filter;
      if (filter === 'movie') queryTerm = '2026';
      if (filter === 'series') queryTerm = 'Season';
      if (filter === 'dual') queryTerm = 'Dual';
      if (filter === 'south') queryTerm = 'South';
      if (filter === 'bangla') queryTerm = 'Bangla';
      if (filter === 'korean') queryTerm = 'Korean';

      showLoading();
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(queryTerm)}`);
        const data = await res.json();
        if (data.success && data.results && data.results.length > 0) {
          state.folders = data.results.filter(r => r.type === 'folder' || r.type === 'movie' || r.type === 'series');
          state.files = data.results.filter(r => r.type !== 'folder' && r.type !== 'movie' && r.type !== 'series');
          el.currentFolderTitle.textContent = `${pillBtn.textContent.trim()} (${data.total || data.results.length} titles)`;
          applyFilterAndSort();
        } else {
          showEmpty();
        }
      } catch (err) {
        showEmpty();
      }
    }
  }

  // ============================================================
  // RENDERING ITEMS - SPACIOUS CARDS WITH INSTANT ACTIONS
  // ============================================================

  function renderItems() {
    const total = state.filteredFolders.length + state.filteredFiles.length;

    if (total === 0) {
      showEmpty();
      return;
    }

    hideStates();

    if (state.viewMode === 'grid') {
      renderGridView();
    } else {
      renderListView();
    }
  }

  function renderGridView() {
    el.itemsContainer.className = 'movies-grid grid-mode';
    let html = '';

    // Folders (Movies, Shows, Subcategories, Year collections)
    state.filteredFolders.forEach((folder, idx) => {
      const cleanTitle = folder.cleanTitle || cleanMediaTitle(folder.name);
      const isYearFolder = /^\(?\d{4}\)?$/.test(folder.name.trim());
      const icon = isYearFolder ? '📅' : (folder.mediaType === 'series' || folder.type === 'series' ? '📺' : '🎬');
      const bestQuality = folder.tags?.find(t => t === '4K' || t === '1080p' || t === '720p');

      // Direct poster URL from ISP storage
      const posterUrl = isYearFolder ? '' : `${folder.url}a_AL_.jpg`;

      html += `
        <div class="movie-card" data-index="${idx}" data-url="${escapeHtml(folder.url)}" data-type="folder" data-name="${escapeHtml(folder.name)}">
          
          <!-- Poster with hover overlay -->
          <div class="poster-box" data-action="open-folder" data-url="${escapeHtml(folder.url)}">
            ${posterUrl ? `
              <img class="poster-img" src="${escapeHtml(posterUrl)}" alt="${escapeHtml(cleanTitle)}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
              <span class="poster-fallback" style="display:none;">${icon}</span>
            ` : `
              <span class="poster-fallback">${icon}</span>
            `}
            
            ${bestQuality ? `<span class="quality-pill">${escapeHtml(bestQuality)}</span>` : ''}

            <!-- Desktop Hover Overlay -->
            <div class="hover-actions">
              <button class="hover-play-btn" data-action="quick-play" data-url="${escapeHtml(folder.url)}" data-name="${escapeHtml(folder.name)}" title="Watch in Browser">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
              </button>
              <button class="hover-vlc-btn" data-action="vlc" data-url="${escapeHtml(folder.url)}" data-name="${escapeHtml(folder.name)}" title="Launch in VLC Player">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L6 17h12L12 2zm-1.5 5h3l2.25 6h-7.5L10.5 7zM3 19h18v3H3v-3z"/></svg>
                <span>VLC</span>
              </button>
            </div>
          </div>

          <!-- Card Content / Meta -->
          <div class="card-content">
            <div class="card-title-wrap" data-action="open-folder" data-url="${escapeHtml(folder.url)}">
              <h4 class="card-title" title="${escapeHtml(folder.name)}">${escapeHtml(cleanTitle)}</h4>
              <div class="card-sub">
                <span>${folder.year ? folder.year : (folder.category || 'Directory')}</span>
                ${folder.tags && folder.tags.length > 0 ? `<span>•</span><span>${escapeHtml(folder.tags[0])}</span>` : ''}
              </div>
            </div>

            <!-- Instant 1-Click Action Buttons -->
            <div class="card-action-bar">
              <button class="card-btn-play" data-action="quick-play" data-url="${escapeHtml(folder.url)}" data-name="${escapeHtml(folder.name)}" title="Instant Play">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
                <span>Play</span>
              </button>
              <button class="card-btn-vlc" data-action="vlc" data-url="${escapeHtml(folder.url)}" data-name="${escapeHtml(folder.name)}" title="Play in VLC">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L6 17h12L12 2zm-1.5 5h3l2.25 6h-7.5L10.5 7zM3 19h18v3H3v-3z"/></svg>
                <span>VLC</span>
              </button>
            </div>
          </div>

        </div>
      `;
    });

    // Files (Direct video files or downloads)
    state.filteredFiles.forEach((file, idx) => {
      const isVideo = file.type === 'video';
      const isAudio = file.type === 'audio';
      const icon = isVideo ? '🎬' : isAudio ? '🎵' : file.type === 'image' ? '🖼️' : file.type === 'archive' ? '📦' : '📄';
      const bestQuality = file.tags?.find(t => t === '4K' || t === '1080p' || t === '720p');

      html += `
        <div class="movie-card" data-index="${idx}" data-url="${escapeHtml(file.url)}" data-type="${escapeHtml(file.type)}" data-name="${escapeHtml(file.name)}">
          
          <div class="poster-box" data-action="${isVideo || isAudio ? 'play-file' : 'download-file'}" data-url="${escapeHtml(file.url)}" data-name="${escapeHtml(file.name)}">
            ${file.type === 'image' ? `
              <img class="poster-img" src="${escapeHtml(file.url)}" alt="${escapeHtml(file.name)}" loading="lazy">
            ` : `
              <span class="poster-fallback">${icon}</span>
            `}
            
            ${bestQuality ? `<span class="quality-pill">${escapeHtml(bestQuality)}</span>` : ''}

            <div class="hover-actions">
              ${isVideo || isAudio ? `
                <button class="hover-play-btn" data-action="play-file" data-url="${escapeHtml(file.url)}" data-name="${escapeHtml(file.name)}" title="Play">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
                </button>
                <button class="hover-vlc-btn" data-action="vlc-file" data-url="${escapeHtml(file.url)}" data-name="${escapeHtml(file.name)}" title="Play in VLC">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L6 17h12L12 2zm-1.5 5h3l2.25 6h-7.5L10.5 7zM3 19h18v3H3v-3z"/></svg>
                  <span>VLC</span>
                </button>
              ` : `
                <a href="${escapeHtml(file.url)}" target="_blank" download class="hover-play-btn" title="Download">
                  📥
                </a>
              `}
            </div>
          </div>

          <div class="card-content">
            <div class="card-title-wrap" data-action="${isVideo || isAudio ? 'play-file' : 'download-file'}" data-url="${escapeHtml(file.url)}" data-name="${escapeHtml(file.name)}">
              <h4 class="card-title" title="${escapeHtml(file.name)}">${escapeHtml(cleanMediaTitle(file.name))}</h4>
              <div class="card-sub">
                <span>${escapeHtml(file.size || file.ext || 'File')}</span>
              </div>
            </div>

            <div class="card-action-bar">
              ${isVideo || isAudio ? `
                <button class="card-btn-play" data-action="play-file" data-url="${escapeHtml(file.url)}" data-name="${escapeHtml(file.name)}" title="Instant Play">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
                  <span>Play</span>
                </button>
                <button class="card-btn-vlc" data-action="vlc-file" data-url="${escapeHtml(file.url)}" data-name="${escapeHtml(file.name)}" title="Play in VLC">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L6 17h12L12 2zm-1.5 5h3l2.25 6h-7.5L10.5 7zM3 19h18v3H3v-3z"/></svg>
                  <span>VLC</span>
                </button>
              ` : `
                <a href="${escapeHtml(file.url)}" target="_blank" download class="card-btn-play" style="text-align:center;">
                  <span>📥 Download</span>
                </a>
              `}
            </div>
          </div>

        </div>
      `;
    });

    el.itemsContainer.innerHTML = html;
    bindCardClicks();
  }

  function renderListView() {
    el.itemsContainer.className = 'movies-grid list-mode';
    let html = '';

    state.filteredFolders.forEach((folder) => {
      const cleanTitle = folder.cleanTitle || cleanMediaTitle(folder.name);
      const isYearFolder = /^\(?\d{4}\)?$/.test(folder.name.trim());
      const icon = isYearFolder ? '📅' : (folder.mediaType === 'series' || folder.type === 'series' ? '📺' : '📁');

      html += `
        <div class="list-item-row" data-url="${escapeHtml(folder.url)}" data-type="folder" data-name="${escapeHtml(folder.name)}">
          <div class="row-left" data-action="open-folder" data-url="${escapeHtml(folder.url)}">
            <span class="row-icon">${icon}</span>
            <div class="row-text">
              <div class="row-title" title="${escapeHtml(folder.name)}">${escapeHtml(cleanTitle)}</div>
              <div class="row-meta">
                <span>Directory</span>
                <span>${escapeHtml(folder.date || '')}</span>
              </div>
            </div>
          </div>
          <div class="row-actions">
            <button class="btn-subtle" data-action="quick-play" data-url="${escapeHtml(folder.url)}" data-name="${escapeHtml(folder.name)}">
              ▶ Play
            </button>
            <button class="btn-subtle" data-action="vlc" data-url="${escapeHtml(folder.url)}" data-name="${escapeHtml(folder.name)}">
              🍿 VLC
            </button>
          </div>
        </div>
      `;
    });

    state.filteredFiles.forEach((file) => {
      const isVideo = file.type === 'video';
      const isAudio = file.type === 'audio';
      const icon = isVideo ? '🎬' : isAudio ? '🎵' : file.type === 'image' ? '🖼️' : file.type === 'archive' ? '📦' : '📄';

      html += `
        <div class="list-item-row" data-url="${escapeHtml(file.url)}" data-type="${escapeHtml(file.type)}" data-name="${escapeHtml(file.name)}">
          <div class="row-left" data-action="${isVideo || isAudio ? 'play-file' : 'download-file'}" data-url="${escapeHtml(file.url)}" data-name="${escapeHtml(file.name)}">
            <span class="row-icon">${icon}</span>
            <div class="row-text">
              <div class="row-title" title="${escapeHtml(file.name)}">${escapeHtml(cleanMediaTitle(file.name))}</div>
              <div class="row-meta">
                <span>${escapeHtml(file.size || '')}</span>
                <span>${escapeHtml(file.date || '')}</span>
              </div>
            </div>
          </div>
          <div class="row-actions">
            ${isVideo || isAudio ? `
              <button class="btn-subtle" data-action="play-file" data-url="${escapeHtml(file.url)}" data-name="${escapeHtml(file.name)}">
                ▶ Play
              </button>
              <button class="btn-subtle" data-action="vlc-file" data-url="${escapeHtml(file.url)}" data-name="${escapeHtml(file.name)}">
                🍿 VLC
              </button>
            ` : `
              <a href="${escapeHtml(file.url)}" target="_blank" download class="btn-subtle">
                📥 Download
              </a>
            `}
          </div>
        </div>
      `;
    });

    el.itemsContainer.innerHTML = html;
    bindCardClicks();
  }

  function bindCardClicks() {
    el.itemsContainer.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const url = btn.getAttribute('data-url');
        const name = btn.getAttribute('data-name');

        if (action === 'open-folder') {
          navigateTo(url);
        } else if (action === 'quick-play') {
          handleQuickPlayFolder(url, name);
        } else if (action === 'play-file') {
          playMedia(url, name);
        } else if (action === 'vlc') {
          handleVlcFolder(url, name);
        } else if (action === 'vlc-file') {
          triggerVlcStream(url, name);
        } else if (action === 'download-file') {
          window.open(url, '_blank');
        }
      });
    });
  }

  // ============================================================
  // QUICK ACTIONS: INSTANT PLAY & VLC
  // ============================================================

  async function handleQuickPlayFolder(folderUrl, folderName) {
    showToast('Connecting stream...');
    try {
      const res = await fetch(`/api/resolve?url=${encodeURIComponent(folderUrl)}`);
      const data = await res.json();

      if (data.success && data.primaryVideo) {
        playMedia(
          data.primaryVideo.url,
          data.title || folderName,
          data.subtitles || [],
          data.videos || [],
          data.poster,
          data.backdrop,
          data.isSeries,
          data.seasons || [],
          0,
          0
        );
      } else {
        // Folder has no direct video (directory or year group) -> navigate into it
        navigateTo(folderUrl);
      }
    } catch (err) {
      navigateTo(folderUrl);
    }
  }

  async function handleVlcFolder(folderUrl, folderName) {
    showToast('Connecting VLC...');
    try {
      const res = await fetch(`/api/resolve?url=${encodeURIComponent(folderUrl)}`);
      const data = await res.json();

      if (data.success && data.primaryVideo) {
        triggerVlcStream(data.primaryVideo.url, data.primaryVideo.name);
      } else {
        navigateTo(folderUrl);
      }
    } catch (err) {
      navigateTo(folderUrl);
    }
  }

  // ============================================================
  // VLC LAUNCHER (DIRECT 1-CLICK SPAWN ON PC + M3U FALLBACK)
  // ============================================================

  async function triggerVlcStream(videoUrl, title) {
    const cleanTitle = cleanMediaTitle(title || 'Stream');
    showToast(`Launching VLC Player...`);

    // 1. Direct spawn via local Node backend
    try {
      const res = await fetch(`/api/open-vlc?url=${encodeURIComponent(videoUrl)}`);
      const data = await res.json();
      if (data.success) {
        showToast('🍿 Playing in VLC Media Player!');
        return;
      }
    } catch (e) {}

    // 2. Fallback .M3U download for Android/iOS/Remote
    const m3uUrl = `/api/vlc.m3u?url=${encodeURIComponent(videoUrl)}&name=${encodeURIComponent(cleanTitle)}`;
    const link = document.createElement('a');
    link.href = m3uUrl;
    link.download = `${cleanTitle}.m3u`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Opening ${cleanTitle}.m3u in VLC`);
  }

  // ============================================================
  // IN-BROWSER VIDEO PLAYER WITH RANGE SEEKING & WEB SERIES PANEL
  // ============================================================

  function playMedia(videoUrl, title, subtitles = [], playlist = [], poster = null, backdrop = null, isSeries = false, seasons = [], currentSeasonIdx = 0, currentEpIdx = 0) {
    state.currentPlaying = {
      videoUrl,
      title,
      subtitles,
      playlist,
      poster,
      backdrop,
      isSeries,
      seasons: seasons || [],
      currentSeasonIdx,
      currentEpIdx
    };

    // Save to Continue Watching history
    saveToContinueWatching(videoUrl, title, poster, isSeries);

    el.playerMediaTitle.textContent = cleanMediaTitle(title);
    el.mkvUnsupportedBanner.style.display = 'none';
    el.playerModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Show/hide series side panel
    const hasSeasons = seasons && seasons.length > 0;
    if (isSeries && hasSeasons) {
      if (el.playerSeriesPanel) el.playerSeriesPanel.style.display = 'flex';
      renderSeriesPanel(seasons, currentSeasonIdx, currentEpIdx);
      updateSeriesNavButtons();
    } else {
      if (el.playerSeriesPanel) el.playerSeriesPanel.style.display = 'none';
      if (el.playerEpisodeSub) el.playerEpisodeSub.style.display = 'none';
      if (el.playerPrevEpBtn) el.playerPrevEpBtn.style.display = 'none';
      if (el.playerNextEpBtn) {
        const cIdx = playlist.findIndex(p => p.url === videoUrl);
        el.playerNextEpBtn.style.display = (cIdx >= 0 && cIdx < playlist.length - 1) ? 'inline-flex' : 'none';
      }
    }

    if (poster) {
      el.mainVideoPlayer.poster = poster;
    } else {
      el.mainVideoPlayer.removeAttribute('poster');
    }

    // Set streaming source (using /api/stream for Range seek support)
    el.mainVideoPlayer.src = videoUrl;
    el.mainVideoPlayer.playbackRate = parseFloat(el.speedSelect.value) || 1.0;

    // Resume playback check
    const savedTime = localStorage.getItem('df_resume_' + videoUrl);
    if (savedTime && parseFloat(savedTime) > 10) {
      const resumeSec = parseFloat(savedTime);
      el.mainVideoPlayer.currentTime = resumeSec;
      if (el.playerResumeBadge) {
        el.playerResumeBadge.style.display = 'inline-block';
        setTimeout(() => { if (el.playerResumeBadge) el.playerResumeBadge.style.display = 'none'; }, 4000);
      }
      showToast(`Resumed playback at ${formatTime(resumeSec)}`);
    } else {
      if (el.playerResumeBadge) el.playerResumeBadge.style.display = 'none';
    }

    const playPromise = el.mainVideoPlayer.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        if (videoUrl.toLowerCase().endsWith('.mkv')) {
          el.mkvUnsupportedBanner.style.display = 'flex';
        }
      });
    }

    el.mainVideoPlayer.onerror = () => {
      el.videoBuffering.style.display = 'none';
      if (videoUrl.toLowerCase().endsWith('.mkv')) {
        el.mkvUnsupportedBanner.style.display = 'flex';
      }
    };

    populateSubtitles(subtitles);

    // Track playback progress every 3 seconds
    el.mainVideoPlayer.ontimeupdate = () => {
      if (el.mainVideoPlayer.currentTime > 5) {
        localStorage.setItem('df_resume_' + videoUrl, Math.floor(el.mainVideoPlayer.currentTime));
      }
    };

    // Auto-advance on video ended
    el.mainVideoPlayer.onended = () => {
      localStorage.removeItem('df_resume_' + videoUrl);
      playNextEpisode();
    };
  }

  function renderSeriesPanel(seasons, activeSeasonIdx, activeEpIdx) {
    if (!seasons || seasons.length === 0) return;

    // Calculate total episodes across all seasons
    let totalEps = 0;
    seasons.forEach(s => {
      totalEps += (s.episodes ? s.episodes.length : 0);
    });
    if (el.seriesEpCountBadge) {
      el.seriesEpCountBadge.textContent = `${totalEps} Ep`;
    }

    // Render Season Pills
    if (el.seasonTabsScroll) {
      let tabsHtml = '';
      seasons.forEach((season, sIdx) => {
        const isActive = sIdx === activeSeasonIdx ? 'active' : '';
        const seasonName = season.name || `Season ${season.seasonNumber || sIdx + 1}`;
        tabsHtml += `
          <button class="season-tab-btn ${isActive}" data-season-idx="${sIdx}">
            ${escapeHtml(seasonName)}
          </button>
        `;
      });
      el.seasonTabsScroll.innerHTML = tabsHtml;

      el.seasonTabsScroll.querySelectorAll('.season-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const sIdx = parseInt(btn.getAttribute('data-season-idx'), 10);
          switchSeason(sIdx);
        });
      });
    }

    // Render Episodes for current active season
    renderEpisodesList(seasons, activeSeasonIdx, activeEpIdx);
  }

  function renderEpisodesList(seasons, activeSeasonIdx, activeEpIdx) {
    if (!el.episodesScrollList) return;
    const currentSeason = seasons[activeSeasonIdx];
    if (!currentSeason || !currentSeason.episodes || currentSeason.episodes.length === 0) {
      el.episodesScrollList.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-dim);">No episodes found in this season</div>`;
      return;
    }

    let epHtml = '';
    currentSeason.episodes.forEach((ep, epIdx) => {
      const isCurrentPlaying = (activeSeasonIdx === state.currentPlaying.currentSeasonIdx && epIdx === state.currentPlaying.currentEpIdx);
      const activeClass = isCurrentPlaying ? 'active' : '';
      const displayTitle = ep.cleanTitle || cleanMediaTitle(ep.name);
      const epLabel = ep.episodeNumber ? `E${ep.episodeNumber < 10 ? '0' : ''}${ep.episodeNumber}` : `EP ${epIdx + 1}`;

      epHtml += `
        <div class="episode-item-card ${activeClass}" data-season-idx="${activeSeasonIdx}" data-ep-idx="${epIdx}" data-url="${escapeHtml(ep.url)}" data-name="${escapeHtml(ep.name)}">
          <div class="ep-left">
            <span class="ep-badge">${epLabel}</span>
            <div class="ep-info">
              <div class="ep-title" title="${escapeHtml(displayTitle)}">${escapeHtml(displayTitle)}</div>
              <div class="ep-meta">
                <span>${escapeHtml(ep.size || '')}</span>
              </div>
            </div>
          </div>
          <div class="ep-actions">
            <button class="ep-btn-play" data-action="play-ep" data-season-idx="${activeSeasonIdx}" data-ep-idx="${epIdx}" title="Play in Browser">
              ▶
            </button>
            <button class="ep-btn-vlc" data-action="vlc-ep" data-url="${escapeHtml(ep.url)}" data-name="${escapeHtml(ep.name)}" title="Instant Play in VLC">
              VLC
            </button>
          </div>
        </div>
      `;
    });

    el.episodesScrollList.innerHTML = epHtml;

    // Bind click events on episode cards
    el.episodesScrollList.querySelectorAll('.episode-item-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const vlcBtn = e.target.closest('[data-action="vlc-ep"]');
        if (vlcBtn) {
          e.stopPropagation();
          const epUrl = vlcBtn.getAttribute('data-url');
          const epName = vlcBtn.getAttribute('data-name');
          triggerVlcStream(epUrl, epName);
          return;
        }

        const sIdx = parseInt(card.getAttribute('data-season-idx'), 10);
        const epIdx = parseInt(card.getAttribute('data-ep-idx'), 10);
        playEpisode(sIdx, epIdx);
      });
    });

    // Update playerEpisodeSub badge in player header
    if (el.playerEpisodeSub && currentSeason.episodes[activeEpIdx]) {
      const activeEp = currentSeason.episodes[activeEpIdx];
      const epLabel = activeEp.episodeNumber ? `S${currentSeason.seasonNumber || activeSeasonIdx + 1} E${activeEp.episodeNumber < 10 ? '0' : ''}${activeEp.episodeNumber}` : `Episode ${activeEpIdx + 1}`;
      el.playerEpisodeSub.textContent = epLabel;
      el.playerEpisodeSub.style.display = 'inline-block';
    }

    // Scroll active episode into view
    setTimeout(() => {
      const activeCard = el.episodesScrollList.querySelector('.episode-item-card.active');
      if (activeCard) activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);
  }

  function switchSeason(sIdx) {
    if (!state.currentPlaying || !state.currentPlaying.seasons) return;
    const seasons = state.currentPlaying.seasons;
    if (sIdx < 0 || sIdx >= seasons.length) return;

    if (el.seasonTabsScroll) {
      el.seasonTabsScroll.querySelectorAll('.season-tab-btn').forEach((btn, idx) => {
        btn.classList.toggle('active', idx === sIdx);
      });
    }

    const activeEpIdx = (sIdx === state.currentPlaying.currentSeasonIdx) ? state.currentPlaying.currentEpIdx : 0;
    renderEpisodesList(seasons, sIdx, activeEpIdx);
  }

  function playEpisode(sIdx, epIdx) {
    if (!state.currentPlaying || !state.currentPlaying.seasons) return;
    const seasons = state.currentPlaying.seasons;
    if (!seasons[sIdx] || !seasons[sIdx].episodes[epIdx]) return;

    const targetEp = seasons[sIdx].episodes[epIdx];
    const seriesTitle = state.currentPlaying.title;
    const epDisplayTitle = targetEp.cleanTitle || cleanMediaTitle(targetEp.name);
    showToast(`Playing ${epDisplayTitle}`);

    playMedia(
      targetEp.url,
      seriesTitle,
      state.currentPlaying.subtitles,
      seasons[sIdx].episodes,
      state.currentPlaying.poster,
      state.currentPlaying.backdrop,
      true,
      seasons,
      sIdx,
      epIdx
    );
  }

  function updateSeriesNavButtons() {
    if (!state.currentPlaying || !state.currentPlaying.isSeries || !state.currentPlaying.seasons) {
      if (el.playerPrevEpBtn) el.playerPrevEpBtn.style.display = 'none';
      if (el.playerNextEpBtn) el.playerNextEpBtn.style.display = 'none';
      return;
    }

    const { seasons, currentSeasonIdx, currentEpIdx } = state.currentPlaying;
    const currentSeason = seasons[currentSeasonIdx];
    if (!currentSeason || !currentSeason.episodes) return;

    const hasPrev = (currentEpIdx > 0) || (currentSeasonIdx > 0);
    const hasNext = (currentEpIdx < currentSeason.episodes.length - 1) || (currentSeasonIdx < seasons.length - 1);

    if (el.playerPrevEpBtn) el.playerPrevEpBtn.style.display = hasPrev ? 'inline-flex' : 'none';
    if (el.playerNextEpBtn) el.playerNextEpBtn.style.display = hasNext ? 'inline-flex' : 'none';
  }

  function playNextEpisode() {
    if (!state.currentPlaying) return;

    if (state.currentPlaying.isSeries && state.currentPlaying.seasons && state.currentPlaying.seasons.length > 0) {
      const { seasons, currentSeasonIdx, currentEpIdx } = state.currentPlaying;
      const currentSeason = seasons[currentSeasonIdx];

      if (currentSeason && currentEpIdx < currentSeason.episodes.length - 1) {
        playEpisode(currentSeasonIdx, currentEpIdx + 1);
      } else if (currentSeasonIdx < seasons.length - 1) {
        playEpisode(currentSeasonIdx + 1, 0);
      } else {
        showToast('You reached the final episode!');
      }
      return;
    }

    if (state.currentPlaying.playlist && state.currentPlaying.playlist.length > 1) {
      const { videoUrl, playlist, subtitles, poster, backdrop } = state.currentPlaying;
      const currentIndex = playlist.findIndex(item => item.url === videoUrl);
      if (currentIndex >= 0 && currentIndex < playlist.length - 1) {
        const nextItem = playlist[currentIndex + 1];
        showToast(`Playing Next: ${cleanMediaTitle(nextItem.cleanTitle || nextItem.name)}`);
        playMedia(nextItem.url, nextItem.name, subtitles, playlist, poster, backdrop);
      }
    }
  }

  function playPrevEpisode() {
    if (!state.currentPlaying) return;

    if (state.currentPlaying.isSeries && state.currentPlaying.seasons && state.currentPlaying.seasons.length > 0) {
      const { seasons, currentSeasonIdx, currentEpIdx } = state.currentPlaying;
      if (currentEpIdx > 0) {
        playEpisode(currentSeasonIdx, currentEpIdx - 1);
      } else if (currentSeasonIdx > 0) {
        const prevSeason = seasons[currentSeasonIdx - 1];
        const lastEpIdx = prevSeason.episodes ? prevSeason.episodes.length - 1 : 0;
        playEpisode(currentSeasonIdx - 1, Math.max(0, lastEpIdx));
      }
      return;
    }

    if (state.currentPlaying.playlist && state.currentPlaying.playlist.length > 1) {
      const { videoUrl, playlist, subtitles, poster, backdrop } = state.currentPlaying;
      const currentIndex = playlist.findIndex(item => item.url === videoUrl);
      if (currentIndex > 0) {
        const prevItem = playlist[currentIndex - 1];
        showToast(`Playing Prev: ${cleanMediaTitle(prevItem.cleanTitle || prevItem.name)}`);
        playMedia(prevItem.url, prevItem.name, subtitles, playlist, poster, backdrop);
      }
    }
  }

  function closePlayer() {
    el.mainVideoPlayer.pause();
    el.mainVideoPlayer.removeAttribute('src');
    el.mainVideoPlayer.load();
    el.playerModal.classList.remove('active');
    if (el.playerSeriesPanel) el.playerSeriesPanel.style.display = 'none';
    if (el.playerEpisodeSub) el.playerEpisodeSub.style.display = 'none';
    if (el.playerPrevEpBtn) el.playerPrevEpBtn.style.display = 'none';
    if (el.playerNextEpBtn) el.playerNextEpBtn.style.display = 'none';
    state.currentPlaying = null;
    document.body.style.overflow = '';
  }

  function populateSubtitles(subtitles) {
    el.subtitleSelect.innerHTML = `<option value="none">Off</option>`;
    const oldTracks = el.mainVideoPlayer.querySelectorAll('track');
    oldTracks.forEach(t => t.remove());

    if (subtitles && subtitles.length > 0) {
      subtitles.forEach((sub, idx) => {
        const option = document.createElement('option');
        option.value = sub.url;
        option.textContent = sub.name;
        el.subtitleSelect.appendChild(option);

        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.label = sub.name;
        track.srclang = 'en';
        track.src = sub.url;
        if (idx === 0) track.default = true;
        el.mainVideoPlayer.appendChild(track);
      });
    }
  }

  // ============================================================
  // EVENT LISTENERS
  // ============================================================

  function setupEventListeners() {
    // Dropdown links in top nav
    document.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const url = item.getAttribute('data-url');
        if (url) navigateTo(url);
      });
    });

    if (el.homeLogoLink) {
      el.homeLogoLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (state.categories.length > 0) navigateTo(state.categories[0].url);
      });
    }

    // Search input (Live debounce + Deep catalog search on Enter)
    let debounceTimer;
    el.filterInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      state.searchQuery = el.filterInput.value;
      el.clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
      debounceTimer = setTimeout(() => {
        applyFilterAndSort();
      }, 150);
    });

    el.clearSearchBtn.addEventListener('click', () => {
      el.filterInput.value = '';
      state.searchQuery = '';
      el.clearSearchBtn.style.display = 'none';
      applyFilterAndSort();
    });

    el.filterInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const query = el.filterInput.value.trim();
        if (query) {
          showLoading();
          try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data.success && data.results) {
              state.folders = data.results.filter(r => r.type === 'folder' || r.type === 'movie' || r.type === 'series');
              state.files = data.results.filter(r => r.type !== 'folder' && r.type !== 'movie' && r.type !== 'series');
              el.currentFolderTitle.textContent = `Search: "${query}" (${data.total || data.results.length} results)`;
              applyFilterAndSort();
            }
          } catch (err) {
            applyFilterAndSort();
          }
        }
      }
    });

    // View & Sort
    el.gridViewBtn.addEventListener('click', () => setViewMode('grid'));
    el.listViewBtn.addEventListener('click', () => setViewMode('list'));
    el.sortSelect.addEventListener('change', () => {
      state.sortOrder = el.sortSelect.value;
      applyFilterAndSort();
    });

    el.refreshBtn.addEventListener('click', () => {
      if (state.currentUrl) navigateTo(state.currentUrl);
    });
    el.parentDirBtn.addEventListener('click', () => {
      if (state.parentUrl) navigateTo(state.parentUrl);
    });
    el.retryBtn.addEventListener('click', () => {
      if (state.currentUrl) navigateTo(state.currentUrl);
    });

    // URL Jumper
    el.directUrlBtn.addEventListener('click', openUrlModal);
    const mobileDirectUrlBtn = document.getElementById('mobileDirectUrlBtn');
    if (mobileDirectUrlBtn) {
      mobileDirectUrlBtn.addEventListener('click', () => {
        closeMobileDrawer();
        openUrlModal();
      });
    }
    el.closeUrlModalBtn.addEventListener('click', closeUrlModal);
    el.cancelUrlModalBtn.addEventListener('click', closeUrlModal);
    el.submitJumpUrlBtn.addEventListener('click', () => {
      const val = el.jumpUrlInput.value.trim();
      if (val) {
        closeUrlModal();
        navigateTo(val);
      }
    });

    document.querySelectorAll('.preset-wrap .pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const url = pill.getAttribute('data-url');
        if (url) el.jumpUrlInput.value = url;
      });
    });

    // VLC Help
    el.vlcHelpBtn.addEventListener('click', () => el.vlcHelpModal.classList.add('active'));
    const mobileVlcHelpBtn = document.getElementById('mobileVlcHelpBtn');
    if (mobileVlcHelpBtn) {
      mobileVlcHelpBtn.addEventListener('click', () => {
        closeMobileDrawer();
        el.vlcHelpModal.classList.add('active');
      });
    }
    el.closeVlcModalBtn.addEventListener('click', () => el.vlcHelpModal.classList.remove('active'));
    el.dismissVlcModalBtn.addEventListener('click', () => el.vlcHelpModal.classList.remove('active'));

    // Video Player
    el.playerCloseBtn.addEventListener('click', closePlayer);
    if (el.playerPrevEpBtn) {
      el.playerPrevEpBtn.addEventListener('click', playPrevEpisode);
    }
    if (el.playerNextEpBtn) {
      el.playerNextEpBtn.addEventListener('click', playNextEpisode);
    }

    // Movie Details Modal
    if (el.closeDetailsBtn) {
      el.closeDetailsBtn.addEventListener('click', closeMovieDetails);
    }
    if (el.detailsLaunchVlcBtn) {
      el.detailsLaunchVlcBtn.addEventListener('click', () => {
        if (state.currentSelectedMovie) {
          const movie = state.currentSelectedMovie;
          closeMovieDetails();
          if (movie.type === 'folder' || movie.mediaType === 'series') {
            handleVlcFolder(movie.url, movie.name);
          } else {
            triggerVlcStream(movie.url, movie.name);
          }
        }
      });
    }
    if (el.detailsLaunchBrowserBtn) {
      el.detailsLaunchBrowserBtn.addEventListener('click', () => {
        if (state.currentSelectedMovie) {
          const movie = state.currentSelectedMovie;
          closeMovieDetails();
          if (movie.type === 'folder' || movie.mediaType === 'series') {
            handleQuickPlayFolder(movie.url, movie.name);
          } else {
            playMedia(movie.url, movie.name);
          }
        }
      });
    }
    if (el.detailsDownloadM3uBtn) {
      el.detailsDownloadM3uBtn.addEventListener('click', () => {
        if (state.currentSelectedMovie) {
          const item = state.currentSelectedMovie;
          const title = item.cleanTitle || cleanMediaTitle(item.name);
          const m3uUrl = `/api/vlc.m3u?url=${encodeURIComponent(item.url)}&name=${encodeURIComponent(title)}`;
          window.location.href = m3uUrl;
          showToast('Downloading .M3U stream file');
        }
      });
    }
    if (el.detailsCopyStreamBtn) {
      el.detailsCopyStreamBtn.addEventListener('click', () => {
        if (state.currentSelectedMovie) {
          const streamUrl = `${window.location.origin}/api/stream?url=${encodeURIComponent(state.currentSelectedMovie.url)}`;
          navigator.clipboard.writeText(streamUrl).then(() => {
            showToast('Stream link copied to clipboard!');
          });
        }
      });
    }
    if (el.detailsOpenFolderBtn) {
      el.detailsOpenFolderBtn.addEventListener('click', () => {
        if (state.currentSelectedMovie) {
          closeMovieDetails();
          navigateTo(state.currentSelectedMovie.url);
        }
      });
    }

    // Filter & Category Pills Bar
    if (el.filterPillsBar) {
      el.filterPillsBar.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => handleFilterPillClick(pill));
      });
    }

    // PiP Button
    if (el.playerPipBtn) {
      el.playerPipBtn.addEventListener('click', async () => {
        try {
          if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
          } else {
            await el.mainVideoPlayer.requestPictureInPicture();
          }
        } catch (e) {
          showToast('PiP not supported in this browser');
        }
      });
    }

    // Keyboard Shortcut Help Overlay
    if (el.kbdHelpCloseBtn) {
      el.kbdHelpCloseBtn.addEventListener('click', () => {
        el.kbdHelpOverlay.style.display = 'none';
      });
    }
    if (el.kbdHelpOverlay) {
      el.kbdHelpOverlay.addEventListener('click', (e) => {
        if (e.target === el.kbdHelpOverlay) el.kbdHelpOverlay.style.display = 'none';
      });
    }

    // Continue Watching Clear Button
    if (el.cwClearBtn) {
      el.cwClearBtn.addEventListener('click', () => {
        localStorage.removeItem('df_cw_items');
        if (el.continueWatchingSection) el.continueWatchingSection.style.display = 'none';
        showToast('Continue Watching cleared');
      });
    }

    // Search Autocomplete
    let acDebounce;
    el.filterInput.addEventListener('input', () => {
      clearTimeout(acDebounce);
      const q = el.filterInput.value.trim();
      if (q.length < 2) {
        if (el.searchAutocomplete) el.searchAutocomplete.style.display = 'none';
        return;
      }
      acDebounce = setTimeout(() => fetchAutocomplete(q), 300);
    });

    el.filterInput.addEventListener('keydown', (e) => {
      if (!el.searchAutocomplete || el.searchAutocomplete.style.display === 'none') return;
      const items = el.searchAutocomplete.querySelectorAll('.ac-item');
      const focused = el.searchAutocomplete.querySelector('.ac-item.focused');
      let idx = Array.from(items).indexOf(focused);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (focused) focused.classList.remove('focused');
        idx = (idx + 1) % items.length;
        items[idx]?.classList.add('focused');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (focused) focused.classList.remove('focused');
        idx = (idx - 1 + items.length) % items.length;
        items[idx]?.classList.add('focused');
      } else if (e.key === 'Enter' && focused) {
        e.preventDefault();
        focused.click();
      } else if (e.key === 'Escape') {
        el.searchAutocomplete.style.display = 'none';
      }
    });

    document.addEventListener('click', (e) => {
      if (el.searchAutocomplete && !el.searchAutocomplete.contains(e.target) && e.target !== el.filterInput) {
        el.searchAutocomplete.style.display = 'none';
      }
    });

    el.playerVlcDirectBtn.addEventListener('click', () => {
      if (state.currentPlaying) {
        triggerVlcStream(state.currentPlaying.videoUrl, state.currentPlaying.title);
      }
    });

    el.bannerLaunchVlcBtn.addEventListener('click', () => {
      if (state.currentPlaying) {
        closePlayer();
        triggerVlcStream(state.currentPlaying.videoUrl, state.currentPlaying.title);
      }
    });

    el.speedSelect.addEventListener('change', () => {
      el.mainVideoPlayer.playbackRate = parseFloat(el.speedSelect.value) || 1.0;
    });

    el.externalSubtitleInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const objectUrl = URL.createObjectURL(file);
        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.label = file.name;
        track.srclang = 'en';
        track.src = objectUrl;
        track.default = true;
        el.mainVideoPlayer.appendChild(track);

        const option = document.createElement('option');
        option.value = objectUrl;
        option.textContent = file.name + ' (Custom)';
        option.selected = true;
        el.subtitleSelect.appendChild(option);

        showToast('Subtitle loaded!');
      }
    });

    el.mainVideoPlayer.addEventListener('waiting', () => {
      el.videoBuffering.style.display = 'flex';
    });
    el.mainVideoPlayer.addEventListener('playing', () => {
      el.videoBuffering.style.display = 'none';
      el.mkvUnsupportedBanner.style.display = 'none';
    });

    // Mobile Drawer
    if (el.mobileMenuBtn) {
      el.mobileMenuBtn.addEventListener('click', openMobileDrawer);
    }
    if (el.mobileDrawerClose) {
      el.mobileDrawerClose.addEventListener('click', closeMobileDrawer);
    }
    if (el.drawerBackdrop) {
      el.drawerBackdrop.addEventListener('click', closeMobileDrawer);
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (el.playerModal.classList.contains('active')) {
        if (e.key === 'Escape') {
          closePlayer();
        } else if (e.key === ' ' || e.key === 'k') {
          e.preventDefault();
          if (el.mainVideoPlayer.paused) el.mainVideoPlayer.play();
          else el.mainVideoPlayer.pause();
        } else if (e.key === 'f') {
          e.preventDefault();
          toggleFullscreen(el.mainVideoPlayer);
        } else if (e.key === 'm') {
          el.mainVideoPlayer.muted = !el.mainVideoPlayer.muted;
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          el.mainVideoPlayer.currentTime = Math.max(0, el.mainVideoPlayer.currentTime - 10);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          el.mainVideoPlayer.currentTime = Math.min(el.mainVideoPlayer.duration, el.mainVideoPlayer.currentTime + 10);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          el.mainVideoPlayer.volume = Math.min(1.0, el.mainVideoPlayer.volume + 0.1);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          el.mainVideoPlayer.volume = Math.max(0, el.mainVideoPlayer.volume - 0.1);
        } else if (e.key === 'n' || e.key === 'N') {
          playNextEpisode();
        } else if (e.key === 'p' || e.key === 'P') {
          playPrevEpisode();
        }
      } else {
        // Global shortcuts (outside player)
        if (e.key === '?') {
          if (el.kbdHelpOverlay) el.kbdHelpOverlay.style.display = el.kbdHelpOverlay.style.display === 'flex' ? 'none' : 'flex';
        } else if (e.key === 'Escape') {
          if (el.kbdHelpOverlay && el.kbdHelpOverlay.style.display !== 'none') {
            el.kbdHelpOverlay.style.display = 'none';
          }
        }
      }
    });
  }

  function openMovieDetails(item) {
    state.currentSelectedMovie = item;
    const title = item.cleanTitle || cleanMediaTitle(item.name);
    el.detailsTitle.textContent = title;
    el.detailsMeta.textContent = `${item.year || item.category || 'ISP Media'} • ${item.size || 'HD Stream'}`;

    if (item.tags && item.tags.length > 0) {
      el.detailsTags.innerHTML = item.tags.map(t => `<span class="tag-pill">${escapeHtml(t)}</span>`).join('');
    } else {
      el.detailsTags.innerHTML = `<span class="tag-pill">DhakaFlix</span>`;
    }

    const poster = item.poster || `${item.url}a_AL_.jpg`;
    el.detailsPosterBanner.style.backgroundImage = `url("${poster}")`;

    el.movieDetailsModal.classList.add('active');
  }

  function closeMovieDetails() {
    el.movieDetailsModal.classList.remove('active');
    state.currentSelectedMovie = null;
  }

  function openMobileDrawer() {
    el.mobileDrawer.classList.add('active');
    el.drawerBackdrop.classList.add('active');
  }

  function closeMobileDrawer() {
    el.mobileDrawer.classList.remove('active');
    el.drawerBackdrop.classList.remove('active');
  }

  function setViewMode(mode) {
    state.viewMode = mode;
    localStorage.setItem('df_view_mode', mode);

    if (mode === 'grid') {
      el.gridViewBtn.classList.add('active');
      el.listViewBtn.classList.remove('active');
    } else {
      el.listViewBtn.classList.add('active');
      el.gridViewBtn.classList.remove('active');
    }

    renderItems();
  }

  function openUrlModal() {
    el.jumpUrlInput.value = state.currentUrl || 'http://172.16.50.7/DHAKA-FLIX-7/English%20Movies/';
    el.urlJumperModal.classList.add('active');
    setTimeout(() => el.jumpUrlInput.focus(), 100);
  }

  function closeUrlModal() {
    el.urlJumperModal.classList.remove('active');
  }

  function showLoading() {
    el.loadingState.style.display = 'flex';
    el.errorState.style.display = 'none';
    el.emptyState.style.display = 'none';

    // Skeleton placeholder cards for smooth modern loading
    let skHtml = '';
    for (let i = 0; i < 12; i++) {
      skHtml += `
        <div class="skeleton-card">
          <div class="skeleton-poster"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
          <div class="skeleton-line shorter"></div>
        </div>
      `;
    }
    el.itemsContainer.className = 'movies-grid grid-mode';
    el.itemsContainer.innerHTML = skHtml;
  }

  // ============================================================
  // CONTINUE WATCHING SYSTEM
  // ============================================================

  function saveToContinueWatching(videoUrl, title, poster, isSeries) {
    if (!videoUrl) return;
    try {
      let items = JSON.parse(localStorage.getItem('df_cw_items') || '[]');
      items = items.filter(it => it.url !== videoUrl);
      const cleanTitle = cleanMediaTitle(title || 'Video');
      items.unshift({
        url: videoUrl,
        title: cleanTitle,
        poster: poster || null,
        isSeries: !!isSeries,
        savedAt: Date.now()
      });
      if (items.length > 20) items = items.slice(0, 20);
      localStorage.setItem('df_cw_items', JSON.stringify(items));
      renderContinueWatching();
    } catch (e) {
      console.warn('Failed to save to continue watching:', e);
    }
  }

  function renderContinueWatching() {
    if (!el.continueWatchingSection || !el.cwScroll) return;
    try {
      const items = JSON.parse(localStorage.getItem('df_cw_items') || '[]');
      if (!items || items.length === 0) {
        el.continueWatchingSection.style.display = 'none';
        return;
      }

      el.continueWatchingSection.style.display = 'block';
      let html = '';
      items.forEach(item => {
        const savedTime = parseFloat(localStorage.getItem('df_resume_' + item.url) || '0');
        const progressPercent = Math.min(95, Math.max(5, Math.round((savedTime / 5400) * 100))) || 20;
        const timeText = savedTime > 10 ? `Resumed at ${formatTime(savedTime)}` : 'Watch from start';

        html += `
          <div class="cw-card" data-url="${escapeHtml(item.url)}" data-title="${escapeHtml(item.title)}">
            <div class="cw-poster">
              ${item.poster ? `<img src="${escapeHtml(item.poster)}" alt="${escapeHtml(item.title)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />` : ''}
              <div class="cw-fallback" style="${item.poster ? 'display:none;' : 'display:flex;'}">🎬</div>
              <div class="cw-progress-bar">
                <div class="cw-progress-fill" style="width: ${progressPercent}%;"></div>
              </div>
              <div class="cw-play-overlay">
                <span class="cw-play-icon">▶</span>
              </div>
              <button class="cw-remove-btn" title="Remove" data-remove-url="${escapeHtml(item.url)}">✕</button>
            </div>
            <div class="cw-title-text" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</div>
            <div class="cw-time-left">${timeText}</div>
          </div>
        `;
      });

      el.cwScroll.innerHTML = html;

      // Event binding
      el.cwScroll.querySelectorAll('.cw-card').forEach(card => {
        card.addEventListener('click', (e) => {
          const removeBtn = e.target.closest('.cw-remove-btn');
          if (removeBtn) {
            e.stopPropagation();
            const removeUrl = removeBtn.getAttribute('data-remove-url');
            let stored = JSON.parse(localStorage.getItem('df_cw_items') || '[]');
            stored = stored.filter(it => it.url !== removeUrl);
            localStorage.setItem('df_cw_items', JSON.stringify(stored));
            localStorage.removeItem('df_resume_' + removeUrl);
            renderContinueWatching();
            return;
          }

          const cardUrl = card.getAttribute('data-url');
          const cardTitle = card.getAttribute('data-title');
          playMedia(cardUrl, cardTitle);
        });
      });
    } catch (e) {
      console.warn('Error rendering continue watching:', e);
    }
  }

  // ============================================================
  // HERO SPOTLIGHT BANNER SYSTEM (CINEMA SPOTLIGHT)
  // ============================================================

  let heroItems = [];
  let heroCurrentIndex = 0;
  let heroTimer = null;

  function resetHeroTimer() {
    if (heroTimer) clearInterval(heroTimer);
    heroTimer = setInterval(() => {
      if (heroItems && heroItems.length > 0) {
        const nextIdx = (heroCurrentIndex + 1) % heroItems.length;
        showHeroSlide(nextIdx);
      }
    }, 7000);
  }

  async function initHeroBanner() {
    if (!el.heroBanner) return;
    try {
      // Fetch top recent 2026 / 1080p titles from search index
      let res = await fetch('/api/search?q=2026&limit=6');
      let data = await res.json();
      if (!data.success || !data.results || data.results.length === 0) {
        res = await fetch('/api/search?q=1080p&limit=6');
        data = await res.json();
      }

      if (data.success && data.results && data.results.length > 0) {
        heroItems = data.results.filter(r => r.type === 'folder' || r.type === 'movie' || r.type === 'series').slice(0, 6);
        if (heroItems.length === 0) return;

        // Render dots
        let dotsHtml = '';
        heroItems.forEach((_, idx) => {
          dotsHtml += `<button class="hero-dot ${idx === 0 ? 'active' : ''}" data-idx="${idx}" aria-label="Slide ${idx + 1}"></button>`;
        });
        el.heroDots.innerHTML = dotsHtml;

        el.heroDots.querySelectorAll('.hero-dot').forEach(dot => {
          dot.addEventListener('click', () => {
            const idx = parseInt(dot.getAttribute('data-idx'), 10);
            showHeroSlide(idx);
            resetHeroTimer();
          });
        });

        // Wire hero buttons
        el.heroBtnPlay.addEventListener('click', () => {
          const cur = heroItems[heroCurrentIndex];
          if (cur) handleQuickPlayFolder(cur.url, cur.name);
        });

        el.heroBtnVlc.addEventListener('click', () => {
          const cur = heroItems[heroCurrentIndex];
          if (cur) handleVlcFolder(cur.url, cur.name);
        });

        if (el.heroBtnInfo) {
          el.heroBtnInfo.addEventListener('click', () => {
            const cur = heroItems[heroCurrentIndex];
            if (cur) openMovieDetails(cur);
          });
        }

        if (el.heroPosterWrap) {
          el.heroPosterWrap.addEventListener('click', () => {
            const cur = heroItems[heroCurrentIndex];
            if (cur) handleQuickPlayFolder(cur.url, cur.name);
          });
        }

        // Nav Arrows
        if (el.heroPrevBtn) {
          el.heroPrevBtn.addEventListener('click', () => {
            const prevIdx = (heroCurrentIndex - 1 + heroItems.length) % heroItems.length;
            showHeroSlide(prevIdx);
            resetHeroTimer();
          });
        }
        if (el.heroNextBtn) {
          el.heroNextBtn.addEventListener('click', () => {
            const nextIdx = (heroCurrentIndex + 1) % heroItems.length;
            showHeroSlide(nextIdx);
            resetHeroTimer();
          });
        }

        // Show first slide and start auto-rotate
        showHeroSlide(0);
        el.heroBanner.style.display = 'block';
        resetHeroTimer();
      }
    } catch (err) {
      console.warn('Hero banner init failed:', err);
    }
  }

  function showHeroSlide(index) {
    if (!heroItems || heroItems.length === 0) return;
    heroCurrentIndex = index;
    const item = heroItems[index];

    // Artwork URLs
    const posterUrl = item.posterUrl || `${item.url}a_AL_.jpg`;
    const backdropUrl = item.backdrop || posterUrl;

    // Background blur canvas & blended backdrop
    if (el.heroBg) el.heroBg.style.backgroundImage = `url("${backdropUrl}")`;
    if (el.heroBackdropImg) el.heroBackdropImg.style.backgroundImage = `url("${backdropUrl}")`;

    // Portrait 3D Glass Poster Card
    if (el.heroPosterImg) {
      el.heroPosterImg.src = posterUrl;
      if (el.heroPosterWrap) el.heroPosterWrap.style.display = '';
    }

    // Title & Specs
    const cleanTitle = item.cleanTitle || cleanMediaTitle(item.name);
    el.heroTitle.textContent = cleanTitle;

    // Specs pills (Rating, Year, Quality, Audio, Category)
    if (el.heroSpecs) {
      el.heroSpecs.innerHTML = `
        <span class="hero-spec-pill rating">★ ${item.rating || '8.6'}</span>
        <span class="hero-spec-pill">${item.year || '2026'}</span>
        <span class="hero-spec-pill quality">1080p Full HD</span>
        <span class="hero-spec-pill">Dolby 5.1</span>
        <span class="hero-spec-pill">${escapeHtml(item.group || item.category || 'Cinema')}</span>
      `;
    }

    // Meta text description
    if (el.heroMeta) {
      el.heroMeta.textContent = `${item.category || 'English Movies'} • High Definition direct stream available on DhakaFlix ISP server with instant browser & VLC playback.`;
    }

    // Tags
    el.heroTags.innerHTML = `
      <span class="hero-tag">🔥 SPOTLIGHT</span>
      <span class="hero-tag-alt">${escapeHtml(item.category || 'Cinema')}</span>
      ${item.type === 'series' ? '<span class="hero-tag-alt">📺 Web Series</span>' : '<span class="hero-tag-alt">🎬 Featured Movie</span>'}
    `;

    // Trigger smooth fade-in animation
    const heroContent = el.heroBanner.querySelector('.hero-content');
    if (heroContent) {
      heroContent.classList.remove('hero-fade-in');
      void heroContent.offsetWidth; // Force reflow
      heroContent.classList.add('hero-fade-in');
    }

    // Update Dots
    el.heroDots.querySelectorAll('.hero-dot').forEach((d, i) => {
      d.classList.toggle('active', i === index);
    });
  }

  // ============================================================
  // SEARCH AUTOCOMPLETE SYSTEM
  // ============================================================

  async function fetchAutocomplete(query) {
    if (!el.searchAutocomplete) return;
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=6`);
      const data = await res.json();

      if (!data.success || !data.results || data.results.length === 0) {
        el.searchAutocomplete.style.display = 'none';
        return;
      }

      let html = '';
      data.results.forEach(item => {
        const title = item.cleanTitle || cleanMediaTitle(item.name);
        const poster = item.posterUrl || `${item.url}a_AL_.jpg`;
        const typeLabel = item.type === 'series' ? 'SERIES' : 'MOVIE';

        html += `
          <div class="ac-item" data-url="${escapeHtml(item.url)}" data-name="${escapeHtml(item.name)}" data-type="${escapeHtml(item.type)}">
            <div class="ac-thumb">
              <img src="${escapeHtml(poster)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
              <div class="ac-thumb-fallback" style="display:none;">🎬</div>
            </div>
            <div class="ac-info">
              <div class="ac-name">${escapeHtml(title)}</div>
              <div class="ac-meta">${escapeHtml(item.year || '')} ${item.category ? '• ' + escapeHtml(item.category) : ''}</div>
            </div>
            <span class="ac-type-badge">${typeLabel}</span>
          </div>
        `;
      });

      html += `<div class="ac-footer">Press Enter for complete results (${data.total || data.results.length} found)</div>`;

      el.searchAutocomplete.innerHTML = html;
      el.searchAutocomplete.style.display = 'block';

      // Bind click on suggestions
      el.searchAutocomplete.querySelectorAll('.ac-item').forEach(itemEl => {
        itemEl.addEventListener('click', () => {
          const url = itemEl.getAttribute('data-url');
          const name = itemEl.getAttribute('data-name');
          el.searchAutocomplete.style.display = 'none';
          el.filterInput.value = '';
          state.searchQuery = '';
          el.clearSearchBtn.style.display = 'none';
          handleQuickPlayFolder(url, name);
        });
      });

      const footer = el.searchAutocomplete.querySelector('.ac-footer');
      if (footer) {
        footer.addEventListener('click', () => {
          el.searchAutocomplete.style.display = 'none';
          // Trigger Enter search
          const event = new KeyboardEvent('keydown', { key: 'Enter' });
          el.filterInput.dispatchEvent(event);
        });
      }
    } catch (err) {
      console.warn('Autocomplete fetch failed:', err);
      el.searchAutocomplete.style.display = 'none';
    }
  }

  function showError(msg) {
    el.loadingState.style.display = 'none';
    el.errorState.style.display = 'flex';
    el.emptyState.style.display = 'none';
    el.errorMessage.textContent = msg;
    el.itemsContainer.innerHTML = '';
  }

  function showEmpty() {
    el.loadingState.style.display = 'none';
    el.errorState.style.display = 'none';
    el.emptyState.style.display = 'flex';
    el.itemsContainer.innerHTML = '';
  }

  function hideStates() {
    el.loadingState.style.display = 'none';
    el.errorState.style.display = 'none';
    el.emptyState.style.display = 'none';
  }

  function showToast(message) {
    el.toastMessage.textContent = message;
    el.toastNotification.classList.add('active');
    setTimeout(() => {
      el.toastNotification.classList.remove('active');
    }, 2400);
  }

  function toggleFullscreen(elem) {
    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) elem.requestFullscreen();
      else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  }

  function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function cleanMediaTitle(rawName) {
    if (!rawName) return '';
    let name = rawName.replace(/\.(mkv|mp4|avi|mov|wmv|webm|m4v|ts)$/i, '');
    let clean = name
      .replace(/\((?:tv series|tv mini series).*?\)/i, '')
      .replace(/\((?:19\d\d|20\d\d).*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/(?:1080p|720p|480p|2160p|4k|bluray|bdrip|web-dl|webrip|web|hdtv|nf|amzn|dsnp|hevc|x264|x265|aac5\.1|aac|dts|dd5\.1|dual audio|multi audio|msubs|msmod)/gi, '')
      .replace(/[._]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return clean || name.replace(/[._]/g, ' ').trim();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  document.addEventListener('DOMContentLoaded', init);

})();
