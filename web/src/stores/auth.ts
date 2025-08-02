import {create} from 'zustand';
import {devtools, persist} from 'zustand/middleware';
import type {User, Session} from '../auth';
import {authClient} from '../auth';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  setAuth: (user: User | null, session: Session | null) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        session: null,
        isLoading: true,
        setUser: (user) => set({user}),
        setSession: (session) => set({session}),
        setLoading: (loading) => set({isLoading: loading}),
        logout: async () => {
          try {
            await authClient.signOut();
            set({user: null, session: null});
          } catch (error) {
            console.error('Logout error:', error);
            // Still clear local state even if server logout fails
            set({user: null, session: null});
          }
        },
        setAuth: (user, session) => set({user, session, isLoading: false}),
        checkAuth: async () => {
          try {
            const result = await authClient.getSession();
            if (result.data) {
              set({
                user: result.data.user,
                session: result.data.session,
                isLoading: false,
              });
            } else {
              set({user: null, session: null, isLoading: false});
            }
          } catch (error) {
            console.error('Auth check error:', error);
            set({user: null, session: null, isLoading: false});
          }
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({user: state.user, session: state.session}),
      },
    ),
  ),
);