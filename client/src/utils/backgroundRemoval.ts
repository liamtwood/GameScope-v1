/**
 * Enhanced background removal utility for eagle logos
 * Supports multiple processing modes for different logo types
 */

export interface BackgroundRemovalOptions {
  tolerance?: number;
  preserveInternalWhite?: boolean;
  mode?: 'smart' | 'color' | 'manual';
}

export class BackgroundRemover {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async removeBackground(
    imageFile: File, 
    options: BackgroundRemovalOptions = {}
  ): Promise<Blob> {
    const { tolerance = 30, preserveInternalWhite = true, mode = 'smart' } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Set canvas dimensions
          this.canvas.width = img.width;
          this.canvas.height = img.height;
          
          // Draw original image
          this.ctx.drawImage(img, 0, 0);
          
          // Get image data
          const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
          const data = imageData.data;
          
          // Process based on mode
          if (mode === 'smart') {
            this.processSmartMode(data, img.width, img.height);
          } else if (mode === 'color') {
            this.processColorMode(data, img.width, img.height);
          } else if (mode === 'manual') {
            this.processManualMode(data, img.width, img.height, tolerance);
          }
          
          // Update canvas with processed data
          this.ctx.putImageData(imageData, 0, 0);
          
          // Convert to blob
          this.canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          }, 'image/png');
          
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(imageFile);
    });
  }

  private processSmartMode(data: Uint8ClampedArray, width: number, height: number): void {
    // Algorithm that specifically preserves internal white areas like in TM symbols
    const bgColor = this.detectBackgroundColor(data, width, height);
    const tolerance = 35;
    
    // First, identify all colored (non-white/non-background) pixels
    // These form the boundaries that protect internal white
    const isColoredContent = new Array(width * height).fill(false);
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const idx = i / 4;
      
      // Check if this is colored content (not white/light gray)
      // This includes black, red, yellow, etc.
      const isWhiteish = r > 240 && g > 240 && b > 240;
      const isGrayish = Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20 && r > 200;
      
      if (!isWhiteish && !isGrayish) {
        isColoredContent[idx] = true;
      }
    }
    
    // Create a flood fill mask starting ONLY from edges
    // But stop at any colored content (black, red, yellow)
    const externalBg = new Array(width * height).fill(false);
    const visited = new Array(width * height).fill(false);
    const queue: Array<{x: number, y: number}> = [];
    
    // Add all edge pixels to queue
    for (let x = 0; x < width; x++) {
      // Top edge
      if (!isColoredContent[x]) {
        queue.push({x, y: 0});
        visited[x] = true;
      }
      // Bottom edge
      const bottomIdx = (height - 1) * width + x;
      if (!isColoredContent[bottomIdx]) {
        queue.push({x, y: height - 1});
        visited[bottomIdx] = true;
      }
    }
    
    for (let y = 1; y < height - 1; y++) {
      // Left edge
      const leftIdx = y * width;
      if (!isColoredContent[leftIdx]) {
        queue.push({x: 0, y});
        visited[leftIdx] = true;
      }
      // Right edge
      const rightIdx = y * width + width - 1;
      if (!isColoredContent[rightIdx]) {
        queue.push({x: width - 1, y});
        visited[rightIdx] = true;
      }
    }
    
    // Flood fill but STOP at colored content boundaries
    while (queue.length > 0) {
      const {x, y} = queue.shift()!;
      const idx = y * width + x;
      const pixelIdx = idx * 4;
      
      // Skip if this is colored content
      if (isColoredContent[idx]) {
        continue;
      }
      
      const r = data[pixelIdx];
      const g = data[pixelIdx + 1];
      const b = data[pixelIdx + 2];
      
      // Only process if this looks like background (white/light)
      if (Math.abs(r - bgColor.r) < tolerance && 
          Math.abs(g - bgColor.g) < tolerance && 
          Math.abs(b - bgColor.b) < tolerance) {
        
        externalBg[idx] = true;
        
        // Check neighbors
        const neighbors = [
          {x: x - 1, y}, {x: x + 1, y},
          {x, y: y - 1}, {x, y: y + 1}
        ];
        
        for (let neighbor of neighbors) {
          if (neighbor.x >= 0 && neighbor.x < width && 
              neighbor.y >= 0 && neighbor.y < height) {
            const nIdx = neighbor.y * width + neighbor.x;
            
            // Don't cross colored content boundaries
            if (!visited[nIdx] && !isColoredContent[nIdx]) {
              visited[nIdx] = true;
              queue.push(neighbor);
            }
          }
        }
      }
    }
    
    // Special handling for isolated elements like TM
    // Look for small white regions completely surrounded by background
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const pixelIdx = idx * 4;
        
        if (!externalBg[idx] && !isColoredContent[idx]) {
          const r = data[pixelIdx];
          const g = data[pixelIdx + 1];
          const b = data[pixelIdx + 2];
          
          // If this is white and completely surrounded by external background
          if (r > 240 && g > 240 && b > 240) {
            if (this.isCompletelyIsolated(x, y, width, height, externalBg, isColoredContent)) {
              externalBg[idx] = true;
            }
          }
        }
      }
    }
    
    // Apply transparency only to external background
    for (let i = 0; i < data.length; i += 4) {
      const pixelIdx = i / 4;
      if (externalBg[pixelIdx]) {
        data[i + 3] = 0; // Make transparent
      }
    }
  }

  private processColorMode(data: Uint8ClampedArray, width: number, height: number): void {
    // Aggressive color-based removal - removes all light/white backgrounds
    const bgColor = this.detectBackgroundColor(data, width, height);
    const tolerance = 35; // Increased for more aggressive removal
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // More aggressive white/light color removal
      const isVeryLight = r > 220 && g > 220 && b > 220;
      const matchesBgColor = Math.abs(r - bgColor.r) < tolerance && 
                            Math.abs(g - bgColor.g) < tolerance && 
                            Math.abs(b - bgColor.b) < tolerance;
      
      if (isVeryLight || matchesBgColor) {
        data[i + 3] = 0; // Make transparent
      }
    }
  }

  private processManualMode(data: Uint8ClampedArray, width: number, height: number, threshold: number): void {
    const bgColor = this.detectBackgroundColor(data, width, height);
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      if (Math.abs(r - bgColor.r) < threshold && 
          Math.abs(g - bgColor.g) < threshold && 
          Math.abs(b - bgColor.b) < threshold) {
        data[i + 3] = 0; // Make transparent
      }
    }
  }

  private detectBackgroundColor(
    data: Uint8ClampedArray, 
    width: number, 
    height: number
  ): { r: number; g: number; b: number } {
    // Enhanced edge sampling for better background detection
    const samples: Array<{ r: number; g: number; b: number }> = [];
    const sampleSize = 10;
    
    // Top edge
    for (let x = 0; x < width; x += Math.floor(width / sampleSize)) {
      const idx = x * 4;
      samples.push({r: data[idx], g: data[idx + 1], b: data[idx + 2]});
    }
    
    // Bottom edge
    for (let x = 0; x < width; x += Math.floor(width / sampleSize)) {
      const idx = ((height - 1) * width + x) * 4;
      samples.push({r: data[idx], g: data[idx + 1], b: data[idx + 2]});
    }
    
    // Left edge
    for (let y = 0; y < height; y += Math.floor(height / sampleSize)) {
      const idx = (y * width) * 4;
      samples.push({r: data[idx], g: data[idx + 1], b: data[idx + 2]});
    }
    
    // Right edge
    for (let y = 0; y < height; y += Math.floor(height / sampleSize)) {
      const idx = (y * width + width - 1) * 4;
      samples.push({r: data[idx], g: data[idx + 1], b: data[idx + 2]});
    }
    
    // Find most common color range
    const colorCounts: { [key: string]: number } = {};
    samples.forEach(sample => {
      const key = `${Math.round(sample.r/10)*10},${Math.round(sample.g/10)*10},${Math.round(sample.b/10)*10}`;
      colorCounts[key] = (colorCounts[key] || 0) + 1;
    });
    
    let maxCount = 0;
    let dominantColor = {r: 255, g: 255, b: 255};
    
    for (let key in colorCounts) {
      if (colorCounts[key] > maxCount) {
        maxCount = colorCounts[key];
        const [r, g, b] = key.split(',').map(Number);
        dominantColor = {r, g, b};
      }
    }
    
    return dominantColor;
  }

  private floodFillComponent(
    startX: number, 
    startY: number, 
    width: number, 
    height: number, 
    isBackground: boolean[], 
    visited: boolean[]
  ): Set<number> {
    const component = new Set<number>();
    const stack = [{x: startX, y: startY}];
    
    while (stack.length > 0) {
      const {x, y} = stack.pop()!;
      
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      
      const idx = y * width + x;
      if (visited[idx] || isBackground[idx]) continue;
      
      visited[idx] = true;
      component.add(idx);
      
      // Add neighbors
      stack.push({x: x - 1, y});
      stack.push({x: x + 1, y});
      stack.push({x, y: y - 1});
      stack.push({x, y: y + 1});
    }
    
    return component;
  }

  private isSurroundedByBackground(
    data: Uint8ClampedArray, 
    width: number, 
    height: number, 
    x: number, 
    y: number, 
    bgColor: { r: number; g: number; b: number }, 
    tolerance: number
  ): boolean {
    let backgroundCount = 0;
    let totalCount = 0;
    
    // Check 3x3 area around pixel
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const idx = (ny * width + nx) * 4;
          totalCount++;
          
          if (Math.abs(data[idx] - bgColor.r) < tolerance &&
              Math.abs(data[idx + 1] - bgColor.g) < tolerance &&
              Math.abs(data[idx + 2] - bgColor.b) < tolerance) {
            backgroundCount++;
          }
        }
      }
    }
    
    return totalCount > 0 && backgroundCount / totalCount > 0.5;
  }

  private isCompletelyIsolated(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    externalBg: boolean[], 
    isColoredContent: boolean[]
  ): boolean {
    // Check if this white pixel is in a small isolated region
    // surrounded by external background (for handling TM-like elements)
    
    // First check immediate surroundings
    let hasColoredNeighbor = false;
    let externalNeighbors = 0;
    
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (dx === 0 && dy === 0) continue;
        
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nIdx = ny * width + nx;
          
          if (isColoredContent[nIdx]) {
            hasColoredNeighbor = true;
            break;
          }
          
          if (externalBg[nIdx]) {
            externalNeighbors++;
          }
        }
      }
      if (hasColoredNeighbor) break;
    }
    
    // If no colored neighbors and mostly surrounded by external background
    return !hasColoredNeighbor && externalNeighbors > 15;
  }
}