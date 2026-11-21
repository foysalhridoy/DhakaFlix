const express = require('express');
const cors = require('cors');
const cheerio = require('cheerio');
const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 3000;
const ISP_PORTAL = 'http://172.16.50.4/';

app.use(cors());
app.use(express.json());

// Request logger for debugging
app.use((req, res, next) => {
  if (!req.url.startsWith('/css') && !req.url.startsWith('/js') && !req.url.endsWith('.ico')) {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${decodeURIComponent(req.url)}`);
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// CACHING SYSTEM (IN-MEMORY + DISK PERSISTENCE)
// ============================================================

const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes for directory pages

function getCached(key) {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL) {
    return item.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  if (cache.size > 3000) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, { timestamp: Date.now(), data });
}

// Metadata Cache on disk
const METADATA_CACHE_FILE = path.join(__dirname, 'metadata_cache.json');
let metadataCache = {};
try {
  if (fs.existsSync(METADATA_CACHE_FILE)) {
    metadataCache = JSON.parse(fs.readFileSync(METADATA_CACHE_FILE, 'utf8'));
  }
} catch (e) {
  metadataCache = {};
}

function saveMetadataCache() {
  try {
    fs.writeFileSync(METADATA_CACHE_FILE, JSON.stringify(metadataCache, null, 2), 'utf8');
  } catch (e) {}
}

// Catalog Index Cache on disk
const CATALOG_CACHE_FILE = path.join(__dirname, 'catalog_cache.json');
let catalogIndex = [];
try {
  if (fs.existsSync(CATALOG_CACHE_FILE)) {
    catalogIndex = JSON.parse(fs.readFileSync(CATALOG_CACHE_FILE, 'utf8'));
    console.log(`📚 Loaded ${catalogIndex.length} indexed titles from catalog cache.`);
  }
} catch (e) {
  catalogIndex = [];
}

function saveCatalogCache() {
  try {
    fs.writeFileSync(CATALOG_CACHE_FILE, JSON.stringify(catalogIndex), 'utf8');
  } catch (e) {}
}

// ============================================================
// LOCATE VLC MEDIA PLAYER EXECUTABLE
// ============================================================

function findVlcExecutable() {
  const possiblePaths = [
    'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe',
    'C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Programs\\VideoLAN\\VLC\\vlc.exe')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return 'vlc'; // fallback to system PATH
}

// ============================================================
// COMPREHENSIVE DHAKAFLIX CATEGORIES
// ============================================================

const CATEGORIES = [
  // English Movies
  {
    id: 'eng-movies-2026',
    name: 'English Movies 2026',
    group: 'English Movies',
    icon: '🎬',
    badge: 'Latest',
    url: 'http://172.16.50.7/DHAKA-FLIX-7/English%20Movies/%282026%29/'
  },
  {
    id: 'eng-movies-2025',
    name: 'English Movies 2025',
    group: 'English Movies',
    icon: '🍿',
    badge: 'Popular',
    url: 'http://172.16.50.7/DHAKA-FLIX-7/English%20Movies/%282025%29/'
  },
  {
    id: 'eng-1080p',
    name: 'English Movies (1080p HD)',
    group: 'English Movies',
    icon: '✨',
    badge: '1080p',
    url: 'http://172.16.50.14/DHAKA-FLIX-14/English%20Movies%20%281080p%29/'
  },
  {
    id: 'eng-movies-all',
    name: 'English Movies (By Year)',
    group: 'English Movies',
    icon: '🎞️',
    url: 'http://172.16.50.7/DHAKA-FLIX-7/English%20Movies/'
  },

  // Hindi Movies
  {
    id: 'hindi-movies-2026',
    name: 'Hindi Movies 2026',
    group: 'Hindi Movies',
    icon: '🔥',
    badge: 'Latest',
    url: 'http://172.16.50.14/DHAKA-FLIX-14/Hindi%20Movies/%282026%29/'
  },
  {
    id: 'hindi-movies-2025',
    name: 'Hindi Movies 2025',
    group: 'Hindi Movies',
    icon: '🎥',
    url: 'http://172.16.50.14/DHAKA-FLIX-14/Hindi%20Movies/%282025%29/'
  },
  {
    id: 'hindi-movies-all',
    name: 'Hindi Movies (By Year)',
    group: 'Hindi Movies',
    icon: '🎭',
    url: 'http://172.16.50.14/DHAKA-FLIX-14/Hindi%20Movies/'
  },

  // South Indian Movies
  {
    id: 'south-hindi-dubbed',
    name: 'South Hindi Dubbed',
    group: 'South Movies',
    icon: '🎙️',
    badge: 'Dubbed',
    url: 'http://172.16.50.14/DHAKA-FLIX-14/SOUTH%20INDIAN%20MOVIES/Hindi%20Dubbed/'
  },
  {
    id: 'south-movies',
    name: 'South Indian Movies',
    group: 'South Movies',
    icon: '⚡',
    url: 'http://172.16.50.14/DHAKA-FLIX-14/SOUTH%20INDIAN%20MOVIES/South%20Movies/'
  },

  // Bangla Movies
  {
    id: 'kolkata-bangla',
    name: 'Kolkata Bangla Movies',
    group: 'Bangla Movies',
    icon: '🇧🇩',
    url: 'http://172.16.50.7/DHAKA-FLIX-7/Kolkata%20Bangla%20Movies/'
  },
  {
    id: 'satyajit-ray',
    name: 'Satyajit Ray Classics',
    group: 'Bangla Movies',
    icon: '📽️',
    badge: 'Classic',
    url: 'http://172.16.50.7/DHAKA-FLIX-7/Kolkata%20Bangla%20Movies/Satyajit%20Ray%20Films/'
  },

  // Animation Movies
  {
    id: 'animation-movies',
    name: 'Animation Movies',
    group: 'Animation',
    icon: '🎨',
    url: 'http://172.16.50.14/DHAKA-FLIX-14/Animation%20Movies/'
  },
  {
    id: 'animation-1080p',
    name: 'Animation Movies (1080p)',
    group: 'Animation',
    icon: '🦁',
    badge: '1080p',
    url: 'http://172.16.50.14/DHAKA-FLIX-14/Animation%20Movies%20%281080p%29/'
  },

  // Other Cinema
  {
    id: 'foreign-movies',
    name: 'Foreign Language Movies',
    group: 'Other Cinema',
    icon: '🌍',
    url: 'http://172.16.50.7/DHAKA-FLIX-7/Foreign%20Language%20Movies/'
  },
  {
    id: 'imdb-top250',
    name: 'IMDb Top-250 Movies',
    group: 'Special Collections',
    icon: '🏆',
    badge: 'Top Rated',
    url: 'http://172.16.50.14/DHAKA-FLIX-14/IMDb%20Top-250%20Movies/'
  },
  {
    id: '3d-movies',
    name: '3D Movies',
    group: 'Special Collections',
    icon: '👓',
    badge: '3D',
    url: 'http://172.16.50.7/DHAKA-FLIX-7/3D%20Movies/'
  },

  // TV & Web Series
  {
    id: 'tv-series-0-9',
    name: 'TV Series (0 - 9)',
    group: 'TV & Web Series',
    icon: '📺',
    url: 'http://172.16.50.12/DHAKA-FLIX-12/TV-WEB-Series/TV%20Series%20%E2%98%85%20%200%20%20%E2%80%94%20%209/'
  },
  {
    id: 'tv-series-a-l',
    name: 'TV Series (A - L)',
    group: 'TV & Web Series',
    icon: '📺',
    url: 'http://172.16.50.12/DHAKA-FLIX-12/TV-WEB-Series/TV%20Series%20%E2%99%A5%20%20A%20%20%E2%80%94%20%20L/'
  },
  {
    id: 'tv-series-m-r',
    name: 'TV Series (M - R)',
    group: 'TV & Web Series',
    icon: '📺',
    url: 'http://172.16.50.12/DHAKA-FLIX-12/TV-WEB-Series/TV%20Series%20%E2%99%A6%20%20M%20%20%E2%80%94%20%20R/'
  },
  {
    id: 'tv-series-s-z',
    name: 'TV Series (S - Z)',
    group: 'TV & Web Series',
    icon: '📺',
    url: 'http://172.16.50.12/DHAKA-FLIX-12/TV-WEB-Series/TV%20Series%20%E2%99%A6%20%20S%20%20%E2%80%94%20%20Z/'
  },
  {
    id: 'tv-web-series-all',
    name: 'All TV & Web Series',
    group: 'TV & Web Series',
    icon: '📺',
    url: 'http://172.16.50.12/DHAKA-FLIX-12/TV-WEB-Series/'
  },
  {
    id: 'korean-series',
    name: 'Korean TV & Drama (760+ Shows)',
    group: 'TV & Web Series',
    icon: '🇰🇷',
    badge: 'K-Drama',
    url: 'http://172.16.50.14/DHAKA-FLIX-14/KOREAN%20TV%20%26%20WEB%20Series/'
  },
  {
    id: 'cartoon-series',
    name: 'Anime & Cartoon TV Series',
    group: 'TV & Web Series',
    icon: '👾',
    url: 'http://172.16.50.10/DHAKA-FLIX-10/Anime%20%26%20Cartoon%20TV%20Series/'
  },

  // Shows & Specials
  {
    id: 'documentary',
    name: 'Documentaries',
    group: 'Shows & Sports',
    icon: '📜',
    url: 'http://172.16.50.10/DHAKA-FLIX-10/Documentary/'
  },
  {
    id: 'wwe-aew',
    name: 'WWE & AEW Wrestling',
    group: 'Shows & Sports',
    icon: '🥊',
    url: 'http://172.16.50.10/DHAKA-FLIX-10/WWE%20%26%20AEW%20Wrestling/'
  },
  {
    id: 'awards-tvshows',
    name: 'Awards & TV Shows',
    group: 'Shows & Sports',
    icon: '🏆',
    url: 'http://172.16.50.10/DHAKA-FLIX-10/Awards%20%26%20TV%20Shows/'
  },

  // Games & Software
  {
    id: 'pc-games',
    name: 'PC Games',
    group: 'Games & Apps',
    icon: '🎮',
    url: 'http://172.16.50.8/DHAKA-FLIX-8/PC%20Games/'
  },
  {
    id: 'android-games',
    name: 'Android Games',
    group: 'Games & Apps',
    icon: '📱',
    url: 'http://172.16.50.8/DHAKA-FLIX-8/Android%20Games/'
  },
  {
    id: 'console-games',
    name: 'Console Games',
    group: 'Games & Apps',
    icon: '🕹️',
    url: 'http://172.16.50.8/DHAKA-FLIX-8/Console%20Games/'
  },
  {
    id: 'software',
    name: 'Software',
    group: 'Games & Apps',
    icon: '💻',
    url: 'http://172.16.50.8/DHAKA-FLIX-8/Software/'
  },
  {
    id: 'tutorial',
    name: 'Tutorials & Training',
    group: 'Games & Apps',
    icon: '📚',
    url: 'http://172.16.50.10/DHAKA-FLIX-10/Tutorial/'
  }
];

// Helper: fetch HTML from URL with timeout
async function fetchHtml(targetUrl) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DhakaFlix-Cinema/2.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from ${targetUrl}`);
    }
    return await res.text();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// Media file extensions
const VIDEO_EXTS = new Set(['.mkv', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.ts', '.3gp']);
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg']);
const SUBTITLE_EXTS = new Set(['.srt', '.vtt', '.sub', '.ass', '.ssa']);
const AUDIO_EXTS = new Set(['.mp3', '.aac', '.flac', '.wav', '.ogg', '.m4a', '.wma']);
const ARCHIVE_EXTS = new Set(['.zip', '.rar', '.7z', '.tar', '.gz', '.iso']);

// ============================================================
// MEDIA TITLE & EPISODE PARSER
// ============================================================

function cleanMediaInfo(rawName) {
  if (!rawName) return { title: '', year: '', type: 'movie' };

  let name = rawName.replace(/\.(mkv|mp4|avi|mov|wmv|webm|m4v|ts)$/i, '');
  const isSeries = /(?:tv series|tv mini series|s\d+e\d+|season\s*\d+|s0\d+|complete season)/i.test(name);

  // Extract year
  const yearMatch = name.match(/[\(\s\.\[](19\d\d|20\d\d)[\)\s\.\]]/);
  const year = yearMatch ? yearMatch[1] : '';

  // Clean title by stripping noisy tags
  let title = name
    .replace(/\((?:tv series|tv mini series).*?\)/i, '')
    .replace(/\((?:19\d\d|20\d\d).*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/(?:1080p|720p|480p|2160p|4k|bluray|bdrip|web-dl|webrip|web|hdtv|nf|amzn|dsnp|hevc|x264|x265|aac5\.1|aac|dts|dd5\.1|dual audio|multi audio)/gi, '')
    .replace(/[._]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    title: title || rawName,
    year,
    type: isSeries ? 'series' : 'movie'
  };
}

function parseEpisodeInfo(filename) {
  const sMatch = filename.match(/s(\d+)e(\d+)/i) || filename.match(/(\d+)x(\d+)/i);
  let season = 1;
  let episode = 1;
  if (sMatch) {
    season = parseInt(sMatch[1], 10);
    episode = parseInt(sMatch[2], 10);
  } else {
    const eMatch = filename.match(/(?:ep|episode)[._\s-]*(\d+)/i);
    if (eMatch) episode = parseInt(eMatch[1], 10);
  }

  let episodeTitle = '';
  const titleMatch = filename.match(/s\d+e\d+[._\s-]+(.*?)(?:[._\s-]+(?:1080p|720p|480p|2160p|4k|web|bluray|x264|x265|hevc|aac|dual))/i);
  if (titleMatch && titleMatch[1]) {
    episodeTitle = titleMatch[1].replace(/[._]/g, ' ').trim();
  }

  const sPad = String(season).padStart(2, '0');
  const ePad = String(episode).padStart(2, '0');
  const label = episodeTitle ? `S${sPad}E${ePad} - ${episodeTitle}` : `S${sPad}E${ePad}`;

  return { season, episode, episodeTitle, label };
}

function parseFileInfo(fileName) {
  const extMatch = fileName.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? '.' + extMatch[1].toLowerCase() : '';

  let type = 'file';
  if (VIDEO_EXTS.has(ext)) type = 'video';
  else if (IMAGE_EXTS.has(ext)) type = 'image';
  else if (SUBTITLE_EXTS.has(ext)) type = 'subtitle';
  else if (AUDIO_EXTS.has(ext)) type = 'audio';
  else if (ARCHIVE_EXTS.has(ext)) type = 'archive';

  const tags = [];
  const lower = fileName.toLowerCase();

  if (lower.includes('2160p') || lower.includes('4k')) tags.push('4K');
  else if (lower.includes('1080p')) tags.push('1080p');
  else if (lower.includes('720p')) tags.push('720p');
  else if (lower.includes('480p')) tags.push('480p');

  if (lower.includes('dual audio') || lower.includes('dual')) tags.push('Dual Audio');
  if (lower.includes('multi audio')) tags.push('Multi Audio');
  if (lower.includes('hindi')) tags.push('Hindi');
  if (lower.includes('english')) tags.push('English');
  if (lower.includes('bangla')) tags.push('Bangla');

  if (lower.includes('nf') || lower.includes('netflix')) tags.push('Netflix');
  if (lower.includes('amzn') || lower.includes('amazon') || lower.includes('prime')) tags.push('Prime');
  if (lower.includes('dsnp') || lower.includes('disney')) tags.push('Disney+');
  if (lower.includes('web-dl') || lower.includes('webrip') || lower.includes('web')) tags.push('WEB');
  if (lower.includes('bluray') || lower.includes('bdrip')) tags.push('BluRay');

  const { title, year, type: mediaType } = cleanMediaInfo(fileName);

  return { ext, type, tags, year, cleanTitle: title, mediaType };
}

// Parse h5ai directory HTML
function parseDirectoryHtml(html, currentUrl) {
  const $ = cheerio.load(html);
  const parsedUrl = new URL(currentUrl);
  const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;

  const folders = [];
  const files = [];
  let parentUrl = null;

  $('div#fallback table tr, table tr').each((_, tr) => {
    const $tr = $(tr);
    const $link = $tr.find('td.fb-n a');
    if (!$link.length) return;

    const href = $link.attr('href') || '';
    const rawName = $link.text().trim();
    const date = $tr.find('td.fb-d').text().trim();
    const size = $tr.find('td.fb-s').text().trim();
    const alt = ($tr.find('td.fb-i img').attr('alt') || '').toLowerCase();

    if (href === '..' || href === '../' || alt === 'folder-parent' || rawName === 'Parent Directory') {
      try {
        parentUrl = new URL(href, currentUrl).href;
      } catch (e) {
        const pathSegments = parsedUrl.pathname.replace(/\/$/, '').split('/');
        if (pathSegments.length > 2) {
          pathSegments.pop();
          parentUrl = `${baseUrl}${pathSegments.join('/')}/`;
        }
      }
      return;
    }

    let fullUrl = '';
    try {
      fullUrl = new URL(href, currentUrl).href;
    } catch (e) {
      fullUrl = href.startsWith('http') ? href : `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`;
    }

    const isFolder = alt === 'folder' || href.endsWith('/') || !size;

    if (isFolder) {
      const { tags, year, cleanTitle, mediaType } = parseFileInfo(rawName);
      folders.push({
        name: rawName,
        url: fullUrl,
        type: 'folder',
        date,
        tags,
        year,
        cleanTitle,
        mediaType
      });
    } else {
      const { ext, type, tags, year, cleanTitle } = parseFileInfo(rawName);
      files.push({
        name: rawName,
        url: fullUrl,
        type,
        ext,
        size,
        date,
        tags,
        year,
        cleanTitle
      });
    }
  });

  const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ name: 'Home', url: '' }];
  let cumPath = '';
  pathSegments.forEach(seg => {
    cumPath += '/' + seg;
    breadcrumbs.push({
      name: decodeURIComponent(seg),
      url: `${baseUrl}${cumPath}/`
    });
  });

  return {
    currentUrl,
    host: parsedUrl.host,
    pathname: parsedUrl.pathname,
    breadcrumbs,
    parentUrl,
    folders,
    files
  };
}

// ============================================================
// TMDB METADATA INTEGRATION
// ============================================================

async function fetchTmdbMetadata(title, year, type = 'movie') {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || !title) return null;

  const cacheKey = `tmdb:${type}:${title}:${year || ''}`.toLowerCase();
  if (metadataCache[cacheKey]) {
    return metadataCache[cacheKey];
  }

  try {
    const endpoint = type === 'series' ? 'search/tv' : 'search/movie';
    let tmdbUrl = `https://api.themoviedb.org/3/${endpoint}?api_key=${apiKey}&query=${encodeURIComponent(title)}`;
    if (year) {
      tmdbUrl += type === 'series' ? `&first_air_date_year=${year}` : `&primary_release_year=${year}`;
    }

    const res = await fetch(tmdbUrl, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const match = data.results[0];
      const result = {
        title: match.title || match.name,
        overview: match.overview,
        rating: match.vote_average ? match.vote_average.toFixed(1) : null,
        releaseDate: match.release_date || match.first_air_date,
        poster: match.poster_path ? `https://image.tmdb.org/t/p/w500${match.poster_path}` : null,
        backdrop: match.backdrop_path ? `https://image.tmdb.org/t/p/w1280${match.backdrop_path}` : null
      };

      metadataCache[cacheKey] = result;
      saveMetadataCache();
      return result;
    }
  } catch (err) {
    console.warn('TMDB lookup failed:', err.message);
  }
  return null;
}

// ============================================================
// BACKGROUND CATALOG INDEXER (COMPLETE CATALOG DISCOVERY)
// ============================================================

let isIndexing = false;

async function scanCategoryToCatalog(category) {
  try {
    const html = await fetchHtml(category.url);
    const data = parseDirectoryHtml(html, category.url);

    let addedCount = 0;
    for (const folder of data.folders) {
      // Check if title is already indexed
      const exists = catalogIndex.some(item => item.url === folder.url);
      if (!exists) {
        const { title, year, type } = cleanMediaInfo(folder.name);
        catalogIndex.push({
          id: folder.url,
          name: folder.name,
          cleanTitle: title,
          year: year || folder.year,
          category: category.name,
          group: category.group,
          url: folder.url,
          type: type || 'movie',
          posterUrl: `${folder.url}a_AL_.jpg`,
          date: folder.date
        });
        addedCount++;
      }
    }
    return addedCount;
  } catch (err) {
    return 0;
  }
}

async function runCatalogDiscovery() {
  if (isIndexing) return;
  isIndexing = true;
  console.log('🔄 Starting complete catalog discovery scan...');

  let totalNew = 0;
  for (const cat of CATEGORIES) {
    // Skip general parent directories like "All Years" to avoid indexing index-folders
    if (cat.name.includes('(By Year)') || cat.name === 'All TV & Web Series') continue;

    const count = await scanCategoryToCatalog(cat);
    totalNew += count;
    // Small delay to be gentle on ISP node
    await new Promise(r => setTimeout(r, 80));
  }

  saveCatalogCache();
  isIndexing = false;
  console.log(`✅ Catalog discovery complete! Total indexed: ${catalogIndex.length} titles (+${totalNew} new).`);
}

// Run initial catalog discovery after 3 seconds
setTimeout(runCatalogDiscovery, 3000);

// ============================================================
// API ROUTES
// ============================================================

// API: List categories
app.get('/api/categories', (req, res) => {
  res.json({ success: true, categories: CATEGORIES });
});

// API: Browse any directory
app.get('/api/browse', async (req, res) => {
  const targetUrl = req.query.url || CATEGORIES[0].url;

  const cached = getCached(targetUrl);
  if (cached) {
    return res.json({ success: true, fromCache: true, ...cached });
  }

  try {
    const html = await fetchHtml(targetUrl);
    const data = parseDirectoryHtml(html, targetUrl);
    setCache(targetUrl, data);
    res.json({ success: true, fromCache: false, ...data });
  } catch (err) {
    console.error('Browse error:', err.message);
    res.status(500).json({
      success: false,
      error: `Could not connect to ISP FTP node: ${err.message}`,
      targetUrl
    });
  }
});

// API: Deep Resolve for Movie or TV Series (Seasons, Episodes, Artwork, Metadata)
app.get('/api/resolve', async (req, res) => {
  const folderUrl = req.query.url;
  if (!folderUrl) {
    return res.status(400).json({ success: false, error: 'URL required' });
  }

  const cacheKey = `resolve:${folderUrl}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return res.json({ success: true, fromCache: true, ...cached });
  }

  try {
    const html = await fetchHtml(folderUrl);
    const data = parseDirectoryHtml(html, folderUrl);

    const videoFiles = data.files.filter(f => f.type === 'video');
    const imageFiles = data.files.filter(f => f.type === 'image');
    const subtitleFiles = data.files.filter(f => f.type === 'subtitle');

    // Artwork check on server
    let poster = `${folderUrl}a_AL_.jpg`;
    if (imageFiles.length > 0) {
      const bestImage = imageFiles.find(img => img.name.includes('a_AL_') || img.name.toLowerCase().includes('poster')) || imageFiles[0];
      poster = bestImage.url;
    }

    let backdrop = null;
    if (imageFiles.length > 0) {
      const bestBackdrop = imageFiles.find(img => img.name.includes('a_VL_') || img.name.toLowerCase().includes('backdrop') || img.name.toLowerCase().includes('fanart'));
      if (bestBackdrop) backdrop = bestBackdrop.url;
    }

    const rawFolderName = decodeURIComponent(data.pathname.replace(/\/$/, '').split('/').pop() || '');
    const { title: cleanTitle, year, type: detectedType } = cleanMediaInfo(rawFolderName);

    // Check if folder contains seasons or episodes (TV Series)
    const seasonFolders = data.folders.filter(f => /season\s*\d+|s\d+|complete season/i.test(f.name));
    let isSeries = seasonFolders.length > 0 || detectedType === 'series';
    let seasons = [];
    let allEpisodes = [];

    if (seasonFolders.length > 0) {
      isSeries = true;
      // Sort season folders (Season 1, Season 2, etc.)
      seasonFolders.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

      // Deduplicate season folders if both S01 and Season 1 exist
      const seenSeasonNums = new Set();
      const uniqueSeasonFolders = [];
      seasonFolders.forEach(sf => {
        const sMatch = sf.name.match(/(?:season|s)\s*(\d+)/i);
        const sNum = sMatch ? parseInt(sMatch[1], 10) : sf.name;
        if (!seenSeasonNums.has(sNum)) {
          seenSeasonNums.add(sNum);
          uniqueSeasonFolders.push({ folder: sf, seasonNum: typeof sNum === 'number' ? sNum : 1 });
        }
      });

      for (const item of uniqueSeasonFolders) {
        const sf = item.folder;
        try {
          const sHtml = await fetchHtml(sf.url);
          const sData = parseDirectoryHtml(sHtml, sf.url);
          const epVideos = sData.files.filter(f => f.type === 'video');
          epVideos.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

          const parsedEpisodes = epVideos.map(ep => {
            const epInfo = parseEpisodeInfo(ep.name);
            return {
              name: ep.name,
              cleanTitle: epInfo.label,
              url: ep.url,
              size: ep.size,
              date: ep.date,
              season: epInfo.season || item.seasonNum,
              episode: epInfo.episode,
              type: 'video'
            };
          });

          seasons.push({
            name: sf.name,
            seasonNumber: item.seasonNum,
            url: sf.url,
            episodes: parsedEpisodes
          });
          allEpisodes.push(...parsedEpisodes);
        } catch (e) {}
      }
    } else if (detectedType === 'series' || (videoFiles.length > 1 && videoFiles.some(v => /s\d+e\d+|ep\d+|episode/i.test(v.name)))) {
      // Single-season series with episodes directly in the folder
      isSeries = true;
      videoFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
      const parsedEpisodes = videoFiles.map(ep => {
        const epInfo = parseEpisodeInfo(ep.name);
        return {
          name: ep.name,
          cleanTitle: epInfo.label,
          url: ep.url,
          size: ep.size,
          date: ep.date,
          season: epInfo.season || 1,
          episode: epInfo.episode,
          type: 'video'
        };
      });

      seasons.push({
        name: 'Season 1',
        seasonNumber: 1,
        url: folderUrl,
        episodes: parsedEpisodes
      });
      allEpisodes = parsedEpisodes;
    }

    const primaryVideo = videoFiles.length > 0 ? videoFiles[0] : (allEpisodes.length > 0 ? allEpisodes[0] : null);

    // Optional TMDB enhancement
    const tmdbData = await fetchTmdbMetadata(cleanTitle, year, isSeries ? 'series' : 'movie');
    if (tmdbData) {
      if (!backdrop && tmdbData.backdrop) backdrop = tmdbData.backdrop;
    }

    const result = {
      folderUrl,
      title: cleanTitle || decodeURIComponent(folderUrl.replace(/\/$/, '').split('/').pop() || 'Media'),
      rawTitle: decodeURIComponent(folderUrl.replace(/\/$/, '').split('/').pop() || 'Media'),
      year,
      isSeries,
      poster,
      backdrop: backdrop || poster,
      primaryVideo,
      videos: videoFiles.length > 0 ? videoFiles : allEpisodes,
      seasons,
      subtitles: subtitleFiles,
      allFiles: data.files,
      subfolders: data.folders,
      tmdb: tmdbData || null
    };

    setCache(cacheKey, result);
    res.json({ success: true, fromCache: false, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Search across the COMPLETE catalog
app.get('/api/search', async (req, res) => {
  const query = (req.query.q || '').trim().toLowerCase();
  if (!query) {
    return res.json({ success: true, results: [] });
  }

  // Instant in-memory search across complete indexed catalog
  const terms = query.split(/\s+/).filter(Boolean);
  const matches = catalogIndex.filter(item => {
    const hay = `${item.name} ${item.cleanTitle} ${item.year || ''} ${item.category || ''}`.toLowerCase();
    return terms.every(term => hay.includes(term));
  });

  // If indexed catalog has matches, return top 100
  if (matches.length > 0) {
    return res.json({
      success: true,
      total: matches.length,
      fromIndex: true,
      results: matches.slice(0, 100)
    });
  }

  // Fallback: live search across top categories if catalog index was not yet populated
  try {
    const targetUrls = [
      CATEGORIES[0].url,
      CATEGORIES[4].url,
      CATEGORIES[7].url,
      CATEGORIES[16].url
    ];

    const results = [];
    for (const url of targetUrls) {
      try {
        const cached = getCached(url) || parseDirectoryHtml(await fetchHtml(url), url);
        setCache(url, cached);

        cached.folders.forEach(f => {
          if (f.name.toLowerCase().includes(query)) results.push({ ...f, parentUrl: url });
        });
        cached.files.forEach(f => {
          if (f.name.toLowerCase().includes(query)) results.push({ ...f, parentUrl: url });
        });
      } catch (e) {}
    }

    res.json({ success: true, total: results.length, fromIndex: false, results: results.slice(0, 50) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Catalog with pagination and category filtering
app.get('/api/catalog', (req, res) => {
  const category = (req.query.category || '').toLowerCase();
  const type = (req.query.type || '').toLowerCase(); // 'movie' or 'series'
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));

  let filtered = catalogIndex;
  if (category) {
    filtered = filtered.filter(item => item.category.toLowerCase().includes(category) || item.group.toLowerCase().includes(category));
  }
  if (type) {
    filtered = filtered.filter(item => item.type === type);
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const results = filtered.slice(start, start + limit);

  res.json({
    success: true,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    results
  });
});

// API: Trigger full catalog refresh in background
app.post('/api/refresh-catalog', (req, res) => {
  runCatalogDiscovery();
  res.json({ success: true, message: 'Catalog indexing started in background', currentIndexCount: catalogIndex.length });
});

// API: DIRECT VLC LAUNCHER (Executes VLC directly on Windows without browser popups!)
app.get('/api/open-vlc', (req, res) => {
  const streamUrl = req.query.url;
  if (!streamUrl) {
    return res.status(400).json({ success: false, error: 'Stream URL is required' });
  }

  const vlcPath = findVlcExecutable();

  try {
    const child = spawn(vlcPath, [
      streamUrl,
      '--network-caching=800',
      '--no-video-title-show'
    ], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();

    console.log(`🎬 VLC launched for stream: ${streamUrl}`);
    res.json({
      success: true,
      message: 'VLC Media Player launched successfully!',
      streamUrl,
      vlcPath
    });
  } catch (err) {
    console.error('Failed to spawn VLC:', err.message);
    res.status(500).json({
      success: false,
      error: `Could not launch VLC: ${err.message}. Please use the .M3U download option.`,
      vlcPath
    });
  }
});

// API: Generate and download VLC .m3u playlist
app.get('/api/vlc.m3u', (req, res) => {
  const streamUrl = req.query.url;
  const rawTitle = req.query.name || 'DhakaFlix_Stream';
  const cleanTitle = rawTitle.replace(/[\\/:*?"<>|]/g, '_');

  if (!streamUrl) {
    return res.status(400).send('Stream URL required');
  }

  const m3uContent = `#EXTM3U
#EXTINF:-1 tvg-name="${cleanTitle}" group-title="DhakaFlix",${cleanTitle}
${streamUrl}
`;

  res.setHeader('Content-Type', 'audio/x-mpegurl; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(cleanTitle)}.m3u"`);
  res.send(m3uContent);
});

