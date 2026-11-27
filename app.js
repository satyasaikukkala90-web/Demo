/* ===== OkLuT Music - app.js ===== */

// --- Jamendo API (real data) ---
const JAMENDO_CLIENT_ID = '56d30c95'; // Public demo client id for testing; replace if you have your own
let tracks = []; // populated from Jamendo search/popular

const albums = [
  { id: 'a1', title: 'Urban Dreams', artist: 'Neon Waves', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop' },
  { id: 'a2', title: 'Sunset Sessions', artist: 'Luna Park', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' },
  { id: 'a3', title: 'Voltage', artist: 'The Synths', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop' },
  { id: 'a4', title: 'Waves', artist: 'Coastal Kids', cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop' }
];

const artists = [
  { id: 'ar1', name: 'Neon Waves', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop' },
  { id: 'ar2', name: 'Luna Park', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop' },
  { id: 'ar3', name: 'The Synths', cover: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&h=400&fit=crop' },
  { id: 'ar4', name: 'Coastal Kids', cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop' }
];

const playlistsData = [
  { id: 'p1', title: 'Chill Vibes', desc: 'Relax and unwind', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop' },
  { id: 'p2', title: 'Workout Energy', desc: 'Power through your session', cover: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=400&fit=crop' },
  { id: 'p3', title: 'Late Night Drive', desc: 'Cruise under city lights', cover: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&h=400&fit=crop' },
  { id: 'p4', title: 'Focus Flow', desc: 'Deep concentration beats', cover: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop' }
];

async function fetchJamendoTracks(query = 'popular') {
  try {
    const url = `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=jsonpretty&limit=20&search=${encodeURIComponent(query)}&audioformat=mp32`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Jamendo fetch failed');
    const data = await res.json();
    const results = (data.results || []).map(t => ({
      id: String(t.id),
      title: t.name || 'Unknown Title',
      artist: t.artist_name || 'Unknown Artist',
      album: t.album_name || '',
      duration: parseInt(t.duration, 10) || 0,
      cover: t.album_image || t.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
      audio: t.audio || ''
    })).filter(t => t.audio);
    return results;
  } catch (e) {
    console.error('Jamendo error:', e);
    return [];
  }
}

// --- State ---
let currentTrackIndex = -1;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let likedTracks = new Set(JSON.parse(localStorage.getItem('oklut_liked') || '[]'));

const audio = new Audio();
audio.volume = 0.8;

// --- Helpers ---
function formatTime(sec) {
  if (!isFinite(sec) || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function saveLikes() {
  localStorage.setItem('oklut_liked', JSON.stringify([...likedTracks]));
}

// --- Render Cards ---
function createTrackCard(track, index) {
  const card = document.createElement('div');
  card.className = 'music-card';
  card.innerHTML = `
    <div class="music-card-img-wrap">
      <img src="${track.cover}" alt="${track.title}">
      <button class="music-card-play" aria-label="Play"><i class="fas fa-play"></i></button>
    </div>
    <div class="music-card-title">${track.title}</div>
    <div class="music-card-artist">${track.artist}</div>
  `;
  card.querySelector('.music-card-play').addEventListener('click', (e) => {
    e.stopPropagation();
    playTrack(index);
  });
  card.addEventListener('click', () => playTrack(index));
  return card;
}

function createAlbumCard(album) {
  const card = document.createElement('div');
  card.className = 'music-card';
  card.innerHTML = `
    <div class="music-card-img-wrap">
      <img src="${album.cover}" alt="${album.title}">
      <button class="music-card-play" aria-label="Play"><i class="fas fa-play"></i></button>
    </div>
    <div class="music-card-title">${album.title}</div>
    <div class="music-card-artist">${album.artist}</div>
  `;
  card.querySelector('.music-card-play').addEventListener('click', (e) => {
    e.stopPropagation();
    playTrack(0);
  });
  card.addEventListener('click', () => playTrack(0));
  return card;
}

function createArtistCard(artist) {
  const card = document.createElement('div');
  card.className = 'music-card artist-card';
  card.innerHTML = `
    <div class="music-card-img-wrap">
      <img src="${artist.cover}" alt="${artist.name}">
      <button class="music-card-play" aria-label="Play"><i class="fas fa-play"></i></button>
    </div>
    <div class="music-card-title">${artist.name}</div>
    <div class="music-card-artist">Artist</div>
  `;
  card.querySelector('.music-card-play').addEventListener('click', (e) => {
    e.stopPropagation();
    playTrack(0);
  });
  card.addEventListener('click', () => playTrack(0));
  return card;
}

function createPlaylistCard(pl) {
  const card = document.createElement('div');
  card.className = 'music-card';
  card.innerHTML = `
    <div class="music-card-img-wrap">
      <img src="${pl.cover}" alt="${pl.title}">
      <button class="music-card-play" aria-label="Play"><i class="fas fa-play"></i></button>
    </div>
    <div class="music-card-title">${pl.title}</div>
    <div class="music-card-artist">${pl.desc}</div>
  `;
  card.querySelector('.music-card-play').addEventListener('click', (e) => {
    e.stopPropagation();
    playTrack(0);
  });
  card.addEventListener('click', () => playTrack(0));
  return card;
}

// --- Populate UI ---
function populateHome() {
  const trendingRow = document.getElementById('trendingRow');
  const albumsRow = document.getElementById('albumsRow');
  const artistsRow = document.getElementById('artistsRow');
  trendingRow.innerHTML = '';
  albumsRow.innerHTML = '';
  artistsRow.innerHTML = '';

  tracks.forEach((t, i) => trendingRow.appendChild(createTrackCard(t, i)));
  albums.forEach(a => albumsRow.appendChild(createAlbumCard(a)));
  artists.forEach(ar => artistsRow.appendChild(createArtistCard(ar)));
}

function populateGrids() {
  const playlistsGrid = document.getElementById('playlistsGrid');
  const albumsGrid = document.getElementById('albumsGrid');
  const artistsGrid = document.getElementById('artistsGrid');
  playlistsGrid.innerHTML = '';
  albumsGrid.innerHTML = '';
  artistsGrid.innerHTML = '';

  playlistsData.forEach(p => playlistsGrid.appendChild(createPlaylistCard(p)));
  albums.forEach(a => albumsGrid.appendChild(createAlbumCard(a)));
  artists.forEach(ar => artistsGrid.appendChild(createArtistCard(ar)));
}

function populateLibrary() {
  const grid = document.getElementById('libraryGrid');
  grid.innerHTML = '';
  tracks.forEach((t, i) => {
    const item = document.createElement('div');
    item.className = 'library-item';
    item.innerHTML = `
      <img src="${t.cover}" alt="${t.title}">
      <div class="library-item-info">
        <h4>${t.title}</h4>
        <p>${t.artist} • Song</p>
      </div>
    `;
    item.addEventListener('click', () => playTrack(i));
    grid.appendChild(item);
  });
}

// --- Player Logic ---
function playTrack(index) {
  if (index < 0 || index >= tracks.length) return;
  currentTrackIndex = index;
  const track = tracks[currentTrackIndex];
  audio.src = track.audio;
  audio.play().then(() => {
    isPlaying = true;
    updatePlayButton();
  }).catch(() => {
    // Autoplay may be blocked; still update UI
    isPlaying = true;
    updatePlayButton();
  });
  updatePlayerUI(track);
}

function updatePlayerUI(track) {
  document.getElementById('playerCover').src = track.cover;
  document.getElementById('playerTrackName').textContent = track.title;
  document.getElementById('playerTrackArtist').textContent = track.artist;
  updateLikeButton();
}

function updatePlayButton() {
  const icon = document.getElementById('playPauseIcon');
  icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
}

function togglePlayPause() {
  if (currentTrackIndex === -1) {
    playTrack(0);
    return;
  }
  if (isPlaying) {
    audio.pause();
    isPlaying = false;
  } else {
    audio.play().catch(() => {});
    isPlaying = true;
  }
  updatePlayButton();
}

function playNext() {
  if (tracks.length === 0) return;
  let next;
  if (isShuffle) {
    next = Math.floor(Math.random() * tracks.length);
  } else {
    next = currentTrackIndex + 1;
    if (next >= tracks.length) next = 0;
  }
  playTrack(next);
}

function playPrev() {
  if (tracks.length === 0) return;
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  let prev = currentTrackIndex - 1;
  if (prev < 0) prev = tracks.length - 1;
  playTrack(prev);
}

function updateLikeButton() {
  const btn = document.getElementById('playerLikeBtn');
  const icon = btn.querySelector('i');
  if (currentTrackIndex === -1) {
    icon.className = 'far fa-heart';
    btn.classList.remove('liked');
    return;
  }
  const trackId = tracks[currentTrackIndex].id;
  if (likedTracks.has(trackId)) {
    icon.className = 'fas fa-heart';
    btn.classList.add('liked');
  } else {
    icon.className = 'far fa-heart';
    btn.classList.remove('liked');
  }
}

// Audio events
audio.addEventListener('timeupdate', () => {
  document.getElementById('currentTimeLabel').textContent = formatTime(audio.currentTime);
  const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  document.getElementById('progressSlider').value = pct;
});
audio.addEventListener('loadedmetadata', () => {
  document.getElementById('durationLabel').textContent = formatTime(audio.duration);
});
audio.addEventListener('ended', () => {
  if (isRepeat) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } else {
    playNext();
  }
});

// Player controls
document.getElementById('playPauseBtn').addEventListener('click', togglePlayPause);
document.getElementById('nextBtn').addEventListener('click', playNext);
document.getElementById('prevBtn').addEventListener('click', playPrev);
document.getElementById('shuffleBtn').addEventListener('click', function() {
  isShuffle = !isShuffle;
  this.classList.toggle('active', isShuffle);
});
document.getElementById('repeatBtn').addEventListener('click', function() {
  isRepeat = !isRepeat;
  this.classList.toggle('active', isRepeat);
});
document.getElementById('progressSlider').addEventListener('input', function() {
  if (audio.duration) audio.currentTime = (this.value / 100) * audio.duration;
});
document.getElementById('volumeSlider').addEventListener('input', function() {
  audio.volume = this.value / 100;
  updateVolumeIcon();
});
document.getElementById('muteBtn').addEventListener('click', function() {
  if (audio.volume > 0) {
    audio.dataset.prevVol = audio.volume;
    audio.volume = 0;
    document.getElementById('volumeSlider').value = 0;
  } else {
    const prev = parseFloat(audio.dataset.prevVol) || 0.8;
    audio.volume = prev;
    document.getElementById('volumeSlider').value = prev * 100;
  }
  updateVolumeIcon();
});
function updateVolumeIcon() {
  const icon = document.getElementById('volumeIcon');
  if (audio.volume === 0) icon.className = 'fas fa-volume-mute';
  else if (audio.volume < 0.5) icon.className = 'fas fa-volume-down';
  else icon.className = 'fas fa-volume-up';
}
document.getElementById('playerLikeBtn').addEventListener('click', function() {
  if (currentTrackIndex === -1) return;
  const trackId = tracks[currentTrackIndex].id;
  if (likedTracks.has(trackId)) likedTracks.delete(trackId);
  else likedTracks.add(trackId);
  saveLikes();
  updateLikeButton();
});

// --- View Switching ---
function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(`view-${viewId}`);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll(`.nav-item[data-view="${viewId}"]`).forEach(n => n.classList.add('active'));

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
}

document.querySelectorAll('.nav-item[data-view]').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    showView(item.dataset.view);
  });
});
document.querySelectorAll('.section-seeall[data-view]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    showView(link.dataset.view);
  });
});

// Hero buttons
document.getElementById('heroPlayBtn').addEventListener('click', () => playTrack(0));
document.getElementById('heroExploreBtn').addEventListener('click', () => showView('search'));

// Mobile menu
document.getElementById('menuToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// --- Search ---
const searchInput = document.getElementById('searchInput');
const globalSearchInput = document.getElementById('globalSearchInput');

async function performSearch(query) {
  const q = (query || '').trim();
  const resultsEl = document.getElementById('searchResults');
  if (!q) {
    resultsEl.innerHTML = `
      <div class="search-empty-state">
        <i class="fas fa-music"></i>
        <h3>Search OkLuT</h3>
        <p>Type something to find your next favorite track.</p>
      </div>`;
    return;
  }
  resultsEl.innerHTML = `
    <div class="search-empty-state">
      <i class="fas fa-spinner fa-spin"></i>
      <h3>Searching...</h3>
      <p>Fetching from Jamendo.</p>
    </div>`;
  const results = await fetchJamendoTracks(q);
  if (results.length === 0) {
    resultsEl.innerHTML = `
      <div class="search-empty-state">
        <i class="fas fa-search"></i>
        <h3>No results found</h3>
        <p>Try different keywords.</p>
      </div>`;
    return;
  }
  // Replace current tracks with search results so play indices align
  tracks = results;
  populateHome();
  populateLibrary();
  const list = document.createElement('ul');
  list.className = 'search-result-list';
  results.forEach((t, idx) => {
    const li = document.createElement('li');
    li.className = 'search-result-item';
    li.innerHTML = `
      <img src="${t.cover}" alt="${t.title}">
      <div class="search-result-info">
        <div class="search-result-name">${t.title}</div>
        <div class="search-result-artist">${t.artist}</div>
      </div>
      <span class="search-result-duration">${formatTime(t.duration)}</span>
    `;
    li.addEventListener('click', () => playTrack(idx));
    list.appendChild(li);
  });
  resultsEl.innerHTML = '';
  resultsEl.appendChild(list);
}

if (searchInput) {
  searchInput.addEventListener('input', (e) => performSearch(e.target.value));
}
if (globalSearchInput) {
  globalSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      showView('search');
      if (searchInput) {
        searchInput.value = globalSearchInput.value;
        performSearch(globalSearchInput.value);
        searchInput.focus();
      }
    }
  });
}

// --- Auth (localStorage) ---
function getUser() {
  try {
    return JSON.parse(localStorage.getItem('oklut_user'));
  } catch {
    return null;
  }
}
function setUser(user) {
  if (user) localStorage.setItem('oklut_user', JSON.stringify(user));
  else localStorage.removeItem('oklut_user');
  updateAuthUI();
}
function updateAuthUI() {
  const user = getUser();
  const authArea = document.getElementById('authArea');
  const userArea = document.getElementById('userArea');
  const mobileLoginBtn = document.getElementById('mobileLoginBtn');
  if (user) {
    authArea.classList.add('hidden');
    userArea.classList.remove('hidden');
    if (mobileLoginBtn) mobileLoginBtn.style.display = 'none';
    const displayName = user.name || 'User';
    document.getElementById('topUserName').textContent = displayName;
    document.getElementById('sidebarUserName').textContent = displayName;
    const initials = displayName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('topAvatar').textContent = initials;
    document.getElementById('sidebarAvatar').textContent = initials;
  } else {
    authArea.classList.remove('hidden');
    userArea.classList.add('hidden');
    if (mobileLoginBtn) mobileLoginBtn.style.display = 'inline-block';
    document.getElementById('sidebarUserName').textContent = 'Guest';
    document.getElementById('topAvatar').textContent = 'G';
    document.getElementById('sidebarAvatar').textContent = 'G';
  }
}

// Modal helpers
function openModal(id) {
  document.getElementById(id).classList.add('show');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('show');
}

document.getElementById('openLoginBtn').addEventListener('click', () => openModal('loginModal'));
document.getElementById('openSignupBtn').addEventListener('click', () => openModal('signupModal'));
if (document.getElementById('mobileLoginBtn')) {
  document.getElementById('mobileLoginBtn').addEventListener('click', () => openModal('loginModal'));
}
document.getElementById('closeLoginModal').addEventListener('click', () => closeModal('loginModal'));
document.getElementById('closeSignupModal').addEventListener('click', () => closeModal('signupModal'));
document.getElementById('switchToSignup').addEventListener('click', (e) => {
  e.preventDefault();
  closeModal('loginModal');
  openModal('signupModal');
});
document.getElementById('switchToLogin').addEventListener('click', (e) => {
  e.preventDefault();
  closeModal('signupModal');
  openModal('loginModal');
});

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('show');
  });
});

