"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Mic, Send, User } from "lucide-react";

import { cn } from "@acme/ui";

import { Button } from "./button";
import { Input } from "./input";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  options?: { label: string; value: string }[];
}

interface ChatInterfaceProps {
  onSpeakingChange: (isSpeaking: boolean) => void;
  onSendMessage: (
    message: string,
    history: { role: "user" | "assistant"; content: string }[],
  ) => Promise<string>;
}

export function ChatInterface({
  onSpeakingChange,
  onSendMessage,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I can help you verify user certifications. Just ask me to 'verify a certificate'.",
    },
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

  const handleSendMessage = async (text: string = inputValue) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    setIsProcessing(true);
    onSpeakingChange(true);

    try {
      // Convert messages to history format (excluding the new user message which is added in actions)
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await onSendMessage(text, history);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: response,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "I'm sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsProcessing(false);
      onSpeakingChange(false);
    }
  };

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          setInputValue(transcript);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          handleSendMessage(transcript);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const handleMicClick = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (error) {
          console.error("Failed to start speech recognition:", error);
        }
      } else {
        alert("Speech recognition is not supported in this browser.");
      }
    }
  };

  return (
    <div className="bg-background/20 mx-auto flex h-[600px] w-full max-w-2xl flex-col rounded-xl border shadow-xl backdrop-blur-[4px]">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex flex-col gap-2",
              message.role === "user" ? "items-end" : "items-start",
            )}
          >
            <div
              className={cn(
                "flex max-w-[80%] items-start gap-3",
                message.role === "user" ? "flex-row-reverse" : "flex-row",
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {message.role === "user" ? (
                  <User className="h-5 w-5" />
                ) : (
                  <Bot className="h-5 w-5" />
                )}
              </div>
              <div
                className={cn(
                  "rounded-lg p-3",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted",
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex items-start gap-3">
            <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
              <Bot className="h-5 w-5" />
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="flex gap-1">
                <span
                  className="bg-foreground/50 h-2 w-2 animate-bounce rounded-full"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="bg-foreground/50 h-2 w-2 animate-bounce rounded-full"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="bg-foreground/50 h-2 w-2 animate-bounce rounded-full"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-background/50 rounded-b-xl border-t p-4 backdrop-blur-sm">
        <div className="flex gap-2">
          <Button
            variant={isListening ? "destructive" : "outline"}
            size="icon"
            onClick={handleMicClick}
            className={cn(
              "shrink-0 transition-all",
              isListening && "animate-pulse",
            )}
          >
            <Mic className="h-5 w-5" />
          </Button>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button
            onClick={() => handleSendMessage()}
            size="icon"
            disabled={!inputValue.trim() || isProcessing}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
