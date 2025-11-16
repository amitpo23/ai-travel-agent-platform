import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Loader2, Save } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function AgentFormPage() {
  const { id } = useParams<{ id?: string }>();
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: "",
    agentType: "travelAgent" as "travelAgent" | "hotelBot",
    hotelName: "",
    agencyName: "",
    description: "",
    personality: "",
    tone: "friendly and professional",
    avatarUrl: "",
    systemPrompt: "",
    defaultLanguage: "en",
    isActive: true,
  });

  const { data: agent, isLoading: loadingAgent } = trpc.agents.getById.useQuery(
    { id: Number(id) },
    { enabled: isEditing && !!id }
  );

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        agentType: agent.agentType,
        hotelName: agent.hotelName ?? "",
        agencyName: agent.agencyName ?? "",
        description: agent.description ?? "",
        personality: agent.personality ?? "",
        tone: agent.tone,
        avatarUrl: agent.avatarUrl ?? "",
        systemPrompt: agent.systemPrompt,
        defaultLanguage: agent.defaultLanguage,
        isActive: agent.isActive,
      });
    }
  }, [agent]);

  const createMutation = trpc.agents.create.useMutation({
    onSuccess: () => {
      toast.success("Agent created successfully");
      setLocation("/admin/agents");
    },
    onError: (error) => {
      toast.error(`Failed to create agent: ${error.message}`);
    },
  });

  const updateMutation = trpc.agents.update.useMutation({
    onSuccess: () => {
      toast.success("Agent updated successfully");
      setLocation("/admin/agents");
    },
    onError: (error) => {
      toast.error(`Failed to update agent: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.systemPrompt) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (isEditing && id) {
      updateMutation.mutate({
        id: Number(id),
        ...formData,
        hotelName: formData.hotelName || undefined,
        agencyName: formData.agencyName || undefined,
        description: formData.description || undefined,
        personality: formData.personality || undefined,
        avatarUrl: formData.avatarUrl || undefined,
      });
    } else {
      createMutation.mutate({
        ...formData,
        hotelName: formData.hotelName || undefined,
        agencyName: formData.agencyName || undefined,
        description: formData.description || undefined,
        personality: formData.personality || undefined,
        avatarUrl: formData.avatarUrl || undefined,
      });
    }
  };

  if (authLoading || (isEditing && loadingAgent)) {
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
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            {isEditing ? "Edit Agent" : "Create New Agent"}
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure your AI travel agent or hotel concierge bot
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Set up the core identity and configuration of your agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sarah - Travel Expert"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agentType">Agent Type *</Label>
                <Select
                  value={formData.agentType}
                  onValueChange={(value: "travelAgent" | "hotelBot") =>
                    setFormData({ ...formData, agentType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="travelAgent">Travel Agent</SelectItem>
                    <SelectItem value="hotelBot">Hotel Concierge Bot</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.agentType === "hotelBot" && (
                <div className="space-y-2">
                  <Label htmlFor="hotelName">Hotel Name</Label>
                  <Input
                    id="hotelName"
                    value={formData.hotelName}
                    onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                    placeholder="e.g., Grand Hotel Royal"
                  />
                </div>
              )}

              {formData.agentType === "travelAgent" && (
                <div className="space-y-2">
                  <Label htmlFor="agencyName">Agency Name</Label>
                  <Input
                    id="agencyName"
                    value={formData.agencyName}
                    onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                    placeholder="e.g., Global Travel Solutions"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the agent's purpose and capabilities"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="personality">Personality & Tone</Label>
                <Input
                  id="personality"
                  value={formData.personality}
                  onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                  placeholder="e.g., Friendly, professional, and enthusiastic"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="systemPrompt">System Prompt *</Label>
                <Textarea
                  id="systemPrompt"
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                  placeholder="You are a helpful travel agent assistant. Your role is to help customers find the perfect vacation..."
                  rows={6}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This prompt defines how the AI agent behaves and responds to users
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultLanguage">Default Language</Label>
                <Select
                  value={formData.defaultLanguage}
                  onValueChange={(value) =>
                    setFormData({ ...formData, defaultLanguage: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="he">Hebrew</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <Input
                  id="avatarUrl"
                  type="url"
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/admin/agents")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              <Save className="w-4 h-4 mr-2" />
              {isEditing ? "Update Agent" : "Create Agent"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
