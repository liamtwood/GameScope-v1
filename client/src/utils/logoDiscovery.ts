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

      // Try favicon first as it's most reliable
      const faviconUrl = `${cleanUrl}/favicon.ico`;
      try {
        const response = await fetch(faviconUrl, { method: 'HEAD' });
        if (response.ok) {
          return {
            faviconUrl,
            success: true
          };
        }
      } catch (e) {
        // Continue to other methods
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
        '/public/logo.png'
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

      // Try to scrape the page for logo images
      try {
        const response = await fetch(cleanUrl);
        if (response.ok) {
          const html = await response.text();
          const logoUrl = this.extractLogoFromHtml(html, cleanUrl);
          if (logoUrl) {
            return {
              logoUrl,
              success: true
            };
          }
        }
      } catch (e) {
        // Page scraping failed
      }

      return { success: false, error: "No logo found at common locations or in page content" };
      
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  /**
   * Extract logo from HTML content using common patterns
   */
  private extractLogoFromHtml(html: string, baseUrl: string): string | null {
    // Look for common logo patterns in HTML
    const logoPatterns = [
      /<img[^>]*class="[^"]*logo[^"]*"[^>]*src="([^"]+)"/i,
      /<img[^>]*src="([^"]+)"[^>]*class="[^"]*logo[^"]*"/i,
      /<img[^>]*alt="[^"]*logo[^"]*"[^>]*src="([^"]+)"/i,
      /<img[^>]*src="([^"]+)"[^>]*alt="[^"]*logo[^"]*"/i,
      /<img[^>]*id="[^"]*logo[^"]*"[^>]*src="([^"]+)"/i,
      /<img[^>]*src="([^"]+)"[^>]*id="[^"]*logo[^"]*"/i,
    ];

    for (const pattern of logoPatterns) {
      const match = html.match(pattern);
      if (match) {
        let logoUrl = match[1];
        
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