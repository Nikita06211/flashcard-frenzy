import AuthGuard from "@/components/AuthGuard";
import Lobby from "@/features/lobby/Lobby";

export default function LobbyPage() {
  return (
    <AuthGuard>
      <Lobby />
    </AuthGuard>
  );
}
