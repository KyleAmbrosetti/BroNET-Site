import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Bot, User, Loader2, Minimize2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "G'day! I'm BroNET's AI assistant. How can I help you today? I can answer questions about our NBN plans, coverage, modems, billing, or technical support.",
        },
      ]);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: userMessage,
          systemPrompt: `You are BroNET's friendly and helpful AI customer support assistant for an Australian NBN internet service provider.

Key information about BroNET:
- We offer NBN plans from Basic (25Mbps, $59/month) to Ultra (1000Mbps, $129/month)
- We sell eero 7 ($299) and eero Pro 7 ($599) mesh routers
- Coverage check is available on our website
- Support is available 24/7
- We service all NBN-connected areas in Australia
- Billing cycles are monthly
- Our support team can be reached via support tickets in the dashboard

Be helpful, friendly, and use Australian English. Keep responses concise but informative.
If you don't know something specific about the user's account, suggest they check their dashboard or submit a support ticket.`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let assistantMessage = "";
      let newConversationId = conversationId;

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
            } catch {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting right now. Please try again in a moment, or submit a support ticket for assistance.",
        },
      ]);
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

  if (!isOpen) {
    return (
      <Button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
        data-testid="button-open-chat"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="sr-only">Open chat</span>
      </Button>
    );
  }

  if (isMinimized) {
    return (
      <Card
        className="fixed bottom-6 right-6 w-72 shadow-xl z-50 cursor-pointer hover:shadow-2xl transition-shadow"
        onClick={() => setIsMinimized(false)}
        data-testid="card-chat-minimized"
      >
        <CardHeader className="py-3 px-4 bg-gradient-to-r from-primary to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold">BroNET Support</span>
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
    );
  }

  return (
    <Card
      className="fixed bottom-6 right-6 w-96 h-[500px] shadow-xl z-50 flex flex-col"
      data-testid="card-chat"
    >
      <CardHeader className="py-3 px-4 bg-gradient-to-r from-primary to-purple-600 text-white rounded-t-lg flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bot className="h-6 w-6" />
              <Zap className="h-3 w-3 absolute -bottom-1 -right-1 text-yellow-300" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">BroNET AI Support</CardTitle>
              <p className="text-xs text-white/80">Powered by AI</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white hover:bg-white/20"
              onClick={handleMinimize}
              data-testid="button-minimize-chat"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
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

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
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
                    "rounded-lg px-3 py-2 max-w-[75%] text-sm",
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
      </CardContent>

      <CardFooter className="p-3 border-t flex-shrink-0">
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
    </Card>
  );
}
