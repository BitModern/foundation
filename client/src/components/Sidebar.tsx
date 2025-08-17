import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Settings, 
  Users, 
  TestTube,
  ChevronLeft, 
  ChevronRight,
  Menu,
  X,
  User,
  History
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import stepMonkeyLogo from "@assets/Stepmonkey logo_1755370775316.webp";
import stepMonkeyLogoDark from "@assets/Stepmonkey logo darkmode_1755371086080.webp";
import tqIconLight from "@assets/tq-icon-light.webp";
import tqIconDark from "@assets/tq-icon-dark.webp";
import { useTheme } from "@/hooks/use-theme";
import CryptoJS from "crypto-js";


interface SidebarProps {
  className?: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    title: "Test Generator",
    href: "/",
    icon: TestTube,
  },
  {
    title: "Test Case History",
    href: "/history",
    icon: History,
  },
  {
    title: "Settings", 
    href: "/settings",
    icon: Settings,
  },
  {
    title: "User Management",
    href: "/users",
    icon: Users,
    adminOnly: true,
  },
];

function SidebarContent({ 
  collapsed, 
  onToggle, 
  onItemClick 
}: { 
  collapsed: boolean; 
  onToggle: () => void;
  onItemClick?: () => void;
}) {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const logoSrc = isDark ? stepMonkeyLogoDark : stepMonkeyLogo;
  const collapsedIconSrc = isDark ? tqIconDark : tqIconLight;

  const getUserInitials = () => {
    if (!user) return "U";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) return user.firstName[0].toUpperCase();
    if (user.email) return user.email[0].toUpperCase();
    return "U";
  };

  const getGravatarUrl = (email: string) => {
    if (!email) return "";
    const hash = CryptoJS.MD5(email.toLowerCase().trim()).toString();
    return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=80`;
  };

  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly) {
      return isAuthenticated && user?.role === 'admin';
    }
    return true;
  });

  return (
    <div className="flex h-screen flex-col bg-card border-r">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
        {collapsed ? (
          <img 
            key={isDark ? 'dark-collapsed' : 'light-collapsed'}
            src={collapsedIconSrc} 
            alt="StepMonkey" 
            className="h-8 w-8"
          />
        ) : (
          <img 
            key={isDark ? 'dark' : 'light'}
            src={logoSrc} 
            alt="StepMonkey" 
            className="h-8"
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-10",
                  collapsed ? "px-2" : "px-3",
                  isActive && "bg-secondary text-secondary-foreground"
                )}
                onClick={onItemClick}
              >
                <Icon className={cn("h-4 w-4", !collapsed && "mr-3")} />
                {!collapsed && (
                  <span className="truncate">{item.title}</span>
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      {isAuthenticated && (
        <div className="p-2 border-t h-16 flex items-center flex-shrink-0">
          <Link href="/account" className="w-full">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start h-10",
                collapsed ? "px-2" : "px-3",
                location === "/account" && "bg-secondary text-secondary-foreground"
              )}
              onClick={onItemClick}
            >
              {collapsed ? (
                <Avatar className="h-6 w-6">
                  <AvatarImage 
                    src={user?.email ? getGravatarUrl(user.email) : ""} 
                    alt={user?.firstName || user?.email || "User"}
                  />
                  <AvatarFallback className="text-xs">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <>
                  <Avatar className="h-6 w-6 mr-3">
                    <AvatarImage 
                      src={user?.email ? getGravatarUrl(user.email) : ""} 
                      alt={user?.firstName || user?.email || "User"}
                    />
                    <AvatarFallback className="text-xs">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-sm font-medium truncate">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user?.email
                      }
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Account Settings
                    </span>
                  </div>
                </>
              )}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

// Desktop Sidebar
export function DesktopSidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "hidden md:flex transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <SidebarContent
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
    </div>
  );
}

// Mobile Sidebar
export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent
            collapsed={false}
            onToggle={() => setOpen(false)}
            onItemClick={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function Sidebar({ className }: SidebarProps) {
  return (
    <>
      <DesktopSidebar className={className} />
      <MobileSidebar />
    </>
  );
}