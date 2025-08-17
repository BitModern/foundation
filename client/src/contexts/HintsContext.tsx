import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface HintsContextType {
  hintsEnabled: boolean;
  toggleHints: () => void;
}

const HintsContext = createContext<HintsContextType | undefined>(undefined);

interface HintsProviderProps {
  children: ReactNode;
}

export function HintsProvider({ children }: HintsProviderProps) {
  const [hintsEnabled, setHintsEnabled] = useState(() => {
    // Load from localStorage or default to true
    const saved = localStorage.getItem("stepmonkey-hints-enabled");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem("stepmonkey-hints-enabled", JSON.stringify(hintsEnabled));
  }, [hintsEnabled]);

  const toggleHints = () => {
    setHintsEnabled((prev: boolean) => !prev);
  };

  return (
    <HintsContext.Provider value={{ hintsEnabled, toggleHints }}>
      {children}
    </HintsContext.Provider>
  );
}

export function useHints() {
  const context = useContext(HintsContext);
  if (context === undefined) {
    throw new Error("useHints must be used within a HintsProvider");
  }
  return context;
}