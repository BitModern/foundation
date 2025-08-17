import { useState, useEffect } from "react";

export interface Modifiers {
  strategy?: "happy" | "sad" | "boundary" | "comprehensive" | "exploratory" | "regression";
  workflow: Array<"e2e" | "component" | "multirole" | "firsttime">;
  quality: Array<"accessibility" | "performance" | "security" | "data" | "api" | "localization">;
  format?: "verbose" | "concise" | "gherkin" | "automation";
  language: string;
  customModifier?: string;
}

const defaultModifiers: Modifiers = {
  workflow: [],
  quality: [],
  language: "en",
};

export function useModifiers() {
  const [modifiers, setModifiers] = useState<Modifiers>(() => {
    const saved = localStorage.getItem("stepmonkey-modifiers");
    return saved ? JSON.parse(saved) : defaultModifiers;
  });

  useEffect(() => {
    localStorage.setItem("stepmonkey-modifiers", JSON.stringify(modifiers));
  }, [modifiers]);

  const updateStrategy = (strategy: Modifiers["strategy"]) => {
    setModifiers(prev => ({ ...prev, strategy }));
  };

  const updateWorkflow = (workflow: string, checked: boolean) => {
    setModifiers(prev => ({
      ...prev,
      workflow: checked
        ? [...prev.workflow, workflow as any]
        : prev.workflow.filter(w => w !== workflow)
    }));
  };

  const updateQuality = (quality: string, checked: boolean) => {
    setModifiers(prev => ({
      ...prev,
      quality: checked
        ? [...prev.quality, quality as any]
        : prev.quality.filter(q => q !== quality)
    }));
  };

  const updateFormat = (format: Modifiers["format"]) => {
    setModifiers(prev => ({ ...prev, format }));
  };

  const updateLanguage = (language: string) => {
    setModifiers(prev => ({ ...prev, language }));
  };

  const updateCustomModifier = (customModifier: string) => {
    setModifiers(prev => ({ ...prev, customModifier }));
  };

  const loadPreset = (presetName: string) => {
    if (!presetName) return;

    const presets: Record<string, Partial<Modifiers>> = {
      smoke: {
        strategy: "happy",
        workflow: ["e2e"],
        format: "concise",
        quality: [],
      },
      newfeature: {
        strategy: "comprehensive",
        workflow: ["e2e", "multirole"],
        format: "verbose",
        quality: [],
      },
      bdd: {
        strategy: "comprehensive",
        workflow: ["e2e"],
        quality: ["api"],
        format: "gherkin",
      },
      hardening: {
        strategy: "comprehensive",
        workflow: ["e2e"],
        quality: ["security", "performance", "data"],
        format: "verbose",
      },
      accessibility: {
        strategy: "comprehensive",
        workflow: ["e2e"],
        quality: ["accessibility"],
        format: "verbose",
      },
      api: {
        strategy: "comprehensive",
        workflow: ["component"],
        quality: ["api", "data"],
        format: "verbose",
      },
      bugfix: {
        strategy: "sad",
        format: "concise",
        workflow: [],
        quality: [],
      },
    };

    const preset = presets[presetName];
    if (preset) {
      setModifiers(prev => ({ ...prev, ...preset }));
    }
  };

  const clearModifiers = () => {
    setModifiers({ ...defaultModifiers });
  };

  const saveModifiers = () => {
    localStorage.setItem("stepmonkey-saved-modifiers", JSON.stringify(modifiers));
  };

  const getActiveModifierCount = () => {
    let count = 0;
    if (modifiers.strategy) count++;
    count += modifiers.workflow.length;
    count += modifiers.quality.length;
    if (modifiers.format) count++;
    if (modifiers.customModifier?.trim()) count++;
    return count;
  };

  return {
    modifiers,
    updateStrategy,
    updateWorkflow,
    updateQuality,
    updateFormat,
    updateLanguage,
    updateCustomModifier,
    loadPreset,
    clearModifiers,
    saveModifiers,
    getActiveModifierCount,
  };
}
