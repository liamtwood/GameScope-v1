/**
 * Logo discovery utility for automatically finding team logos from websites
 */

export interface LogoDiscoveryResult {
  logoUrl?: string;
  faviconUrl?: string;
  socialMediaImage?: string;
  success: boolean;
  error?: string;
}

export class LogoDiscovery {
  
  /**
   * Attempts to find a team logo from their website
   */
  async findLogoFromWebsite(websiteUrl: string): Promise<LogoDiscoveryResult> {
    try {
      // Clean up the URL
      const cleanUrl = this.cleanUrl(websiteUrl);
      if (!cleanUrl) {
        return { success: false, error: "Invalid website URL" };
      }

      // Try common logo patterns
      const logoPatterns = [
        '/logo.png',
        '/logo.jpg', 
        '/logo.svg',
        '/images/logo.png',
        '/assets/logo.png',
        '/wp-content/uploads/logo.png',
        '/media/logo.png'
      ];

      // Try favicon as fallback
      const faviconUrl = `${cleanUrl}/favicon.ico`;
      
      // For now, return the favicon as the most reliable option
      // In a full implementation, you'd scrape the website for better logos
      try {
        const response = await fetch(faviconUrl, { method: 'HEAD' });
        if (response.ok) {
          return {
            faviconUrl,
            success: true
          };
        }
      } catch (e) {
        // Favicon not found, continue
      }

      // Try common logo paths
      for (const pattern of logoPatterns) {
        try {
          const logoUrl = `${cleanUrl}${pattern}`;
          const response = await fetch(logoUrl, { method: 'HEAD' });
          if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
            return {
              logoUrl,
              success: true
            };
          }
        } catch (e) {
          // Continue to next pattern
        }
      }

      return { success: false, error: "No logo found at common locations" };
      
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  private cleanUrl(url: string): string | null {
    try {
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}`;
    } catch (e) {
      return null;
    }
  }
}