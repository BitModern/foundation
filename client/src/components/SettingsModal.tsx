import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Save, RotateCcw, Loader2, Check, X, CheckCircle } from "lucide-react";
import { useHints } from "@/contexts/HintsContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { SiJira, SiLinear, SiGithub, SiOpenai, SiAnthropic } from 'react-icons/si';
import { TestQualityIcon, OpenRouterIcon } from '@/assets/icons';
import { useSettings } from "@/hooks/use-settings";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ConditionalTooltip } from "@/components/ui/conditional-tooltip";
import { Settings } from "@shared/schema";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, resetSettings, refetch, isLoading } = useSettings();
  const { toast } = useToast();
  const { hintsEnabled } = useHints();
  const { isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState<Settings>({
    aiProvider: "testquality",
    apiKeys: {},
    promptTemplates: {},
    defaultModifiers: {},
    splitMode: true,
    inputHistory: [],
    integrations: {},
    defaultIntegration: undefined,
  });
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, 'testing' | 'success' | 'error'>>({});

  // Fetch TestQuality projects when API token is available
  const { data: testQualityProjects, isLoading: projectsLoading, refetch: refetchProjects, error: projectsError } = useQuery({
    queryKey: ["/api/testquality/projects"],
    queryFn: async () => {
      const response = await fetch("/api/testquality/projects", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      // Extract projects array from the response
      return data.projects || [];
    },
    enabled: isOpen && isAuthenticated && !!formData.testqualitySettings?.apiToken,
    retry: false,
  });

  // Debug logging for TestQuality projects
  useEffect(() => {
    console.log("TestQuality Projects Debug:", {
      isOpen,
      isAuthenticated,
      hasApiToken: !!formData.testqualitySettings?.apiToken,
      apiToken: formData.testqualitySettings?.apiToken ? "[REDACTED]" : "none",
      projectsLoading,
      projectsError,
      testQualityProjects,
      isArray: Array.isArray(testQualityProjects),
      projectCount: Array.isArray(testQualityProjects) ? testQualityProjects.length : "N/A",
    });
  }, [isOpen, isAuthenticated, formData.testqualitySettings?.apiToken, projectsLoading, projectsError, testQualityProjects]);

  // Initialize form data when modal opens and settings are available
  useEffect(() => {
    console.log("SettingsModal: useEffect triggered", { isOpen, hasSettings: !!settings, isLoading, isInitialized });
    console.log("SettingsModal: Current settings object:", settings);
    if (isOpen && settings && !isLoading && !isInitialized) {
      console.log("SettingsModal: Initializing form data with settings:", JSON.stringify(settings, null, 2));
      const newFormData = {
        aiProvider: settings.aiProvider,
        apiKeys: settings.apiKeys || {},
        promptTemplates: settings.promptTemplates || {},
        defaultModifiers: settings.defaultModifiers || {},
        splitMode: settings.splitMode,
        inputHistory: settings.inputHistory || [],
        integrations: settings.integrations || {},
        defaultIntegration: settings.defaultIntegration || undefined,
        testqualitySettings: settings.testqualitySettings || {
          apiToken: "",
          projectId: undefined,
          baseUrl: "https://api.testquality.com/api",
        },
      };
      console.log("SettingsModal: Setting formData to:", JSON.stringify(newFormData, null, 2));
      setFormData(newFormData);
      setIsInitialized(true);
    } else {
      console.log("SettingsModal: Not initializing because:", { 
        isOpen, 
        hasSettings: !!settings, 
        isLoading, 
        isInitialized 
      });
    }
  }, [isOpen, settings, isLoading, isInitialized]);

  // Reset initialization when modal closes
  useEffect(() => {
    if (!isOpen) {
      console.log("SettingsModal: Modal closed, resetting initialization");
      setIsInitialized(false);
    }
  }, [isOpen]);

  const handleSave = async () => {
    try {
      console.log("SettingsModal: Saving form data:", JSON.stringify(formData, null, 2));
      console.log("SettingsModal: Integrations specifically:", JSON.stringify(formData.integrations, null, 2));
      
      await updateSettings(formData);
      toast({
        title: "Settings Saved",
        description: "Your settings have been saved successfully.",
      });
      onClose();
    } catch (error) {
      console.error("SettingsModal: Save error:", error);
      toast({
        title: "Save Failed", 
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReset = async () => {
    try {
      await resetSettings();
      // Reset form to default values
      setFormData({
        aiProvider: "testquality",
        apiKeys: {},
        promptTemplates: {},
        defaultModifiers: {},
        splitMode: true,
        inputHistory: [],
        integrations: {},
        testqualitySettings: {
          apiToken: "",
          projectId: undefined,
          baseUrl: "https://api.testquality.com/api",
        },
      });
      toast({
        title: "Settings Reset",
        description: "Settings have been reset to defaults.",
      });
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: "Failed to reset settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleApiKeyVisibility = (provider: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const updateApiKey = (provider: string, value: string) => {
    setFormData((prev: Settings) => ({
      ...prev,
      apiKeys: {
        ...prev.apiKeys,
        [provider]: value
      }
    }));
  };

  const updatePromptTemplate = (type: string, value: string) => {
    setFormData((prev: Settings) => ({
      ...prev,
      promptTemplates: {
        ...prev.promptTemplates,
        [type]: value
      }
    }));
  };

  // Test API connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async ({ provider, apiKey }: { provider: string; apiKey: string }) => {
      const response = await apiRequest("POST", "/api/test-connection", {
        provider,
        apiKey,
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      setTestResults(prev => ({ ...prev, [variables.provider]: 'success' }));
      toast({
        title: "Connection Successful",
        description: `${variables.provider} API connection is working properly.`,
      });
      setTimeout(() => {
        setTestResults(prev => {
          const newResults = { ...prev };
          delete newResults[variables.provider];
          return newResults;
        });
      }, 3000);
    },
    onError: (error, variables) => {
      setTestResults(prev => ({ ...prev, [variables.provider]: 'error' }));
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${variables.provider} API. Please check your API key.`,
        variant: "destructive",
      });
      setTimeout(() => {
        setTestResults(prev => {
          const newResults = { ...prev };
          delete newResults[variables.provider];
          return newResults;
        });
      }, 3000);
    },
  });

  const testConnection = (provider: string) => {
    let apiKey = "";
    
    // Get the appropriate API key based on provider type
    switch (provider) {
      case "openai":
      case "anthropic":
      case "openrouter":
        apiKey = formData.apiKeys?.[provider] || "";
        break;
      case "testquality":
        apiKey = formData.testqualitySettings?.apiToken || "";
        break;
      case "jira":
        apiKey = formData.integrations?.jira?.apiToken || "";
        break;
      case "linear":
        apiKey = formData.integrations?.linear?.apiKey || "";
        break;
      case "github":
        apiKey = formData.integrations?.github?.accessToken || "";
        break;
      default:
        apiKey = "";
    }
    
    if (!apiKey) {
      toast({
        title: "No API Key",
        description: `Please enter an API key for ${provider} first.`,
        variant: "destructive",
      });
      return;
    }
    
    setTestResults(prev => ({ ...prev, [provider]: 'testing' }));
    
    // Send additional data for integrations that need it
    const connectionData: any = { provider, apiKey };
    if (provider === "jira") {
      connectionData.jiraUrl = formData.integrations?.jira?.url;
      connectionData.jiraEmail = formData.integrations?.jira?.email;
    }
    
    testConnectionMutation.mutate(connectionData);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "openai":
        return <SiOpenai className="w-4 h-4 text-black dark:text-white" />;
      case "anthropic":
        return <SiAnthropic className="w-4 h-4 text-orange-600" />;
      case "openrouter":
        return <OpenRouterIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTestButtonIcon = (provider: string) => {
    const status = testResults[provider];
    switch (status) {
      case 'testing':
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'error':
        return <X className="h-3 w-3 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-visible">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your AI providers, API keys, and integration settings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[80vh] overflow-y-auto pr-2">
        
        <div className="space-y-6">
          {/* Debug info while loading */}
          {!isInitialized && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Loading settings...</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* API Keys Section */}
            <Card>
              <CardHeader>
                <ConditionalTooltip content={<p>Store your API keys securely for AI providers like OpenAI, Anthropic, and OpenRouter</p>}>
                  <CardTitle>API Keys</CardTitle>
                </ConditionalTooltip>
                {isInitialized && (
                  <p className="text-sm text-muted-foreground">
                    Current keys: {Object.keys(formData.apiKeys).filter(k => formData.apiKeys[k]).length} saved
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "openai", label: "OpenAI API Key", placeholder: "sk-..." },
                  { key: "anthropic", label: "Anthropic API Key", placeholder: "sk-ant-..." },
                  { key: "openrouter", label: "OpenRouter API Key", placeholder: "sk-or-..." },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getProviderIcon(key)}
                        <Label htmlFor={key}>{label}</Label>
                      </div>
                      <ConditionalTooltip content={<p>Test your API key connection to verify it's working correctly</p>}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => testConnection(key)}
                          disabled={!formData.apiKeys?.[key] || testResults[key] === 'testing'}
                          className="h-7 px-2 text-xs"
                        >
                          {getTestButtonIcon(key)}
                          <span className="ml-1">
                            {testResults[key] === 'testing' ? 'Testing...' : 
                             testResults[key] === 'success' ? 'Connected' :
                             testResults[key] === 'error' ? 'Failed' : 'Test'}
                          </span>
                        </Button>
                      </ConditionalTooltip>
                    </div>
                    <ConditionalTooltip
                      content={<p>Enter your {label.replace(' API Key', '')} API key to enable this AI provider for test case generation</p>}
                    >
                      <div className="relative">
                        <Input
                          id={key}
                          type={showApiKeys[key] ? "text" : "password"}
                          placeholder={placeholder}
                          value={formData.apiKeys?.[key] || ""}
                          onChange={(e) => updateApiKey(key, e.target.value)}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => toggleApiKeyVisibility(key)}
                        >
                          {showApiKeys[key] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </ConditionalTooltip>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Prompt Templates Section */}
            <Card>
              <CardHeader>
                <ConditionalTooltip content={<p>Customize the AI prompts used for generating test cases and GitHub PRs</p>}>
                  <CardTitle>Prompt Templates</CardTitle>
                </ConditionalTooltip>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <ConditionalTooltip content={<p>Override the default AI prompt used for generating test cases. Leave empty to use the built-in prompt.</p>}>
                    <Label htmlFor="testcase-prompt">Test Case Generation Prompt</Label>
                  </ConditionalTooltip>
                  <Textarea
                    id="testcase-prompt"
                    placeholder="Enter your custom prompt template for test case generation..."
                    value={formData.promptTemplates?.testCase || ""}
                    onChange={(e) => updatePromptTemplate("testCase", e.target.value)}
                    className="h-32 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <ConditionalTooltip content={<p>Customize the AI prompt used when creating GitHub pull requests with test cases.</p>}>
                    <Label htmlFor="github-prompt">GitHub PR Generation Prompt</Label>
                  </ConditionalTooltip>
                  <Textarea
                    id="github-prompt"
                    placeholder="Enter your custom prompt template for GitHub PR generation..."
                    value={formData.promptTemplates?.githubPR || ""}
                    onChange={(e) => updatePromptTemplate("githubPR", e.target.value)}
                    className="h-32 resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Integrations Section */}
            <Card>
              <CardHeader>
                <ConditionalTooltip content={<p>Connect to project management tools like Jira, Linear, and GitHub to import real issues and stories</p>}>
                  <CardTitle>External Integrations</CardTitle>
                </ConditionalTooltip>
                <p className="text-sm text-muted-foreground">
                  Connect to external tools to import issues and stories
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Default Integration Selection */}
                <div className="space-y-2">
                  <ConditionalTooltip content={<p>Set which integration will be selected automatically when you click Import Issue</p>}>
                    <Label>Default Integration for Import</Label>
                  </ConditionalTooltip>
                  <Select 
                    value={formData.defaultIntegration || "none"} 
                    onValueChange={(value) => {
                      setFormData(prev => ({
                        ...prev,
                        defaultIntegration: value === "none" ? undefined : value as "jira" | "linear" | "github"
                      }));
                    }}
                  >
                    <ConditionalTooltip
                      content={<p>Choose which integration service will be pre-selected when you click Import Issue</p>}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select default integration..." />
                      </SelectTrigger>
                    </ConditionalTooltip>
                    <SelectContent>
                      <SelectItem value="none">None (show all options)</SelectItem>
                      <SelectItem value="jira">
                        <div className="flex items-center space-x-2">
                          <SiJira className="w-3 h-3 text-blue-600" />
                          <span>Jira</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="linear">
                        <div className="flex items-center space-x-2">
                          <SiLinear className="w-3 h-3 text-purple-600" />
                          <span>Linear</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="github">
                        <div className="flex items-center space-x-2">
                          <SiGithub className="w-3 h-3 text-gray-800 dark:text-gray-200" />
                          <span>GitHub</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Choose which integration to use by default when importing stories
                  </p>
                </div>

                {/* Jira Integration */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <SiJira className="w-4 h-4 text-blue-600" />
                      <label className="text-sm font-medium">Jira</label>
                    </div>
                    <ConditionalTooltip
                      content={<p>Test your Jira connection to verify your credentials are working correctly</p>}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => testConnection('jira')}
                        disabled={!formData.integrations?.jira?.url || !formData.integrations?.jira?.apiToken || testResults['jira'] === 'testing'}
                        className="h-7 px-2 text-xs"
                      >
                      {getTestButtonIcon('jira')}
                        <span className="ml-1">
                          {testResults['jira'] === 'testing' ? 'Testing...' : 
                           testResults['jira'] === 'success' ? 'Connected' :
                           testResults['jira'] === 'error' ? 'Failed' : 'Test'}
                        </span>
                      </Button>
                    </ConditionalTooltip>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <ConditionalTooltip
                      content={<p>Enter your Jira instance URL (e.g., https://company.atlassian.net)</p>}
                    >
                      <Input
                        placeholder="Jira URL (e.g., https://company.atlassian.net)"
                        value={formData.integrations?.jira?.url || ""}
                        onChange={(e) => {
                          console.log("Jira URL input changed:", e.target.value);
                          setFormData(prev => {
                            const newData = {
                              ...prev,
                              integrations: {
                                ...prev.integrations,
                                jira: {
                                  ...prev.integrations?.jira,
                                  url: e.target.value
                                }
                              }
                            };
                            console.log("Updated formData after Jira URL change:", JSON.stringify(newData.integrations, null, 2));
                            return newData;
                          });
                        }}
                      />
                    </ConditionalTooltip>
                    <ConditionalTooltip
                      content={<p>Enter the email address associated with your Jira account</p>}
                    >
                      <Input
                        placeholder="Email"
                        value={formData.integrations?.jira?.email || ""}
                        onChange={(e) => {
                          console.log("Jira email input changed:", e.target.value);
                          setFormData(prev => {
                            const newData = {
                              ...prev,
                              integrations: {
                                ...prev.integrations,
                                jira: {
                                  ...prev.integrations?.jira,
                                  email: e.target.value
                                }
                              }
                            };
                            console.log("Updated formData after Jira email change:", JSON.stringify(newData.integrations, null, 2));
                            return newData;
                          });
                        }}
                      />
                    </ConditionalTooltip>
                    <ConditionalTooltip
                      content={<p>Generate a Jira API token from your account settings to authenticate requests</p>}
                    >
                      <div className="relative">
                        <Input
                          type={showApiKeys['jira'] ? "text" : "password"}
                          placeholder="API Token"
                          value={formData.integrations?.jira?.apiToken || ""}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              integrations: {
                                ...prev.integrations,
                                jira: {
                                  ...prev.integrations?.jira,
                                  apiToken: e.target.value
                                }
                              }
                            }));
                          }}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => toggleApiKeyVisibility('jira')}
                        >
                          {showApiKeys['jira'] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </ConditionalTooltip>
                  </div>
                </div>

                {/* Linear Integration */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <SiLinear className="w-4 h-4 text-purple-600" />
                      <label className="text-sm font-medium">Linear</label>
                    </div>
                    <ConditionalTooltip
                      content={<p>Test your Linear API connection to verify your API key is working correctly</p>}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => testConnection('linear')}
                        disabled={!formData.integrations?.linear?.apiKey || testResults['linear'] === 'testing'}
                        className="h-7 px-2 text-xs"
                      >
                      {getTestButtonIcon('linear')}
                        <span className="ml-1">
                          {testResults['linear'] === 'testing' ? 'Testing...' : 
                           testResults['linear'] === 'success' ? 'Connected' :
                           testResults['linear'] === 'error' ? 'Failed' : 'Test'}
                        </span>
                      </Button>
                    </ConditionalTooltip>
                  </div>
                  <ConditionalTooltip
                    content={<p>Generate a Personal API Key from your Linear settings to access your team's issues</p>}
                  >
                    <div className="relative">
                      <Input
                        type={showApiKeys['linear'] ? "text" : "password"}
                        placeholder="Linear API Key"
                        value={formData.integrations?.linear?.apiKey || ""}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            integrations: {
                              ...prev.integrations,
                              linear: {
                                ...prev.integrations?.linear,
                                apiKey: e.target.value
                              }
                            }
                          }));
                        }}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => toggleApiKeyVisibility('linear')}
                      >
                        {showApiKeys['linear'] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </ConditionalTooltip>
                </div>

                {/* GitHub Integration */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <SiGithub className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                      <label className="text-sm font-medium">GitHub</label>
                    </div>
                    <ConditionalTooltip
                      content={<p>Test your GitHub access token to verify it has proper repository permissions</p>}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => testConnection('github')}
                        disabled={!formData.integrations?.github?.accessToken || testResults['github'] === 'testing'}
                        className="h-7 px-2 text-xs"
                      >
                      {getTestButtonIcon('github')}
                        <span className="ml-1">
                          {testResults['github'] === 'testing' ? 'Testing...' : 
                           testResults['github'] === 'success' ? 'Connected' :
                           testResults['github'] === 'error' ? 'Failed' : 'Test'}
                        </span>
                      </Button>
                    </ConditionalTooltip>
                  </div>
                  <ConditionalTooltip
                    content={<p>Generate a Personal Access Token from GitHub Settings &gt; Developer settings with repository access</p>}
                  >
                    <div className="relative">
                      <Input
                        type={showApiKeys['github'] ? "text" : "password"}
                        placeholder="GitHub Personal Access Token"
                        value={formData.integrations?.github?.accessToken || ""}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            integrations: {
                              ...prev.integrations,
                              github: {
                                ...prev.integrations?.github,
                                accessToken: e.target.value
                              }
                            }
                          }));
                        }}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => toggleApiKeyVisibility('github')}
                      >
                        {showApiKeys['github'] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </ConditionalTooltip>
                </div>
              </CardContent>
            </Card>

            {/* TestQuality Integration */}
            <Card>
              <CardHeader>
                <ConditionalTooltip content={<p>Connect to TestQuality to export generated test cases directly to your projects</p>}>
                  <CardTitle>TestQuality Integration</CardTitle>
                </ConditionalTooltip>
                <p className="text-sm text-muted-foreground">
                  Export test cases directly to your TestQuality projects
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>TestQuality API</Label>
                  <ConditionalTooltip
                    content={<p>Test your TestQuality API connection to verify your token is working correctly</p>}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => testConnection('testquality')}
                      disabled={!formData.testqualitySettings?.apiToken || testResults['testquality'] === 'testing'}
                      className="h-7 px-2 text-xs"
                    >
                    {getTestButtonIcon('testquality')}
                      <span className="ml-1">
                        {testResults['testquality'] === 'testing' ? 'Testing...' : 
                         testResults['testquality'] === 'success' ? 'Connected' :
                         testResults['testquality'] === 'error' ? 'Failed' : 'Test'}
                      </span>
                    </Button>
                  </ConditionalTooltip>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <ConditionalTooltip
                      content={<p>Enter your TestQuality API token to enable exporting test cases directly to your projects</p>}
                    >
                      <Label htmlFor="testquality-token">API Token</Label>
                    </ConditionalTooltip>
                    <ConditionalTooltip
                      content={<p>Enter your TestQuality API token from your account settings to enable project integration</p>}
                    >
                      <div className="relative">
                        <Input
                          id="testquality-token"
                          type={showApiKeys['testquality'] ? "text" : "password"}
                          placeholder="Enter your TestQuality API token..."
                          value={formData.testqualitySettings?.apiToken || ""}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              testqualitySettings: {
                                ...prev.testqualitySettings,
                                apiToken: e.target.value,
                                baseUrl: prev.testqualitySettings?.baseUrl || "https://api.testquality.com/api",
                              }
                            }));
                            // Refetch projects when token changes
                            if (e.target.value && e.target.value !== formData.testqualitySettings?.apiToken) {
                              setTimeout(() => refetchProjects(), 500);
                            }
                          }}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => toggleApiKeyVisibility('testquality')}
                        >
                          {showApiKeys['testquality'] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </ConditionalTooltip>
                  </div>

                  <div className="space-y-2">
                    <ConditionalTooltip
                      content={<p>Select the TestQuality project where generated test cases will be exported</p>}
                    >
                      <Label htmlFor="testquality-project">Project</Label>
                    </ConditionalTooltip>
                    <Select
                      value={formData.testqualitySettings?.projectId?.toString() || ""}
                      onValueChange={(value) => {
                        setFormData(prev => ({
                          ...prev,
                          testqualitySettings: {
                            ...prev.testqualitySettings,
                            projectId: value ? parseInt(value) : undefined,
                            apiToken: prev.testqualitySettings?.apiToken || "",
                            baseUrl: prev.testqualitySettings?.baseUrl || "https://api.testquality.com/api",
                          }
                        }));
                      }}
                    >
                      <ConditionalTooltip
                        content={<p>Choose the TestQuality project where your generated test cases will be exported</p>}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            projectsLoading ? "Loading projects..." :
                            !formData.testqualitySettings?.apiToken ? "Enter API token first" :
                            "Select a project..."
                          } />
                        </SelectTrigger>
                      </ConditionalTooltip>
                      <SelectContent>
                        {projectsLoading && (
                          <div className="p-2 text-sm text-muted-foreground">Loading projects...</div>
                        )}
                        {projectsError && (
                          <div className="p-2 text-sm text-red-600">Error loading projects</div>
                        )}
                        {!projectsLoading && !projectsError && Array.isArray(testQualityProjects) && testQualityProjects.length === 0 && (
                          <div className="p-2 text-sm text-muted-foreground">No projects found</div>
                        )}
                        {Array.isArray(testQualityProjects) && testQualityProjects.map((project: any) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))}
                        {/* Debug info */}
                        {!projectsLoading && (
                          <div className="p-2 text-xs text-gray-400 border-t">
                            Debug: {Array.isArray(testQualityProjects) ? `${testQualityProjects.length} projects` : 'Not an array'} | Token: {formData.testqualitySettings?.apiToken ? 'Present' : 'Missing'}
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* General Settings */}
            <Card>
              <CardHeader>
                <ConditionalTooltip
                  content={<p>Configure default behavior and preferences for the application</p>}
                >
                  <CardTitle>General Settings</CardTitle>
                </ConditionalTooltip>
                <p className="text-sm text-muted-foreground">
                  Configure default behavior and AI provider preferences
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <ConditionalTooltip
                    content={<p>Set which AI service to use by default when generating test cases</p>}
                  >
                    <Label htmlFor="ai-provider">Default AI Provider</Label>
                  </ConditionalTooltip>
                  <Select
                    value={formData.aiProvider}
                    onValueChange={(value) => setFormData((prev: Settings) => ({ ...prev, aiProvider: value as any }))}
                  >
                    <ConditionalTooltip
                      content={<p>Choose your preferred AI service for generating test cases by default</p>}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select AI provider" />
                      </SelectTrigger>
                    </ConditionalTooltip>
                    <SelectContent>
                      <SelectItem value="testquality">
                        <div className="flex items-center space-x-2">
                          <TestQualityIcon className="w-3 h-3 text-blue-600" />
                          <span>TestQuality</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="openai">
                        <div className="flex items-center space-x-2">
                          <SiOpenai className="w-3 h-3 text-emerald-600" />
                          <span>OpenAI</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="anthropic">
                        <div className="flex items-center space-x-2">
                          <SiAnthropic className="w-3 h-3 text-orange-500" />
                          <span>Anthropic</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="openrouter">
                        <div className="flex items-center space-x-2">
                          <OpenRouterIcon className="w-3 h-3 text-blue-600" />
                          <span>OpenRouter</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <ConditionalTooltip
                    content={<p>Choose whether to split stories by acceptance criteria or create single test cases by default</p>}
                  >
                    <Label htmlFor="default-split">Default Split Mode</Label>
                  </ConditionalTooltip>
                  <Select
                    value={formData.splitMode ? "split" : "single"}
                    onValueChange={(value) => setFormData((prev: Settings) => ({ ...prev, splitMode: value === "split" }))}
                  >
                    <ConditionalTooltip
                      content={<p>Choose how test cases are generated: split creates multiple test cases per story, single creates one comprehensive test case</p>}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                    </ConditionalTooltip>
                    <SelectContent>
                      <SelectItem value="split">Split by Acceptance Criteria</SelectItem>
                      <SelectItem value="single">Single Test Case Mode</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex items-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset to Defaults</span>
            </Button>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  console.log("=== SAVE BUTTON CLICKED ===");
                  console.log("Current formData:", JSON.stringify(formData, null, 2));
                  console.log("Current formData.integrations:", JSON.stringify(formData.integrations, null, 2));
                  handleSave();
                }} 
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Save Settings</span>
              </Button>
            </div>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}