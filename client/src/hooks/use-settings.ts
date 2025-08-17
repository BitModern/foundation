import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Settings } from "@shared/schema";

const defaultSettings: Settings = {
  aiProvider: "testquality",
  apiKeys: {},
  promptTemplates: {},
  defaultModifiers: {},
  splitMode: true,
  inputHistory: [],
  integrations: {},
  defaultIntegration: undefined,
  testqualitySettings: {
    apiToken: "",
    projectId: undefined,
    baseUrl: "https://api.testquality.com/api",
  },
  generationOptions: {
    splitMode: true,
    stepsAsTable: false,
    prependKey: true,
    assigneeEnabled: false,
    assigneeValue: "",
    folderOverride: "",
  },
};

export function useSettings() {
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 5 * 60 * 1000, // 5 minutes - reasonable caching
    refetchOnMount: "always", 
    refetchOnWindowFocus: false,
    enabled: isAuthenticated && !authLoading,
    retry: (failureCount, error: any) => {
      if (error?.status === 401) return false;
      return failureCount < 2;
    },
    select: (data: Settings | null): Settings => {
      console.log("use-settings: select function received data:", JSON.stringify(data, null, 2));
      
      if (!data) {
        console.log("use-settings: No data received, using defaults");
        return defaultSettings;
      }
      
      // Deep merge function to preserve nested objects
      const deepMerge = (target: any, source: any): any => {
        if (source === null || source === undefined) return target;
        if (typeof target !== 'object' || typeof source !== 'object') return source;
        
        const result = { ...target };
        for (const key in source) {
          if (source[key] !== undefined) {
            if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
              result[key] = deepMerge(target[key] || {}, source[key]);
            } else {
              result[key] = source[key];
            }
          }
        }
        return result;
      };
      
      // Ensure all required fields exist with proper fallbacks using deep merge
      const result = {
        aiProvider: data.aiProvider || defaultSettings.aiProvider,
        apiKeys: data.apiKeys || defaultSettings.apiKeys,
        promptTemplates: data.promptTemplates || defaultSettings.promptTemplates,
        defaultModifiers: data.defaultModifiers || defaultSettings.defaultModifiers,
        splitMode: data.splitMode !== undefined ? data.splitMode : defaultSettings.splitMode,
        inputHistory: Array.isArray(data.inputHistory) ? data.inputHistory : defaultSettings.inputHistory,
        integrations: data.integrations || defaultSettings.integrations,
        defaultIntegration: data.defaultIntegration || defaultSettings.defaultIntegration,
        testqualitySettings: deepMerge(defaultSettings.testqualitySettings || {}, data.testqualitySettings),
        generationOptions: deepMerge(defaultSettings.generationOptions, data.generationOptions),
      };
      
      // Validate critical fields and log warnings
      if (!result.testqualitySettings?.baseUrl) {
        console.warn("use-settings: TestQuality baseUrl missing, using default");
        result.testqualitySettings = result.testqualitySettings || {};
        result.testqualitySettings.baseUrl = defaultSettings.testqualitySettings?.baseUrl || "https://api.testquality.com/api";
      }
      
      console.log("use-settings: select function returning:", JSON.stringify(result, null, 2));
      return result;
    }
  });

  // Return settings with fallback to defaults
  const finalSettings = settings || defaultSettings;

  const updateMutation = useMutation({
    mutationFn: async (newSettings: Settings) => {
      console.log("use-settings: mutation sending to server:", JSON.stringify(newSettings, null, 2));
      console.log("use-settings: mutation integrations specifically:", JSON.stringify(newSettings.integrations, null, 2));
      try {
        const response = await apiRequest("POST", "/api/settings", newSettings);
        const result = await response.json();
        console.log("use-settings: mutation response received:", JSON.stringify(result, null, 2));
        return result;
      } catch (error) {
        console.error("use-settings: mutation error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("use-settings: mutation success, invalidating cache");
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error) => {
      console.error("use-settings: mutation failed:", error);
    },
  });

  const updateSettings = async (newSettings: Partial<Settings>) => {
    console.log("use-settings: updateSettings called with:", JSON.stringify(newSettings, null, 2));
    console.log("use-settings: finalSettings:", JSON.stringify(finalSettings, null, 2));
    
    const merged = { ...finalSettings, ...newSettings };
    console.log("use-settings: merged settings:", JSON.stringify(merged, null, 2));
    console.log("use-settings: merged integrations:", JSON.stringify(merged.integrations, null, 2));
    
    try {
      const result = await updateMutation.mutateAsync(merged);
      console.log("use-settings: updateSettings completed successfully");
      return result;
    } catch (error) {
      console.error("use-settings: updateSettings failed:", error);
      throw error;
    }
  };

  const resetSettings = async () => {
    return updateSettings(defaultSettings);
  };

  return {
    settings: finalSettings,
    isLoading,
    updateSettings,
    resetSettings,
    refetch,
    isUpdating: updateMutation.isPending,
  };
}
