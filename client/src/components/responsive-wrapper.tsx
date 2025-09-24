import { useMobile } from '@/hooks/use-mobile';

interface ResponsiveWrapperProps {
  children: React.ReactNode;
  mobileComponent?: React.ReactNode;
  tabletComponent?: React.ReactNode;
  desktopComponent?: React.ReactNode;
  fallback?: 'mobile' | 'desktop';
}

export function ResponsiveWrapper({ 
  children, 
  mobileComponent, 
  tabletComponent, 
  desktopComponent,
  fallback = 'desktop'
}: ResponsiveWrapperProps) {
  const { isMobile, isTablet, isDesktop } = useMobile();

  // Return specific component if provided
  if (isMobile && mobileComponent) {
    return <>{mobileComponent}</>;
  }
  
  if (isTablet && tabletComponent) {
    return <>{tabletComponent}</>;
  }
  
  if (isDesktop && desktopComponent) {
    return <>{desktopComponent}</>;
  }

  // Fallback logic
  if (isMobile && fallback === 'mobile') {
    return <>{children}</>;
  }
  
  if (!isDesktop && fallback === 'mobile') {
    return <>{children}</>;
  }

  // Default fallback to children (usually desktop layout)
  return <>{children}</>;
}