import { useParams } from "wouter";
import { useEffect, useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send, Bot, User } from "lucide-react";
import { Streamdown } from "streamdown";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      // Add assistant message to the list
      setMessages(prev => [
        ...prev,
        data.message as Message,
      ]);
    },
    onError: (error) => {
      console.error('Send error:', error);
      // Optionally show error message to user
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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !conversationId.current || sendMutation.isPending) {
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: inputMessage,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputMessage;
    setInputMessage("");

    // Send message
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
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Agent not found or not available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const agent = agentData.current;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={agent.avatarUrl} alt={agent.name} />
              <AvatarFallback>
                <Bot className="w-6 h-6" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{agent.name}</h1>
              <p className="text-sm text-muted-foreground">
                {agent.agentType === 'travelAgent' ? 'Travel Agent' : 'Hotel Concierge'}
                {agent.hotelName && ` • ${agent.hotelName}`}
                {agent.agencyName && ` • ${agent.agencyName}`}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
          {messages.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center">
                <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  Welcome! How can I help you today?
                </h3>
                <p className="text-sm text-muted-foreground">
                  {agent.description || `I'm here to assist you with ${
                    agent.agentType === 'travelAgent' 
                      ? 'travel planning and bookings' 
                      : 'hotel information and services'
                  }`}
                </p>
              </CardContent>
            </Card>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <Avatar className="w-8 h-8 shrink-0">
                {message.role === 'user' ? (
                  <>
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </>
                ) : (
                  <>
                    <AvatarImage src={agent.avatarUrl} alt={agent.name} />
                    <AvatarFallback>
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              <Card
                className={`max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card'
                }`}
              >
                <CardContent className="pt-4 pb-4">
                  {message.role === 'assistant' ? (
                    <Streamdown>{message.content}</Streamdown>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}

          {sendMutation.isPending && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src={agent.avatarUrl} alt={agent.name} />
                <AvatarFallback>
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <Card className="bg-card">
                <CardContent className="pt-4 pb-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </CardContent>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-card">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={sendMutation.isPending}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || sendMutation.isPending}
              size="icon"
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
    </div>
  );
}
