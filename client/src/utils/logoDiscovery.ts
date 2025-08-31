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

      // Try multiple favicon locations
      const faviconPatterns = [
        '/favicon.ico',
        '/favicon.png',
        '/favicon.svg',
        '/apple-touch-icon.png',
        '/apple-touch-icon-180x180.png',
        '/android-chrome-192x192.png',
        '/android-chrome-512x512.png'
      ];

      for (const pattern of faviconPatterns) {
        try {
          const faviconUrl = `${cleanUrl}${pattern}`;
          const response = await fetch(faviconUrl, { method: 'HEAD' });
          if (response.ok) {
            return {
              faviconUrl,
              success: true
            };
          }
        } catch (e) {
          // Continue to next pattern
        }
      }

      // Try common logo patterns
      const logoPatterns = [
        '/logo.png',
        '/logo.jpg', 
        '/logo.svg',
        '/images/logo.png',
        '/assets/logo.png',
        '/wp-content/uploads/logo.png',
        '/media/logo.png',
        '/img/logo.png',
        '/static/logo.png',
        '/public/logo.png',
        '/assets/images/logo.png',
        '/static/images/logo.png',
        '/content/images/logo.png'
      ];

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

      // Try to scrape the page for logo images (this may fail due to CORS)
      try {
        const response = await fetch(cleanUrl, { mode: 'cors' });
        if (response.ok) {
          const html = await response.text();
          const logoUrl = this.extractLogoFromHtml(html, cleanUrl);
          if (logoUrl) {
            // Verify the extracted logo URL is accessible
            try {
              const logoResponse = await fetch(logoUrl, { method: 'HEAD' });
              if (logoResponse.ok) {
                return {
                  logoUrl,
                  success: true
                };
              }
            } catch (e) {
              // Logo URL not accessible
            }
          }
        }
      } catch (e) {
        // Page scraping failed due to CORS or other restrictions
      }

      return { success: false, error: "No accessible logo found. Some websites block automatic logo discovery due to security restrictions." };
      
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  /**
   * Extract logo from HTML content using common patterns
   */
  private extractLogoFromHtml(html: string, baseUrl: string): string | null {
    // Look for common logo patterns in HTML - expanded patterns
    const logoPatterns = [
      // Class-based logo detection
      /<img[^>]*class="[^"]*logo[^"]*"[^>]*src="([^"]+)"/i,
      /<img[^>]*src="([^"]+)"[^>]*class="[^"]*logo[^"]*"/i,
      /<img[^>]*class="[^"]*brand[^"]*"[^>]*src="([^"]+)"/i,
      /<img[^>]*src="([^"]+)"[^>]*class="[^"]*brand[^"]*"/i,
      /<img[^>]*class="[^"]*header[^"]*logo[^"]*"[^>]*src="([^"]+)"/i,
      /<img[^>]*class="[^"]*site[^"]*logo[^"]*"[^>]*src="([^"]+)"/i,
      
      // Alt text-based detection
      /<img[^>]*alt="[^"]*logo[^"]*"[^>]*src="([^"]+)"/i,
      /<img[^>]*src="([^"]+)"[^>]*alt="[^"]*logo[^"]*"/i,
      /<img[^>]*alt="[^"]*brand[^"]*"[^>]*src="([^"]+)"/i,
      /<img[^>]*src="([^"]+)"[^>]*alt="[^"]*brand[^"]*"/i,
      
      // ID-based detection
      /<img[^>]*id="[^"]*logo[^"]*"[^>]*src="([^"]+)"/i,
      /<img[^>]*src="([^"]+)"[^>]*id="[^"]*logo[^"]*"/i,
      /<img[^>]*id="[^"]*brand[^"]*"[^>]*src="([^"]+)"/i,
      
      // Open Graph and meta tags
      /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i,
      /<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"/i,
      
      // Link rel icon patterns
      /<link[^>]*rel="icon"[^>]*href="([^"]+)"/i,
      /<link[^>]*rel="apple-touch-icon"[^>]*href="([^"]+)"/i,
      /<link[^>]*rel="shortcut icon"[^>]*href="([^"]+)"/i,
    ];

    for (const pattern of logoPatterns) {
      const match = html.match(pattern);
      if (match) {
        let logoUrl = match[1];
        
        // Skip data URLs and very small images
        if (logoUrl.startsWith('data:') || logoUrl.includes('1x1') || logoUrl.includes('pixel')) {
          continue;
        }
        
        // Convert relative URLs to absolute
        if (logoUrl.startsWith('/')) {
          logoUrl = baseUrl + logoUrl;
        } else if (logoUrl.startsWith('./')) {
          logoUrl = baseUrl + logoUrl.substring(1);
        } else if (!logoUrl.startsWith('http')) {
          logoUrl = baseUrl + '/' + logoUrl;
        }
        
        return logoUrl;
      }
    }

    return null;
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