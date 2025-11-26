import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface TabContextType {
  activeTab: string | null;
  setActiveTab: (tab: string | null) => void;
  pageTitle: string;
  setPageTitle: (title: string) => void;
  getFullArea: () => string;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export function TabProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState<string>("");

  const getFullArea = useCallback(() => {
    if (activeTab) {
      return `${pageTitle} > ${activeTab}`;
    }
    return pageTitle;
  }, [pageTitle, activeTab]);

  return (
    <TabContext.Provider value={{ 
      activeTab, 
      setActiveTab, 
      pageTitle, 
      setPageTitle,
      getFullArea 
    }}>
      {children}
    </TabContext.Provider>
  );
}

export function useTab() {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error("useTab must be used within a TabProvider");
  }
  return context;
}
