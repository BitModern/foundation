import { createContext, useContext } from "react";
import { AuthContext, useAuthProvider } from "@/hooks/use-auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authValue = useAuthProvider();

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
}