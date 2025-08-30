/**
 * Intelligent background removal utility for eagle logos
 * Based on flood-fill algorithm with corner sampling
 */

export interface BackgroundRemovalOptions {
  tolerance?: number;
  preserveInternalWhite?: boolean;
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
    const { tolerance = 30, preserveInternalWhite = true } = options;

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
          
          // Find background color by sampling corners
          const bgColor = this.detectBackgroundColor(data, img.width, img.height);
          
          // Create visited array for flood fill
          const visited = new Array(img.width * img.height).fill(false);
          
          // Perform flood fill from corners to identify external background
          this.floodFillFromCorners(
            data, 
            visited, 
            img.width, 
            img.height, 
            bgColor, 
            tolerance
          );
          
          // Apply transparency to background pixels
          this.applyTransparency(data, visited);
          
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

  private detectBackgroundColor(
    data: Uint8ClampedArray, 
    width: number, 
    height: number
  ): { r: number; g: number; b: number } {
    // Sample corner pixels
    const corners = [
      0, // top-left
      (width - 1) * 4, // top-right
      (height - 1) * width * 4, // bottom-left
      ((height - 1) * width + width - 1) * 4 // bottom-right
    ];
    
    let bgR = 0, bgG = 0, bgB = 0;
    let count = 0;
    
    for (let corner of corners) {
      // Check if corner is predominantly light (likely background)
      if (data[corner] > 200 && data[corner + 1] > 200 && data[corner + 2] > 200) {
        bgR += data[corner];
        bgG += data[corner + 1];
        bgB += data[corner + 2];
        count++;
      }
    }
    
    if (count > 0) {
      return {
        r: Math.round(bgR / count),
        g: Math.round(bgG / count),
        b: Math.round(bgB / count)
      };
    } else {
      // Default to white if no clear background found
      return { r: 255, g: 255, b: 255 };
    }
  }

  private floodFillFromCorners(
    data: Uint8ClampedArray,
    visited: boolean[],
    width: number,
    height: number,
    bgColor: { r: number; g: number; b: number },
    tolerance: number
  ): void {
    const queue: { x: number; y: number }[] = [];
    
    // Add corners to queue if they match background color
    const cornerPositions = [
      { x: 0, y: 0 },
      { x: width - 1, y: 0 },
      { x: 0, y: height - 1 },
      { x: width - 1, y: height - 1 }
    ];
    
    for (let corner of cornerPositions) {
      const idx = corner.y * width + corner.x;
      const pixelIdx = idx * 4;
      if (this.colorMatch(data, pixelIdx, bgColor, tolerance)) {
        queue.push(corner);
        visited[idx] = true;
      }
    }
    
    // Flood fill algorithm
    while (queue.length > 0) {
      const { x, y } = queue.shift()!;
      
      // Check 4-connected neighbors
      const neighbors = [
        { x: x - 1, y: y },
        { x: x + 1, y: y },
        { x: x, y: y - 1 },
        { x: x, y: y + 1 }
      ];
      
      for (let neighbor of neighbors) {
        if (
          neighbor.x >= 0 && 
          neighbor.x < width && 
          neighbor.y >= 0 && 
          neighbor.y < height
        ) {
          const idx = neighbor.y * width + neighbor.x;
          const pixelIdx = idx * 4;
          
          if (
            !visited[idx] && 
            this.colorMatch(data, pixelIdx, bgColor, tolerance)
          ) {
            visited[idx] = true;
            queue.push(neighbor);
          }
        }
      }
    }
  }

  private colorMatch(
    data: Uint8ClampedArray,
    pixelIdx: number,
    bgColor: { r: number; g: number; b: number },
    tolerance: number
  ): boolean {
    const r = data[pixelIdx];
    const g = data[pixelIdx + 1];
    const b = data[pixelIdx + 2];
    
    return (
      Math.abs(r - bgColor.r) < tolerance &&
      Math.abs(g - bgColor.g) < tolerance &&
      Math.abs(b - bgColor.b) < tolerance
    );
  }

  private applyTransparency(data: Uint8ClampedArray, visited: boolean[]): void {
    for (let i = 0; i < visited.length; i++) {
      if (visited[i]) {
        // Set alpha to 0 for background pixels
        data[i * 4 + 3] = 0;
      }
    }
  }
}