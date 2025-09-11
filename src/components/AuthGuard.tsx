"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function AuthGuard({ children, redirectTo = "/auth" }: AuthGuardProps) {
  const userData = useUser();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  // Safely destructure with default values
  const user = userData?.user || null;
  const loading = userData?.loading || false;

  // Check session directly from Supabase as backup
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('AuthGuard: Direct session check:', session?.user?.email);
        
        if (session) {
          console.log('AuthGuard: Session found, allowing access');
          setIsChecking(false);
          setHasCheckedSession(true);
        } else {
          console.log('AuthGuard: No session found, waiting for useUser hook...');
          // Don't immediately redirect, let useUser hook handle it
          setHasCheckedSession(true);
        }
      } catch (error) {
        console.error('AuthGuard: Error checking session:', error);
        setHasCheckedSession(true);
      }
    };

    // Give more time for the session to be restored
    const timer = setTimeout(checkSession, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && hasCheckedSession) {
      if (user) {
        console.log('AuthGuard: User found via useUser hook, allowing access');
        setIsChecking(false);
      } else {
        // Give a bit more time for session restoration
        console.log('AuthGuard: No user found, checking session one more time...');
        const finalCheck = setTimeout(async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              console.log('AuthGuard: Session found in final check, allowing access');
              setIsChecking(false);
            } else {
              console.log('AuthGuard: No session in final check, redirecting to auth');
              router.push(redirectTo);
            }
          } catch (error) {
            console.error('AuthGuard: Error in final session check:', error);
            router.push(redirectTo);
          }
        }, 1000);
        
        return () => clearTimeout(finalCheck);
      }
    }
  }, [user, loading, router, redirectTo, hasCheckedSession]);

  // Show loading spinner while checking authentication
  if (loading || isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, render the protected content
  if (user) {
    return <>{children}</>;
  }

  // This should not render as user will be redirected
  return null;
}
