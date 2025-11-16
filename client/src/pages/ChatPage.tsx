import { useParams } from "wouter";
import { useEffect, useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send, Bot, User, Plus, Search, LayoutGrid, Moon, Sun, Sparkles, MapPin, Hotel, Plane } from "lucide-react";
import { Streamdown } from "streamdown";
import { useTheme } from "@/contexts/ThemeContext";

interface Message {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
}

export default function ChatPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random()}`);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

  const conversationId = useRef<number | null>(null);
  const agentData = useRef<any>(null);

  const initMutation = trpc.chat.initConversation.useMutation({
    onSuccess: (data) => {
      setMessages(data.messages as Message[]);
      conversationId.current = data.conversation.id;
      agentData.current = data.agent;
    },
  });

  const sendMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, data.message as Message]);
    },
    onError: (error) => {
      console.error('Send error:', error);
    },
  });

  useEffect(() => {
    if (agentId) {
      initMutation.mutate({
        agentId: Number(agentId),
        sessionId,
      });
    }
  }, [agentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || inputMessage;
    if (!messageToSend.trim() || !conversationId.current || sendMutation.isPending) {
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: messageToSend,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");

    sendMutation.mutate({
      conversationId: conversationId.current,
      message: messageToSend,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (initMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!agentData.current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md p-6">
          <p className="text-center text-muted-foreground">Agent not found or not available</p>
        </Card>
      </div>
    );
  }

  const agent = agentData.current;

  // Suggested prompts based on agent type
  const suggestedPrompts = agent.agentType === 'travelAgent' ? [
    { icon: <Plane className="w-4 h-4" />, text: "Help me plan a vacation", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { icon: <MapPin className="w-4 h-4" />, text: "Best destinations for summer", color: "bg-green-50 text-green-700 border-green-200" },
    { icon: <Hotel className="w-4 h-4" />, text: "Find hotels in Paris", color: "bg-purple-50 text-purple-700 border-purple-200" },
    { icon: <Sparkles className="w-4 h-4" />, text: "Recommend activities", color: "bg-orange-50 text-orange-700 border-orange-200" },
  ] : [
    { icon: <Hotel className="w-4 h-4" />, text: `Tell me about ${agent.hotelName || 'the hotel'}`, color: "bg-blue-50 text-blue-700 border-blue-200" },
    { icon: <Sparkles className="w-4 h-4" />, text: "What amenities are available?", color: "bg-green-50 text-green-700 border-green-200" },
    { icon: <MapPin className="w-4 h-4" />, text: "Local recommendations", color: "bg-purple-50 text-purple-700 border-purple-200" },
    { icon: <Bot className="w-4 h-4" />, text: "Room service menu", color: "bg-orange-50 text-orange-700 border-orange-200" },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 border-r bg-card overflow-hidden flex flex-col`}>
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg">Chat</span>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2"
            onClick={() => window.location.reload()}
          >
            <Plus className="w-4 h-4" />
            New chat
          </Button>
        </div>
        
        <div className="flex-1 p-2">
          <div className="text-xs text-muted-foreground px-3 py-2">Chat History</div>
          {/* Placeholder for chat history */}
        </div>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={agent.avatarUrl} alt={agent.name} />
              <AvatarFallback>
                <Bot className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{agent.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {agent.agentType === 'travelAgent' ? 'Travel Agent' : 'Hotel Concierge'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <LayoutGrid className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Search className="w-5 h-5" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            /* Empty State - Centered */
            <div className="h-full flex flex-col items-center justify-center px-4 max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold text-center mb-8">
                How can I help you today?
              </h1>

              {/* Input Box - Centered */}
              <div className="w-full max-w-2xl mb-6">
                <div className="relative">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message here..."
                    disabled={sendMutation.isPending}
                    className="pr-12 py-6 text-base"
                  />
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || sendMutation.isPending}
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg"
                  >
                    {sendMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground px-1">
                  <Bot className="w-4 h-4" />
                  <span>{agent.name}</span>
                </div>
              </div>

              {/* Suggested Prompts */}
              <div className="w-full max-w-2xl">
                <div className="grid grid-cols-2 gap-3">
                  {suggestedPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className={`justify-start gap-2 h-auto py-3 px-4 ${prompt.color} hover:opacity-80`}
                      onClick={() => handleSendMessage(prompt.text)}
                      disabled={sendMutation.isPending}
                    >
                      {prompt.icon}
                      <span className="text-sm">{prompt.text}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Messages List */
            <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarImage src={agent.avatarUrl} alt={agent.name} />
                      <AvatarFallback>
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <Streamdown>{message.content}</Streamdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback>
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {sendMutation.isPending && (
                <div className="flex gap-4">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={agent.avatarUrl} alt={agent.name} />
                    <AvatarFallback>
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area - Bottom (only shown when there are messages) */}
        {messages.length > 0 && (
          <div className="border-t bg-card">
            <div className="max-w-3xl mx-auto w-full px-4 py-4">
              <div className="relative">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  disabled={sendMutation.isPending}
                  className="pr-12 py-6 text-base"
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || sendMutation.isPending}
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg"
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