// API: Stream Proxy with Range Request support (HTTP 206 Seeking)
app.get('/api/stream', (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send('Stream URL required');
  }

  try {
    const urlObj = new URL(targetUrl);
    const headers = {
      'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
      'Accept': '*/*'
    };

    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const client = urlObj.protocol === 'https:' ? https : http;

    const proxyReq = client.request(targetUrl, { headers }, (proxyRes) => {
      res.status(proxyRes.statusCode);

      let contentType = proxyRes.headers['content-type'] || 'video/mp4';
      if (contentType === 'application/octet-stream') {
        if (targetUrl.endsWith('.mkv')) contentType = 'video/x-matroska';
        else if (targetUrl.endsWith('.webm')) contentType = 'video/webm';
        else contentType = 'video/mp4';
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (proxyRes.headers['content-range']) {
        res.setHeader('Content-Range', proxyRes.headers['content-range']);
      }
      if (proxyRes.headers['content-length']) {
        res.setHeader('Content-Length', proxyRes.headers['content-length']);
      }

      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy stream error:', err.message);
      if (!res.headersSent) {
        res.status(502).send('Error connecting to video stream');
      }
    });

    req.on('close', () => {
      proxyReq.destroy();
    });

    proxyReq.end();
  } catch (err) {
    res.status(400).send('Invalid stream URL: ' + err.message);
  }
});

// Fallback to index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🎬 DhakaFlix Media Platform is live!`);
  console.log(`🌐 Local Web:    http://localhost:${PORT}`);
  console.log(`📱 ISP Server:   ${ISP_PORTAL}`);
  console.log(`🍿 VLC Player:   ${findVlcExecutable()}`);
  console.log(`====================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
  } else {
    console.error('Server error:', err);
  }
});
