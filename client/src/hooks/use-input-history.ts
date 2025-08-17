import { useState, useEffect } from "react";
import { useSettings } from "./use-settings";

const HISTORY_KEY = "stepmonkey-input-history";
const MAX_HISTORY_ITEMS = 20;

export function useInputHistory() {
  const [history, setHistory] = useState<string[]>([]);
  const { settings, updateSettings, isLoading } = useSettings();

  useEffect(() => {
    if (isLoading || !settings) {
      return;
    }

    // Priority: Use database settings first, fall back to localStorage for migration
    if (Array.isArray(settings.inputHistory) && settings.inputHistory.length > 0) {
      setHistory(settings.inputHistory);
    } else if (!settings.inputHistory || settings.inputHistory.length === 0) {
      // Check for localStorage migration only once
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setHistory(parsed);
            // Migrate to database async
            updateSettings({ inputHistory: parsed }).then(() => {
              localStorage.removeItem(HISTORY_KEY);
            }).catch(err => {
              console.warn("Failed to migrate history to database:", err);
            });
          } else {
            setHistory([]);
          }
        } catch (err) {
          console.warn("Failed to parse input history from localStorage:", err);
          localStorage.removeItem(HISTORY_KEY);
          setHistory([]);
        }
      } else {
        setHistory([]);
      }
    }
  }, [settings, isLoading]);

  const addToHistory = (input: string) => {
    if (!input.trim()) return;
    
    setHistory(prev => {
      // Remove if already exists to avoid duplicates
      const filtered = prev.filter(item => item !== input);
      // Add to beginning and limit length
      const updated = [input, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      
      // Save to database via settings (async, don't await to avoid blocking UI)
      updateSettings({ inputHistory: updated }).catch(err => {
        console.warn("Failed to save input history:", err);
      });
      
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    updateSettings({ inputHistory: [] }).catch(err => {
      console.warn("Failed to clear history:", err);
    });
    localStorage.removeItem(HISTORY_KEY);
  };

  const removeFromHistory = (index: number) => {
    setHistory(prev => {
      const updated = prev.filter((_, i) => i !== index);
      updateSettings({ inputHistory: updated }).catch(err => {
        console.warn("Failed to update history:", err);
      });
      return updated;
    });
  };

  return {
    history,
    addToHistory,
    clearHistory,
    removeFromHistory,
  };
}