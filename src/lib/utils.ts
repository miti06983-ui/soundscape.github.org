import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getAverageColor(blob: Blob): Promise<ThemeColors> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.src = url;
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ primary: '#27272a', secondary: '#18181b' });
        return;
      }
      
      // Sample a small grid to find a "vibrant" color
      const size = 10;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      
      let bestColor = { r: 0, g: 0, b: 0, score: -1 };
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Skip too dark or too light colors
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        if (brightness < 30 || brightness > 220) continue;
        
        // Calculate saturation and warmth
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const sat = (max - min) / (max || 1);
        
        // Warmth factor: red and green (yellow) favored over blue
        const warmth = (r + g * 0.7) / (r + g + b || 1);
        
        const score = sat * 120 + warmth * 80; 
        
        if (score > bestColor.score) {
          bestColor = { r, g, b, score };
        }
      }
      
      if (bestColor.score === -1) {
        // Fallback to center pixel if no good vibrant color found
        const center = (size * size / 2 + size / 2) * 4;
        bestColor = { r: data[center], g: data[center+1], b: data[center+2], score: 0 };
      }

      // Boost brightness and saturation for a "popping" overall theme
      // Convert to HSL-like boost
      // Use original colors but with a slight saturation boost for vividness
      const sBoost = 1.1;
      const avg = (bestColor.r + bestColor.g + bestColor.b) / 3;
      bestColor.r = Math.min(255, Math.round(avg + (bestColor.r - avg) * sBoost));
      bestColor.g = Math.min(255, Math.round(avg + (bestColor.g - avg) * sBoost));
      bestColor.b = Math.min(255, Math.round(avg + (bestColor.b - avg) * sBoost));

      
      // Derive a secondary color (shift hue or pick another)
      const secondary = {
        r: Math.min(255, Math.round(bestColor.r * 0.6 + 40)),
        g: Math.min(255, Math.round(bestColor.g * 0.4 + 20)),
        b: Math.min(255, Math.round(bestColor.b * 0.8 + 60)),
      };

      resolve({
        primary: `rgb(${bestColor.r}, ${bestColor.g}, ${bestColor.b})`,
        secondary: `rgb(${secondary.r}, ${secondary.g}, ${secondary.b})`
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ primary: '#27272a', secondary: '#18181b' });
    };
  });
}

export type ThemeColors = { primary: string; secondary: string };

export function darkenColor(rgb: string, factor: number = 0.4): string {
  if (rgb.startsWith('#')) {
    // Basic hex support if needed, but we mostly use rgb
    return rgb;
  }
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return rgb;
  
  const r = Math.round(parseInt(match[1]) * factor);
  const g = Math.round(parseInt(match[2]) * factor);
  const b = Math.round(parseInt(match[3]) * factor);
  
  return `rgb(${r}, ${g}, ${b})`;
}
