export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  year?: number;
  trackNo?: number;
  diskNo?: number;
  duration: number; // in seconds
  coverBlob?: Blob | string; // Can be a Blob or a URL string
  lyrics?: string;
  file?: File | Blob; // File for local, optional for cloud
  path: string;
  isCloud?: boolean;
  isBackend?: boolean;
  externalCoverUrl?: string;
  downloadUrl?: string;
  storagePath?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  tracks: string[]; // Track IDs
}

export interface ListeningHistory {
  id: string;
  trackId: string;
  artist: string;
  title: string;
  timestamp: any; // Firestore serverTimestamp
  userId: string;
}
