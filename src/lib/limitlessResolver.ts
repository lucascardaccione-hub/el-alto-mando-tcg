// In-memory cache: "SET:NUM" -> "IMAGE_URL"
let memoryCache: Map<string, string> | null = null;

function loadCache(): Map<string, string> {
  if (memoryCache) return memoryCache;
  memoryCache = new Map<string, string>();

  if (typeof window === 'undefined') {
    try {
      const fs = require('fs');
      const path = require('path');
      const cacheFile = path.join(process.cwd(), 'data', 'limitless_cards_cache.json');
      if (fs.existsSync(cacheFile)) {
        const raw = fs.readFileSync(cacheFile, 'utf8');
        const obj = JSON.parse(raw);
        for (const [k, v] of Object.entries(obj)) {
          if (typeof v === 'string') {
            memoryCache.set(k.toUpperCase(), v);
          }
        }
      }
    } catch (e) {
      console.error('Error loading Limitless cache:', e);
    }
  }

  return memoryCache;
}

function saveCache() {
  if (!memoryCache || typeof window !== 'undefined') return;
  try {
    const fs = require('fs');
    const path = require('path');
    const cacheFile = path.join(process.cwd(), 'data', 'limitless_cards_cache.json');
    const dataDir = path.dirname(cacheFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const obj: Record<string, string> = {};
    memoryCache.forEach((v, k) => {
      obj[k] = v;
    });
    fs.writeFileSync(cacheFile, JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving Limitless cache:', e);
  }
}

export function getLimitlessSetCode(set: string): string {
  const upper = (set || '').toUpperCase().trim();
  if (upper === 'PR-SW' || upper === 'SWSHP') return 'SP';
  if (upper === 'PR-SV' || upper === 'SVP') return 'SVP';
  if (upper === 'PR-SM' || upper === 'SMP') return 'SMP';
  if (upper === 'PR-XY' || upper === 'XYP') return 'XYP';
  if (upper === 'PR-BW' || upper === 'BWP') return 'BWP';
  return upper;
}

/**
 * Synchronous cache lookup (0ms)
 */
export function getLimitlessCardImageSync(set: string, number: string): string | null {
  const cache = loadCache();
  const limitlessSet = getLimitlessSetCode(set);
  const cleanNum = (number || '').replace(/^0+/, '');
  const key = `${limitlessSet}:${cleanNum}`;
  return cache.get(key) || null;
}

/**
 * Async resolver with direct CDN candidate check and limitlesstcg.com fallback
 */
export async function resolveLimitlessCardImage(set: string, number: string): Promise<string | null> {
  const cache = loadCache();
  const limitlessSet = getLimitlessSetCode(set);
  const cleanNum = (number || '').replace(/^0+/, '');
  const key = `${limitlessSet}:${cleanNum}`;

  if (cache.has(key)) {
    return cache.get(key) || null;
  }

  const paddedNum = cleanNum.padStart(3, '0');

  // Direct CDN candidates
  const cdnCandidates = [
    `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/${limitlessSet}/${limitlessSet}_${paddedNum}_R_EN_SM.png`,
    `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/${limitlessSet}/${limitlessSet}_${cleanNum}_R_EN_SM.png`,
    `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/${limitlessSet}/${limitlessSet}_${paddedNum}_R_EN.png`,
    `https://limitless3.nyc3.cdn.digitaloceanspaces.com/tpci/${limitlessSet}/${limitlessSet}_${paddedNum}_R_EN_SM.png`
  ];

  for (const cdnUrl of cdnCandidates) {
    try {
      const headRes = await fetch(cdnUrl, { method: 'HEAD' });
      if (headRes.ok) {
        cache.set(key, cdnUrl);
        saveCache();
        return cdnUrl;
      }
    } catch (_) {}
  }

  // Scrape page if direct candidates didn't hit
  try {
    const pageUrl = `https://limitlesstcg.com/cards/${limitlessSet}/${cleanNum}`;
    const pageRes = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (pageRes.ok) {
      const html = await pageRes.text();
      const match = html.match(/<meta property=["']og:image["'] content=["']([^"']+)["']/i);
      if (match && match[1]) {
        const imgUrl = match[1];
        cache.set(key, imgUrl);
        saveCache();
        return imgUrl;
      }
    }
  } catch (_) {}

  return null;
}
