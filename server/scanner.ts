import { parseFile } from 'music-metadata';
import fg from 'fast-glob';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export interface TrackMetadata {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  path: string;
  fileName: string;
  hasCover: boolean;
  externalCoverUrl?: string;
}

const MUSIC_DIR = path.resolve(process.cwd(), 'Download');

// 扫描缓存
let trackCache: TrackMetadata[] = [];

export async function scanLibrary() {
  console.log('Scanning library in:', MUSIC_DIR);
  
  if (!fs.existsSync(MUSIC_DIR)) {
    console.warn('Music directory not found, creating one...');
    fs.mkdirSync(MUSIC_DIR, { recursive: true });
  }

  const files = await fg(['**/*.{mp3,m4a,wav,flac}'], { cwd: MUSIC_DIR, absolute: true });
  console.log(`Found ${files.length} audio files.`);

  const newCache: TrackMetadata[] = [];

  for (const file of files) {
    try {
      const metadata = await parseFile(file);
      const id = crypto.createHash('md5').update(file).digest('hex');
      
      newCache.push({
        id,
        title: metadata.common.title || path.basename(file),
        artist: metadata.common.artist || 'Unknown Artist',
        album: metadata.common.album || 'Unknown Album',
        duration: metadata.format.duration || 0,
        path: file,
        fileName: path.basename(file),
        hasCover: !!metadata.common.picture && metadata.common.picture.length > 0
      });
    } catch (err) {
      console.error(`Failed to parse ${file}:`, err);
    }
  }

  trackCache = newCache;
  return trackCache;
}

export function getTrackList() {
  return trackCache;
}

export function getTrackById(id: string) {
  return trackCache.find(t => t.id === id);
}

export async function getTrackCover(id: string) {
  const track = getTrackById(id);
  if (!track) return null;

  try {
    const metadata = await parseFile(track.path);
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      return metadata.common.picture[0];
    }
  } catch (err) {
    console.error(`Failed to get cover for ${id}:`, err);
  }
  return null;
}

export function updateTrackMetadata(id: string, updates: Partial<TrackMetadata>) {
  const index = trackCache.findIndex(t => t.id === id);
  if (index !== -1) {
    trackCache[index] = { ...trackCache[index], ...updates };
    return trackCache[index];
  }
  return null;
}
