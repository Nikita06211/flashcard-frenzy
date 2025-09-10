"use client";

import { useRouter } from "next/navigation";
import { useUserSync } from "@/hooks/useUserSync";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";
import LobbyList from "./LobbyList";

export default function Lobby() {
  // Sync user with database when they access the lobby
  useUserSync();
  const userData = useUser();
  const router = useRouter();

  // Safely destructure with default values
  const user = userData?.user || null;

  const handleLogout = async () => {
    try {
      // Update user status in database
      if (user) {
        await fetch("/api/users/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });
      }

      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Redirect to auth page
      router.push("/auth");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Flashcard Frenzy Lobby
            </h1>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Welcome, {user?.email}! Find online players and start your flashcard battle!
          </p>
        </div>

        {/* Lobby Content */}
        <div className="max-w-4xl mx-auto">
          <LobbyList />
        </div>

        {/* Footer Info */}
        <div className="text-center mt-12 text-sm text-gray-500 dark:text-gray-400">
          <p>Challenge other players to test your knowledge with flashcards</p>
        </div>
      </div>
    </div>
  );
}
