import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, Bot, Database, MessageSquare } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="w-8 h-8" />}
            <h1 className="text-xl font-bold">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">{user?.name || user?.email}</span>
                <Button variant="outline" onClick={() => setLocation("/admin/agents")}>
                  Dashboard
                </Button>
                <Button variant="ghost" onClick={() => logout()}>
                  Logout
                </Button>
              </>
            ) : (
              <Button onClick={() => (window.location.href = getLoginUrl())}>
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              AI-Powered Travel Agent Platform
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Build and manage intelligent chatbots for travel agencies and hotels.
              Provide 24/7 customer support with AI agents powered by your knowledge base.
            </p>
            {!isAuthenticated ? (
              <Button size="lg" onClick={() => (window.location.href = getLoginUrl())}>
                Get Started
              </Button>
            ) : (
              <Button size="lg" onClick={() => setLocation("/admin/agents")}>
                Go to Dashboard
              </Button>
            )}
          </div>
        </section>

        {/* Features */}
        <section className="container py-16 border-t">
          <h3 className="text-3xl font-bold text-center mb-12">Key Features</h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="flex flex-col items-center text-center p-6 rounded-lg border">
              <Bot className="w-12 h-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">AI Agents</h4>
              <p className="text-muted-foreground">
                Create travel agents and hotel concierge bots with custom personalities and behaviors
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg border">
              <Database className="w-12 h-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">Knowledge Base</h4>
              <p className="text-muted-foreground">
                Build comprehensive knowledge bases with hotel info, policies, and travel tips
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg border">
              <MessageSquare className="w-12 h-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">Smart Chat</h4>
              <p className="text-muted-foreground">
                LLM-powered conversations with booking capabilities and personalized recommendations
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2024 {APP_TITLE}. Built with Next.js, tRPC, and AI.</p>
        </div>
      </footer>
    </div>
  );
}
