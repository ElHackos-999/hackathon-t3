"use client";

import { useState } from "react";
import { ChatInterface } from "@acme/ui/chat-interface";
import { ThreeBackground } from "@acme/ui/three-background";

export default function HomePage() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <ThreeBackground isSpeaking={isSpeaking} />

      <div className="z-10 w-full max-w-4xl px-4 flex flex-col items-center gap-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight text-center drop-shadow-lg">
          Ask to AI
        </h1>
        
        <ChatInterface onSpeakingChange={setIsSpeaking} />
      </div>
    </main>
  );
}
