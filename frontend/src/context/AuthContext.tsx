import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { apiRequest } from '../api/client';

type User = {
  id: number;
  email: string;
  isBureau: boolean;
  isIntervenant: boolean;
  intervenantId: number | null;
  firstName: string | null;
  lastName: string | null;
};

type ActiveSpace = 'bureau' | 'intervenant';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    activeSpace: 'bureau' | 'intervenant',
  ) => Promise<User>;
  logout: () => void;
  activeSpace: ActiveSpace | null;
  setActiveSpace: (space: ActiveSpace) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeSpace, setActiveSpaceState] = useState<ActiveSpace | null>(
    () => {
      const stored = sessionStorage.getItem('activeSpace');
      return stored === 'bureau' || stored === 'intervenant'
        ? stored
        : null;
    },
  );

  function setActiveSpace(space: ActiveSpace) {
    sessionStorage.setItem('activeSpace', space);
    setActiveSpaceState(space);
  }

  useEffect(() => {
    async function restoreSession() {
      try {
        if (sessionStorage.getItem('accessToken')) {
          const profile = await apiRequest('/auth/me');
          setUser(profile);
        }
      } catch {
        sessionStorage.removeItem('accessToken');
        setUser(null);
        sessionStorage.removeItem('activeSpace');
        setActiveSpaceState(null);
      } finally {
        setLoading(false);
      }
    }

    void restoreSession();
  }, []);

  async function login(email: string, password: string, activeSpace: ActiveSpace) {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, activeSpace }),
    });

    sessionStorage.setItem('accessToken', result.accessToken);
    setUser(result.user);

    const profile = await apiRequest('/auth/me');
    setUser(profile);

    return result.user as User;
  }

  function logout() {
    sessionStorage.removeItem('accessToken');
    setUser(null);
    sessionStorage.removeItem('activeSpace');
    setActiveSpaceState(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, activeSpace, setActiveSpace }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider');
  }

  return context;
}
