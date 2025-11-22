"use client";

import { useState, useTransition } from "react";
import { ChatInterface } from "@acme/ui/chat-interface";
import { ThreeBackground } from "@acme/ui/three-background";
import { sendMessage } from "./actions";

export default function HomePage() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSendMessage = async (message: string) => {
    return new Promise<string>((resolve, reject) => {
      startTransition(async () => {
        try {
          const response = await sendMessage(message);
          resolve(response);
        } catch (error) {
          // reject(error);
        }
      });
    });
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <div className="w-full max-w-4xl px-4 flex flex-col items-center gap-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight text-center drop-shadow-lg">
          Ask to AI
        </h1>

        <div className="relative w-full max-w-2xl overflow-hidden rounded-xl">
          <ThreeBackground isSpeaking={isSpeaking} />

          <div className="relative z-10 flex h-full items-center justify-center">
            <ChatInterface 
              onSpeakingChange={setIsSpeaking} 
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
