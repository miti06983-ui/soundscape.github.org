import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { Track } from '../types';

interface MiniPlayerProps {
  track: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export interface DesktopLyricsRef {
  requestPiP: () => Promise<void>;
}

export const DesktopLyrics = forwardRef<DesktopLyricsRef, MiniPlayerProps>(({ 
  track, 
  isPlaying, 
  onTogglePlay, 
  onNext, 
  onPrevious 
}, ref) => {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  useImperativeHandle(ref, () => ({
    requestPiP: async () => {
      if (pipWindow) {
        pipWindow.close();
        setPipWindow(null);
        return;
      }

      // @ts-ignore
      if (window.documentPictureInPicture) {
        try {
          // @ts-ignore
          const win = await window.documentPictureInPicture.requestWindow({
            width: 320,
            height: 380,
          });

          // 注入样式
          const style = win.document.createElement('style');
          style.textContent = `
            body {
              margin: 0;
              padding: 0;
              background: #121212;
              color: white;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              height: 100vh;
              overflow: hidden;
              user-select: none;
            }
            .cover-container {
              position: relative;
              width: 100%;
              aspect-ratio: 1;
              overflow: hidden;
            }
            .cover-img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              transition: transform 0.5s ease;
            }
            .info-overlay {
              padding: 12px 16px;
              background: linear-gradient(transparent, rgba(0,0,0,0.8));
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
            }
            .title {
              font-size: 14px;
              font-weight: bold;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .artist {
              font-size: 12px;
              color: #b3b3b3;
              margin-top: 2px;
            }
            .controls {
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 24px;
              background: #181818;
            }
            button {
              background: none;
              border: none;
              color: #b3b3b3;
              cursor: pointer;
              transition: all 0.2s;
              padding: 8px;
            }
            button:hover {
              color: white;
              transform: scale(1.1);
            }
            button.play-btn {
              background: white;
              color: black;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            button.play-btn:hover {
              transform: scale(1.05);
              background: #f0f0f0;
            }
            svg {
              width: 20px;
              height: 20px;
              fill: currentColor;
            }
          `;
          win.document.head.append(style);

          // 构建 DOM
          win.document.body.innerHTML = `
            <div class="cover-container">
              <img id="pip-cover" class="cover-img" src="" alt="">
              <div class="info-overlay">
                <div id="pip-title" class="title"></div>
                <div id="pip-artist" class="artist"></div>
              </div>
            </div>
            <div class="controls">
              <button id="pip-prev">
                <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6L18 18V6z"></path></svg>
              </button>
              <button id="pip-play" class="play-btn">
                <svg id="pip-play-icon" viewBox="0 0 24 24"></svg>
              </button>
              <button id="pip-next">
                <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6zM16 6v12h2V6z"></path></svg>
              </button>
            </div>
          `;

          // 绑定事件
          win.document.getElementById('pip-play')?.addEventListener('click', () => onTogglePlay());
          win.document.getElementById('pip-prev')?.addEventListener('click', () => onPrevious());
          win.document.getElementById('pip-next')?.addEventListener('click', () => onNext());

          setPipWindow(win);
          win.addEventListener('pagehide', () => setPipWindow(null));
        } catch (err) {
          console.error("Mini Player failed:", err);
        }
      }
    }
  }));

  useEffect(() => {
    if (!pipWindow || !track) return;

    const titleEl = pipWindow.document.getElementById('pip-title');
    const artistEl = pipWindow.document.getElementById('pip-artist');
    const coverEl = pipWindow.document.getElementById('pip-cover') as HTMLImageElement;
    const playIconEl = pipWindow.document.getElementById('pip-play-icon');

    if (titleEl) titleEl.innerText = track.title;
    if (artistEl) artistEl.innerText = track.artist;
    
    if (coverEl) {
      const url = typeof track.coverBlob === 'string' ? track.coverBlob : 
                  (track.coverBlob instanceof Blob ? URL.createObjectURL(track.coverBlob) : '');
      if (url) coverEl.src = url;
    }

    if (playIconEl) {
      playIconEl.innerHTML = isPlaying 
        ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>' 
        : '<path d="M8 5v14l11-7z"></path>';
    }

  }, [track, isPlaying, pipWindow]);

  return null;
});
