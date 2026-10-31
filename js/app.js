(() => {
  'use strict';

  const IMAGE_BASE = 'https://image.tmdb.org/t/p';
  const LANGUAGE = 'id-ID';
  const KEYS = {
    ratings: 'ratefilm.ratings.v1',
    watchlist: 'ratefilm.watchlist.v1',
  };

  class ApiError extends Error {
    constructor(message, status) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  }

  const state = {
    view: 'explore',
    query: '',
    genre: '',
    year: '',
    sort: 'popularity.desc',
    page: 1,
    totalPages: 1,
    movies: [],
    genres: [],
    loading: false,
    autoLoadPaused: false,
    requestId: 0,
  };

  const cache = new Map();
  const el = {};
  let heroMovie = null;
  let ratings = readJSON(KEYS.ratings, {});
  let watchlist = readJSON(KEYS.watchlist, {});
  let lastFocused = null;
  let modalRequest = 0;
  let toastTimer = 0;
  let searchTimer = 0;

  // ---------------------------------------------------------------- helpers

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function $$(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));
  }

  function icon(name) {
    return `<svg class="icon" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      showToast('Gagal menyimpan ke browser. Penyimpanan mungkin penuh.');
      return false;
    }
  }

  function img(path, size = 'w500') {
    if (!path) return '';
    return /^https?:\/\//i.test(path) ? path : `${IMAGE_BASE}/${size}${path}`;
  }

  function fmtNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? new Intl.NumberFormat('id-ID').format(number) : '—';
  }

  function fmtDate(value) {
    if (!value) return '';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  }

  function fmtRelative(timestamp) {
    const diff = Date.now() - Number(timestamp || 0);
    const minute = 60000;
    const hour = 3600000;
    const day = 86400000;
    if (diff < minute) return 'baru saja';
    if (diff < hour) return `${Math.floor(diff / minute)} menit lalu`;
    if (diff < day) return `${Math.floor(diff / hour)} jam lalu`;
    if (diff < day * 7) return `${Math.floor(diff / day)} hari lalu`;
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(timestamp));
  }

  function initials(title) {
    const words = String(title || '?').trim().split(/\s+/).slice(0, 2);
    return words.map((word) => word.charAt(0)).join('').toUpperCase() || '?';
  }

  function movieYear(movie) {
    return (movie.release_date || '').slice(0, 4);
  }

  function tmdbScore(movie) {
    if (!movie.vote_average) return '—';
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(movie.vote_average);
  }

  function snapshot(movie) {
    return {
      id: movie.id,
      title: movie.title || 'Tanpa judul',
      poster_path: movie.poster_path || null,
      release_date: movie.release_date || '',
      vote_average: movie.vote_average || 0,
      genre_ids: movie.genre_ids || [],
    };
  }

  function showToast(message) {
    if (!el.toast) return;
    el.toast.textContent = message;
    el.toast.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => el.toast.classList.remove('is-show'), 2800);
  }

  // -------------------------------------------------------------------- API

  async function api(path, params = {}) {
    const url = new URL('/api/tmdb', window.location.origin);
    url.searchParams.set('endpoint', path);
    url.searchParams.set('language', LANGUAGE);
    Object.entries(params).forEach(([name, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(name, value);
      }
    });

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url.toString(), {
        headers: { accept: 'application/json' },
        signal: controller.signal,
      });
      const data = await response.json();
      if (response.status === 401) {
        throw new ApiError('API key TMDB tidak valid atau sudah dicabut.', 401);
      }
      if (response.status === 429) {
        throw new ApiError('Batas permintaan TMDB tercapai. Coba lagi beberapa saat.', 429);
      }
      if (!response.ok) {
        throw new ApiError(
          data.error || data.status_message || `Permintaan TMDB gagal (${response.status}).`,
          response.status,
        );
      }
      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error.name === 'AbortError') {
        throw new ApiError('Permintaan ke TMDB timeout. Periksa koneksi internet.', 0);
      }
      throw new ApiError('Tidak bisa terhubung ke TMDB. Periksa koneksi internet.', 0);
    } finally {
      window.clearTimeout(timer);
    }
  }

  // ----------------------------------------------------------- markup bits

  function posterMarkup(movie, size = 'w500') {
    const src = img(movie.poster_path, size);
    return `<span class="poster">
      <span class="poster__fallback" aria-hidden="true">${esc(initials(movie.title))}</span>
      ${src ? `<img class="poster__img" src="${esc(src)}" alt="" loading="lazy" decoding="async" onerror="this.remove()">` : ''}
    </span>`;
  }

  function cardMarkup(movie) {
    const saved = Boolean(watchlist[movie.id]);
    const rating = ratings[movie.id];
    const year = movieYear(movie);
    return `<article class="card" data-id="${movie.id}">
      <button class="card__main" type="button" data-open="${movie.id}" aria-label="Lihat detail ${esc(movie.title)}">
        ${posterMarkup(movie)}
        <span class="card__info">
          <span class="card__title">${esc(movie.title)}</span>
          <span class="card__meta">
            <span>${year || '—'}</span>
            <span class="meta-dot" aria-hidden="true"></span>
            <span class="card__score">${icon('star')}${tmdbScore(movie)}</span>
          </span>
        </span>
      </button>
      <button class="card__save ${saved ? 'is-saved' : ''}" type="button" data-save="${movie.id}" aria-pressed="${saved}" aria-label="${saved ? 'Hapus dari watchlist' : 'Tambah ke watchlist'}" title="${saved ? 'Hapus dari watchlist' : 'Tambah ke watchlist'}">${icon('bookmark')}</button>
      ${rating ? `<span class="card__rating" title="Rating kamu">${icon('star')}${rating.score}</span>` : ''}
    </article>`;
  }

  function starBar(score) {
    const percent = Math.max(0, Math.min(100, Number(score) * 10));
    return `<span class="star-bar" aria-hidden="true"><span class="star-bar__base">★★★★★</span><span class="star-bar__fill" style="width:${percent}%">★★★★★</span></span>`;
  }

  function skeletonMarkup(count = 12) {
    const item = `<div class="card card--skeleton" aria-hidden="true">
      <div class="skeleton skeleton--poster"></div>
      <div class="skeleton skeleton--line"></div>
      <div class="skeleton skeleton--line skeleton--short"></div>
    </div>`;
    return item.repeat(count);
  }

  function ratingRowMarkup(movie) {
    const year = movieYear(movie);
    return `<article class="rating-row">
      <button class="rating-row__main" type="button" data-open="${movie.id}" aria-label="Edit rating ${esc(movie.title)}">
        <span class="rating-row__poster">${posterMarkup(movie, 'w92')}</span>
        <span class="rating-row__info">
          <span class="rating-row__title">${esc(movie.title)}</span>
          <span class="rating-row__meta">
            <span>${year || '—'}</span>
            <span class="meta-dot" aria-hidden="true"></span>
            ${starBar(movie.score)}
            <span class="rating-row__score">${movie.score}/10</span>
          </span>
          ${movie.review ? `<span class="rating-row__review">“${esc(movie.review)}”</span>` : ''}
          <span class="rating-row__date">Diperbarui ${fmtRelative(movie.updatedAt)}</span>
        </span>
      </button>
      <span class="rating-row__actions">
        <button class="icon-btn" type="button" data-open="${movie.id}" aria-label="Edit rating ${esc(movie.title)}" title="Edit rating">${icon('edit')}</button>
        <button class="icon-btn icon-btn--danger" type="button" data-delete-rating="${movie.id}" aria-label="Hapus rating ${esc(movie.title)}" title="Hapus rating">${icon('trash')}</button>
      </span>
    </article>`;
  }

  // ------------------------------------------------------------- data load

  async function loadGenres() {
    try {
      const data = await api('/genre/movie/list');
      state.genres = Array.isArray(data.genres) ? data.genres : [];
      el.genreSelect.innerHTML = '<option value="">Semua genre</option>' + state.genres
        .map((genre) => `<option value="${genre.id}">${esc(genre.name)}</option>`)
        .join('');
      el.genreSelect.value = state.genre;
    } catch {
      // Filter genre tetap bisa dipakai tanpa daftar genre.
    }
  }

  async function loadHero() {
    try {
      const data = await api('/trending/movie/day');
      const results = Array.isArray(data.results) ? data.results : [];
      let movie = results.find((item) => item.backdrop_path) || results[0];
      if (!movie) return;

      if ((movie.overview || '').trim().length < 120) {
        try {
          movie = { ...movie, ...await api(`/movie/${movie.id}`) };
        } catch (error) {
          console.warn('Could not load a longer featured-film synopsis:', error);
        }
      }

      heroMovie = movie;
      cache.set(movie.id, movie);
      renderHero(movie);
    } catch {
      el.hero.hidden = true;
    }
  }

  async function loadMovies({ append = false } = {}) {
    const requestId = ++state.requestId;
    state.loading = true;

    if (!append) {
      state.page = 1;
      state.movies = [];
      state.autoLoadPaused = false;
      el.grid.innerHTML = skeletonMarkup();
      el.grid.hidden = false;
      el.empty.hidden = true;
      el.error.hidden = true;
      el.resultMeta.textContent = 'Memuat...';
    }
    updateLoadMore();

    try {
      const requestedPage = append ? state.page + 1 : 1;
      const params = { page: requestedPage, include_adult: 'false' };
      let data;

      if (state.query) {
        data = await api('/search/movie', { ...params, query: state.query });
      } else {
        params.sort_by = state.sort;
        if (state.genre) params.with_genres = state.genre;
        if (state.year) params.primary_release_year = state.year;
        if (state.sort === 'vote_average.desc') params['vote_count.gte'] = 200;
        if (state.sort === 'primary_release_date.desc') params['vote_count.gte'] = 20;
        data = await api('/discover/movie', params);
      }

      if (requestId !== state.requestId) return;

      const results = Array.isArray(data.results) ? data.results : [];
      results.forEach((movie) => cache.set(movie.id, movie));
      state.page = requestedPage;
      state.movies = append ? state.movies.concat(results) : results;
      state.totalPages = Math.min(Number(data.total_pages) || 1, 500);
      renderGrid(append ? results : null);
      el.resultMeta.textContent = data.total_results ? `${fmtNumber(data.total_results)} film` : '';
    } catch (error) {
      if (requestId !== state.requestId) return;
      if (append && state.movies.length > 0) {
        state.autoLoadPaused = true;
        el.error.hidden = false;
        el.errorText.textContent = error.message || 'Gagal memuat halaman berikutnya.';
        el.retryBtn.textContent = 'Coba muat lagi';
      } else {
        state.movies = [];
        renderError(error);
      }
    } finally {
      if (requestId === state.requestId) {
        state.loading = false;
        updateLoadMore();
      }
    }
  }

  function renderGrid(newItems) {
    el.retryBtn.textContent = 'Coba lagi';
    if (newItems) {
      el.grid.insertAdjacentHTML('beforeend', newItems.map(cardMarkup).join(''));
    } else {
      el.grid.innerHTML = state.movies.map(cardMarkup).join('');
    }
    const isEmpty = state.movies.length === 0;
    el.grid.hidden = isEmpty;
    el.empty.hidden = !isEmpty;
    el.error.hidden = true;
    if (isEmpty) updateEmptyCopy();
  }

  function renderError(error) {
    el.grid.innerHTML = '';
    el.grid.hidden = true;
    el.empty.hidden = true;
    el.error.hidden = false;
    el.errorText.textContent = error.message || 'Terjadi kesalahan saat memuat data.';
    el.resultMeta.textContent = '';
    updateLoadMore();
  }

  function updateLoadMore() {
    const hasMore = state.page < state.totalPages && state.movies.length > 0;
    el.loadMoreWrap.hidden = !hasMore;
    el.loadMoreBtn.disabled = state.loading;
    el.loadMoreBtn.textContent = state.loading && state.movies.length > 0 ? 'Memuat...' : 'Muat lebih banyak';
  }

  function loadNextPage({ automatic = false } = {}) {
    if (automatic && state.autoLoadPaused) return;
    if (state.loading || state.page >= state.totalPages || state.movies.length === 0) return;
    state.autoLoadPaused = false;
    loadMovies({ append: true });
  }

  function updateEmptyCopy() {
    if (state.query) {
      el.emptyTitle.textContent = `Tidak ada hasil untuk “${state.query}”`;
      el.emptyText.textContent = 'Coba kata kunci lain atau periksa ejaan judul film.';
    } else if (state.genre || state.year) {
      el.emptyTitle.textContent = 'Tidak ada film dengan filter ini';
      el.emptyText.textContent = 'Coba ganti genre atau tahun, lalu muat ulang.';
    } else {
      el.emptyTitle.textContent = 'Belum ada film untuk ditampilkan';
      el.emptyText.textContent = 'Coba muat ulang atau periksa koneksi internet.';
    }
  }

  function syncExploreHeader() {
    const searching = Boolean(state.query);
    el.exploreEyebrow.textContent = searching ? 'Pencarian' : 'Jelajahi';
    el.exploreTitle.textContent = searching ? `Hasil untuk “${state.query}”` : 'Katalog film';
    el.filters.hidden = searching;
    updateFilterState();
  }

  function updateFilterState() {
    const active = Boolean(state.genre || state.year || state.sort !== 'popularity.desc');
    el.resetFilters.hidden = !active || Boolean(state.query);
  }

  // ------------------------------------------------------------- rendering

  function renderHero(movie) {
    el.heroTitle.textContent = movie.title;
    const parts = [];
    if (movie.release_date) parts.push(`<span>${movieYear(movie)}</span>`);
    if (movie.vote_average) parts.push(`<span class="hero__score">${icon('star')}${tmdbScore(movie)}</span>`);
    if (movie.vote_count) parts.push(`<span>${fmtNumber(movie.vote_count)} suara</span>`);
    el.heroMeta.innerHTML = parts.join('<span class="meta-dot" aria-hidden="true"></span>');
    el.heroOverview.textContent = movie.overview || 'Sinopsis belum tersedia untuk film ini.';

    if (movie.backdrop_path) {
      el.heroImg.src = img(movie.backdrop_path, 'w1280');
      el.heroImg.hidden = false;
      el.hero.classList.remove('hero--no-image');
    } else {
      el.heroImg.removeAttribute('src');
      el.heroImg.hidden = true;
      el.hero.classList.add('hero--no-image');
    }

    updateHeroSave();
    updateHeroVisibility();
  }

  function updateHeroVisibility() {
    el.hero.hidden = !heroMovie || state.view !== 'explore' || Boolean(state.query);
  }

  function updateHeroSave() {
    if (!heroMovie) {
      el.heroSave.innerHTML = '';
      return;
    }
    const saved = Boolean(watchlist[heroMovie.id]);
    el.heroSave.classList.toggle('is-saved', saved);
    el.heroSave.setAttribute('aria-pressed', String(saved));
    el.heroSave.innerHTML = saved ? `${icon('check')} Di watchlist` : `${icon('bookmark')} Watchlist`;
  }

  function updateBadges() {
    const watchlistCount = Object.keys(watchlist).length;
    const ratingsCount = Object.keys(ratings).length;
    $$('[data-count="watchlist"]').forEach((node) => { node.textContent = watchlistCount; });
    $$('[data-count="ratings"]').forEach((node) => { node.textContent = ratingsCount; });
  }

  function updateSaveButtons(id) {
    const saved = Boolean(watchlist[id]);
    $$(`[data-save="${id}"]`).forEach((button) => {
      button.classList.toggle('is-saved', saved);
      button.setAttribute('aria-pressed', String(saved));
      button.setAttribute('aria-label', saved ? 'Hapus dari watchlist' : 'Tambah ke watchlist');
      button.setAttribute('title', saved ? 'Hapus dari watchlist' : 'Tambah ke watchlist');
    });
    const detailButton = $('#detailSave', el.modalBody);
    if (detailButton) {
      detailButton.classList.toggle('is-saved', saved);
      detailButton.setAttribute('aria-pressed', String(saved));
      detailButton.innerHTML = saved ? `${icon('check')} Tersimpan di watchlist` : `${icon('bookmark')} Tambah ke watchlist`;
    }
    updateHeroSave();
  }

  function updateCardRating(id) {
    $$(`.card[data-id="${id}"]`).forEach((card) => {
      let badge = $('.card__rating', card);
      if (ratings[id]) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'card__rating';
          badge.title = 'Rating kamu';
          card.appendChild(badge);
        }
        badge.innerHTML = `${icon('star')}${ratings[id].score}`;
      } else if (badge) {
        badge.remove();
      }
    });
  }

  function toggleWatchlist(movie) {
    if (!movie) return;
    if (watchlist[movie.id]) {
      delete watchlist[movie.id];
      writeJSON(KEYS.watchlist, watchlist);
      showToast(`“${movie.title}” dihapus dari watchlist.`);
    } else {
      watchlist[movie.id] = { ...snapshot(movie), addedAt: Date.now() };
      writeJSON(KEYS.watchlist, watchlist);
      showToast(`“${movie.title}” ditambahkan ke watchlist.`);
    }
    updateBadges();
    updateSaveButtons(movie.id);
    if (state.view === 'watchlist') renderWatchlist();
  }

  function renderWatchlist() {
    const items = Object.values(watchlist).sort((a, b) => b.addedAt - a.addedAt);
    items.forEach((movie) => cache.set(movie.id, movie));
    el.watchlistGrid.innerHTML = items.map(cardMarkup).join('');
    el.watchlistGrid.hidden = items.length === 0;
    el.watchlistEmpty.hidden = items.length > 0;
  }

  function renderRatings() {
    const items = Object.values(ratings).sort((a, b) => b.updatedAt - a.updatedAt);
    items.forEach((movie) => cache.set(movie.id, movie));

    el.ratingsList.hidden = items.length === 0;
    el.ratingsEmpty.hidden = items.length > 0;
    el.ratingSummary.hidden = items.length === 0;

    if (!items.length) {
      el.ratingsList.innerHTML = '';
      return;
    }

    const average = items.reduce((sum, movie) => sum + Number(movie.score), 0) / items.length;
    el.ratingAvg.textContent = fmtNumber(Number(average.toFixed(1)));
    el.ratingTotal.textContent = fmtNumber(items.length);
    el.ratingsList.innerHTML = items.map(ratingRowMarkup).join('');
  }

  function setView(view) {
    state.view = view;
    $$('.tab').forEach((tab) => {
      const active = tab.dataset.view === view;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-pressed', String(active));
    });
    el.exploreView.hidden = view !== 'explore';
    el.watchlistView.hidden = view !== 'watchlist';
    el.ratingsView.hidden = view !== 'ratings';
    updateHeroVisibility();
    if (view === 'watchlist') renderWatchlist();
    if (view === 'ratings') renderRatings();
    window.scrollTo(0, 0);
  }

  // ------------------------------------------------------------------ modal

  function openModal(html) {
    if (el.modal.hidden) lastFocused = document.activeElement;
    el.modalBody.innerHTML = html;
    el.modal.hidden = false;
    document.body.classList.add('is-locked');
    requestAnimationFrame(() => el.modal.classList.add('is-open'));
    el.modalClose.focus({ preventScroll: true });
  }

  function closeModal() {
    modalRequest += 1;
    el.modal.classList.remove('is-open');
    el.modal.hidden = true;
    document.body.classList.remove('is-locked');
    el.modalBody.innerHTML = '';
    if (lastFocused && document.contains(lastFocused)) {
      lastFocused.focus({ preventScroll: true });
    }
    lastFocused = null;
  }

  async function openDetail(id) {
    const requestId = ++modalRequest;
    openModal(`<div class="detail-loading" aria-busy="true">
      <div class="skeleton skeleton--backdrop"></div>
      <div class="detail-loading__body">
        <h2 class="sr-only" id="modalTitle">Memuat detail film</h2>
        <div class="skeleton skeleton--line"></div>
        <div class="skeleton skeleton--line skeleton--short"></div>
      </div>
    </div>`);

    try {
      const movie = await api(`/movie/${id}`);
      if (requestId !== modalRequest) return;
      cache.set(id, movie);
      renderDetail(movie);
    } catch (error) {
      if (requestId !== modalRequest) return;
      renderModalError(error.message, () => openDetail(id));
    }
  }

  function renderModalError(message, retry) {
    el.modalBody.innerHTML = `<div class="modal-message">
      <h2 id="modalTitle">Gagal memuat detail</h2>
      <p>${esc(message)}</p>
      <button class="btn btn--primary btn--sm" id="modalRetry" type="button">Coba lagi</button>
    </div>`;
    $('#modalRetry', el.modalBody).addEventListener('click', retry);
  }

  function renderDetail(movie) {
    const saved = Boolean(watchlist[movie.id]);
    const existing = ratings[movie.id];
    const score = existing ? Number(existing.score) : 0;
    const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}j ${movie.runtime % 60}m` : '';
    const genres = (movie.genres || []).map((genre) => `<span class="chip">${esc(genre.name)}</span>`).join('');

    const meta = [];
    if (movie.release_date) meta.push(`<span>${fmtDate(movie.release_date)}</span>`);
    if (runtime) meta.push(`<span>${runtime}</span>`);
    if (movie.vote_count) meta.push(`<span>${fmtNumber(movie.vote_count)} suara</span>`);

    el.modalBody.innerHTML = `<article class="detail">
      <div class="detail__hero ${movie.backdrop_path ? '' : 'detail__hero--empty'}">
        ${movie.backdrop_path ? `<img class="detail__backdrop" src="${esc(img(movie.backdrop_path, 'w1280'))}" alt="" onerror="this.remove()">` : ''}
      </div>
      <div class="detail__body">
        <div class="detail__poster">${posterMarkup(movie, 'w342')}</div>
        <div class="detail__main">
          <h2 class="detail__title" id="modalTitle">${esc(movie.title)}</h2>
          ${movie.tagline ? `<p class="detail__tagline">“${esc(movie.tagline)}”</p>` : ''}
          <div class="detail__meta">
            <span class="score-pill">${icon('star')}${tmdbScore(movie)} <small>TMDB</small></span>
            ${meta.join('<span class="meta-dot" aria-hidden="true"></span>')}
          </div>
          ${genres ? `<div class="chips">${genres}</div>` : ''}
          <p class="detail__overview">${esc(movie.overview || 'Sinopsis belum tersedia untuk film ini.')}</p>
          <div class="detail__actions">
            <button class="btn btn--ghost ${saved ? 'is-saved' : ''}" id="detailSave" type="button" aria-pressed="${saved}">${saved ? `${icon('check')} Tersimpan di watchlist` : `${icon('bookmark')} Tambah ke watchlist`}</button>
          </div>
        </div>

        <form class="rate-box" id="rateForm">
          <div class="rate-box__head">
            <h3>Rating kamu</h3>
            <span class="rate-box__value" id="rateValue">${score ? `${score}/10` : 'Belum dirating'}</span>
          </div>
          <div class="stars" id="stars" role="group" aria-label="Pilih rating 1 sampai 10">
            ${Array.from({ length: 10 }, (_, index) => `<button class="star ${index < score ? 'is-on' : ''}" type="button" data-score="${index + 1}" aria-label="${index + 1} dari 10" aria-pressed="${index < score}">${icon('star')}</button>`).join('')}
          </div>
          <label class="rate-box__label" for="reviewInput">Review singkat <span>(opsional)</span></label>
          <textarea id="reviewInput" rows="3" maxlength="500" placeholder="Apa yang paling berkesan dari film ini?">${esc(existing ? existing.review : '')}</textarea>
          <div class="rate-box__actions">
            <button class="btn btn--primary" type="submit">Simpan rating</button>
            ${existing ? '<button class="btn btn--danger" id="deleteRating" type="button">Hapus rating</button>' : ''}
          </div>
        </form>
      </div>
    </article>`;

    const form = $('#rateForm', el.modalBody);
    const starsWrap = $('#stars', form);
    const valueEl = $('#rateValue', form);
    const starButtons = $$('.star', starsWrap);
    let draft = score;

    const paint = (value) => {
      starButtons.forEach((button, index) => {
        const active = index < value;
        button.classList.toggle('is-on', active);
        button.setAttribute('aria-pressed', String(active));
      });
      valueEl.textContent = value ? `${value}/10` : 'Belum dirating';
    };

    starButtons.forEach((button) => {
      const value = Number(button.dataset.score);
      button.addEventListener('mouseenter', () => paint(value));
      button.addEventListener('focus', () => paint(value));
      button.addEventListener('click', () => {
        draft = value;
        paint(draft);
      });
    });
    starsWrap.addEventListener('mouseleave', () => paint(draft));
    starsWrap.addEventListener('focusout', (event) => {
      if (!starsWrap.contains(event.relatedTarget)) paint(draft);
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!draft) {
        showToast('Pilih bintang dulu untuk memberi rating.');
        return;
      }
      ratings[movie.id] = {
        ...snapshot(movie),
        score: draft,
        review: $('#reviewInput', form).value.trim().slice(0, 500),
        updatedAt: Date.now(),
      };
      if (writeJSON(KEYS.ratings, ratings)) {
        updateBadges();
        updateCardRating(movie.id);
        renderDetail(movie);
        showToast('Rating kamu tersimpan.');
      }
    });

    const deleteButton = $('#deleteRating', form);
    if (deleteButton) {
      deleteButton.addEventListener('click', () => {
        if (!window.confirm(`Hapus rating untuk “${movie.title}”?`)) return;
        delete ratings[movie.id];
        if (writeJSON(KEYS.ratings, ratings)) {
          updateBadges();
          updateCardRating(movie.id);
          renderDetail(movie);
          showToast('Rating dihapus.');
        }
      });
    }

    $('#detailSave', el.modalBody).addEventListener('click', () => toggleWatchlist(movie));
  }

  // ------------------------------------------------------------------ boot

  function buildYearOptions() {
    const currentYear = new Date().getFullYear();
    let options = '<option value="">Semua tahun</option>';
    for (let year = currentYear; year >= 1950; year -= 1) {
      options += `<option value="${year}">${year}</option>`;
    }
    el.yearSelect.innerHTML = options;
  }

  function handleGridClick(event) {
    const saveButton = event.target.closest('[data-save]');
    if (saveButton) {
      const movie = cache.get(Number(saveButton.dataset.save));
      if (movie) toggleWatchlist(movie);
      return;
    }
    const openButton = event.target.closest('[data-open]');
    if (openButton) openDetail(Number(openButton.dataset.open));
  }

  function initApp() {
    el.appView.hidden = false;
    updateBadges();
    loadGenres();
    loadHero();
    loadMovies();
    if (state.view === 'watchlist') renderWatchlist();
    if (state.view === 'ratings') renderRatings();
  }

  function wireEvents() {
    el.tabs.addEventListener('click', (event) => {
      const tab = event.target.closest('[data-view]');
      if (tab) setView(tab.dataset.view);
    });

    el.searchInput.addEventListener('input', () => {
      const value = el.searchInput.value.trim();
      el.searchClear.hidden = !value;
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => {
        if (value === state.query) return;
        state.query = value;
        setView('explore');
        syncExploreHeader();
        loadMovies();
      }, 400);
    });

    el.searchClear.addEventListener('click', () => {
      el.searchInput.value = '';
      el.searchClear.hidden = true;
      state.query = '';
      syncExploreHeader();
      setView('explore');
      loadMovies();
      el.searchInput.focus();
    });

    el.brandLink.addEventListener('click', (event) => {
      event.preventDefault();
      const hadQuery = Boolean(state.query);
      el.searchInput.value = '';
      el.searchClear.hidden = true;
      state.query = '';
      syncExploreHeader();
      setView('explore');
      if (hadQuery) loadMovies();
    });

    el.genreSelect.addEventListener('change', () => {
      state.genre = el.genreSelect.value;
      updateFilterState();
      loadMovies();
    });

    el.yearSelect.addEventListener('change', () => {
      state.year = el.yearSelect.value;
      updateFilterState();
      loadMovies();
    });

    el.sortSelect.addEventListener('change', () => {
      state.sort = el.sortSelect.value;
      updateFilterState();
      loadMovies();
    });

    el.resetFilters.addEventListener('click', () => {
      state.genre = '';
      state.year = '';
      state.sort = 'popularity.desc';
      el.genreSelect.value = '';
      el.yearSelect.value = '';
      el.sortSelect.value = 'popularity.desc';
      updateFilterState();
      loadMovies();
    });

    el.loadMoreBtn.addEventListener('click', () => loadNextPage());

    el.retryBtn.addEventListener('click', () => {
      if (state.movies.length > 0 && state.page < state.totalPages) {
        loadNextPage();
      } else {
        loadMovies();
      }
    });

    el.heroDetail.addEventListener('click', () => {
      if (heroMovie) openDetail(heroMovie.id);
    });
    el.heroSave.addEventListener('click', () => {
      if (heroMovie) toggleWatchlist(heroMovie);
    });
    el.heroImg.addEventListener('error', () => el.hero.classList.add('hero--no-image'));

    el.grid.addEventListener('click', handleGridClick);
    el.watchlistGrid.addEventListener('click', handleGridClick);

    el.ratingsList.addEventListener('click', (event) => {
      const deleteButton = event.target.closest('[data-delete-rating]');
      if (deleteButton) {
        const id = Number(deleteButton.dataset.deleteRating);
        const movie = ratings[id];
        if (!movie) return;
        if (!window.confirm(`Hapus rating untuk “${movie.title}”?`)) return;
        delete ratings[id];
        if (writeJSON(KEYS.ratings, ratings)) {
          updateBadges();
          updateCardRating(id);
          renderRatings();
          showToast('Rating dihapus.');
        }
        return;
      }
      const openButton = event.target.closest('[data-open]');
      if (openButton) openDetail(Number(openButton.dataset.open));
    });

    [el.watchlistExploreBtn, el.ratingsExploreBtn].forEach((button) => {
      button.addEventListener('click', () => setView('explore'));
    });

    el.modal.addEventListener('click', (event) => {
      if (event.target.closest('[data-close]')) closeModal();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !el.modal.hidden) closeModal();
    });

  }

  function boot() {
    Object.assign(el, {
      appView: $('#appView'),
      hero: $('#hero'),
      heroImg: $('#heroImg'),
      heroTitle: $('#heroTitle'),
      heroMeta: $('#heroMeta'),
      heroOverview: $('#heroOverview'),
      heroDetail: $('#heroDetail'),
      heroSave: $('#heroSave'),
      exploreView: $('#exploreView'),
      exploreEyebrow: $('#exploreEyebrow'),
      exploreTitle: $('#exploreTitle'),
      resultMeta: $('#resultMeta'),
      filters: $('#filters'),
      genreSelect: $('#genreSelect'),
      yearSelect: $('#yearSelect'),
      sortSelect: $('#sortSelect'),
      resetFilters: $('#resetFilters'),
      grid: $('#movieGrid'),
      empty: $('#exploreEmpty'),
      emptyTitle: $('#emptyTitle'),
      emptyText: $('#emptyText'),
      error: $('#exploreError'),
      errorText: $('#errorText'),
      retryBtn: $('#retryBtn'),
      loadMoreWrap: $('#loadMoreWrap'),
      loadMoreBtn: $('#loadMoreBtn'),
      watchlistView: $('#watchlistView'),
      watchlistGrid: $('#watchlistGrid'),
      watchlistEmpty: $('#watchlistEmpty'),
      watchlistExploreBtn: $('#watchlistExploreBtn'),
      ratingsView: $('#ratingsView'),
      ratingSummary: $('#ratingSummary'),
      ratingAvg: $('#ratingAvg'),
      ratingTotal: $('#ratingTotal'),
      ratingsList: $('#ratingsList'),
      ratingsEmpty: $('#ratingsEmpty'),
      ratingsExploreBtn: $('#ratingsExploreBtn'),
      tabs: $('.tabs'),
      searchInput: $('#searchInput'),
      searchClear: $('#searchClear'),
      brandLink: $('#brandLink'),
      modal: $('#modal'),
      modalBody: $('#modalBody'),
      modalClose: $('.modal__close'),
      toast: $('#toast'),
    });

    buildYearOptions();
    wireEvents();
    if ('IntersectionObserver' in window) {
      const loadMoreObserver = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting) && state.view === 'explore') {
          loadNextPage({ automatic: true });
        }
      }, { rootMargin: '500px 0px' });
      loadMoreObserver.observe(el.loadMoreWrap);
    }
    updateBadges();
    initApp();
  }

  boot();
})();
