import React, { createContext, useContext, useState, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSettings } from "@/hooks/use-settings";

interface AIProviderContextType {
  selectedProvider: string;
  setSelectedProvider: (provider: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  modelsData: any;
  providers: Array<{ value: string; label: string }>;
  needsApiKey: boolean;
  hasRequiredApiKey: boolean;
}

const AIProviderContext = createContext<AIProviderContextType | undefined>(undefined);

export const AIProviderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedProvider, setSelectedProvider] = useState("testquality");
  const [selectedModel, setSelectedModel] = useState("");
  const { settings } = useSettings();

  const { data: modelsData } = useQuery({
    queryKey: ["/api/models", selectedProvider],
    enabled: !!selectedProvider,
  });

  const providers = [
    { value: "testquality", label: "TestQualityAI (Free)" },
    { value: "openai", label: "OpenAI" },
    { value: "anthropic", label: "Anthropic" },
    { value: "openrouter", label: "OpenRouter" },
  ];

  const needsApiKey = selectedProvider !== "testquality";
  const hasRequiredApiKey = selectedProvider === "testquality" || 
    (settings && (settings as any).apiKeys && (settings as any).apiKeys[selectedProvider]);

  const value = {
    selectedProvider,
    setSelectedProvider,
    selectedModel,
    setSelectedModel,
    modelsData,
    providers,
    needsApiKey,
    hasRequiredApiKey,
  };

  return (
    <AIProviderContext.Provider value={value}>
      {children}
    </AIProviderContext.Provider>
  );
};

export const useAIProvider = () => {
  const context = useContext(AIProviderContext);
  if (context === undefined) {
    throw new Error("useAIProvider must be used within an AIProviderProvider");
  }
  return context;
};