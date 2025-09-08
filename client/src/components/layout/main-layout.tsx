import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function MainLayout({ title, subtitle, children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      setSidebarHidden(true);
    } else {
      setSidebarHidden(false);
    }
  }, [isMobile]);

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleSidebar = () => {
    setSidebarHidden(!sidebarHidden);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed z-50' : 'relative'} 
        transition-transform duration-300
        ${isMobile && sidebarHidden ? '-translate-x-full' : 'translate-x-0'}
      `}>
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggleCollapse={toggleSidebarCollapse}
        />
      </div>

      {/* Mobile overlay */}
      {isMobile && !sidebarHidden && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={title}
          subtitle={subtitle}
          onToggleSidebar={toggleSidebar}
          isMobile={isMobile}
        />
        
        <main className="flex-1 overflow-y-scroll p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
