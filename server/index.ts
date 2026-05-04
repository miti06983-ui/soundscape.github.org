import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import { scanLibrary, getTrackList, getTrackById, getTrackCover } from './scanner';
import { fetchLyrics } from './lyrics';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// 启动时扫描一次
scanLibrary().then(() => {
  console.log('Initial library scan complete.');
});

// 1. 获取所有扫描到的歌曲
app.get('/api/tracks', (req, res) => {
  res.json(getTrackList());
});

// 2. 重新扫描
app.post('/api/scan', async (req, res) => {
  const tracks = await scanLibrary();
  res.json({ message: 'Scan complete', count: tracks.length });
});

// 3. 歌曲流服务
app.get('/api/stream/:id', (req, res) => {
  const track = getTrackById(req.params.id);
  if (!track) return res.status(404).json({ error: 'Track not found' });

  const stat = fs.statSync(track.path);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(track.path, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'audio/mpeg',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'audio/mpeg',
    };
    res.writeHead(200, head);
    fs.createReadStream(track.path).pipe(res);
  }
});

// 4. 封面提取
app.get('/api/cover/:id', async (req, res) => {
  const cover = await getTrackCover(req.params.id);
  if (!cover) {
    return res.status(404).send('Cover not found');
  }
  res.setHeader('Content-Type', cover.format);
  res.send(cover.data);
});

// 5. 歌词接口
app.get('/api/lyrics', async (req, res) => {
  const { title, artist } = req.query;
  const lyrics = await fetchLyrics(title as string, artist as string);
  res.json({ lyrics });
});

// 6. 标签自动修复
app.post('/api/repair/:id', async (req, res) => {
  const { updateTrackMetadata, getTrackById } = await import('./scanner');
  const track = getTrackById(req.params.id);
  if (!track) return res.status(404).json({ error: 'Track not found' });

  try {
    const fetch = (await import('node-fetch')).default;
    // Clean up filename for searching (remove .mp3 and common junk)
    const query = track.fileName.replace(/\.(mp3|flac|wav|m4a)$/i, '').replace(/[_-]/g, ' ');
    
    console.log(`Repairing track ${track.id}: searching for "${query}"`);
    
    const searchUrl = `https://music.163.com/api/search/get/web?s=${encodeURIComponent(query)}&type=1&limit=5`;
    const response = await fetch(searchUrl);
    const data: any = await response.json();

    if (data.result && data.result.songs && data.result.songs.length > 0) {
      const bestMatch = data.result.songs[0];
      
      const updates = {
        title: bestMatch.name,
        artist: bestMatch.artists.map((a: any) => a.name).join(', '),
        album: bestMatch.album.name,
        externalCoverUrl: bestMatch.album.picUrl,
        hasCover: true
      };

      const updatedTrack = updateTrackMetadata(track.id, updates);
      res.json({ success: true, track: updatedTrack });
    } else {
      res.status(404).json({ error: 'No match found' });
    }
  } catch (err) {
    console.error('Repair failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Big Backend is running on http://localhost:${port}`);
});

// ============================================
// AI Stem Separation API - Lalal.ai
// ============================================

interface StemJob {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  stems?: {
    vocals?: string;
    drums?: string;
    bass?: string;
    other?: string;
  };
  error?: string;
}

const stemJobs = new Map<string, StemJob>();

async function lalalaiSeparate(trackId: string, onProgress: (p: number) => void): Promise<StemJob['stems']> {
  const track = getTrackById(trackId);
  if (!track) throw new Error('Track not found');

  const jobId = `job_${Date.now()}`;
  const job: StemJob = { id: jobId, status: 'processing', progress: 0 };
  stemJobs.set(jobId, job);

  const LALAL_API_KEY = process.env.LALAL_API_KEY;
  const LALAL_API_URL = 'https://api.lalal.ai/v1/separate';

  if (!LALAL_API_KEY) {
    console.warn('LALAL_API_KEY not configured, using demo mode');
    job.status = 'failed';
    job.error = 'API key not configured';
    return null;
  }

  try {
    const audioBuffer = fs.readFileSync(track.path);
    
    onProgress(10);

    const response = await fetch(LALAL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LALAL_API_KEY}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        audio: audioBuffer.toString('base64'),
        vocal_volume: 1.0,
        instrumental_volume: 1.0,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    onProgress(50);

    const result = await response.json();
    
    if (result.status === 'error') {
      throw new Error(result.message || 'Separation failed');
    }

    onProgress(100);

    job.status = 'completed';
    job.stems = {
      vocals: result.results?.vocals?.mp3,
      drums: result.results?.drums?.mp3,
      bass: result.results?.bass?.mp3,
      other: result.results?.instrumental?.mp3,
    };

    return job.stems;
  } catch (error) {
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : 'Unknown error';
    throw error;
  }
}

app.post('/api/stem-separate', async (req, res) => {
  const { trackId } = req.body;

  if (!trackId) {
    return res.status(400).json({ error: 'trackId is required' });
  }

  const track = getTrackById(trackId);
  if (!track) {
    return res.status(404).json({ error: 'Track not found' });
  }

  const jobId = `job_${Date.now()}`;
  const job: StemJob = { id: jobId, status: 'processing', progress: 0 };
  stemJobs.set(jobId, job);

  lalalaiSeparate(trackId, (progress) => {
    job.progress = progress;
  })
    .then((stems) => {
      job.status = 'completed';
      job.stems = stems || undefined;
    })
    .catch((err) => {
      job.status = 'failed';
      job.error = err.message;
    });

  res.json({ jobId, status: 'processing' });
});

app.get('/api/stem-status/:jobId', (req, res) => {
  const job = stemJobs.get(req.params.jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    stems: job.stems,
    error: job.error,
  });
});

app.get('/api/stem-stream/:jobId/:stem', (req, res) => {
  const { jobId, stem } = req.params;
  const job = stemJobs.get(jobId);

  if (!job || job.status !== 'completed' || !job.stems) {
    return res.status(404).json({ error: 'Stem not available' });
  }

  const stemUrl = job.stems[stem as keyof typeof job.stems];
  if (!stemUrl) {
    return res.status(404).json({ error: 'Stem not found' });
  }

  res.redirect(stemUrl);
});
