import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Edit, Trash2, Database } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function AgentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: agents, isLoading } = trpc.agents.list.useQuery(undefined, {
    enabled: !!user,
  });

  const deleteMutation = trpc.agents.delete.useMutation({
    onSuccess: () => {
      toast.success("Agent deleted successfully");
      utils.agents.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete agent: ${error.message}`);
    },
  });

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-6xl py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">AI Agents</h1>
            <p className="text-muted-foreground mt-2">
              Manage your travel agents and hotel concierge bots
            </p>
          </div>
          <Button onClick={() => setLocation("/admin/agents/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Create Agent
          </Button>
        </div>

        {!agents || agents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No agents created yet</p>
              <Button onClick={() => setLocation("/admin/agents/new")}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Agent
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <Card key={agent.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {agent.name}
                        {!agent.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        <Badge variant={agent.agentType === 'travelAgent' ? 'default' : 'outline'}>
                          {agent.agentType === 'travelAgent' ? 'Travel Agent' : 'Hotel Concierge'}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                  {agent.description && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                      {agent.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end">
                  <div className="text-xs text-muted-foreground mb-4">
                    {agent.hotelName && <div>Hotel: {agent.hotelName}</div>}
                    {agent.agencyName && <div>Agency: {agent.agencyName}</div>}
                    <div>Language: {agent.defaultLanguage}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setLocation(`/admin/agents/${agent.id}/knowledge`)}
                      >
                        <Database className="w-4 h-4 mr-2" />
                        Knowledge
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/admin/agents/${agent.id}/edit`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(agent.id, agent.name)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(`/chat/${agent.id}`, '_blank')}
                    >
                      Test Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
