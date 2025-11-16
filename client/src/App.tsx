import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AgentsPage from "./pages/admin/AgentsPage";
import AgentFormPage from "./pages/admin/AgentFormPage";
import KnowledgeBasePage from "./pages/admin/KnowledgeBasePage";
import BookingsPage from "./pages/admin/BookingsPage";
import ChatPage from "./pages/ChatPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      
      {/* Admin Routes */}
      <Route path="/admin/agents" component={AgentsPage} />
      <Route path="/admin/agents/new" component={AgentFormPage} />
      <Route path="/admin/agents/:id/edit" component={AgentFormPage} />
      <Route path="/admin/agents/:id/knowledge" component={KnowledgeBasePage} />
      <Route path="/admin/bookings" component={BookingsPage} />
      
      {/* Public Chat Route */}
      <Route path="/chat/:agentId" component={ChatPage} />
      
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
