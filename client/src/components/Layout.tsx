import { DesktopSidebar, MobileSidebar } from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import stepMonkeyLogo from "@assets/Stepmonkey logo_1755370775316.webp";
import stepMonkeyLogoDark from "@assets/Stepmonkey logo darkmode_1755371086080.webp";
import { useTheme } from "@/hooks/use-theme";


interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isDark } = useTheme();
  const logoSrc = isDark ? stepMonkeyLogoDark : stepMonkeyLogo;
  
  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Desktop Sidebar */}
      <DesktopSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Header with Mobile Menu */}
        <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 flex-shrink-0">
          <div className="flex items-center justify-between px-4 h-16">
            <div className="flex items-center space-x-4">
              {/* Mobile Menu */}
              <MobileSidebar />
              
              {/* App Logo on Mobile */}
              <img 
                key={isDark ? 'dark' : 'light'}
                src={logoSrc} 
                alt="StepMonkey" 
                className="h-8 md:hidden"
              />
            </div>
            
            {/* Header Controls */}
            <Header />
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
            {children}
          </div>
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}