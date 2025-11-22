"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Card, CardContent } from "./card";
import { Mic, Send, User, Bot } from "lucide-react";
import { cn } from "@acme/ui";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  onSpeakingChange: (isSpeaking: boolean) => void;
}

export function ChatInterface({ onSpeakingChange }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "assistant", content: "Hello! I'm your AI assistant. How can I help you today?" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsProcessing(true);
    onSpeakingChange(true); // AI starts "thinking/speaking"

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "This is a simulated response. I heard you say: " + userMessage.content,
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsProcessing(false);
      onSpeakingChange(false);
    }, 2000);
  };

  const handleMicClick = () => {
    if (isListening) {
      setIsListening(false);
      // Stop listening logic here
    } else {
      setIsListening(true);
      // Start listening logic here
      // For simulation, let's just set a timeout to "hear" something
      setTimeout(() => {
        setInputValue("Hello AI, this is a voice message.");
        setIsListening(false);
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full mx-auto bg-background/0 backdrop-blur-[0px] rounded-xl border shadow-xl">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex items-start gap-3",
              message.role === "user" ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {message.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div
              className={cn(
                "p-3 rounded-lg max-w-[80%]",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}
        {isProcessing && (
           <div className="flex items-start gap-3">
             <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
               <Bot className="w-5 h-5" />
             </div>
             <div className="bg-muted p-3 rounded-lg">
               <div className="flex gap-1">
                 <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                 <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                 <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
               </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-background/50 backdrop-blur-sm rounded-b-xl">
        <div className="flex gap-2">
          <Button
            variant={isListening ? "destructive" : "outline"}
            size="icon"
            onClick={handleMicClick}
            className={cn("shrink-0 transition-all", isListening && "animate-pulse")}
          >
            <Mic className="w-5 h-5" />
          </Button>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button onClick={handleSendMessage} size="icon" disabled={!inputValue.trim() || isProcessing}>
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
