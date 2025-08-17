import { Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./hooks/use-theme";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./components/AuthProvider";
import { AIProviderProvider } from "./contexts/AIProviderContext";
import Layout from "./components/Layout";
import HomePage from "./pages/home";
import AccountPage from "./pages/AccountPage";
import SettingsPage from "./pages/settings";
import AISettingsPage from "./pages/ai-settings";
import UsersPage from "./pages/users";
import NotFoundPage from "./pages/not-found";
import { queryClient } from "./lib/queryClient";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <AuthProvider>
          <AIProviderProvider>
            <Layout>
              <Route path="/" component={HomePage} />
              <Route path="/account" component={AccountPage} />
              <Route path="/settings" component={SettingsPage} />
              <Route path="/ai" component={AISettingsPage} />
              <Route path="/users" component={UsersPage} />
              <Route component={NotFoundPage} />
            </Layout>
            <Toaster />
          </AIProviderProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}