'use client';

import { useUser as useSupabaseUser } from "@supabase/auth-helpers-react";

export function useUser() {
  return useSupabaseUser();
}