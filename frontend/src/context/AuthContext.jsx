import { createContext, useContext, useEffect, useState } from "react";
import * as authService from "../services/authService";
import { getAccessToken, getRefreshToken, setTokens, BASE_URL, clearTokens } from "../services/api";
import axios from "axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    async function restoreUser() {
      const token = getAccessToken();
      if (token) {
        try {
          let currentUser = await authService.getCurrentUser();
          if (!currentUser) {
            const refresh = getRefreshToken();
            if (refresh) {
              try {
                const resp = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh });
                const newAccess = resp.data.access || resp.data.token || null;
                if (newAccess) setTokens(newAccess, refresh);
                currentUser = await authService.getCurrentUser();
              } catch (e) {
                clearTokens();
                currentUser = null;
              }
            }
          }
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
