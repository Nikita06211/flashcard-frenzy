'use client';

import { useState, useEffect } from 'react';
import { useUser as useSupabaseUser } from "@supabase/auth-helpers-react";
import { supabase } from '@/lib/supabaseClient';

export function useUser() {
  const supabaseUser = useSupabaseUser();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('useUser: Initial session:', session?.user?.email);
        setSession(session);
      } catch (error) {
        console.error('useUser: Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('useUser: Auth state change:', event, session?.user?.email);
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Use session data if available, otherwise fall back to supabaseUser
  const user = session?.user || (supabaseUser as any)?.user || null;
  const isLoading = loading || (supabaseUser as any)?.loading || false;

  console.log('useUser: Returning user:', user?.email, 'loading:', isLoading);

  return {
    user,
    loading: isLoading
  };
}