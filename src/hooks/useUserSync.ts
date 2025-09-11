"use client";

import { useEffect } from "react";
import { useUser } from "./useUser";

export function useUserSync() {
  const userData = useUser();

  // Safely destructure with default values
  const user = userData?.user || null;
  const loading = userData?.loading || false;

  useEffect(() => {
    if (user && !loading && user.email) {
      console.log('🔄 useUserSync: User detected, syncing with database...', user.email);
      // Sync user with MongoDB when they log in
      // Use email as id since Supabase user.id might not be available in this context
      syncUserWithDatabase({ email: user.email, id: user.email });
    }
  }, [user, loading]);

  const syncUserWithDatabase = async (user: { email: string; id: string }) => {
    console.log('📡 useUserSync: Sending sync request for user:', user.email);
    try {
      const response = await fetch("/api/users/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user.email,
          email: user.email,
        }),
      });

      if (!response.ok) {
        console.error("❌ useUserSync: Failed to sync user with database");
      } else {
        console.log('✅ useUserSync: User synced successfully');
      }
    } catch (error) {
      console.error("❌ useUserSync: Error syncing user:", error);
    }
  };

  return { user, loading };
}
