import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ConditionalTooltip } from "@/components/ui/conditional-tooltip";
import { SiOpenai, SiAnthropic } from 'react-icons/si';
import { TestQualityIcon, OpenRouterIcon, GeminiIcon, GrokIcon } from '@/assets/icons';
import { useAIProvider } from "@/contexts/AIProviderContext";

export const AIProviderCard: React.FC = () => {
  const {
    selectedProvider,
    setSelectedProvider,
    selectedModel,
    setSelectedModel,
    modelsData,
    providers,
    needsApiKey,
    hasRequiredApiKey
  } = useAIProvider();

  const models = (modelsData as any)?.models || [];

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'testquality':
        return <TestQualityIcon className="w-3 h-3" />;
      case 'openai':
        return <SiOpenai className="w-3 h-3 text-emerald-600" />;
      case 'anthropic':
        return <SiAnthropic className="w-3 h-3 text-orange-500" />;
      case 'openrouter':
        return <OpenRouterIcon className="w-3 h-3 text-blue-600" />;
      default:
        return null;
    }
  };

  const getModelIcon = (model: string) => {
    if (model.includes('gpt') || model.includes('openai')) {
      return <SiOpenai className="w-3 h-3 text-emerald-600" />;
    } else if (model.includes('claude') || model.includes('anthropic')) {
      return <SiAnthropic className="w-3 h-3 text-orange-500" />;
    } else if (model.includes('gemini')) {
      return <GeminiIcon className="w-3 h-3" />;
    } else if (model.includes('grok')) {
      return <GrokIcon className="w-3 h-3 text-black dark:text-white" />;
    } else if (selectedProvider === 'testquality') {
      return <TestQualityIcon className="w-3 h-3" />;
    } else if (selectedProvider === 'openrouter') {
      return <OpenRouterIcon className="w-3 h-3 text-blue-600" />;
    }
    return null;
  };

  // Update selected model when provider changes or models are loaded
  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0]);
    } else if (models.length > 0 && !models.includes(selectedModel)) {
      setSelectedModel(models[0]);
    }
  }, [models, selectedModel, setSelectedModel]);

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    setSelectedModel(""); // Reset model when provider changes
  };

  return (
    <Card className="w-full min-w-0 sm:min-w-[280px]">
      <CardHeader className="pb-4">
        <ConditionalTooltip
          content={<p>Choose which AI service and specific model to use for generating test cases</p>}
        >
          <CardTitle className="text-lg">AI Provider & Model</CardTitle>
        </ConditionalTooltip>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <ConditionalTooltip
              content={<p>Select AI provider: TestQuality (free), OpenAI, Anthropic, or OpenRouter for accessing multiple models</p>}
            >
              <div>
                <Label htmlFor="provider">Provider</Label>
                <Select value={selectedProvider} onValueChange={handleProviderChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider.value} value={provider.value}>
                        <div className="flex items-center space-x-2">
                          {getProviderIcon(provider.value)}
                          <span>{provider.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </ConditionalTooltip>
          </div>
          <div className="space-y-2">
            <ConditionalTooltip
              content={<p>Choose the specific AI model for generation. Different models have varying capabilities and costs.</p>}
            >
              <div>
                <Label htmlFor="model">Model</Label>
                <Select 
                  value={selectedModel} 
                  onValueChange={setSelectedModel}
                  disabled={!models.length}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={models.length ? "Select model" : "Loading models..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model: string) => (
                      <SelectItem key={model} value={model}>
                        <div className="flex items-center space-x-2">
                          {getModelIcon(model)}
                          <span>{model}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </ConditionalTooltip>
          </div>
          {selectedProvider === "testquality" ? (
            <div className="text-sm text-green-600 bg-green-50 dark:bg-green-900 dark:text-green-200 p-3 rounded-lg">
              ✓ Free provider - no API key required
            </div>
          ) : needsApiKey && !hasRequiredApiKey ? (
            <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-900 dark:text-amber-200 p-3 rounded-lg">
              ⚠ API key required - configure in Settings
            </div>
          ) : hasRequiredApiKey ? (
            <div className="text-sm text-green-600 bg-green-50 dark:bg-green-900 dark:text-green-200 p-3 rounded-lg">
              ✓ API key configured
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};