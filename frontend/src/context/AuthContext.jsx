import { createContext, useContext, useEffect, useState } from "react";
import * as authService from "../services/authService";
import { getAccessToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    async function restoreUser() {
      const token = getAccessToken();
      if (token) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } catch {
          setUser(null);
        }
      }
      setInitializing(false);
    }
    restoreUser();
  }, []);

  const login = async (email, password) => {
    const userData = await authService.login(email, password);
    setUser(userData);
    return userData;
  };

  const register = async ({ name, email, password, role = "participant" }) => {
    await authService.register(name, email, password, role);
    const userData = await authService.login(email, password);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, initializing }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
