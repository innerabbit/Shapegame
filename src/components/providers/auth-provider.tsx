'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { createClient } from '@/lib/supabase/client';
import { signInWithWallet, type AppUser } from '@/lib/auth/wallet-auth';

interface AuthContextValue {
  user: AppUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSigningIn: boolean;
  signOut: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isSigningIn: false,
  signOut: async () => {},
  refetchUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const supabaseRef = useRef(createClient());
  const authAttemptedRef = useRef<string | null>(null);

  // Fetch app user from users table
  const fetchUser = useCallback(async () => {
    const supabase = supabaseRef.current;
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('supabase_auth_id', session.user.id)
      .single();

    setUser(data);
    setIsLoading(false);
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const supabase = supabaseRef.current;

    // Initial check
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => subscription.unsubscribe();
  }, [fetchUser]);

  // Auto sign-in when wallet connects
  useEffect(() => {
    const walletAddress = wallet.publicKey?.toBase58();

    // Wallet disconnected — sign out
    if (!wallet.connected || !walletAddress) {
      if (user) {
        supabaseRef.current.auth.signOut().then(() => {
          setUser(null);
          authAttemptedRef.current = null;
        });
      }
      return;
    }

    // Wait for initial session check to complete before auto sign-in
    if (isLoading) return;

    // Already signed in with this wallet, or already attempted
    if (user?.wallet_address === walletAddress) return;
    if (authAttemptedRef.current === walletAddress) return;
    if (isSigningIn) return;
    if (!wallet.signMessage) return;

    // Auto sign-in
    authAttemptedRef.current = walletAddress;
    setIsSigningIn(true);

    signInWithWallet(wallet).then((result) => {
      if ('user' in result) {
        setUser(result.user);
      } else {
        console.error('Wallet auth failed:', result.error);
      }
      setIsSigningIn(false);
    });
  }, [wallet.connected, wallet.publicKey, wallet.signMessage, user, isSigningIn, isLoading, wallet]);

  const signOut = useCallback(async () => {
    await supabaseRef.current.auth.signOut();
    setUser(null);
    authAttemptedRef.current = null;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isSigningIn,
        signOut,
        refetchUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
