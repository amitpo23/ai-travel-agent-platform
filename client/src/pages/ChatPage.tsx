import { useParams } from "wouter";
import { Loader2 } from "lucide-react";

export default function ChatPage() {
  const { agentId } = useParams<{ agentId: string }>();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">
          Chat interface for agent {agentId} - Coming in Phase 5
        </p>
      </div>
    </div>
  );
}
