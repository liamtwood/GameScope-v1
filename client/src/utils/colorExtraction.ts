export interface ColorResult {
  color: string;
  frequency: number;
}

export interface ExtractedColors {
  primary: string;
  secondary?: string;
  dominantColors: ColorResult[];
}

/**
 * Extract dominant colors from an image URL
 */
export async function extractColorsFromImage(imageUrl: string): Promise<ExtractedColors> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Set canvas size to image size, but limit for performance
        const maxSize = 200;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        // Extract colors
        const colors = extractDominantColors(pixels);
        const filteredColors = filterColors(colors);
        
        // Get primary and secondary colors
        const primary = filteredColors[0]?.color || '#6b7280';
        const secondary = filteredColors[1]?.color;
        
        resolve({
          primary,
          secondary,
          dominantColors: filteredColors.slice(0, 5)
        });
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
}

/**
 * Extract dominant colors from pixel data
 */
function extractDominantColors(pixels: Uint8ClampedArray): ColorResult[] {
  const colorCounts = new Map<string, number>();
  
  // Sample every 4th pixel for performance
  for (let i = 0; i < pixels.length; i += 16) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];
    
    // Skip transparent pixels
    if (a < 128) continue;
    
    // Quantize colors to reduce noise
    const quantizedR = Math.floor(r / 32) * 32;
    const quantizedG = Math.floor(g / 32) * 32;
    const quantizedB = Math.floor(b / 32) * 32;
    
    const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
    colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
  }
  
  // Convert to array and sort by frequency
  const colors: ColorResult[] = Array.from(colorCounts.entries())
    .map(([colorKey, count]) => {
      const [r, g, b] = colorKey.split(',').map(Number);
      return {
        color: rgbToHex(r, g, b),
        frequency: count
      };
    })
    .sort((a, b) => b.frequency - a.frequency);
  
  return colors;
}

/**
 * Filter out colors that are too light, too dark, or too similar
 */
function filterColors(colors: ColorResult[]): ColorResult[] {
  const filtered: ColorResult[] = [];
  
  for (const color of colors) {
    const { r, g, b } = hexToRgb(color.color);
    
    // Skip colors that are too light (likely background)
    const lightness = (r + g + b) / 3;
    if (lightness > 220) continue;
    
    // Skip colors that are too dark (likely shadows)
    if (lightness < 30) continue;
    
    // Skip colors that are too similar to existing ones
    const isDuplicate = filtered.some(existing => {
      const existingRgb = hexToRgb(existing.color);
      const distance = Math.sqrt(
        Math.pow(r - existingRgb.r, 2) +
        Math.pow(g - existingRgb.g, 2) +
        Math.pow(b - existingRgb.b, 2)
      );
      return distance < 50; // Minimum distance threshold
    });
    
    if (!isDuplicate) {
      filtered.push(color);
    }
    
    // Limit to top colors
    if (filtered.length >= 5) break;
  }
  
  return filtered;
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Convert hex to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

/**
 * Get contrasting text color for a background color
 */
export function getContrastColor(hexColor: string): string {
  const { r, g, b } = hexToRgb(hexColor);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}