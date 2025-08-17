import { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useHints } from "@/contexts/HintsContext";

interface ConditionalTooltipProps {
  children: ReactNode;
  content: ReactNode;
  asChild?: boolean;
}

export function ConditionalTooltip({ children, content, asChild = true }: ConditionalTooltipProps) {
  const { hintsEnabled } = useHints();

  if (!hintsEnabled) {
    return <>{children}</>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild={asChild}>
        {children}
      </TooltipTrigger>
      <TooltipContent>
        {content}
      </TooltipContent>
    </Tooltip>
  );
}