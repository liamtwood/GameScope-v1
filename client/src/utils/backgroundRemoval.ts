/**
 * Enhanced background removal utility for eagle logos
 * Supports multiple processing modes for different logo types
 */

export interface BackgroundRemovalOptions {
  tolerance?: number;
  preserveInternalWhite?: boolean;
  mode?: 'smart' | 'color' | 'manual';
  autoCrop?: boolean;
  cropPadding?: number;
  resizeWidth?: number;
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
      autoCrop = false,
      cropPadding = 10,
      resizeWidth
    } = options;

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
          
          // Handle cropping if enabled
          let finalCanvas = this.canvas;
          if (autoCrop) {
            const cropBounds = this.findContentBounds(imageData.data, img.width, img.height);
            if (cropBounds) {
              finalCanvas = this.cropAndRecenter(this.canvas, cropBounds, cropPadding);
            }
          }
          
          // Handle resizing if enabled
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
    // Enhanced algorithm that handles isolated elements like TM symbols
    const bgColor = this.detectBackgroundColor(data, width, height);
    const tolerance = 40; // Increased tolerance for more aggressive background removal
    
    // First pass: Mark all pixels similar to background color (including most whites/lights)
    const isBackground = new Array(width * height).fill(false);
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // More aggressive background detection for whites and light colors
      const isWhiteish = r > 200 && g > 200 && b > 200;
      const matchesBgColor = Math.abs(r - bgColor.r) < tolerance && 
                            Math.abs(g - bgColor.g) < tolerance && 
                            Math.abs(b - bgColor.b) < tolerance;
      
      if (matchesBgColor || isWhiteish) {
        isBackground[i / 4] = true;
      }
    }
    
    // Second pass: Find content islands and preserve internal content only
    const visited = new Array(width * height).fill(false);
    const contentPixels = new Set<number>();
    
    // Find all non-background pixels as potential content
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (!isBackground[idx] && !visited[idx]) {
          // Found content - flood fill to find connected component
          const component = this.floodFillComponent(x, y, width, height, isBackground, visited);
          // Only keep components that are substantial (not just noise/artifacts)
          if (component.size > 5) {
            component.forEach(pixel => contentPixels.add(pixel));
          }
        }
      }
    }
    
    // Apply transparency to everything except solid content
    for (let i = 0; i < data.length; i += 4) {
      const pixelIdx = i / 4;
      if (!contentPixels.has(pixelIdx)) {
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

  private findContentBounds(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): { left: number; top: number; right: number; bottom: number; width: number; height: number } | null {
    let left = width;
    let right = 0;
    let top = height;
    let bottom = 0;
    let hasContent = false;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const alpha = data[idx + 3];
        
        if (alpha > 0) { // Non-transparent pixel
          hasContent = true;
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }
    }

    if (!hasContent) return null;

    return {
      left,
      top,
      right,
      bottom,
      width: right - left + 1,
      height: bottom - top + 1
    };
  }

  private cropAndRecenter(
    canvas: HTMLCanvasElement,
    bounds: { left: number; top: number; width: number; height: number },
    padding: number
  ): HTMLCanvasElement {
    const newCanvas = document.createElement('canvas');
    const ctx = newCanvas.getContext('2d')!;
    
    // Calculate new dimensions with padding
    const newWidth = bounds.width + (padding * 2);
    const newHeight = bounds.height + (padding * 2);
    
    newCanvas.width = newWidth;
    newCanvas.height = newHeight;
    
    // Draw the cropped content centered with padding
    ctx.drawImage(
      canvas,
      bounds.left, bounds.top, bounds.width, bounds.height,
      padding, padding, bounds.width, bounds.height
    );
    
    return newCanvas;
  }

  private resizeCanvas(canvas: HTMLCanvasElement, targetWidth: number): HTMLCanvasElement {
    const aspectRatio = canvas.height / canvas.width;
    const targetHeight = Math.round(targetWidth * aspectRatio);
    
    const resizedCanvas = document.createElement('canvas');
    const ctx = resizedCanvas.getContext('2d')!;
    
    resizedCanvas.width = targetWidth;
    resizedCanvas.height = targetHeight;
    
    // Use smooth scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
    
    return resizedCanvas;
  }
}