// Login form
document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const name = email.split('@')[0] || 'User';
  setUser({ name, email });
  closeModal('loginModal');
  e.target.reset();
});
// Signup form
document.getElementById('signupForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('signupName').value.trim() || 'User';
  const email = document.getElementById('signupEmail').value.trim();
  setUser({ name, email });
  closeModal('signupModal');
  e.target.reset();
});
// Logout
document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  setUser(null);
  document.getElementById('dropdownMenu').classList.remove('show');
});
// User dropdown toggle
document.getElementById('userPill').addEventListener('click', () => {
  document.getElementById('dropdownMenu').classList.toggle('show');
});
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('userDropdown');
  if (dropdown && !dropdown.contains(e.target)) {
    document.getElementById('dropdownMenu').classList.remove('show');
  }
});

// --- Create Playlist (simple prompt) ---
document.getElementById('createPlaylistBtn').addEventListener('click', () => {
  const name = prompt('Playlist name:');
  if (name && name.trim()) {
    const newPl = {
      id: 'p' + Date.now(),
      title: name.trim(),
      desc: 'Made by you',
      cover: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop'
    };
    playlistsData.unshift(newPl);
    populateGrids();
    alert(`Playlist "${newPl.title}" created!`);
  }
});

// --- Init ---
async function initApp() {
  // Load initial tracks from Jamendo
  tracks = await fetchJamendoTracks('electronic');
  populateHome();
  populateGrids();
  populateLibrary();
  updateAuthUI();
  updateVolumeIcon();
}
initApp();