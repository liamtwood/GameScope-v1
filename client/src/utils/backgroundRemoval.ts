/**
 * Enhanced background removal utility for eagle logos
 * Supports multiple processing modes for different logo types
 */

export interface BackgroundRemovalOptions {
  tolerance?: number;
  preserveInternalWhite?: boolean;
  mode?: 'smart' | 'color' | 'manual';
  resizeWidth?: number;
  autoCrop?: boolean;
  cropPadding?: number;
  zoomLevel?: number;
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
    const { 
      tolerance = 30, 
      preserveInternalWhite = true, 
      mode = 'smart', 
      resizeWidth, 
      autoCrop = true, 
      cropPadding = 0,
      zoomLevel = 100
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Calculate zoom dimensions
          const zoomFactor = zoomLevel / 100;
          const scaledWidth = Math.round(img.width * zoomFactor);
          const scaledHeight = Math.round(img.height * zoomFactor);
          
          // Set canvas dimensions to scaled size
          this.canvas.width = scaledWidth;
          this.canvas.height = scaledHeight;
          
          // Draw scaled image
          this.ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
          
          // Get image data from scaled canvas
          const imageData = this.ctx.getImageData(0, 0, scaledWidth, scaledHeight);
          const data = imageData.data;
          
          // Process based on mode
          if (mode === 'smart') {
            this.processSmartMode(data, scaledWidth, scaledHeight);
          } else if (mode === 'color') {
            this.processColorMode(data, scaledWidth, scaledHeight);
          } else if (mode === 'manual') {
            this.processManualMode(data, scaledWidth, scaledHeight, tolerance);
          }
          
          // Update canvas with processed data
          this.ctx.putImageData(imageData, 0, 0);
          
          // Handle auto-cropping to remove whitespace
          let finalCanvas = this.canvas;
          if (autoCrop) {
            const bounds = this.findContentBounds(data, scaledWidth, scaledHeight);
            if (bounds) {
              finalCanvas = this.cropAndRecenter(this.canvas, bounds, cropPadding);
            }
          }
          
          // Handle resizing if specified
          if (resizeWidth && resizeWidth > 0) {
            finalCanvas = this.resizeCanvas(finalCanvas, resizeWidth);
          }
          
          // Convert to blob
          finalCanvas.toBlob((blob) => {
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
      
      // Check if pixel matches background color
      if (Math.abs(r - bgColor.r) < tolerance && 
          Math.abs(g - bgColor.g) < tolerance && 
          Math.abs(b - bgColor.b) < tolerance) {
        // Additional check: is this pixel surrounded by similar colors?
        const pixelIdx = i / 4;
        const x = pixelIdx % width;
        const y = Math.floor(pixelIdx / width);
        
        if (this.isSurroundedByBackground(data, width, height, x, y, bgColor, tolerance)) {
          data[i + 3] = 0; // Make transparent
        }
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


  private resizeCanvas(canvas: HTMLCanvasElement, targetWidth: number): HTMLCanvasElement {
    const aspectRatio = canvas.height / canvas.width;
    const targetHeight = Math.round(targetWidth * aspectRatio);
    
    const resizedCanvas = document.createElement('canvas');
    const ctx = resizedCanvas.getContext('2d')!;
    
    resizedCanvas.width = targetWidth;
    resizedCanvas.height = targetHeight;
    
    // Use smooth scaling for high quality resize
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
    
    return resizedCanvas;
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

  private findContentBounds(data: Uint8ClampedArray, width: number, height: number): {left: number, top: number, width: number, height: number} | null {
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let hasContent = false;
    
    // Find bounds of non-transparent pixels AND non-background colored pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const alpha = data[idx + 3];
        
        // Consider a pixel as content if:
        // 1. It's not transparent (alpha > 0)
        // 2. It's not white/near-white (even if opaque)
        // This ensures we crop out white borders too
        const isWhite = r > 250 && g > 250 && b > 250;
        const isNearWhite = r > 245 && g > 245 && b > 245;
        
        if (alpha > 0 && !isWhite) {
          // For near-white pixels, check if they're part of actual content
          // by looking at surrounding pixels
          if (isNearWhite) {
            // Check if this near-white pixel is adjacent to colored content
            let hasColoredNeighbor = false;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  const nIdx = (ny * width + nx) * 4;
                  const nr = data[nIdx];
                  const ng = data[nIdx + 1];
                  const nb = data[nIdx + 2];
                  const nalpha = data[nIdx + 3];
                  // If neighbor is colored (not white) and opaque
                  if (nalpha > 0 && (nr < 240 || ng < 240 || nb < 240)) {
                    hasColoredNeighbor = true;
                    break;
                  }
                }
              }
              if (hasColoredNeighbor) break;
            }
            // Skip this near-white pixel if it has no colored neighbors
            if (!hasColoredNeighbor) continue;
          }
          
          hasContent = true;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    if (!hasContent) {
      return null;
    }
    
    return {
      left: minX,
      top: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    };
  }

  private cropAndRecenter(sourceCanvas: HTMLCanvasElement, bounds: {left: number, top: number, width: number, height: number}, padding: number): HTMLCanvasElement {
    // Calculate new dimensions with padding
    const cropWidth = bounds.width + padding * 2;
    const cropHeight = bounds.height + padding * 2;
    
    // Create new canvas with cropped dimensions
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;
    const ctx = croppedCanvas.getContext('2d')!;
    
    // Calculate source position (ensure we don't go outside canvas bounds)
    const sourceX = Math.max(0, bounds.left - padding);
    const sourceY = Math.max(0, bounds.top - padding);
    const sourceWidth = Math.min(sourceCanvas.width - sourceX, cropWidth);
    const sourceHeight = Math.min(sourceCanvas.height - sourceY, cropHeight);
    
    // Calculate destination position (center if we couldn't get full padding)
    const destX = (cropWidth - sourceWidth) / 2;
    const destY = (cropHeight - sourceHeight) / 2;
    
    // Draw the cropped and centered content
    ctx.drawImage(
      sourceCanvas,
      sourceX, sourceY, sourceWidth, sourceHeight,
      destX, destY, sourceWidth, sourceHeight
    );
    
    return croppedCanvas;
  }

  private isCompletelyIsolated(x: number, y: number, width: number, height: number, externalBg: boolean[], isColoredContent: boolean[]): boolean {
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
    
    // If connected to colored content, it's not isolated
    if (hasColoredNeighbor) {
      return false;
    }
    
    // If mostly surrounded by external background, it's isolated
    return externalNeighbors > 12; // More than half of possible neighbors
  }
}