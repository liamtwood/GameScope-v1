/**
 * Background removal utility — server-side ML (rembg) implementation.
 * Replaces the old client-side canvas flood-fill approach.
 * The API is identical so all callers (ObjectUploader, LogoUpload) work unchanged.
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
  /**
   * Remove the background from an image file using the server-side rembg ML model.
   * Returns a transparent PNG blob.
   */
  async removeBackground(
    imageFile: File,
    _options: BackgroundRemovalOptions = {}
  ): Promise<Blob> {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await fetch("/api/remove-background", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const msg = await response.text().catch(() => response.statusText);
      throw new Error(`Background removal failed (${response.status}): ${msg}`);
    }

    return response.blob();
  }
}
