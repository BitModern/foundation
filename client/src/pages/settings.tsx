import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, AlertCircle, CheckCircle, Eye, EyeOff, Check, X } from "lucide-react";
import { SiJira, SiLinear, SiGithub, SiOpenai, SiAnthropic } from 'react-icons/si';
import { TestQualityIcon, OpenRouterIcon } from '@/assets/icons';
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ConditionalTooltip } from "@/components/ui/conditional-tooltip";

export default function SettingsPage() {
  const { toast } = useToast();
  const { settings, updateSettings, isLoading, isUpdating } = useSettings();
  const { isAuthenticated } = useAuth();
  
  // Local state for form
  const [formData, setFormData] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, 'testing' | 'success' | 'error'>>({});

  // Initialize form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData(settings);
      setHasChanges(false);
    }
  }, [settings]);

  // Fetch TestQuality projects when API token is available
  const { data: testQualityProjects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/testquality/projects"],
    queryFn: async () => {
      const response = await fetch("/api/testquality/projects", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      return data.projects || [];
    },
    enabled: isAuthenticated && !!formData.testqualitySettings?.apiToken,
    retry: false,
  });

  const handleSave = async () => {
    if (!hasChanges) return;
    
    try {
      await updateSettings(formData);
      setHasChanges(false);
      toast({
        title: "Settings Saved",
        description: "Your settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateFormData = (updates: any) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const toggleApiKeyVisibility = (provider: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
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
    testConnectionMutation.mutate({ provider, apiKey });
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

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
              <h2 className="text-lg font-semibold">Authentication Required</h2>
              <p className="text-muted-foreground">Please log in to access settings.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure your AI providers, integrations, and preferences.
          </p>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges || isUpdating}>
          {isUpdating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isUpdating ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="ai-providers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="ai-providers">AI Providers</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="testquality">TestQuality</TabsTrigger>
        </TabsList>

        {/* AI Providers Tab */}
        <TabsContent value="ai-providers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Default AI Provider</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select 
                value={formData.aiProvider} 
                onValueChange={(value) => updateFormData({ aiProvider: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="testquality">
                    <div className="flex items-center">
                      <TestQualityIcon className="w-4 h-4 mr-2" />
                      TestQualityAI (Free)
                    </div>
                  </SelectItem>
                  <SelectItem value="openai">
                    <div className="flex items-center">
                      <SiOpenai className="w-4 h-4 mr-2" />
                      OpenAI
                    </div>
                  </SelectItem>
                  <SelectItem value="anthropic">
                    <div className="flex items-center">
                      <SiAnthropic className="w-4 h-4 mr-2" />
                      Anthropic
                    </div>
                  </SelectItem>
                  <SelectItem value="openrouter">
                    <div className="flex items-center">
                      <OpenRouterIcon className="w-4 h-4 mr-2" />
                      OpenRouter
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <ConditionalTooltip content={<p>Store your API keys securely for AI providers like OpenAI, Anthropic, and OpenRouter</p>}>
                <CardTitle>API Keys</CardTitle>
              </ConditionalTooltip>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'openai', label: 'OpenAI API Key', icon: SiOpenai, placeholder: 'sk-...' },
                { key: 'anthropic', label: 'Anthropic API Key', icon: SiAnthropic, placeholder: 'sk-ant-...' },
                { key: 'openrouter', label: 'OpenRouter API Key', icon: OpenRouterIcon, placeholder: 'sk-or-...' },
              ].map(({ key, label, icon: Icon, placeholder }) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {Icon && <Icon className="w-4 h-4" />}
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
                  <ConditionalTooltip content={<p>Enter your {label.replace(' API Key', '')} API key to enable this AI provider for test case generation</p>}>
                    <div className="relative">
                      <Input
                        id={key}
                        type={showApiKeys[key] ? "text" : "password"}
                        value={formData.apiKeys?.[key] || ""}
                        onChange={(e) => updateFormData({ 
                          apiKeys: { ...formData.apiKeys, [key]: e.target.value } 
                        })}
                        placeholder={placeholder}
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
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <ConditionalTooltip content={<p>Set which integration will be selected automatically when you click Import Issue</p>}>
                <CardTitle>Default Integration</CardTitle>
              </ConditionalTooltip>
            </CardHeader>
            <CardContent>
              <Select 
                value={formData.defaultIntegration || "none"} 
                onValueChange={(value) => updateFormData({ defaultIntegration: value === "none" ? undefined : value })}
              >
                <ConditionalTooltip content={<p>Choose which integration service will be pre-selected when you click Import Issue</p>}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select default integration" />
                  </SelectTrigger>
                </ConditionalTooltip>
                <SelectContent>
                  <SelectItem value="none">None (show all options)</SelectItem>
                  <SelectItem value="jira">
                    <div className="flex items-center">
                      <SiJira className="w-4 h-4 mr-2 text-blue-600" />
                      Jira
                    </div>
                  </SelectItem>
                  <SelectItem value="linear">
                    <div className="flex items-center">
                      <SiLinear className="w-4 h-4 mr-2 text-purple-600" />
                      Linear
                    </div>
                  </SelectItem>
                  <SelectItem value="github">
                    <div className="flex items-center">
                      <SiGithub className="w-4 h-4 mr-2 text-gray-800 dark:text-gray-200" />
                      GitHub
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Integration Settings */}
          <Card>
            <CardHeader>
              <ConditionalTooltip content={<p>Connect to project management tools like Jira, Linear, and GitHub to import real issues and stories</p>}>
                <CardTitle>Integration Settings</CardTitle>
              </ConditionalTooltip>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Jira Integration */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <SiJira className="w-4 h-4 text-blue-600" />
                    <label className="text-sm font-medium">Jira</label>
                  </div>
                  <ConditionalTooltip content={<p>Test your Jira connection to verify your credentials are working correctly</p>}>
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
                  <ConditionalTooltip content={<p>Enter your Jira instance URL (e.g., https://company.atlassian.net)</p>}>
                    <Input
                      placeholder="Jira URL (e.g., https://company.atlassian.net)"
                      value={formData.integrations?.jira?.url || ""}
                      onChange={(e) => updateFormData({
                        integrations: {
                          ...formData.integrations,
                          jira: {
                            ...formData.integrations?.jira,
                            url: e.target.value
                          }
                        }
                      })}
                    />
                  </ConditionalTooltip>
                  <ConditionalTooltip content={<p>Enter the email address associated with your Jira account</p>}>
                    <Input
                      placeholder="Email"
                      value={formData.integrations?.jira?.email || ""}
                      onChange={(e) => updateFormData({
                        integrations: {
                          ...formData.integrations,
                          jira: {
                            ...formData.integrations?.jira,
                            email: e.target.value
                          }
                        }
                      })}
                    />
                  </ConditionalTooltip>
                  <ConditionalTooltip content={<p>Enter your Jira API token (create one in your Atlassian account settings)</p>}>
                    <div className="relative">
                      <Input
                        type={showApiKeys['jira'] ? "text" : "password"}
                        placeholder="API Token"
                        value={formData.integrations?.jira?.apiToken || ""}
                        onChange={(e) => updateFormData({
                          integrations: {
                            ...formData.integrations,
                            jira: {
                              ...formData.integrations?.jira,
                              apiToken: e.target.value
                            }
                          }
                        })}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => toggleApiKeyVisibility('jira')}
                      >
                        {showApiKeys['jira'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  <ConditionalTooltip content={<p>Test your Linear connection to verify your API key is working correctly</p>}>
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
                <ConditionalTooltip content={<p>Enter your Linear API key (create one in Linear Settings → API)</p>}>
                  <div className="relative">
                    <Input
                      type={showApiKeys['linear'] ? "text" : "password"}
                      placeholder="Linear API Key"
                      value={formData.integrations?.linear?.apiKey || ""}
                      onChange={(e) => updateFormData({
                        integrations: {
                          ...formData.integrations,
                          linear: {
                            ...formData.integrations?.linear,
                            apiKey: e.target.value
                          }
                        }
                      })}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => toggleApiKeyVisibility('linear')}
                    >
                      {showApiKeys['linear'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  <ConditionalTooltip content={<p>Test your GitHub connection to verify your access token is working correctly</p>}>
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
                <div className="grid grid-cols-2 gap-3">
                  <ConditionalTooltip content={<p>Enter your default GitHub organization or username</p>}>
                    <Input
                      placeholder="Organization/Username"
                      value={formData.integrations?.github?.defaultOrg || ""}
                      onChange={(e) => updateFormData({
                        integrations: {
                          ...formData.integrations,
                          github: {
                            ...formData.integrations?.github,
                            defaultOrg: e.target.value
                          }
                        }
                      })}
                    />
                  </ConditionalTooltip>
                  <ConditionalTooltip content={<p>Enter your default repository name</p>}>
                    <Input
                      placeholder="Repository"
                      value={formData.integrations?.github?.defaultRepo || ""}
                      onChange={(e) => updateFormData({
                        integrations: {
                          ...formData.integrations,
                          github: {
                            ...formData.integrations?.github,
                            defaultRepo: e.target.value
                          }
                        }
                      })}
                    />
                  </ConditionalTooltip>
                </div>
                <ConditionalTooltip content={<p>Enter your GitHub personal access token with repo permissions</p>}>
                  <div className="relative">
                    <Input
                      type={showApiKeys['github'] ? "text" : "password"}
                      placeholder="GitHub Personal Access Token"
                      value={formData.integrations?.github?.accessToken || ""}
                      onChange={(e) => updateFormData({
                        integrations: {
                          ...formData.integrations,
                          github: {
                            ...formData.integrations?.github,
                            accessToken: e.target.value
                          }
                        }
                      })}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => toggleApiKeyVisibility('github')}
                    >
                      {showApiKeys['github'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </ConditionalTooltip>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generation Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="split-mode">Split by Acceptance Criteria</Label>
                <Switch
                  id="split-mode"
                  checked={formData.splitMode || false}
                  onCheckedChange={(checked) => updateFormData({ splitMode: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TestQuality Tab */}
        <TabsContent value="testquality" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TestQualityIcon className="w-5 h-5 mr-2" />
                  <ConditionalTooltip content={<p>Configure TestQuality integration to export test cases directly to your TestQuality projects</p>}>
                    <CardTitle>TestQuality Settings</CardTitle>
                  </ConditionalTooltip>
                </div>
                <ConditionalTooltip content={<p>Test your TestQuality API connection to verify your token is working correctly</p>}>
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
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <ConditionalTooltip content={<p>Enter your TestQuality API token (create one in TestQuality Settings → API Keys)</p>}>
                  <Label htmlFor="tq-token">API Token</Label>
                </ConditionalTooltip>
                <div className="relative">
                  <Input
                    id="tq-token"
                    type={showApiKeys['testquality'] ? "text" : "password"}
                    value={formData.testqualitySettings?.apiToken || ""}
                    onChange={(e) => updateFormData({ 
                      testqualitySettings: { 
                        ...formData.testqualitySettings, 
                        apiToken: e.target.value 
                      } 
                    })}
                    placeholder="Enter TestQuality API token..."
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
              </div>
              
              <div className="space-y-2">
                <ConditionalTooltip content={<p>Select the TestQuality project where test cases will be exported</p>}>
                  <Label htmlFor="tq-project">Project</Label>
                </ConditionalTooltip>
                {testQualityProjects && Array.isArray(testQualityProjects) && testQualityProjects.length > 0 ? (
                  <Select 
                    value={formData.testqualitySettings?.projectId?.toString() || ""} 
                    onValueChange={(value) => updateFormData({ 
                      testqualitySettings: { 
                        ...formData.testqualitySettings, 
                        projectId: value ? parseInt(value) : undefined 
                      } 
                    })}
                  >
                    <ConditionalTooltip content={<p>Choose which TestQuality project to export test cases to</p>}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project..." />
                      </SelectTrigger>
                    </ConditionalTooltip>
                    <SelectContent>
                      {testQualityProjects.map((project: any) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : projectsLoading ? (
                  <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading projects...</span>
                  </div>
                ) : (
                  <Input
                    id="tq-project"
                    type="number"
                    value={formData.testqualitySettings?.projectId || ""}
                    onChange={(e) => updateFormData({ 
                      testqualitySettings: { 
                        ...formData.testqualitySettings, 
                        projectId: e.target.value ? parseInt(e.target.value) : undefined 
                      } 
                    })}
                    placeholder="Enter TestQuality project ID..."
                  />
                )}
                {!projectsLoading && (!testQualityProjects || testQualityProjects.length === 0) && formData.testqualitySettings?.apiToken && (
                  <p className="text-sm text-muted-foreground">
                    No projects found. Please check your API token or enter project ID manually.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Changes Indicator */}
      {hasChanges && (
        <div className="fixed bottom-4 right-4">
          <Card className="p-3">
            <div className="flex items-center space-x-2 text-sm">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span>You have unsaved changes</span>
              <Button size="sm" onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}