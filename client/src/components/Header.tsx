import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings, LogOut, User, Sun, Moon, HelpCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useHints } from "@/contexts/HintsContext";
import { ConditionalTooltip } from "@/components/ui/conditional-tooltip";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import AuthModal from "./AuthModal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const { hintsEnabled, toggleHints } = useHints();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const getUserInitials = () => {
    if (!user) return "U";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) return user.firstName[0].toUpperCase();
    if (user.email) return user.email[0].toUpperCase();
    return "U";
  };

  return (
    <div className="flex items-center space-x-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={hintsEnabled ? "default" : "outline"}
            size="icon"
            onClick={toggleHints}
            className={`h-9 w-9 ${hintsEnabled ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{hintsEnabled ? 'Disable hints and tooltips' : 'Enable hints and tooltips'}</p>
        </TooltipContent>
      </Tooltip>
      
      <ConditionalTooltip
        content={<p>Toggle {isDark ? 'light' : 'dark'} mode</p>}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </ConditionalTooltip>

{isAuthenticated ? (
        <Button
          variant="outline"
          size="icon"
          onClick={handleLogout}
          className="h-9 w-9"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      ) : (
        <Button onClick={() => setShowAuthModal(true)}>
          <User className="h-4 w-4 mr-2" />
          Sign In
        </Button>
      )}
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
}