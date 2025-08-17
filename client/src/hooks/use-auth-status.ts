import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

/**
 * Hook to check authentication status
 * Returns user data when authenticated, null when not
 */
export function useAuthStatus() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    retry: false, // Don't retry on auth failure
  });

  return {
    user,
    isAuthenticated: !!user,
    isLoading
  };
}