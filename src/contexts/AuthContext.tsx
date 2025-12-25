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

const GITHUB_CLIENT_ID = 'YOUR_GITHUB_CLIENT_ID';
const REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/callback` : '';
const TOKEN_EXPIRY_DAYS = 30; // Token valid for 30 days
const STORAGE_KEY = 'github_auth';

// Cookie utilities
const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Strict;Secure`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const c = cookie.trim();
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length));
    }
  }
  return null;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

interface StoredAuth {
  token: string;
  user: GitHubUser;
  expiresAt: number;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to restore auth from localStorage first, then cookies
    const storedAuth = localStorage.getItem(STORAGE_KEY) || getCookie(STORAGE_KEY);
    
    if (storedAuth) {
      try {
        const parsed: StoredAuth = JSON.parse(storedAuth);
        
        // Check if token is expired
        if (parsed.expiresAt > Date.now()) {
          setToken(parsed.token);
          setUser(parsed.user);
          
          // Refresh storage to extend expiry
          saveAuthData(parsed.token, parsed.user);
        } else {
          // Token expired, clear storage
          clearAuthData();
        }
      } catch {
        clearAuthData();
      }
    }
    setIsLoading(false);
  }, []);

  const saveAuthData = (newToken: string, newUser: GitHubUser) => {
    const authData: StoredAuth = {
      token: newToken,
      user: newUser,
      expiresAt: Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    };
    const authString = JSON.stringify(authData);
    
    // Store in both localStorage and cookies for redundancy
    localStorage.setItem(STORAGE_KEY, authString);
    setCookie(STORAGE_KEY, authString, TOKEN_EXPIRY_DAYS);
  };

  const clearAuthData = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('github_token'); // Clean up old keys
    localStorage.removeItem('github_user');
    deleteCookie(STORAGE_KEY);
  };

  const login = () => {
    const scope = 'repo user delete_repo';
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}`;
    window.location.href = authUrl;
  };

  const logout = () => {
    clearAuthData();
    setToken(null);
    setUser(null);
  };

  const setAuthData = (newToken: string, newUser: GitHubUser) => {
    saveAuthData(newToken, newUser);
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
