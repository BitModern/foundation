import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import ReleaseNotesDialog from "./ReleaseNotesDialog";

interface VersionInfo {
  version: string;
}

export default function Footer() {
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);

  const { data: versionData } = useQuery<VersionInfo>({
    queryKey: ["/api/version"],
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000, // 30 seconds - refresh more frequently for version
    refetchInterval: 60 * 1000, // Check every minute for version updates
  });

  return (
    <>
      <footer className="bg-card border-t h-16 flex items-center justify-center flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground flex-1 text-center">
              © 2025 TestQuality. All rights reserved.
            </div>
            <div className="flex items-center absolute right-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReleaseNotes(true)}
                className="text-sm text-muted-foreground hover:text-foreground h-auto p-1"
              >
                <FileText className="h-3 w-3 mr-1" />
                v{versionData?.version || "0.01.030"}
              </Button>
            </div>
          </div>
        </div>
      </footer>

      <ReleaseNotesDialog 
        isOpen={showReleaseNotes}
        onClose={() => setShowReleaseNotes(false)}
      />
    </>
  );
}