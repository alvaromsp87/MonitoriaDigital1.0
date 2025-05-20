"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ThemeContextProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check if we're in the browser environment
    if (typeof window !== 'undefined') {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      // Get saved preference or use system preference
      const savedTheme = localStorage.getItem('theme');
      const initialDarkMode = savedTheme ? savedTheme === 'dark' : systemPrefersDark;
      
      setDarkMode(initialDarkMode);
      document.documentElement.classList.toggle('dark', initialDarkMode);
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    // Save preference
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    
    // Toggle class on root element
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
