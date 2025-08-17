import { useState, useEffect } from "react";

type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // Check localStorage first
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored) {
      setTheme(stored);
      updateDocumentClass(stored);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const systemTheme = prefersDark ? "dark" : "light";
      setTheme(systemTheme);
      updateDocumentClass(systemTheme);
      localStorage.setItem("theme", systemTheme);
    }

    // Listen for storage changes from other tabs/instances
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "theme" && e.newValue) {
        const newTheme = e.newValue as Theme;
        setTheme(newTheme);
        updateDocumentClass(newTheme);
      }
    };

    // Listen for custom theme change events (for same-tab updates)
    const handleThemeChange = (e: CustomEvent) => {
      const newTheme = e.detail.theme as Theme;
      setTheme(newTheme);
      updateDocumentClass(newTheme);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("themeChange", handleThemeChange as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("themeChange", handleThemeChange as EventListener);
    };
  }, []);

  const updateDocumentClass = (newTheme: Theme) => {
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    updateDocumentClass(newTheme);
    localStorage.setItem("theme", newTheme);
    
    // Dispatch custom event to notify other components
    const event = new CustomEvent('themeChange', { detail: { theme: newTheme } });
    window.dispatchEvent(event);
    
  };

  
  return {
    theme,
    toggleTheme,
    isDark: theme === "dark",
  };
}