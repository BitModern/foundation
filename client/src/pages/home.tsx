import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Users, Settings, Shield, Moon, Sun, Monitor, Bot } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome to Your App Foundation
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          A modern full-stack TypeScript foundation with authentication, user management, 
          AI provider integration, and a beautiful UI built with React, Tailwind CSS, and shadcn/ui components.
        </p>
        {user && (
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm">Welcome back,</span>
            <Badge variant="outline">
              {user.firstName || user.email}
            </Badge>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
              <CardTitle className="text-lg">Authentication</CardTitle>
            </div>
            <CardDescription>
              Complete auth system with email verification, password reset, and secure sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Email/password login & registration</li>
              <li>• Email verification workflow</li>
              <li>• Session management</li>
              <li>• Password security</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-lg">User Management</CardTitle>
            </div>
            <CardDescription>
              Full user profile management with role-based access control
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• User profiles & avatars</li>
              <li>• Role-based permissions</li>
              <li>• Admin user management</li>
              <li>• Account settings</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex">
                <Sun className="h-4 w-4 text-orange-500" />
                <Moon className="h-4 w-4 text-slate-600 dark:text-slate-300 -ml-1" />
              </div>
              <CardTitle className="text-lg">Modern UI</CardTitle>
            </div>
            <CardDescription>
              Beautiful, accessible components with dark mode support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Tailwind CSS styling</li>
              <li>• shadcn/ui components</li>
              <li>• Dark/light mode toggle</li>
              <li>• Responsive design</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-lg">AI Provider Integration</CardTitle>
            </div>
            <CardDescription>
              Built-in support for multiple AI providers with secure API key management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• OpenAI GPT models</li>
              <li>• Anthropic Claude</li>
              <li>• OpenRouter access</li>
              <li>• Secure API key storage</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <CardTitle className="text-lg">Settings & Preferences</CardTitle>
            </div>
            <CardDescription>
              Flexible user settings with persistence across sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Theme preferences</li>
              <li>• AI provider settings</li>
              <li>• Custom app settings</li>
              <li>• Notification controls</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <CardTitle className="text-lg">Developer Experience</CardTitle>
            </div>
            <CardDescription>
              Built with modern tools and best practices for rapid development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• TypeScript throughout</li>
              <li>• React Query for state</li>
              <li>• Drizzle ORM</li>
              <li>• Vite dev server</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Ready to Build</CardTitle>
            <CardDescription>
              Start adding your unique features on top of this solid foundation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This foundation provides everything you need to start building your next app quickly and efficiently.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                View Documentation
              </Button>
              <Button size="sm">
                Get Started
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}