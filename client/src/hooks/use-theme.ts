import { useState, useEffect } from 'react';
import type { ColorTheme } from '@/lib/types';

const colorThemes: ColorTheme[] = [
  { 
    name: 'red', 
    light: { accent: '#dc2626', light: '#fef2f2' }, 
    dark: { accent: '#ef4444', light: '#1e293b' } 
  },
  { 
    name: 'blue', 
    light: { accent: '#2563eb', light: '#eff6ff' }, 
    dark: { accent: '#3b82f6', light: '#1e293b' } 
  },
  { 
    name: 'green', 
    light: { accent: '#059669', light: '#ecfdf5' }, 
    dark: { accent: '#10b981', light: '#1e293b' } 
  }
];

export function useTheme() {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [currentColorIndex, setCurrentColorIndex] = useState(0);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedColorIndex = localStorage.getItem('colorIndex');
    
    if (savedTheme === 'dark') {
      setIsDarkTheme(true);
      document.documentElement.classList.add('dark');
    }
    
    if (savedColorIndex) {
      setCurrentColorIndex(parseInt(savedColorIndex, 10));
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const cycleColorTheme = () => {
    const newIndex = (currentColorIndex + 1) % colorThemes.length;
    setCurrentColorIndex(newIndex);
    localStorage.setItem('colorIndex', newIndex.toString());
  };

  const getCurrentTheme = () => colorThemes[currentColorIndex];
  
  const getThemeColors = () => {
    const theme = getCurrentTheme();
    return isDarkTheme ? theme.dark : theme.light;
  };

  return {
    isDarkTheme,
    currentColorIndex,
    colorThemes,
    toggleTheme,
    cycleColorTheme,
    getCurrentTheme,
    getThemeColors
  };
}
