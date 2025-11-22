"use client";

import { useState, useTransition } from "react";

import { ChatInterface } from "@acme/ui/chat-interface";
import { ThreeBackground } from "@acme/ui/three-background";

import { sendMessage } from "./actions";

export default function HomePage() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<string>("");

  const handleSendMessage = async (message: string) => {
    return new Promise<string>((resolve, reject) => {
      startTransition(async () => {
        try {
          const response = await sendMessage(message);
          resolve(response);

          setResponse(response);
        } catch (error) {
          // reject(error);
        }
      });
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <div className="flex w-full max-w-4xl flex-col items-center gap-8 px-4">
        <h1 className="text-center text-4xl font-bold tracking-tight text-white drop-shadow-lg md:text-6xl">
          Ask to AI
        </h1>

        <div className="relative w-full max-w-2xl overflow-hidden rounded-xl">
          <ThreeBackground isSpeaking={isSpeaking} response={response} />

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
