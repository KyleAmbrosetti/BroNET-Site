import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageCircle, X, Send, Bot, User, Loader2, Minimize2, Zap, AlertCircle, Download, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";
import { useIsMobile } from "@/hooks/use-mobile";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [aiMode, setAiMode] = useState<'ai' | 'fallback' | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
    // Reset unread count when messages are visible
    if (isOpen && !isMinimized) {
      setUnreadCount(0);
    }
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Track last message count to increment unread badge only on new complete messages
  const prevMessageCountRef = useRef(0);
  
  useEffect(() => {
    if ((isMinimized || !isOpen) && messages.length > prevMessageCountRef.current) {
      const newMessages = messages.slice(prevMessageCountRef.current);
      const newAssistantMessages = newMessages.filter(m => m.role === "assistant" && m.content);
      setUnreadCount(prev => prev + newAssistantMessages.length);
    }
    prevMessageCountRef.current = messages.length;
  }, [messages, isMinimized, isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "G'day! I'm BroNET's customer support assistant. How can I help you today? I can answer questions about our NBN plans, coverage, modems, billing, or technical support.\n\n⚠️ Privacy Notice: Don't share passwords or sensitive personal information in this chat.",
        },
      ]);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setUnreadCount(0);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleExportToTicket = async () => {
    if (!conversationId || !user) {
      toast({
        title: "Cannot export",
        description: "You must be logged in with an active conversation to export to a ticket.",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    try {
      const { data, error } = await api.exportChatToTicket(conversationId, "Chat Support Conversation");
      if (error) {
        toast({
          title: "Export failed",
          description: error,
          variant: "destructive"
        });
        return;
      }

      // Create the actual ticket
      const ticketResult = await api.createTicket({
        subject: data.subject,
        description: data.description
      });

      if (ticketResult.error) {
        toast({
          title: "Ticket creation failed",
          description: ticketResult.error,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Conversation exported",
        description: "Your chat has been converted to a support ticket. Check your dashboard to view it."
      });

      // Optionally close the chat after export
      setIsOpen(false);
    } catch (err) {
      toast({
        title: "Export failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          conversationId,
          message: userMessage,
          systemPrompt: `You are BroNET's friendly and helpful AI customer support assistant for an Australian NBN internet service provider.

Key information about BroNET:
- We offer NBN plans: Basic (25Mbps, $59/month), Standard (50Mbps, $69/month), Fast (100Mbps, $79/month), Superfast (250Mbps, $99/month), Ultra (1000Mbps, $129/month)
- We sell eero 7 ($299) and eero Pro 7 ($599) mesh routers
- Coverage check is available on our website at /coverage
- Support is available 24/7 via support tickets in the dashboard at /dashboard
- We service all NBN-connected areas in Australia
- Billing cycles are monthly
- Plan details and FAQs are available at /plans and /support
- Privacy policy at /privacy, Terms at /terms

Be helpful, friendly, and use Australian English. Keep responses concise but informative.
Guide users to relevant pages when appropriate (e.g., "Check /plans for more details").
If you don't know something specific about the user's account, suggest they check their dashboard or submit a support ticket.
Never ask for or accept passwords, credit card numbers, or other sensitive information.`,
        }),
      });

      if (response.status === 429) {
        throw new Error("Too many requests. Please wait a moment before trying again.");
      }

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let assistantMessage = "";
      let newConversationId = conversationId;
      let detectedMode: 'ai' | 'fallback' | null = null;

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.conversationId && !newConversationId) {
                newConversationId = data.conversationId;
                setConversationId(data.conversationId);
              }
              
              if (data.mode && !detectedMode) {
                detectedMode = data.mode;
                setAiMode(data.mode);
              }
              
              if (data.content) {
                assistantMessage += data.content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: "assistant",
                    content: assistantMessage,
                  };
                  return newMessages;
                });
              }
              
              if (data.error) {
                setError(data.error);
              }
            } catch {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      setError(error.message || "Connection error");
      // Remove the empty placeholder message and replace with error message
      setMessages((prev) => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1]?.role === "assistant" && !newMessages[newMessages.length - 1]?.content) {
          newMessages.pop(); // Remove empty placeholder
        }
        return [
          ...newMessages,
          {
            role: "assistant",
            content: "Sorry, I'm having trouble connecting right now. Please try again in a moment, or submit a support ticket for assistance.",
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Chat button (closed state)
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50" data-testid="chatbot-container-closed">
        <Button
          onClick={handleOpen}
          className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 relative"
          data-testid="button-open-chat"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 bg-red-500 text-white rounded-full"
              data-testid="badge-unread-count"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Open chat</span>
        </Button>
      </div>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50" data-testid="chatbot-container-minimized">
        <Card
          className="w-72 shadow-xl cursor-pointer hover:shadow-2xl transition-shadow"
          onClick={() => setIsMinimized(false)}
          data-testid="card-chat-minimized"
        >
          <CardHeader className="py-3 px-4 bg-gradient-to-r from-primary to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <span className="font-semibold">BroNET Support</span>
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white" data-testid="badge-minimized-unread">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                data-testid="button-close-chat-minimized"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Full chat view (mobile full-screen or desktop card)
  const chatContent = (
    <>
      <CardHeader className="py-3 px-4 bg-gradient-to-r from-primary to-purple-600 text-white rounded-t-lg flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bot className="h-6 w-6" />
              <Zap className="h-3 w-3 absolute -bottom-1 -right-1 text-yellow-300" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">BroNET AI Support</CardTitle>
              <p className="text-xs text-white/80">
                {aiMode === 'ai' ? 'AI-Powered' : aiMode === 'fallback' ? 'FAQ Mode' : 'Ready to help'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-white/20"
                onClick={handleMinimize}
                data-testid="button-minimize-chat"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white hover:bg-white/20"
              onClick={handleClose}
              data-testid="button-close-chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
        {/* Privacy notice */}
        <div className="px-4 pt-3 pb-2 border-b bg-muted/20">
          <Alert className="py-2 px-3">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Don't share passwords or sensitive personal information in this chat.
            </AlertDescription>
          </Alert>
        </div>

        {/* Messages area */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-2",
                  message.role === "user" ? "flex-row-reverse" : ""
                )}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                    message.role === "user"
                      ? "bg-primary text-white"
                      : "bg-muted"
                  )}
                >
                  {message.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 max-w-[75%] text-sm whitespace-pre-wrap",
                    message.role === "user"
                      ? "bg-primary text-white"
                      : "bg-muted"
                  )}
                  data-testid={`message-${message.role}-${index}`}
                >
                  {message.content || (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex items-start gap-2">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-lg px-3 py-2 bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Error display */}
        {error && (
          <div className="px-4 py-2 border-t bg-destructive/10">
            <div className="flex items-start gap-2 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-3 border-t flex-shrink-0 flex-col gap-2">
        {/* Export to ticket button for logged-in users */}
        {user && conversationId && messages.length > 2 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={handleExportToTicket}
            disabled={isExporting}
            data-testid="button-export-ticket"
          >
            <Download className="h-3 w-3 mr-1" />
            {isExporting ? "Exporting..." : "Export to Support Ticket"}
          </Button>
        )}
        
        {/* Input area */}
        <div className="flex w-full gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
            data-testid="input-chat-message"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            data-testid="button-send-message"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardFooter>
    </>
  );

  // Mobile: full-screen overlay
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col" data-testid="card-chat-mobile">
        {chatContent}
      </div>
    );
  }

  // Desktop: floating card
  return (
    <Card
      className="fixed bottom-6 right-6 w-96 h-[600px] shadow-xl z-50 flex flex-col"
      data-testid="card-chat"
    >
      {chatContent}
    </Card>
  );
}
