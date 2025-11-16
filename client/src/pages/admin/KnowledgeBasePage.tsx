import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Edit, Trash2, FileText } from "lucide-react";
import { useParams } from "wouter";
import { toast } from "sonner";
import { useState } from "react";

export default function KnowledgeBasePage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();

  const [kbDialogOpen, setKbDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [selectedKbId, setSelectedKbId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<{ id: number; title: string; content: string } | null>(null);

  const [kbForm, setKbForm] = useState({ name: "", description: "" });
  const [itemForm, setItemForm] = useState({ title: "", content: "" });

  const { data: agent, isLoading: loadingAgent } = trpc.agents.getById.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  const { data: knowledgeBases, isLoading: loadingKbs } = trpc.knowledgeBases.listByAgent.useQuery(
    { agentId: Number(id) },
    { enabled: !!id }
  );

  const { data: items, isLoading: loadingItems } = trpc.knowledgeItems.listByKnowledgeBase.useQuery(
    { knowledgeBaseId: selectedKbId! },
    { enabled: !!selectedKbId }
  );

  const createKbMutation = trpc.knowledgeBases.create.useMutation({
    onSuccess: () => {
      toast.success("Knowledge base created");
      utils.knowledgeBases.listByAgent.invalidate();
      setKbDialogOpen(false);
      setKbForm({ name: "", description: "" });
    },
    onError: (error) => toast.error(`Failed: ${error.message}`),
  });

  const deleteKbMutation = trpc.knowledgeBases.delete.useMutation({
    onSuccess: () => {
      toast.success("Knowledge base deleted");
      utils.knowledgeBases.listByAgent.invalidate();
      if (selectedKbId) setSelectedKbId(null);
    },
    onError: (error) => toast.error(`Failed: ${error.message}`),
  });

  const createItemMutation = trpc.knowledgeItems.create.useMutation({
    onSuccess: () => {
      toast.success("Knowledge item created");
      utils.knowledgeItems.listByKnowledgeBase.invalidate();
      setItemDialogOpen(false);
      setItemForm({ title: "", content: "" });
    },
    onError: (error) => toast.error(`Failed: ${error.message}`),
  });

  const updateItemMutation = trpc.knowledgeItems.update.useMutation({
    onSuccess: () => {
      toast.success("Knowledge item updated");
      utils.knowledgeItems.listByKnowledgeBase.invalidate();
      setItemDialogOpen(false);
      setEditingItem(null);
      setItemForm({ title: "", content: "" });
    },
    onError: (error) => toast.error(`Failed: ${error.message}`),
  });

  const deleteItemMutation = trpc.knowledgeItems.delete.useMutation({
    onSuccess: () => {
      toast.success("Knowledge item deleted");
      utils.knowledgeItems.listByKnowledgeBase.invalidate();
    },
    onError: (error) => toast.error(`Failed: ${error.message}`),
  });

  const handleCreateKb = () => {
    if (!kbForm.name) {
      toast.error("Name is required");
      return;
    }
    createKbMutation.mutate({
      agentId: Number(id),
      name: kbForm.name,
      description: kbForm.description || undefined,
    });
  };

  const handleCreateOrUpdateItem = () => {
    if (!itemForm.title || !itemForm.content) {
      toast.error("Title and content are required");
      return;
    }

    if (editingItem) {
      updateItemMutation.mutate({
        id: editingItem.id,
        title: itemForm.title,
        content: itemForm.content,
      });
    } else if (selectedKbId) {
      createItemMutation.mutate({
        knowledgeBaseId: selectedKbId,
        title: itemForm.title,
        content: itemForm.content,
      });
    }
  };

  const openItemDialog = (item?: { id: number; title: string; content: string }) => {
    if (item) {
      setEditingItem(item);
      setItemForm({ title: item.title, content: item.content });
    } else {
      setEditingItem(null);
      setItemForm({ title: "", content: "" });
    }
    setItemDialogOpen(true);
  };

  if (authLoading || loadingAgent) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!agent) {
    return (
      <DashboardLayout>
        <div className="container max-w-6xl py-8">
          <p className="text-muted-foreground">Agent not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-7xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{agent.name} - Knowledge Base</h1>
          <p className="text-muted-foreground mt-2">
            Manage knowledge bases and content for this agent
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Knowledge Bases List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Knowledge Bases</CardTitle>
                <Dialog open={kbDialogOpen} onOpenChange={setKbDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Knowledge Base</DialogTitle>
                      <DialogDescription>
                        Add a new knowledge base for this agent
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="kb-name">Name</Label>
                        <Input
                          id="kb-name"
                          value={kbForm.name}
                          onChange={(e) => setKbForm({ ...kbForm, name: e.target.value })}
                          placeholder="e.g., Hotel Amenities"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="kb-description">Description</Label>
                        <Textarea
                          id="kb-description"
                          value={kbForm.description}
                          onChange={(e) => setKbForm({ ...kbForm, description: e.target.value })}
                          placeholder="Optional description"
                          rows={3}
                        />
                      </div>
                      <Button onClick={handleCreateKb} disabled={createKbMutation.isPending}>
                        {createKbMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Create
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingKbs ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : !knowledgeBases || knowledgeBases.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No knowledge bases yet
                </p>
              ) : (
                <div className="space-y-2">
                  {knowledgeBases.map((kb) => (
                    <div
                      key={kb.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedKbId === kb.id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-accent"
                      }`}
                      onClick={() => setSelectedKbId(kb.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{kb.name}</p>
                          {kb.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {kb.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete "${kb.name}"?`)) {
                              deleteKbMutation.mutate({ id: kb.id });
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Knowledge Items */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Knowledge Items</CardTitle>
                  <CardDescription>
                    {selectedKbId
                      ? "Content in this knowledge base"
                      : "Select a knowledge base to view items"}
                  </CardDescription>
                </div>
                {selectedKbId && (
                  <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingItem ? "Edit Knowledge Item" : "Create Knowledge Item"}
                        </DialogTitle>
                        <DialogDescription>
                          Add information that the agent can use to answer questions
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="item-title">Title</Label>
                          <Input
                            id="item-title"
                            value={itemForm.title}
                            onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                            placeholder="e.g., Pool Opening Hours"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="item-content">Content</Label>
                          <Textarea
                            id="item-content"
                            value={itemForm.content}
                            onChange={(e) => setItemForm({ ...itemForm, content: e.target.value })}
                            placeholder="Detailed information..."
                            rows={8}
                          />
                        </div>
                        <Button
                          onClick={handleCreateOrUpdateItem}
                          disabled={createItemMutation.isPending || updateItemMutation.isPending}
                        >
                          {(createItemMutation.isPending || updateItemMutation.isPending) && (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          )}
                          {editingItem ? "Update" : "Create"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedKbId ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Select a knowledge base from the left to view and manage items
                  </p>
                </div>
              ) : loadingItems ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : !items || items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground mb-4">No items in this knowledge base yet</p>
                  <Button onClick={() => openItemDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Item
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <Card key={item.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openItemDialog(item)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Delete "${item.title}"?`)) {
                                  deleteItemMutation.mutate({ id: item.id });
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{item.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
