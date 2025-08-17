import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Bot, Key, Check, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AIProvider {
  id: string;
  name: string;
  description: string;
  requiresApiKey: boolean;
  keyLabel: string;
}

interface UserSettings {
  aiProvider: string;
  apiKeys: Record<string, string>;
}

export default function AISettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [selectedProvider, setSelectedProvider] = useState<string>("");

  // Fetch available AI providers
  const { data: providers = [] } = useQuery<AIProvider[]>({
    queryKey: ["/api/ai/providers"],
  });

  // Fetch user settings
  const { data: settings } = useQuery<UserSettings>({
    queryKey: ["/api/settings"],
    onSuccess: (data) => {
      if (data) {
        setSelectedProvider(data.aiProvider || "openai");
        setApiKeys(data.apiKeys || {});
      }
    }
  });

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: (data: Partial<UserSettings>) =>
      apiRequest("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings Updated",
        description: "Your AI provider settings have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    updateSettings.mutate({
      aiProvider: selectedProvider,
      apiKeys: apiKeys,
    });
  };

  const handleApiKeyChange = (providerId: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [providerId]: value
    }));
  };

  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold">AI Provider Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Configure your AI providers and manage API keys for AI-powered features.
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          API keys are securely encrypted and stored in your user settings. 
          They are never shared or visible to other users.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {/* Default Provider Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Default AI Provider
            </CardTitle>
            <CardDescription>
              Choose your preferred AI provider for app features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default-provider">Default Provider</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider..." />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* API Key Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-orange-600" />
              API Key Management
            </CardTitle>
            <CardDescription>
              Configure API keys for each AI provider you want to use
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {providers.map((provider) => (
              <div key={provider.id} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{provider.name}</h4>
                    <p className="text-sm text-muted-foreground">{provider.description}</p>
                  </div>
                  {apiKeys[provider.id] && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </div>
                
                {provider.requiresApiKey && (
                  <div className="space-y-2">
                    <Label htmlFor={`${provider.id}-key`}>{provider.keyLabel}</Label>
                    <Input
                      id={`${provider.id}-key`}
                      type="password"
                      placeholder="Enter your API key..."
                      value={apiKeys[provider.id] || ""}
                      onChange={(e) => handleApiKeyChange(provider.id, e.target.value)}
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSaveSettings} 
            disabled={updateSettings.isPending}
          >
            {updateSettings.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}