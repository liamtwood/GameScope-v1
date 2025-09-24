import { useState, useEffect } from 'react';

interface MobileDetection {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  userAgent: string;
}

export function useMobile(): MobileDetection {
  const [detection, setDetection] = useState<MobileDetection>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        screenWidth: 1024,
        userAgent: ''
      };
    }

    const screenWidth = window.innerWidth;
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Check for mobile devices
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isMobileScreen = screenWidth < 768;
    const isMobile = isMobileDevice || isMobileScreen;
    
    // Check for tablet (larger mobile devices)
    const isTabletDevice = /ipad|android(?!.*mobile)/i.test(userAgent);
    const isTabletScreen = screenWidth >= 768 && screenWidth < 1024;
    const isTablet = (isTabletDevice || isTabletScreen) && !isMobile;
    
    const isDesktop = !isMobile && !isTablet;

    return {
      isMobile,
      isTablet,
      isDesktop,
      screenWidth,
      userAgent
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth;
      const userAgent = navigator.userAgent.toLowerCase();
      
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isMobileScreen = screenWidth < 768;
      const isMobile = isMobileDevice || isMobileScreen;
      
      const isTabletDevice = /ipad|android(?!.*mobile)/i.test(userAgent);
      const isTabletScreen = screenWidth >= 768 && screenWidth < 1024;
      const isTablet = (isTabletDevice || isTabletScreen) && !isMobile;
      
      const isDesktop = !isMobile && !isTablet;

      setDetection({
        isMobile,
        isTablet,
        isDesktop,
        screenWidth,
        userAgent
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return detection;
}

// Additional hook for simple mobile check
export function useIsMobile(): boolean {
  const { isMobile } = useMobile();
  return isMobile;
}