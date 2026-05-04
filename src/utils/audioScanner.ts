import * as mm from 'music-metadata-browser';
import { Track } from '../types';

export async function processFiles(files: FileList | File[]): Promise<Track[]> {
  const tracks: Track[] = [];
  const fileArray = Array.from(files);

  for (const file of fileArray) {
    if (file.name.match(/\.(mp3|wav|ogg|m4a|flac)$/i)) {
      try {
        const metadata = await mm.parseBlob(file);
        
        // Extract lyrics if they exist (common tags: USLT, LYRICS, etc)
        const lyrics = metadata.common.lyrics?.join('\n') || 
                       (metadata.native as any)?.['ID3v2.3']?.find((f: any) => f.id === 'USLT')?.value?.text ||
                       (metadata.native as any)?.['ID3v2.4']?.find((f: any) => f.id === 'USLT')?.value?.text;

        const track: Track = {
          id: crypto.randomUUID(),
          title: metadata.common.title || file.name.replace(/\.[^/.]+$/, ""),
          artist: metadata.common.artist || "Unknown Artist",
          album: metadata.common.album || "Unknown Album",
          year: metadata.common.year,
          trackNo: metadata.common.track.no || undefined,
          diskNo: metadata.common.disk.no || undefined,
          duration: metadata.format.duration || 0,
          path: (file as any).webkitRelativePath || file.name,
          file: file,
          lyrics: lyrics,
          coverBlob: metadata.common.picture?.[0] ? 
            new Blob([metadata.common.picture[0].data], { type: metadata.common.picture[0].format }) 
            : undefined
        };
        tracks.push(track);
      } catch (e) {
        console.error(`Error parsing metadata for ${file.name}:`, e);
        tracks.push({
          id: crypto.randomUUID(),
          title: file.name.replace(/\.[^/.]+$/, ""),
          artist: "Unknown Artist",
          album: "Unknown Album",
          duration: 0,
          path: (file as any).webkitRelativePath || file.name,
          file: file
        });
      }
    }
  }

  // Sort by Album -> Disk -> Track Number
  return tracks.sort((a, b) => {
    if (a.album !== b.album) return a.album.localeCompare(b.album);
    if (a.diskNo !== b.diskNo) return (a.diskNo || 0) - (b.diskNo || 0);
    return (a.trackNo || 0) - (b.trackNo || 0);
  });
}

export async function scanDirectory(): Promise<Track[]> {
  try {
    // Keep this as secondary option or for new-tab use cases
    if (!('showDirectoryPicker' in window)) {
      throw new Error('File System Access API not supported');
    }
    // @ts-ignore
    const dirHandle = await window.showDirectoryPicker();
    const allFiles: File[] = [];

    async function processDirectory(handle: any) {
      for await (const entry of handle.values()) {
        if (entry.kind === 'directory') {
          await processDirectory(entry);
        } else if (entry.kind === 'file') {
          allFiles.push(await entry.getFile());
        }
      }
    }

    await processDirectory(dirHandle);
    return processFiles(allFiles);
  } catch (error) {
    console.error('Directory scanning failed:', error);
    return [];
  }
}
