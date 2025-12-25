import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
}

interface AuthContextType {
  user: GitHubUser | null;
  token: string | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  setAuthData: (token: string, user: GitHubUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GITHUB_CLIENT_ID = 'YOUR_GITHUB_CLIENT_ID'; // Will need to be configured
const REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/callback` : '';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data
    const storedToken = localStorage.getItem('github_token');
    const storedUser = localStorage.getItem('github_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = () => {
    const scope = 'repo user';
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}`;
    window.location.href = authUrl;
  };

  const logout = () => {
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_user');
    setToken(null);
    setUser(null);
  };

  const setAuthData = (newToken: string, newUser: GitHubUser) => {
    localStorage.setItem('github_token', newToken);
    localStorage.setItem('github_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, setAuthData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
